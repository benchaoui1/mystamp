// ═══════════════════════════════════════════════════════════
//  api/telr-create.js  —  Vercel Serverless Function
//  "The hidden worker" that securely talks to Telr.
//
//  The browser NEVER sees your Authentication Key. It lives only
//  in Vercel Environment Variables (TELR_STORE_ID, TELR_AUTH_KEY).
//
//  Flow:
//    checkout.js  →  POST /api/telr-create  →  Telr order.json
//    Telr returns a payment URL  →  we send it back to the browser
//    browser redirects the customer to that URL to pay by card.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read secrets from Vercel Environment Variables (never hard-coded)
  const STORE_ID = process.env.TELR_STORE_ID;
  const AUTH_KEY = process.env.TELR_AUTH_KEY;
  const TEST_MODE = process.env.TELR_TEST_MODE === '0' ? '0' : '1'; // default to test
  const SITE_URL = process.env.SITE_URL || 'https://mystamp.ae';

  if (!STORE_ID || !AUTH_KEY) {
    return res.status(500).json({ error: 'Payment is not configured yet.' });
  }

  try {
    const body = req.body || {};
    const amount = Number(body.amount);
    const cartId = String(body.cartId || '').trim();

    // Basic validation
    if (!amount || amount <= 0 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }
    if (!cartId) {
      return res.status(400).json({ error: 'Missing order reference.' });
    }

    // Build the Telr request (Hosted Payment Page — order.json)
    const params = new URLSearchParams();
    params.append('ivp_method', 'create');
    params.append('ivp_store', STORE_ID);
    params.append('ivp_authkey', AUTH_KEY);
    params.append('ivp_cart', cartId);
    params.append('ivp_test', TEST_MODE);
    params.append('ivp_amount', amount.toFixed(2));
    params.append('ivp_currency', 'AED');
    params.append('ivp_desc', (body.description || 'Custom Stamp Order').slice(0, 120));

    // Where Telr sends the customer back after payment
    params.append('return_auth', `${SITE_URL}/payment-success.html?ref=${encodeURIComponent(cartId)}`);
    params.append('return_decl', `${SITE_URL}/payment-failed.html?ref=${encodeURIComponent(cartId)}`);
    params.append('return_can',  `${SITE_URL}/checkout.html`);

    // Optional customer billing details (skip if missing → Telr will ask)
    if (body.firstName) params.append('bill_fname', String(body.firstName).slice(0, 40));
    if (body.lastName)  params.append('bill_sname', String(body.lastName).slice(0, 40));
    if (body.email)     params.append('bill_email', String(body.email).slice(0, 80));
    if (body.phone)     params.append('bill_phone1', String(body.phone).slice(0, 20));
    if (body.address)   params.append('bill_addr1', String(body.address).slice(0, 100));
    if (body.city)      params.append('bill_city', String(body.city).slice(0, 40));
    params.append('bill_country', 'AE');

    // Call Telr
    const telrRes = await fetch('https://secure.telr.com/gateway/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await telrRes.json();

    // Telr returns either { order: { ref, url } } or { error: { message, note } }
    if (data && data.order && data.order.url) {
      return res.status(200).json({ url: data.order.url, ref: data.order.ref });
    }

    const msg = (data && data.error && (data.error.note || data.error.message)) || 'Payment could not be started.';
    return res.status(400).json({ error: msg });

  } catch (e) {
    return res.status(500).json({ error: 'Payment service is unavailable right now.' });
  }
}
