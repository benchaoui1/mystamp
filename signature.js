/* ════════════════════════════════════════════════════════════════
   SIGNATURE PAGE LOGIC
   - Smooth velocity-based signature pad (touch + mouse + stylus)
   - Two methods: Draw  |  Upload an existing signature (auto-cleaned)
   - Draggable name tag that prints on the signature
   - Undo / Clear / Accept / Re-sign
   - ID / passport upload with preview
   - Submit → flattened signature (ink + name) sent for verification
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ───── Logo fallback ───── */
  var logoImg = document.getElementById('logoImg');
  var logoFallback = document.getElementById('logoFallback');
  if (logoImg) logoImg.addEventListener('error', function () {
    this.style.display = 'none';
    if (logoFallback) logoFallback.style.display = 'flex';
  });

  /* ───── WhatsApp bubble ───── */
  var waBubble = document.getElementById('waFloatBubble');
  var waClose = document.getElementById('waFloatClose');
  if (waBubble) {
    setTimeout(function () { waBubble.classList.add('show'); }, 2500);
    if (waClose) waClose.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); waBubble.classList.remove('show');
    });
  }

  /* ════════════════════════════════════════
     ELEMENTS + STATE
  ════════════════════════════════════════ */
  var canvas = document.getElementById('sigCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var frame = document.getElementById('sigPadFrame');
  var pad = document.getElementById('sigPad');
  var undoBtn = document.getElementById('sigUndo');
  var clearBtn = document.getElementById('sigClear');
  var acceptBtn = document.getElementById('sigAccept');
  var acceptLabel = document.getElementById('sigAcceptLabel');

  var modeDrawBtn = document.getElementById('sigModeDraw');
  var modeUploadBtn = document.getElementById('sigModeUpload');
  var padUpload = document.getElementById('sigPadUpload');
  var imgInput = document.getElementById('sigImgInput');
  var scanEl = document.getElementById('sigScan');
  var cleanBadge = document.getElementById('sigCleanBadge');

  var INK = { blue: '#3a67ff', black: '#15181f' };
  var inkColor = INK.blue;
  var mode = 'draw';                 // 'draw' | 'upload'
  var drawing = false, locked = false, hasInk = false;
  var points = [], snapshots = [], lastWidth = 2;
  var originalUploadImg = null;      // keep source for re-tint

  /* ════════════════════════════════════════
     CANVAS SIZING (high-DPI)
  ════════════════════════════════════════ */
  function sizeCanvas() {
    var prev = hasInk ? canvas.toDataURL() : null;
    var rect = pad.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (prev) {
      var img = new Image();
      img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); };
      img.src = prev;
    }
  }
  sizeCanvas();
  var resizeT;
  window.addEventListener('resize', function () { clearTimeout(resizeT); resizeT = setTimeout(sizeCanvas, 180); });

  function padSize() { var r = pad.getBoundingClientRect(); return { w: r.width, h: r.height }; }
  function getPos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; }

  /* ════════════════════════════════════════
     DRAWING (draw mode only)
  ════════════════════════════════════════ */
  function strokeWidth(p0, p1) {
    var dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    var dt = Math.max(p1.t - p0.t, 1);
    var w = 3.4 - (dist / dt) * 2.2;
    w = Math.max(1.1, Math.min(3.6, w));
    return lastWidth + (w - lastWidth) * 0.4;
  }
  function startStroke(e) {
    if (locked || mode !== 'draw') return;
    drawing = true;
    try { snapshots.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); } catch (err) {}
    if (snapshots.length > 40) snapshots.shift();
    points = [getPos(e)]; lastWidth = 2;
    if (!hasInk) { hasInk = true; pad.classList.add('has-ink'); }
    frame.classList.add('is-active');
    refreshControls();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
  }
  function moveStroke(e) {
    if (!drawing || locked || mode !== 'draw') return;
    var evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (var i = 0; i < evs.length; i++) {
      var p = getPos(evs[i]); points.push(p);
      if (points.length < 3) continue;
      var p0 = points[points.length - 3], p1 = points[points.length - 2], p2 = points[points.length - 1];
      var m1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      var m2 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      var w = strokeWidth(p1, p2); lastWidth = w;
      ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.quadraticCurveTo(p1.x, p1.y, m2.x, m2.y);
      ctx.strokeStyle = inkColor; ctx.lineWidth = w; ctx.stroke();
    }
  }
  function endStroke() {
    if (!drawing) return; drawing = false;
    if (points.length === 1) {
      var p = points[0];
      ctx.beginPath(); ctx.fillStyle = inkColor; ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    points = []; refreshControls();
  }
  canvas.addEventListener('pointerdown', startStroke);
  canvas.addEventListener('pointermove', moveStroke);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
  canvas.addEventListener('pointerleave', function (e) { if (drawing) endStroke(e); });

  /* ════════════════════════════════════════
     MODE SWITCHING
  ════════════════════════════════════════ */
  function setMode(m) {
    if (locked) return;
    mode = m;
    var isUpload = m === 'upload';
    modeDrawBtn.classList.toggle('active', !isUpload);
    modeUploadBtn.classList.toggle('active', isUpload);
    modeDrawBtn.setAttribute('aria-selected', String(!isUpload));
    modeUploadBtn.setAttribute('aria-selected', String(isUpload));
    pad.classList.toggle('mode-upload', isUpload);
    resetInk();                        // start each method fresh
    if (isUpload) pad.classList.add('no-image');
    refreshControls();
  }
  modeDrawBtn.addEventListener('click', function () { setMode('draw'); });
  modeUploadBtn.addEventListener('click', function () { setMode('upload'); });

  /* ════════════════════════════════════════
     UPLOAD AN EXISTING SIGNATURE → CLEAN + SCAN
  ════════════════════════════════════════ */
  function hexToRgb(h) { var n = parseInt(h.slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; }

  function otsu(hist, total) {
    var sum = 0, i; for (i = 0; i < 256; i++) sum += i * hist[i];
    var sumB = 0, wB = 0, max = -1, thr = 127;
    for (i = 0; i < 256; i++) {
      wB += hist[i]; if (wB === 0) continue;
      var wF = total - wB; if (wF === 0) break;
      sumB += i * hist[i];
      var mB = sumB / wB, mF = (sum - sumB) / wF;
      var between = wB * wF * (mB - mF) * (mB - mF);
      if (between > max) { max = between; thr = i; }
    }
    return thr;
  }

  /* Turn a photo of a signature into clean transparent ink */
  function cleanSignature(img) {
    var maxDim = 1500;
    var scale = Math.min(1, maxDim / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    var w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    var h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    var work = document.createElement('canvas'); work.width = w; work.height = h;
    var wc = work.getContext('2d'); wc.drawImage(img, 0, 0, w, h);
    var data, hist = new Array(256).fill(0), lum = new Float32Array(w * h), mean = 0, i, px;
    try { data = wc.getImageData(0, 0, w, h); } catch (e) { return null; }
    var d = data.data;
    for (i = 0, px = 0; i < d.length; i += 4, px++) {
      var L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      lum[px] = L; mean += L; hist[Math.round(L)]++;
    }
    mean /= (w * h);
    var t = otsu(hist, w * h);
    var darkBg = mean < 110;           // signature on a dark background → invert
    var ramp = 42;                     // sharper threshold = crisper edges
    var ink = hexToRgb(inkColor);
    for (i = 0, px = 0; i < d.length; i += 4, px++) {
      var a;
      if (darkBg) a = (lum[px] - t) / ramp;     // keep bright pixels
      else a = (t - lum[px]) / ramp;            // keep dark pixels
      a = Math.max(0, Math.min(1, a));
      a = Math.pow(a, 0.7);                      // densify ink, keep anti-aliased edges
      d[i] = ink.r; d[i + 1] = ink.g; d[i + 2] = ink.b; d[i + 3] = Math.round(a * 255);
    }
    wc.putImageData(data, 0, 0);
    // Crop to content
    var minX = w, minY = h, maxX = 0, maxY = 0, found = false;
    for (px = 0; px < w * h; px++) {
      if (d[px * 4 + 3] > 28) {
        found = true;
        var x = px % w, y = (px / w) | 0;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (!found) return null;
    var pad2 = 10;
    minX = Math.max(0, minX - pad2); minY = Math.max(0, minY - pad2);
    maxX = Math.min(w - 1, maxX + pad2); maxY = Math.min(h - 1, maxY + pad2);
    var cw = maxX - minX + 1, ch = maxY - minY + 1;
    var crop = document.createElement('canvas'); crop.width = cw; crop.height = ch;
    crop.getContext('2d').drawImage(work, minX, minY, cw, ch, 0, 0, cw, ch);
    return crop;
  }

  /* Paint a cleaned signature centered into the pad */
  function paintCleaned(crop) {
    var ps = padSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var availW = ps.w * 0.84, availH = ps.h * 0.66;
    var s = Math.min(availW / crop.width, availH / crop.height);
    var dw = crop.width * s, dh = crop.height * s;
    var dx = (ps.w - dw) / 2, dy = (ps.h - dh) / 2 - ps.h * 0.04;
    ctx.drawImage(crop, dx, dy, dw, dh);
    hasInk = true; pad.classList.add('has-ink'); pad.classList.remove('no-image');
    frame.classList.add('is-active');
  }

  function processImageFile(file) {
    if (!file || file.type.indexOf('image') !== 0) { flashUpload('Please choose an image (JPG or PNG)'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        originalUploadImg = img;
        runScan(function () {
          var crop = cleanSignature(img);
          if (!crop) { flashUpload('We couldn\u2019t read a signature there — try a clearer photo'); pad.classList.add('no-image'); return; }
          paintCleaned(crop);
          showCleanBadge();
          refreshControls();
        });
      };
      img.onerror = function () { flashUpload('That image could not be opened'); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function runScan(done) {
    scanEl.classList.remove('run'); void scanEl.offsetWidth; scanEl.classList.add('run');
    setTimeout(function () { done(); }, 480);
    setTimeout(function () { scanEl.classList.remove('run'); }, 1000);
  }
  function showCleanBadge() {
    cleanBadge.classList.add('show');
    setTimeout(function () { cleanBadge.classList.remove('show'); }, 2600);
  }
  function flashUpload(msg) {
    var hint = padUpload.querySelector('.sig-pad-upload-hint');
    var orig = hint.innerHTML;
    hint.textContent = msg; hint.style.color = '#ef4444';
    setTimeout(function () { hint.innerHTML = orig; hint.style.color = ''; }, 2800);
  }

  padUpload.addEventListener('click', function () { if (!locked) imgInput.click(); });
  padUpload.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); imgInput.click(); } });
  imgInput.addEventListener('change', function () { if (this.files[0]) processImageFile(this.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { padUpload.addEventListener(ev, function (e) { e.preventDefault(); padUpload.classList.add('is-drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { padUpload.addEventListener(ev, function (e) { e.preventDefault(); padUpload.classList.remove('is-drag'); }); });
  padUpload.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files[0]) processImageFile(e.dataTransfer.files[0]); });

  /* ════════════════════════════════════════
     UNDO / CLEAR / INK
  ════════════════════════════════════════ */
  undoBtn.addEventListener('click', function () {
    if (locked || mode !== 'draw' || !snapshots.length) return;
    ctx.putImageData(snapshots.pop(), 0, 0);
    if (!snapshots.length) { hasInk = false; pad.classList.remove('has-ink'); frame.classList.remove('is-active'); }
    refreshControls();
  });

  function resetInk() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshots = []; hasInk = false; originalUploadImg = null;
    pad.classList.remove('has-ink'); frame.classList.remove('is-active');
  }
  clearBtn.addEventListener('click', function () {
    if (locked) return;
    resetInk();
    if (mode === 'upload') pad.classList.add('no-image');
    refreshControls();
  });

  document.querySelectorAll('.sig-ink-swatch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      if (locked) return;
      document.querySelectorAll('.sig-ink-swatch').forEach(function (s) { s.classList.remove('active'); });
      sw.classList.add('active');
      inkColor = INK[sw.dataset.ink] || INK.blue;
      // Re-tint an uploaded signature live
      if (mode === 'upload' && originalUploadImg) {
        var crop = cleanSignature(originalUploadImg);
        if (crop) paintCleaned(crop);
      }
    });
  });

  /* ════════════════════════════════════════
     ACCEPT / RE-SIGN
  ════════════════════════════════════════ */
  acceptBtn.addEventListener('click', function () {
    if (!locked) {
      if (!hasInk) return;
      locked = true;
      frame.classList.add('is-locked'); frame.classList.remove('is-active');
      acceptBtn.classList.add('is-resign');
      acceptLabel.textContent = 'Re-sign';
      acceptBtn.querySelector('.sig-accept-icon').innerHTML = '<path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64"/><polyline points="3 4 3 9 8 9"/>';
    } else {
      locked = false;
      frame.classList.remove('is-locked');
      acceptBtn.classList.remove('is-resign');
      acceptLabel.textContent = 'Accept signature';
      acceptBtn.querySelector('.sig-accept-icon').innerHTML = '<polyline points="20 6 9 17 4 12"/>';
      resetInk();
      if (mode === 'upload') pad.classList.add('no-image');
    }
    refreshControls();
  });

  function refreshControls() {
    undoBtn.disabled = locked || mode !== 'draw' || snapshots.length === 0;
    clearBtn.disabled = locked || !hasInk;
    acceptBtn.disabled = !locked && !hasInk;
    modeDrawBtn.disabled = locked; modeUploadBtn.disabled = locked;
    refreshSubmit();
  }

  /* ════════════════════════════════════════
     FLATTEN signature → final PNG
  ════════════════════════════════════════ */
  function buildFinalImage() {
    var ex = document.createElement('canvas');
    ex.width = canvas.width; ex.height = canvas.height;
    var c = ex.getContext('2d');
    c.drawImage(canvas, 0, 0);
    return ex.toDataURL('image/png');
  }

  /* ════════════════════════════════════════
     ID / PASSPORT UPLOAD
  ════════════════════════════════════════ */
  var drop = document.getElementById('sigDrop');
  var fileInput = document.getElementById('sigFileInput');
  var fileCard = document.getElementById('sigFile');
  var fileThumb = document.getElementById('sigFileThumb');
  var fileName = document.getElementById('sigFileName');
  var fileSize = document.getElementById('sigFileSize');
  var fileRemove = document.getElementById('sigFileRemove');
  var uploaded = false;
  var sigIdData = null, sigIdName = null, sigIdType = null;
  var MAX = 12 * 1024 * 1024;
  var OK = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

  function fmt(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

  function handleFile(file) {
    if (!file) return;
    var ok = OK.indexOf(file.type) !== -1 || /\.(jpe?g|png|webp|heic|pdf)$/i.test(file.name);
    if (!ok) { flashDrop('Use a JPG, PNG or PDF file'); return; }
    if (file.size > MAX) { flashDrop('File is over 12 MB — please compress it'); return; }
    fileName.textContent = file.name;
    fileSize.innerHTML = fmt(file.size) + ' <span class="sig-file-ok"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Ready</span>';
    // Keep the full file (base64) so checkout can upload it to Supabase
    sigIdName = file.name; sigIdType = file.type || '';
    var rAll = new FileReader();
    rAll.onload = function (ev) { sigIdData = ev.target.result; };
    rAll.readAsDataURL(file);
    if (file.type.indexOf('image') === 0) {
      var r = new FileReader();
      r.onload = function (ev) { fileThumb.innerHTML = '<img src="' + ev.target.result + '" alt="ID preview">'; };
      r.readAsDataURL(file);
    } else {
      fileThumb.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    drop.style.display = 'none'; fileCard.classList.add('show'); uploaded = true; refreshSubmit();
  }
  function flashDrop(msg) {
    var sub = drop.querySelector('.sig-drop-sub'); var orig = sub.textContent;
    sub.textContent = msg; sub.style.color = '#ef4444'; drop.style.borderColor = '#fecaca';
    setTimeout(function () { sub.textContent = orig; sub.style.color = ''; drop.style.borderColor = ''; }, 2600);
  }
  drop.addEventListener('click', function () { fileInput.click(); });
  drop.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
  fileInput.addEventListener('change', function () { handleFile(this.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-drag'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-drag'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
  fileRemove.addEventListener('click', function () { uploaded = false; sigIdData = null; sigIdName = null; sigIdType = null; fileInput.value = ''; fileCard.classList.remove('show'); drop.style.display = 'flex'; refreshSubmit(); });

  /* ════════════════════════════════════════
     SUBMIT
  ════════════════════════════════════════ */
  var submitBtn = document.getElementById('sigSubmit');
  var consoleBody = document.getElementById('sigConsoleBody');
  var successBox = document.getElementById('sigSuccess');
  var successName = document.getElementById('sigSuccessName');

  function refreshSubmit() { submitBtn.disabled = !(locked && hasInk && uploaded); }

  submitBtn.addEventListener('click', function () {
    if (submitBtn.disabled) return;
    var signatureData = buildFinalImage();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="animation:sigSpin .7s linear infinite"><circle cx="12" cy="12" r="9" stroke-dasharray="38 60"/></svg> Preparing checkout…';
    if (!document.getElementById('sig-spin')) {
      var st = document.createElement('style'); st.id = 'sig-spin';
      st.textContent = '@keyframes sigSpin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
    }

    // Build a checkout order for the signature stamp, then go to checkout.
    // The signature image + ID travel along and get uploaded to Supabase there.
    var order = {
      type: 'signature',
      shape: 'signature',
      size: 'Signature Stamp',
      color: '#1a1a2e',
      company: 'Signature Stamp',
      quantity: 1,
      withLogo: false,
      // The signature itself, shown as the preview + uploaded as the design
      signatureData: signatureData,
      previewSvg: null,
      // ID document carried over (base64) so checkout uploads it
      licenseData: sigIdData || null,
      license: sigIdName || null,
      licenseType: sigIdType || null
    };

    try {
      sessionStorage.setItem('mystamp_order', JSON.stringify(order));
    } catch (e) {
      // If too large for sessionStorage, drop the heavy ID base64 but keep signature
      try {
        var slim = Object.assign({}, order); slim.licenseData = null; slim._filesDropped = true;
        sessionStorage.setItem('mystamp_order', JSON.stringify(slim));
      } catch (e2) {}
    }

    setTimeout(function () { window.location.href = 'checkout.html'; }, 700);
  });

  /* init */
  refreshControls();
})();

/* ───── Scroll-reveal for the SEO claim box + FAQ accordion ───── */
(function () {
  'use strict';
  var items = document.querySelectorAll('.sig-reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        var el = entry.target;
        setTimeout(function () { el.classList.add('in'); }, i * 60);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });
})();
