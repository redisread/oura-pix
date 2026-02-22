/**
 * Subscription Management
 * Handles user subscriptions, credits, and plan management
 */

import { getStripe, SUBSCRIPTION_PLANS, PlanId, listCustomerSubscriptions } from './stripe';

/**
 * User subscription status
 */
export interface SubscriptionStatus {
  userId: string;
  planId: PlanId;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'inactive';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  credits: number;
  creditsUsed: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

/**
 * Credit transaction types
 */
export type CreditTransactionType =
  | 'purchase'
  | 'subscription_renewal'
  | 'usage'
  | 'refund'
  | 'bonus'
  | 'adjustment';

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number; // Positive for credits added, negative for usage
  balance: number; // Balance after transaction
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Plan features interface
 */
export interface PlanFeatures {
  id: PlanId;
  name: string;
  price: number;
  monthlyCredits: number;
  maxGenerationsPerDay: number;
  maxUploadSizeMB: number;
  allowedFeatures: string[];
}

/**
 * Get plan features
 * @param planId - Plan identifier
 * @returns Plan features
 */
export function getPlanFeatures(planId: PlanId): PlanFeatures {
  const plan = SUBSCRIPTION_PLANS[planId.toUpperCase() as keyof typeof SUBSCRIPTION_PLANS];

  if (!plan) {
    throw new Error(`Invalid plan ID: ${planId}`);
  }

  const featureMap: Record<PlanId, string[]> = {
    free: ['basic_templates', 'standard_quality', 'email_support'],
    starter: ['all_templates', 'high_quality', 'priority_processing', 'email_support'],
    pro: ['all_templates', 'ultra_quality', 'priority_processing', 'api_access', 'chat_support'],
    enterprise: [
      'all_templates',
      'custom_templates',
      'ultra_quality',
      'priority_processing',
      'api_access',
      'dedicated_support',
      'white_label',
    ],
  };

  const limitMap: Record<PlanId, { daily: number; uploadMB: number }> = {
    free: { daily: 10, uploadMB: 5 },
    starter: { daily: 100, uploadMB: 20 },
    pro: { daily: 500, uploadMB: 50 },
    enterprise: { daily: 2000, uploadMB: 100 },
  };

  const limits = limitMap[planId];

  return {
    id: planId,
    name: plan.name,
    price: plan.price,
    monthlyCredits: 'credits' in plan ? plan.credits : 0,
    maxGenerationsPerDay: limits.daily,
    maxUploadSizeMB: limits.uploadMB,
    allowedFeatures: featureMap[planId],
  };
}

/**
 * Check if user has enough credits
 * @param userId - User ID
 * @param requiredCredits - Credits needed
 * @returns True if user has enough credits
 */
export async function hasEnoughCredits(
  userId: string,
  requiredCredits: number = 1
): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  const availableCredits = status.credits - status.creditsUsed;
  return availableCredits >= requiredCredits;
}

/**
 * Deduct credits for usage
 * @param userId - User ID
 * @param amount - Credits to deduct
 * @param description - Usage description
 * @param metadata - Additional metadata
 * @returns Updated balance
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; remainingCredits: number; error?: string }> {
  const hasEnough = await hasEnoughCredits(userId, amount);

  if (!hasEnough) {
    return {
      success: false,
      remainingCredits: 0,
      error: 'Insufficient credits',
    };
  }

  // In a real implementation, this would update the database
  // For now, we return a mock response
  const status = await getSubscriptionStatus(userId);
  const newUsed = status.creditsUsed + amount;

  // Record transaction (mock)
  const transaction: CreditTransaction = {
    id: generateTransactionId(),
    userId,
    type: 'usage',
    amount: -amount,
    balance: status.credits - newUsed,
    description,
    metadata,
    createdAt: new Date(),
  };

  // TODO: Persist transaction to database
  console.log('Credit transaction:', transaction);

  return {
    success: true,
    remainingCredits: transaction.balance,
  };
}

/**
 * Add credits to user account
 * @param userId - User ID
 * @param amount - Credits to add
 * @param type - Transaction type
 * @param description - Description
 * @param metadata - Additional metadata
 * @returns New balance
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  if (amount <= 0) {
    return {
      success: false,
      newBalance: 0,
      error: 'Amount must be positive',
    };
  }

  const status = await getSubscriptionStatus(userId);
  const newBalance = status.credits + amount;

  // Record transaction (mock)
  const transaction: CreditTransaction = {
    id: generateTransactionId(),
    userId,
    type,
    amount,
    balance: newBalance,
    description,
    metadata,
    createdAt: new Date(),
  };

  // TODO: Persist transaction to database
  console.log('Credit transaction:', transaction);

  return {
    success: true,
    newBalance,
  };
}

/**
 * Get subscription status for user
 * @param userId - User ID
 * @returns Subscription status
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // TODO: Fetch from database
  // This is a mock implementation
  return {
    userId,
    planId: 'free',
    status: 'active',
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false,
    credits: 10,
    creditsUsed: 0,
  };
}

/**
 * Update subscription from Stripe webhook data
 * @param userId - User ID
 * @param stripeCustomerId - Stripe customer ID
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param planId - Plan ID
 * @param status - Subscription status
 * @param currentPeriodEnd - Current period end date
 */
