// ═══════════════════════════════════════════════════════════
//  api/admin-update-order.js  —  Vercel Serverless Function
//  Lets the admin dashboard (admin.html) change an order's status
//  (pending → paid / cancelled / pending again) with one click.
//
//  Security: same shared-secret pattern as admin-orders.js.
//  Uses SUPABASE_SERVICE_KEY server-side only — never sent to the browser.
// ═══════════════════════════════════════════════════════════

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;
  const SB_URL = process.env.SUPABASE_URL;
  const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!ADMIN_KEY) {
    return res.status(500).json({ ok: false, error: 'ADMIN_DASHBOARD_KEY is not set in Vercel yet.' });
  }
  if (!SB_URL || !SB_SERVICE_KEY) {
    return res.status(500).json({ ok: false, error: 'Database is not configured.' });
  }

  const body = req.body || {};
  const suppliedKey = body.key || (req.headers && req.headers['x-admin-key']) || '';
  if (suppliedKey !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, error: 'Unauthorized.' });
  }

  const ref = String(body.ref || '').trim();
  const status = String(body.status || '').trim();
  const ALLOWED = ['pending', 'paid', 'cancelled'];
  if (!ref) return res.status(400).json({ ok: false, error: 'Missing order ref.' });
  if (ALLOWED.indexOf(status) === -1) {
    return res.status(400).json({ ok: false, error: 'Invalid status. Use pending, paid or cancelled.' });
  }

  try {
    const patchUrl =
      SB_URL.replace(/\/$/, '') +
      '/rest/v1/orders?order_ref=eq.' + encodeURIComponent(ref);

    const sbRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_SERVICE_KEY,
        Authorization: 'Bearer ' + SB_SERVICE_KEY,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({ status: status })
    });

    if (!sbRes.ok) {
      const t = await sbRes.text();
      return res.status(500).json({ ok: false, error: 'DB update failed', detail: t.slice(0, 300) });
    }

    const updated = await sbRes.json();
    return res.status(200).json({ ok: true, ref: ref, status: status, updated: Array.isArray(updated) ? updated.length : 0 });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Update endpoint error.', detail: String(e).slice(0, 200) });
  }
}
