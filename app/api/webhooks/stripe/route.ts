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
import { type PlanId } from '@/lib/stripe';
import { sendGenerationCompleteEmail } from '@/lib/mail';

/**
 * POST handler for Stripe webhooks
 * @param request - Next.js request
 * @returns Response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // TODO: Notify user of payment failure
  // TODO: Update order/payment status in database
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

    // Determine plan and credits
    const priceId = subscription.items.data[0]?.price.id;
    // TODO: Map priceId to plan and credits

    // Add monthly credits
    // await addCredits(userId, monthlyCredits, 'subscription_renewal', ...);

    console.log(`Subscription renewed for user ${userId}`);
  }
}

/**
 * Handle invoice payment failed webhook
 * @param invoice - Invoice object
 */
async function handleInvoicePaymentFailedWebhook(invoice: Stripe.Invoice): Promise<void> {
  const result = processInvoicePaymentFailed(invoice);

  console.log(`Invoice payment failed for customer ${result.customerId}`);

  // TODO: Send payment failure notification to user
  // TODO: Update subscription status
  // TODO: Grace period handling
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

  // TODO: Send trial ending notification to user
  // TODO: Include payment method update link
}

/**
 * GET handler for webhook verification
 * @returns Status response
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
