// ═══════════════════════════════════════════════════════════
//  supabase-orders.js  —  Save orders + upload ID/License files
//
//  Exposes window.mystampOrders with two helpers:
//    uploadFiles(orderRef, files)  → uploads to Storage, returns URLs
//    saveOrder(orderData)          → inserts a row into the orders table
//    updateOrderStatus(ref, status)→ marks an order paid/failed
// ═══════════════════════════════════════════════════════════
(function () {
  'use strict';

  var BUCKET = 'order-documents';   // create this bucket in Supabase Storage

  function client() {
    return window.mystampSupabase || null;
  }

  // Upload an array of File objects under a folder named after the order ref.
  // Returns an array of { name, path } for the stored files.
  async function uploadFiles(orderRef, files) {
    var sb = client();
    if (!sb || !files || !files.length) return [];

    var stored = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var safeName = (file.name || ('file-' + i)).replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = orderRef + '/' + Date.now() + '-' + i + '-' + safeName;

      try {
        var result = await sb.storage.from(BUCKET).upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
        if (!result.error) {
          stored.push({ name: file.name, path: path });
        }
      } catch (e) { /* skip a failed file, keep the rest */ }
    }
    return stored;
  }

  // Insert the order. Returns { ok, error }.
  async function saveOrder(orderData) {
    var sb = client();
    if (!sb) return { ok: false, error: 'Supabase not configured' };
    try {
      var res = await sb.from('orders').insert([orderData]);
      if (res.error) return { ok: false, error: res.error.message };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }

  async function updateOrderStatus(orderRef, status) {
    var sb = client();
    if (!sb) return { ok: false };
    try {
      var res = await sb.from('orders').update({ status: status }).eq('order_ref', orderRef);
      return { ok: !res.error };
    } catch (e) {
      return { ok: false };
    }
  }

  window.mystampOrders = {
    uploadFiles: uploadFiles,
    saveOrder: saveOrder,
    updateOrderStatus: updateOrderStatus
  };
})();
