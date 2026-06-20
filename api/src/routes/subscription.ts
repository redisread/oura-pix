/**
 * Subscription Routes
 *
 * Handle subscription management and Stripe integration
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { createDb, schema, eq } from "@oura-pix/database";
import { getUser } from "../middleware/auth";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    STRIPE_SECRET_KEY: string;
    STRIPE_STARTER_PRICE_ID: string;
    STRIPE_PRO_PRICE_ID: string;
    STRIPE_ENTERPRISE_PRICE_ID: string;
    NEXT_PUBLIC_APP_URL: string;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

// GET /api/subscription - Get current subscription
router.get("/", async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const db = createDb(c.env.DB);

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
    const user = getUser(c);
    if (!user) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        },
        401
      );
    }

    const body = await c.req.json().catch(() => ({}));
    const { plan = "starter", successUrl, cancelUrl } = body;

    const priceIdMap: Record<string, string> = {
      starter: c.env.STRIPE_STARTER_PRICE_ID,
      pro: c.env.STRIPE_PRO_PRICE_ID,
      enterprise: c.env.STRIPE_ENTERPRISE_PRICE_ID,
    };

    const priceId = priceIdMap[plan];
    if (!priceId) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Invalid plan" },
        },
        400
      );
    }

    try {
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
    } catch (error) {
      console.error("[API] Stripe checkout error:", error);
      return c.json(
        {
          success: false,
          error: { code: "STRIPE_ERROR", message: "Failed to create checkout session" },
        },
        500
      );
    }
  }
);

// POST /api/subscription/portal - Create billing portal session
router.post("/portal", async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const db = createDb(c.env.DB);

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, user.id),
  });

  if (!subscription?.externalSubscriptionId) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "No active subscription found" },
      },
      404
    );
  }

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

    // Get customer ID from subscription
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
  } catch (error) {
    console.error("[API] Stripe portal error:", error);
    return c.json(
      {
        success: false,
        error: { code: "STRIPE_ERROR", message: "Failed to create portal session" },
      },
      500
    );
  }
});

export default router;
