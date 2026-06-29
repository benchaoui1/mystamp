// ═══════════════════════════════════════════════════════════
//  api/telr-webhook.js  —  Vercel Serverless Function
//  "The hidden worker" that confirms a payment and marks the
//  matching order as PAID in Supabase — automatically.
//
//  How it runs:
//    1. Telr calls this URL after a payment (or the success page
//       calls it as a fallback), passing the order ref (cart id).
//    2. We ask Telr directly: "Was this order actually paid?"
//       (ivp_method = check). We TRUST Telr, never the browser.
//    3. If paid → update Supabase orders.status = 'paid'.
//
//  Secrets (Vercel Environment Variables):
//    TELR_STORE_ID, TELR_AUTH_KEY, TELR_TEST_MODE
//    SUPABASE_URL, SUPABASE_SERVICE_KEY   ← service key (server-only!)
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // Accept GET (Telr/browser redirect with ?ref=) or POST (JSON / form)
  const ref =
    (req.query && (req.query.ref || req.query.cart || req.query.cartId)) ||
    (req.body && (req.body.ref || req.body.cart || req.body.cartId)) ||
    '';

  const cartId = String(ref || '').trim();
  if (!cartId) {
    return res.status(400).json({ ok: false, error: 'Missing order reference.' });
  }

  const STORE_ID = process.env.TELR_STORE_ID;
  const AUTH_KEY = process.env.TELR_AUTH_KEY;
  const TEST_MODE = process.env.TELR_TEST_MODE === '0' ? '0' : '1';
  const SB_URL = process.env.SUPABASE_URL;
  const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!STORE_ID || !AUTH_KEY) {
    return res.status(500).json({ ok: false, error: 'Payment is not configured.' });
  }
  if (!SB_URL || !SB_SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Database is not configured.' });
  }

  try {
    // ── 1) Ask Telr the real status of this order ──────────────
    const params = new URLSearchParams();
    params.append('ivp_method', 'check');
    params.append('ivp_store', STORE_ID);
    params.append('ivp_authkey', AUTH_KEY);
    params.append('ivp_cart', cartId);
    params.append('ivp_test', TEST_MODE);

    const telrRes = await fetch('https://secure.telr.com/gateway/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await telrRes.json();

    // Telr "check" returns order.status.code / order.status.text
    // code 3 = Paid/Authorised (the success state for a Sale)
    var statusCode = data && data.order && data.order.status && data.order.status.code;
    var statusText = (data && data.order && data.order.status && data.order.status.text) || '';
    var isPaid = String(statusCode) === '3' || /paid|authorised|authorized/i.test(statusText);

    // Debug logging (visible in Vercel → Logs)
    console.log('[telr-webhook] ref=' + cartId +
      ' telrStatusCode=' + JSON.stringify(statusCode) +
      ' telrStatusText=' + JSON.stringify(statusText) +
      ' isPaid=' + isPaid +
      ' telrError=' + JSON.stringify(data && data.error || null));

    if (!isPaid) {
      // Not paid (declined / pending / cancelled) — leave the order as-is.
      return res.status(200).json({
        ok: true, paid: false, ref: cartId,
        status: statusText || 'not paid',
        telrError: (data && data.error) || null
      });
    }

    // ── 2) Mark the order PAID in Supabase (service key bypasses RLS) ──
    const patchUrl =
      SB_URL.replace(/\/$/, '') +
      '/rest/v1/orders?order_ref=eq.' + encodeURIComponent(cartId);

    const sbRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_SERVICE_KEY,
        'Authorization': 'Bearer ' + SB_SERVICE_KEY,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status: 'paid' })
    });

    if (!sbRes.ok) {
      const t = await sbRes.text();
      console.log('[telr-webhook] SUPABASE FAIL status=' + sbRes.status + ' body=' + t.slice(0, 300));
      return res.status(500).json({ ok: false, error: 'DB update failed', detail: t.slice(0, 200) });
    }

    const updated = await sbRes.json();
    console.log('[telr-webhook] PAID ref=' + cartId + ' rowsUpdated=' + (Array.isArray(updated) ? updated.length : 0));
    return res.status(200).json({
      ok: true, paid: true, ref: cartId,
      updated: Array.isArray(updated) ? updated.length : 0
    });

  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Webhook error.' });
  }
}