export async function updateSubscriptionFromStripe(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planId: PlanId,
  status: string,
  currentPeriodEnd: Date
): Promise<void> {
  // TODO: Update database with subscription info
  console.log('Updating subscription:', {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    planId,
    status,
    currentPeriodEnd,
  });

  // If subscription is active, add monthly credits
  if (status === 'active' || status === 'trialing') {
    const features = getPlanFeatures(planId);
    // TODO: Check if credits already added for this period
    await addCredits(
      userId,
      features.monthlyCredits,
      'subscription_renewal',
      `Monthly credits for ${planId} plan`,
      { stripeSubscriptionId, periodEnd: currentPeriodEnd }
    );
  }
}

/**
 * Cancel subscription
 * @param userId - User ID
 * @returns Success status
 */
export async function cancelUserSubscription(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const status = await getSubscriptionStatus(userId);

  if (!status.stripeSubscriptionId) {
    return {
      success: false,
      error: 'No active subscription found',
    };
  }

  try {
    const stripe = getStripe();
    await stripe.subscriptions.cancel(status.stripeSubscriptionId);

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get user's credit transactions
 * @param userId - User ID
 * @param limit - Number of transactions to return
 * @param offset - Pagination offset
 * @returns List of transactions
 */
export async function getCreditTransactions(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<CreditTransaction[]> {
  // TODO: Fetch from database
  // Mock implementation
  return [];
}

/**
 * Check feature availability
 * @param userId - User ID
 * @param feature - Feature name
 * @returns True if feature is available
 */
export async function hasFeatureAccess(
  userId: string,
  feature: string
): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  const features = getPlanFeatures(status.planId);
  return features.allowedFeatures.includes(feature);
}

/**
 * Get daily usage for user
 * @param userId - User ID
 * @returns Today's generation count
 */
export async function getDailyUsage(userId: string): Promise<number> {
  // TODO: Fetch from database
  // Mock implementation
  return 0;
}

/**
 * Check if user can generate content today
 * @param userId - User ID
 * @returns True if user can generate
 */
export async function canGenerateToday(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId);
  const features = getPlanFeatures(status.planId);
  const dailyUsage = await getDailyUsage(userId);

  return dailyUsage < features.maxGenerationsPerDay;
}

/**
 * Sync subscription with Stripe
 * @param userId - User ID
 * @param stripeCustomerId - Stripe customer ID
 */
export async function syncSubscriptionWithStripe(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  const subscriptions = await listCustomerSubscriptions(stripeCustomerId);

  if (subscriptions.length === 0) {
    // No active subscription, reset to free plan
    await updateSubscriptionFromStripe(
      userId,
      stripeCustomerId,
      '',
      'free',
      'inactive',
      new Date()
    );
    return;
  }

  const subscription = subscriptions[0];
  const priceId = subscription.items.data[0]?.price.id;

  // Find plan by price ID
  let planId: PlanId = 'free';
  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if ('priceId' in plan && plan.priceId === priceId) {
      planId = plan.id as PlanId;
      break;
    }
  }

  await updateSubscriptionFromStripe(
    userId,
    stripeCustomerId,
    subscription.id,
    planId,
    subscription.status,
    new Date(subscription.current_period_end * 1000)
  );
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate prorated credits for plan upgrade
 * @param currentPlanId - Current plan
 * @param newPlanId - New plan
 * @param daysRemaining - Days remaining in current period
 * @returns Prorated credit amount
 */
export function calculateProratedCredits(
  currentPlanId: PlanId,
  newPlanId: PlanId,
  daysRemaining: number
): number {
  const currentPlan = getPlanFeatures(currentPlanId);
  const newPlan = getPlanFeatures(newPlanId);

  // Calculate daily credit value
  const currentDailyCredits = currentPlan.monthlyCredits / 30;
  const newDailyCredits = newPlan.monthlyCredits / 30;

  // Calculate remaining value and new value
  const remainingCurrentCredits = currentDailyCredits * daysRemaining;
  const newCreditsForPeriod = newDailyCredits * daysRemaining;

  // Return the difference (positive means user gets credits)
  return Math.round(newCreditsForPeriod - remainingCurrentCredits);
}

/**
 * Get subscription comparison data
 * @returns Plan comparison for pricing page
 */
export function getSubscriptionComparison(): PlanFeatures[] {
  return Object.keys(SUBSCRIPTION_PLANS).map((key) =>
    getPlanFeatures(key.toLowerCase() as PlanId)
  );
}
