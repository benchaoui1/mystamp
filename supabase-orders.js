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
  // Runs all uploads in parallel (instead of one-by-one) — with several
  // documents (ID front/back, logo, licence) this is the difference between
  // waiting for 4 sequential round-trips and waiting for 1.
  // Returns an array of { name, path } for the stored files.
  async function uploadFiles(orderRef, files) {
    var sb = client();
    if (!sb || !files || !files.length) return [];

    var uploads = files.map(function (file, i) {
      var safeName = (file.name || ('file-' + i)).replace(/[^a-zA-Z0-9._-]/g, '_');
      var path = orderRef + '/' + Date.now() + '-' + i + '-' + safeName;
      return sb.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream'
      }).then(function (result) {
        if (result.error) {
          console.error('Upload failed for', file.name, '→', result.error.message);
          return null;
        }
        return { name: file.name, path: path, type: file.type || '' };
      }).catch(function (e) {
        console.error('Upload threw for', file.name, '→', e);
        return null;
      });
    });

    var results = await Promise.all(uploads);
    return results.filter(Boolean);
  }

  // Insert the order. Returns { ok, error }.
  // Resilient: if the table is missing a column, Postgres/PostgREST returns
  // an error naming that EXACT column (e.g. `column "pobox" of relation
  // "orders" does not exist`). We parse that error and drop ONLY the named
  // column, then retry — instead of blindly stripping a whole list of
  // "optional" columns. That old blind-strip approach was silently
  // dropping customer_address (and anything else in the list) on every
  // order whenever ANY one column was missing, even if customer_address
  // itself existed fine in the table. This keeps every real column that
  // actually exists.
  function extractMissingColumn(errMsg) {
    var m = /column ["']?([a-zA-Z0-9_]+)["']?/i.exec(errMsg || '');
    return m ? m[1] : null;
  }

  async function saveOrder(orderData) {
    var sb = client();
    if (!sb) return { ok: false, error: 'Supabase not configured' };

    async function tryInsert(row) {
      try {
        var res = await sb.from('orders').insert([row]);
        if (res.error) return { ok: false, error: res.error.message };
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e) };
      }
    }

    var row = Object.assign({}, orderData);
    var lastError = null;

    // Try up to 10 times, each time removing only the specific column
    // Postgres complains about — never a whole batch at once.
    for (var attempt = 0; attempt < 10; attempt++) {
      var result = await tryInsert(row);
      if (result.ok) return result;

      lastError = result.error;
      var msg = (result.error || '').toLowerCase();
      var isMissingColumn = msg.indexOf('column') !== -1 && msg.indexOf('does not exist') !== -1;
      if (!isMissingColumn) break;

      var badCol = extractMissingColumn(result.error);
      if (!badCol || !(badCol in row)) break;

      console.warn('[mystamp] Column "' + badCol + '" missing on orders table — retrying without it. Add it in Supabase to stop seeing this.', result.error);
      delete row[badCol];
    }

    return { ok: false, error: lastError };
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

  // Convert a base64 data URL into a File object
  function dataUrlToFile(dataUrl, filename, mime) {
    try {
      var arr = dataUrl.split(',');
      var byteStr = atob(arr[1]);
      var n = byteStr.length;
      var u8 = new Uint8Array(n);
      while (n--) u8[n] = byteStr.charCodeAt(n);
      return new File([u8], filename, { type: mime || 'application/octet-stream' });
    } catch (e) {
      return null;
    }
  }

  // Upload a single base64 data URL (logo / license) under the order folder.
  async function uploadDataUrl(orderRef, dataUrl, filename, mime) {
    var sb = client();
    if (!sb || !dataUrl) return null;
    var file = dataUrlToFile(dataUrl, filename, mime);
    if (!file) return null;
    var safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    var path = orderRef + '/' + Date.now() + '-' + safeName;
    try {
      var result = await sb.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600', upsert: false,
        contentType: mime || 'application/octet-stream'
      });
      if (result.error) {
        console.error('Upload failed for', filename, '→', result.error.message);
        return null;
      }
      return { name: filename, path: path, type: mime || '' };
    } catch (e) {
      console.error('Upload threw for', filename, '→', e);
      return null;
    }
  }

  // Render an SVG string to a PNG data URL (so the stamp design can be
  // saved as a real image). Returns a Promise<dataUrl|null>.
  function svgToPngDataUrl(svgString, size) {
    return new Promise(function (resolve) {
      try {
        size = size || 600;
        // Ensure the SVG declares the xmlns so it can be loaded as an image
        if (svgString.indexOf('xmlns=') === -1) {
          svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        var blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          try {
            var canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) { resolve(null); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
      } catch (e) { resolve(null); }
    });
  }

  window.mystampOrders = {
    uploadFiles: uploadFiles,
    uploadDataUrl: uploadDataUrl,
    svgToPngDataUrl: svgToPngDataUrl,
    saveOrder: saveOrder,
    updateOrderStatus: updateOrderStatus
  };
})();
