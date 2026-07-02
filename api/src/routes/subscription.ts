/**
 * Subscription Routes
 *
 * Handle subscription management and Stripe integration
 */

import Stripe from "stripe";
import { schema, eq } from "@oura-pix/database";
import { createRouter, useCtx } from "../lib/route";
import { badRequest, notFound } from "../lib/http";

const router = createRouter<{
  STRIPE_SECRET_KEY: string;
  STRIPE_STARTER_PRICE_ID: string;
  STRIPE_PRO_PRICE_ID: string;
  STRIPE_ENTERPRISE_PRICE_ID: string;
  NEXT_PUBLIC_APP_URL: string;
}>();

// GET /api/subscription - Get current subscription
router.get("/", async (c) => {
  const { user, db } = useCtx(c);


  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  return c.json({
    success: true,
    data: {
      plan: subscription?.plan || "free",
      status: subscription?.status || "active",
      currentPeriodEnd: subscription?.currentPeriodEnd,
      usedGenerations: subscription?.usedGenerations || 0,
      generationLimit: subscription?.generationLimit || 10,
    },
  });
});

// POST /api/subscription/checkout - Create Stripe checkout session
router.post(
  "/checkout",
  async (c) => {
    const { user } = useCtx(c);

    const body = await c.req.json().catch(() => ({}));
    const { plan = "starter", successUrl, cancelUrl } = body;

    const priceIdMap: Record<string, string> = {
      starter: c.env.STRIPE_STARTER_PRICE_ID,
      pro: c.env.STRIPE_PRO_PRICE_ID,
      enterprise: c.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const priceId = priceIdMap[plan];
    if (!priceId) return badRequest(c, "invalidPlan");

    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${c.env.NEXT_PUBLIC_APP_URL}/profile?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${c.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId: user.id,
        plan,
      },
      allow_promotion_codes: true,
    });

    return c.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  }
);

// POST /api/subscription/portal - Create billing portal session
router.post("/portal", async (c) => {
  const { user, db } = useCtx(c);


  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.externalSubscriptionId) {
    return notFound(c, "noActiveSubscription");
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.externalSubscriptionId
  );

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeSubscription.customer as string,
    return_url: `${c.env.NEXT_PUBLIC_APP_URL}/profile`,
  });

  return c.json({
    success: true,
    data: {
      url: session.url,
    },
  });
});

export default router;
