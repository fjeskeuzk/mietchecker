// Stripe integration for payments
// Server-side only

import Stripe from 'stripe';

// Check if Stripe is configured
export const isStripeConfigured = !!process.env.STRIPE_SECRET_KEY;

// Initialize Stripe only if configured
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

export const PRICE_ID = process.env.STRIPE_PRICE_ID || '';

// Create checkout session for subscription
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'de',
    });

    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

// Create one-time payment session
export async function createOneTimePaymentSession(
  userId: string,
  userEmail: string,
  amount: number,
  currency: string = 'eur',
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amount, // in cents
            product_data: {
              name: 'Mietchecker Premium',
              description: 'Einmalige Zahlung für Premium-Features',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      locale: 'de',
    });

    return session;
  } catch (error) {
    console.error('Error creating one-time payment session:', error);
    throw error;
  }
}

// Get customer portal URL
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      locale: 'de',
    });

    return session.url;
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    throw error;
  }
}

// Verify webhook signature
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    throw error;
  }
}

// Helper to get subscription status
export async function getSubscriptionStatus(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// Helper to cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    return await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

// Helper to check if user is premium based on subscription
export function isPremiumSubscription(subscription: Stripe.Subscription): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing';
}
