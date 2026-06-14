/**
 * Stripe Webhook Routes
 *
 * Handle Stripe webhook events for subscription management
 */

import { Hono } from "hono";
import Stripe from "stripe";
import { createDb, schema, eq } from "@oura-pix/database";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  };
}>();

// POST /api/webhooks/stripe
router.post("/stripe", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  if (!sig) {
    return c.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Missing stripe-signature header" },
      },
      400
    );
  }

  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Webhook] Invalid signature:", err);
    return c.json(
      {
        success: false,
        error: { code: "BAD_REQUEST", message: "Invalid signature" },
      },
      400
    );
  }

  const db = createDb(c.env.DB);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription") {
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan || "starter";

          if (!userId) {
            console.error("[Webhook] Missing userId in session metadata");
            break;
          }

          // Get subscription details
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          // Upsert subscription in database
          await db
            .insert(schema.subscriptions)
            .values({
              userId,
              plan: plan as "starter" | "pro" | "enterprise",
              status: mapStripeStatusToDbStatus(stripeSubscription.status),
              externalSubscriptionId: stripeSubscription.id,
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              usedGenerations: 0,
              generationLimit: getGenerationLimitForPlan(plan),
            })
            .onConflictDoUpdate({
              target: schema.subscriptions.userId,
              set: {
                plan: plan as "starter" | "pro" | "enterprise",
                status: mapStripeStatusToDbStatus(stripeSubscription.status),
                externalSubscriptionId: stripeSubscription.id,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                generationLimit: getGenerationLimitForPlan(plan),
              },
            });

          console.log("[Webhook] Checkout completed for user:", userId, "plan:", plan);
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const externalSubscriptionId = stripeSubscription.id;

        // Find subscription in database
        const existing = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.externalSubscriptionId, externalSubscriptionId),
        });

        if (existing) {
          await db
            .update(schema.subscriptions)
            .set({
              status: mapStripeStatusToDbStatus(stripeSubscription.status),
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
              canceledAt: stripeSubscription.canceled_at
                ? new Date(stripeSubscription.canceled_at * 1000)
                : null,
            })
            .where(eq(schema.subscriptions.id, existing.id));

          console.log(
            "[Webhook] Subscription updated:",
            externalSubscriptionId,
            "status:",
            stripeSubscription.status
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const externalSubscriptionId = stripeSubscription.id;

        const existing = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.externalSubscriptionId, externalSubscriptionId),
        });

        if (existing) {
          await db
            .update(schema.subscriptions)
            .set({
              status: "canceled",
              canceledAt: new Date(),
              externalSubscriptionId: null,
            })
            .where(eq(schema.subscriptions.id, existing.id));

          console.log("[Webhook] Subscription canceled:", externalSubscriptionId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        // Retrieve subscription to verify it exists (validation)
        await stripe.subscriptions.retrieve(subscriptionId);

        const existing = await db.query.subscriptions.findFirst({
          where: eq(schema.subscriptions.externalSubscriptionId, subscriptionId),
        });

        if (existing) {
          await db
            .update(schema.subscriptions)
            .set({
              status: "past_due",
            })
            .where(eq(schema.subscriptions.id, existing.id));

          console.log("[Webhook] Payment failed for subscription:", subscriptionId);
        }
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    return c.json({ success: true, received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return c.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Webhook processing failed" },
      },
      500
    );
  }
});

function getGenerationLimitForPlan(plan: string): number {
  const limits: Record<string, number> = {
    starter: 50,
    pro: 200,
    enterprise: 1000,
  };
  return limits[plan] || 10;
}

/**
 * Map Stripe subscription status to our database status enum
 * Stripe statuses: active, canceled, incomplete, incomplete_expired, past_due, paused, trialing, unpaid
 * Our statuses: active, canceled, past_due, unpaid, trialing
 */
function mapStripeStatusToDbStatus(stripeStatus: string): "active" | "canceled" | "past_due" | "unpaid" | "trialing" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return stripeStatus as "active" | "trialing";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      // New subscription awaiting payment - treat as active once payment completes
      return "active";
    case "paused":
      // Treat paused as past_due
      return "past_due";
    default:
      return "active";
  }
}

export { router as stripeWebhookRoutes };
