// ═══════════════════════════════════════════════════════════
//  api/admin-orders.js  —  Vercel Serverless Function
//  Powers the internal admin.html dashboard: lists every order with
//  its document count, and generates short-lived SIGNED URLs so you
//  can view/download the Emirates ID, logo, license and design files
//  straight from the dashboard — no digging through Supabase's
//  Table Editor + Storage browser separately.
//
//  Security:
//    - The order-documents bucket is PRIVATE (by design — it holds
//      Emirates IDs). The public "anon" key cannot read it.
//    - This function uses SUPABASE_SERVICE_KEY (server-only, never
//      sent to the browser) to fetch orders and sign file URLs.
//    - The endpoint itself is protected by a shared secret
//      (ADMIN_DASHBOARD_KEY) so random visitors can't call it.
//
//  Vercel Environment Variables needed:
//    SUPABASE_URL, SUPABASE_SERVICE_KEY   (already set for the webhook)
//    ADMIN_DASHBOARD_KEY                   ← NEW: pick any long random
//                                             password and add it now
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  const ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!ADMIN_KEY) {
    return res.status(500).json({ ok: false, error: 'ADMIN_DASHBOARD_KEY is not set in Vercel yet.' });
  }
  if (!SB_URL || !SB_SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Database is not configured.' });
  }

  const suppliedKey = (req.query && req.query.key) || (req.headers && req.headers['x-admin-key']) || '';
  if (suppliedKey !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const base = SB_URL.replace(/\/$/, '');
  const authHeaders = {
    apikey: SB_SERVICE_KEY,
    Authorization: 'Bearer ' + SB_SERVICE_KEY
  };

  try {
    // 1) Fetch orders, newest first (limit 200 to keep this fast/cheap)
    const ordersRes = await fetch(
      base + '/rest/v1/orders?select=*&order=created_at.desc&limit=200',
      { headers: authHeaders }
    );
    if (!ordersRes.ok) {
      const t = await ordersRes.text();
      return res.status(500).json({ ok: false, error: 'Could not load orders.', detail: t.slice(0, 300) });
    }
    const orders = await ordersRes.json();

    // 2) For every document on every order, request a signed URL (valid
    //    1 hour). Signing happens in parallel to keep this fast.
    const jobs = [];
    orders.forEach((order) => {
      const docs = Array.isArray(order.documents) ? order.documents : [];
      docs.forEach((doc) => {
        if (!doc || !doc.path) return;
        jobs.push(
          fetch(base + '/storage/v1/object/sign/order-documents/' + doc.path, {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ expiresIn: 3600 })
          })
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => {
              if (j && j.signedURL) {
                doc.url = base + '/storage/v1' + j.signedURL;
              }
            })
            .catch(() => {})
        );
      });
    });
    await Promise.all(jobs);

    return res.status(200).json({ ok: true, orders });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Admin endpoint error.', detail: String(e).slice(0, 200) });
  }
}
