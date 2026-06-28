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
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });
        if (result.error) {
          // Surface the reason so we can see it in the browser console
          console.error('Upload failed for', file.name, '→', result.error.message);
        } else {
          stored.push({ name: file.name, path: path, type: file.type || '' });
        }
      } catch (e) {
        console.error('Upload threw for', file.name, '→', e);
      }
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
