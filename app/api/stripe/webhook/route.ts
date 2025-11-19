// Stripe webhook handler
import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent, isStripeConfigured } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!isStripeConfigured) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = constructWebhookEvent(body, signature);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId || session.client_reference_id;

  if (!userId) {
    console.error('No user ID in checkout session');
    return;
  }

  // Create payment record
  await supabaseAdmin.from('payments').insert({
    user_id: userId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_subscription_id: session.subscription as string,
    status: 'completed',
    amount: session.amount_total,
    currency: session.currency || 'eur',
  });

  // Update user profile to premium
  await supabaseAdmin
    .from('user_profiles')
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
      stripe_customer_id: session.customer as string,
    })
    .eq('id', userId);

  console.log(`User ${userId} upgraded to premium`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by Stripe customer ID
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Ensure user is still premium
  await supabaseAdmin
    .from('user_profiles')
    .update({ is_premium: true })
    .eq('id', profile.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('No user found for customer:', customerId);
    return;
  }

  // Downgrade user from premium
  await supabaseAdmin
    .from('user_profiles')
    .update({ is_premium: false })
    .eq('id', profile.id);

  console.log(`User ${profile.id} downgraded from premium`);
}
