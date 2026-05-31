export async function onRequestPost(context) {
  const stripe = require('stripe')(context.env.STRIPE_SECRET_KEY);
  
  const { name, email } = await context.request.json();
  
  const customer = await stripe.customers.create({
    name,
    email,
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: 50000, // $500.00 in cents
    currency: 'usd',
    customer: customer.id,
    capture_method: 'manual', // This creates a HOLD, not a charge
    description: 'VaultForge VIP Binding Bid Hold - UCC 2-205',
    metadata: {
      type: 'binding_bid_hold',
      ucc_section: '2-205',
      forfeit_terms: '72hr_close'
    }
  });

  return new Response(JSON.stringify({ 
    clientSecret: paymentIntent.client_secret,
    customerId: customer.id 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
