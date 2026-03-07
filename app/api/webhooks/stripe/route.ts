/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscription and payment management
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import {
  getStripe,
  constructWebhookEvent,
  handleCheckoutSessionCompleted as processCheckoutSession,
  handleSubscriptionUpdated as processSubscriptionUpdated,
  handleSubscriptionDeleted as processSubscriptionDeleted,
  handleInvoicePaymentFailed as processInvoicePaymentFailed,
} from '@/lib/stripe';
import { updateSubscriptionFromStripe, addCredits } from '@/lib/subscription';
import { type PlanId, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { sendTrialEndingEmail, sendPaymentFailedEmail } from '@/lib/mail';
import { getCloudflareContext } from '@/lib/cloudflare-context';
import { createDb, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { withDevInit } from '@/lib/with-dev-init';

/**
 * POST handler for Stripe webhooks
 * @param request - Next.js request
 * @returns Response
 */
async function handleStripeWebhook(request: NextRequest): Promise<NextResponse> {
  // Get the signature from headers
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  // Get the raw body
  const payload = await request.text();

  let event;

  try {
    // Verify and construct the event (reads webhook secret from Cloudflare env)
    event = await constructWebhookEvent(payload, signature);
  } catch (err: unknown) {
    console.error('Webhook signature verification failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Log received event
  console.log(`Received Stripe event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      }

      case 'checkout.session.async_payment_succeeded': {
        await handleAsyncPaymentSucceeded(event.data.object);
        break;
      }

      case 'checkout.session.async_payment_failed': {
        await handleAsyncPaymentFailed(event.data.object);
        break;
      }

      case 'invoice.payment_succeeded': {
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      }

      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailedWebhook(event.data.object);
        break;
      }

      case 'customer.subscription.created': {
        await handleSubscriptionCreated(event.data.object);
        break;
      }

      case 'customer.subscription.updated': {
        await handleSubscriptionUpdatedWebhook(event.data.object);
        break;
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeletedWebhook(event.data.object);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        await handleTrialWillEnd(event.data.object);
        break;
      }

      default: {
        console.log(`Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout session completed
 * @param session - Checkout session object
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const result = await processCheckoutSession(session);

  if (result.type === 'subscription') {
    // Handle subscription signup
    await updateSubscriptionFromStripe(
      result.userId,
      result.customerId,
      result.subscriptionId!,
      (result.planId || 'starter') as PlanId,
      'active',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    console.log(`Subscription created for user ${result.userId}`);
  } else {
    // Handle one-time credit purchase
    if (result.credits) {
      await addCredits(
        result.userId,
        result.credits,
        'purchase',
        'Credit pack purchase',
        { sessionId: session.id }
      );

      console.log(`Added ${result.credits} credits to user ${result.userId}`);
    }
  }
}

/**
 * Handle async payment succeeded
 * @param session - Checkout session object
 */
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`Async payment succeeded for session ${session.id}`);

  // Similar to checkout.session.completed
  await handleCheckoutSessionCompleted(session);
}

/**
 * Handle async payment failed
 * @param session - Checkout session object
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
  console.log(`Async payment failed for session ${session.id}`);

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId found in session metadata');
    return;
  }

  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Get user email for notification
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (user?.email) {
      // Send payment failure notification
      await sendPaymentFailedEmail(
        { email: user.email, name: user.name || undefined },
        {
          userName: user.name || 'Valued Customer',
          amount: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : 'N/A',
          invoiceDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          retryUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ourapix.jiahongw.com'}/billing`,
        },
        env
      );
      console.log(`Payment failure notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error('Failed to send payment failure notification:', error);
  }
}

/**
 * Handle invoice payment succeeded
 * @param invoice - Invoice object
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log(`Invoice ${invoice.id} payment succeeded`);

  // Subscription renewal - add monthly credits
  if (invoice.subscription) {
    const stripe = await getStripe();
    const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error('No userId found in subscription metadata');
      return;
    }

    // Determine plan and credits from price ID
    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      console.error('No priceId found in subscription');
      return;
    }

    // Get Stripe config to map priceId to plan
    const { env } = await getCloudflareContext();

    // Map priceId to plan and credits
    const priceIdToPlan: Record<string, { planId: PlanId; credits: number }> = {
      [env.STRIPE_STARTER_PRICE_ID!]: { planId: 'starter', credits: SUBSCRIPTION_PLANS.STARTER.credits },
      [env.STRIPE_PRO_PRICE_ID!]: { planId: 'pro', credits: SUBSCRIPTION_PLANS.PRO.credits },
      [env.STRIPE_ENTERPRISE_PRICE_ID!]: { planId: 'enterprise', credits: SUBSCRIPTION_PLANS.ENTERPRISE.credits },
    };

    const planMapping = priceIdToPlan[priceId];
    if (!planMapping) {
      console.error(`Unknown priceId: ${priceId}`);
      return;
    }

    // Add monthly credits for subscription renewal
    await addCredits(
      userId,
      planMapping.credits,
      'subscription_renewal',
      `Monthly renewal - ${planMapping.planId} plan`,
      {
        invoiceId: invoice.id,
        subscriptionId,
        planId: planMapping.planId,
        priceId,
      }
    );

    console.log(`Subscription renewed for user ${userId}, added ${planMapping.credits} credits`);
  }
}

/**
 * Handle invoice payment failed webhook
 * @param invoice - Invoice object
 */
async function handleInvoicePaymentFailedWebhook(invoice: Stripe.Invoice): Promise<void> {
  const result = processInvoicePaymentFailed(invoice);

  console.log(`Invoice payment failed for customer ${result.customerId}`);

  if (result.subscriptionId) {
    try {
      const stripe = await getStripe();
      const subscription = await stripe.subscriptions.retrieve(result.subscriptionId);
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Update subscription status to past_due
        await updateSubscriptionFromStripe(
          userId,
          result.customerId,
          result.subscriptionId,
          'free' as PlanId, // Keep current plan but mark as past_due
          'past_due',
          new Date(subscription.current_period_end * 1000)
        );
        console.log(`Subscription ${result.subscriptionId} marked as past_due for user ${userId}`);

        // Get user email for notification
        const { env } = await getCloudflareContext();
        const db = createDb(env.DB);
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });

        if (user?.email) {
          // Send payment failure notification
          await sendPaymentFailedEmail(
            { email: user.email, name: user.name || undefined },
            {
              userName: user.name || 'Valued Customer',
              amount: result.amountDue ? `$${(result.amountDue / 100).toFixed(2)}` : 'N/A',
              invoiceDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              retryUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ourapix.jiahongw.com'}/billing`,
            },
            env
          );
          console.log(`Payment failure notification sent to user ${userId}`);
        }
      }
    } catch (error) {
      console.error('Failed to handle invoice payment failure:', error);
    }
  }
}

/**
 * Handle subscription created
 * @param subscription - Subscription object
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Subscription ${subscription.id} created`);

  // This is typically handled by checkout.session.completed
  // But we can add additional logic here if needed
}

/**
 * Handle subscription updated webhook
 * @param subscription - Subscription object
 */
async function handleSubscriptionUpdatedWebhook(subscription: Stripe.Subscription): Promise<void> {
  const result = await processSubscriptionUpdated(subscription);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  await updateSubscriptionFromStripe(
    userId,
    result.customerId,
    result.subscriptionId,
    (result.planId || 'free') as PlanId,
    result.status,
    result.currentPeriodEnd
  );

  console.log(`Subscription ${result.subscriptionId} updated for user ${userId}`);
}

/**
 * Handle subscription deleted webhook
 * @param subscription - Subscription object
 */
async function handleSubscriptionDeletedWebhook(subscription: Stripe.Subscription): Promise<void> {
  const result = processSubscriptionDeleted(subscription);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  // Downgrade to free plan
  await updateSubscriptionFromStripe(
    userId,
    result.customerId,
    result.subscriptionId,
    'free' as PlanId,
    'canceled',
    new Date()
  );

  console.log(`Subscription canceled for user ${userId}`);
}

/**
 * Handle trial ending soon
 * @param subscription - Subscription object
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  console.log(`Trial ending soon for subscription ${subscription.id}`);

  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error('No userId found in subscription metadata');
    return;
  }

  try {
    const { env } = await getCloudflareContext();
    const db = createDb(env.DB);

    // Get user email for notification
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (user?.email) {
      // Get plan name from price ID
      const priceId = subscription.items.data[0]?.price.id;
      let planName = 'Premium';

      if (priceId) {
        if (priceId === env.STRIPE_STARTER_PRICE_ID) {
          planName = SUBSCRIPTION_PLANS.STARTER.name;
        } else if (priceId === env.STRIPE_PRO_PRICE_ID) {
          planName = SUBSCRIPTION_PLANS.PRO.name;
        } else if (priceId === env.STRIPE_ENTERPRISE_PRICE_ID) {
          planName = SUBSCRIPTION_PLANS.ENTERPRISE.name;
        }
      }

      // Calculate trial end date
      const trialEndDate = subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'soon';

      // Send trial ending notification
      await sendTrialEndingEmail(
        { email: user.email, name: user.name || undefined },
        {
          userName: user.name || 'Valued Customer',
          planName,
          endDate: trialEndDate,
          updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://ourapix.jiahongw.com'}/billing`,
        },
        env
      );
      console.log(`Trial ending notification sent to user ${userId}`);
    }
  } catch (error) {
    console.error('Failed to send trial ending notification:', error);
  }
}

/**
 * GET handler for webhook verification
 * @returns Status response
 */
async function handleWebhookGet(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

export const POST = withDevInit(handleStripeWebhook);
export const GET = withDevInit(handleWebhookGet);
