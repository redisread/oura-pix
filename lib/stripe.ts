/**
 * Stripe Payment Integration
 * Handles payments, subscriptions, and customer management
 */

import Stripe from 'stripe';

/**
 * Stripe API configuration
 */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Validate environment variables
 */
function validateConfig(): void {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
}

/**
 * Stripe client instance
 */
let stripeClient: Stripe | null = null;

/**
 * Get or create Stripe client instance
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    validateConfig();
    stripeClient = new Stripe(STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return stripeClient;
}

/**
 * Subscription plan definitions
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 10,
    features: ['10 generations per month', 'Basic templates', 'Standard quality'],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    price: 9.99,
    credits: 100,
    features: ['100 generations per month', 'All templates', 'High quality', 'Priority processing'],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    price: 29.99,
    credits: 500,
    features: ['500 generations per month', 'All templates', 'Ultra quality', 'Priority processing', 'API access'],
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    price: 99.99,
    credits: 2000,
    features: ['2000 generations per month', 'Custom templates', 'Ultra quality', 'Dedicated support', 'Full API access', 'White-label options'],
  },
} as const;

export type PlanId = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]['id'];

/**
 * Credit pack definitions for one-time purchases
 */
export const CREDIT_PACKS = {
  SMALL: {
    id: 'credits-small',
    name: '100 Credits',
    priceId: process.env.STRIPE_CREDITS_SMALL_PRICE_ID,
    price: 4.99,
    credits: 100,
  },
  MEDIUM: {
    id: 'credits-medium',
    name: '500 Credits',
    priceId: process.env.STRIPE_CREDITS_MEDIUM_PRICE_ID,
    price: 19.99,
    credits: 500,
  },
  LARGE: {
    id: 'credits-large',
    name: '2000 Credits',
    priceId: process.env.STRIPE_CREDITS_LARGE_PRICE_ID,
    price: 69.99,
    credits: 2000,
  },
} as const;

/**
 * Customer data interface
 */
export interface CustomerData {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Create or retrieve Stripe customer
 * @param data - Customer data
 * @returns Stripe customer
 */
export async function createOrGetCustomer(data: CustomerData): Promise<Stripe.Customer> {
  const stripe = getStripe();

  // Search for existing customer by email
  const existingCustomers = await stripe.customers.list({
    email: data.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];

    // Update metadata if needed
    if (customer.metadata?.userId !== data.userId) {
      return stripe.customers.update(customer.id, {
        metadata: {
          userId: data.userId,
        },
      });
    }

    return customer;
  }

  // Create new customer
  return stripe.customers.create({
    email: data.email,
    name: data.name,
    metadata: {
      userId: data.userId,
    },
  });
}

/**
 * Create subscription checkout session
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID
 * @param successUrl - Redirect URL after successful payment
 * @param cancelUrl - Redirect URL after cancellation
 * @returns Checkout session
 */
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        customerId,
      },
    },
  });
}

/**
 * Create one-time purchase checkout session for credits
 * @param customerId - Stripe customer ID
 * @param priceId - Stripe price ID
 * @param successUrl - Redirect URL after successful payment
 * @param cancelUrl - Redirect URL after cancellation
 * @returns Checkout session
 */
export async function createCreditsCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();

  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: 'credits',
      customerId,
    },
  });
}

/**
 * Create customer portal session
 * @param customerId - Stripe customer ID
 * @param returnUrl - URL to return to after portal
 * @returns Portal session
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Cancel subscription
 * @param subscriptionId - Stripe subscription ID
 * @returns Cancelled subscription
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get subscription details
 * @param subscriptionId - Stripe subscription ID
 * @returns Subscription
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();

  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * List customer subscriptions
 * @param customerId - Stripe customer ID
 * @returns List of subscriptions
 */
export async function listCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const stripe = getStripe();

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data;
}

/**
 * Get customer payment methods
 * @param customerId - Stripe customer ID
 * @returns List of payment methods
 */
export async function getCustomerPaymentMethods(
  customerId: string
): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripe();

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return methods.data;
}

/**
 * Construct webhook event from payload
 * @param payload - Raw request body
 * @param signature - Stripe signature header
 * @returns Stripe event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  const stripe = getStripe();
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
}

/**
 * Handle checkout session completed
 * @param session - Checkout session
 * @returns Processed data
 */
export function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): {
  customerId: string;
  userId: string;
  type: 'subscription' | 'credits';
  subscriptionId?: string;
  credits?: number;
  planId?: string;
} {
  const customerId = session.customer as string;
  const userId = session.metadata?.userId || '';
  const isSubscription = session.mode === 'subscription';

  const result: any = {
    customerId,
    userId,
    type: isSubscription ? 'subscription' : 'credits',
  };

  if (isSubscription) {
    result.subscriptionId = session.subscription as string;

    // Determine plan from line items
    const priceId = session.line_items?.data[0]?.price?.id;
    if (priceId) {
      const plan = Object.values(SUBSCRIPTION_PLANS).find(
        (p) => 'priceId' in p && p.priceId === priceId
      );
      if (plan) {
        result.planId = plan.id;
        result.credits = plan.credits;
      }
    }
  } else {
    // Credits purchase
    const priceId = session.line_items?.data[0]?.price?.id;
    if (priceId) {
      const pack = Object.values(CREDIT_PACKS).find((p) => p.priceId === priceId);
      if (pack) {
        result.credits = pack.credits;
      }
    }
  }

  return result;
}

/**
 * Handle subscription updated
 * @param subscription - Subscription object
 * @returns Processed data
 */
export function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): {
  subscriptionId: string;
  customerId: string;
  status: Stripe.Subscription.Status;
  planId?: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
} {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = Object.values(SUBSCRIPTION_PLANS).find(
    (p) => 'priceId' in p && p.priceId === priceId
  );

  return {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
    status: subscription.status,
    planId: plan?.id,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };
}

/**
 * Handle subscription deleted
 * @param subscription - Subscription object
 * @returns Processed data
 */
export function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): {
  subscriptionId: string;
  customerId: string;
} {
  return {
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
  };
}

/**
 * Handle invoice payment failed
 * @param invoice - Invoice object
 * @returns Processed data
 */
export function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): {
  invoiceId: string;
  customerId: string;
  subscriptionId?: string;
  amountDue: number;
} {
  return {
    invoiceId: invoice.id,
    customerId: invoice.customer as string,
    subscriptionId: invoice.subscription as string | undefined,
    amountDue: invoice.amount_due,
  };
}

/**
 * Get publishable key for client-side
 * @returns Publishable key
 */
export function getPublishableKey(): string {
  if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
  }
  return STRIPE_PUBLISHABLE_KEY;
}
