/* ════════════════════════════════════════════════════
   MY STAMP — Configurator Logic
   Handles shape/color selection, live SVG preview,
   file uploads, quantity, pricing, and order actions.
════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── State ─────────────────────────────────────── */
  const S = {
    shape:       'circle',
    color:       '#3a67ff',
    qty:         1,
    base:        99,
    logoFee:     19,
    logoData:    null,
    logoName:    null,
    logoType:    null,
    licenseData: null,
    ownDesignData: null,
    ownDesignName: null,
    ownDesignType: null,
    licenseType: null,
    circleSize:  38,
    rectSize:    '55x30',
    licenseFile: null
  };

  const SZ = {
    circle: '38MM',
    square: '40x40MM',
    rect:   '55x30MM',
    oval:   '50x30MM'
  };

  const NS = 'http://www.w3.org/2000/svg';
  const FF = 'Manrope, Arial, sans-serif';

  /* ── DOM cache ─────────────────────────────────── */
  const $ = (id) => document.getElementById(id);

  const els = {
    // Selection (new premium cards)
    shapeBtns:    document.querySelectorAll('.shape-card'),
    colorBtns:    document.querySelectorAll('.color-card'),
    shapeValue:   $('shapeValue'),
    colorValue:   $('colorValue'),
    sizePills:    document.querySelectorAll('#sizePicker .size-pill'),
    rectSizePills: document.querySelectorAll('#rectSizePicker .size-pill'),
    sizePicker:     $('sizePicker'),
    rectSizePicker: $('rectSizePicker'),
    sizeTag:        $('sizeTag'),
    sizeTxt:        $('sizeTxt'),

    // Form
    fName:    $('fName'),
    fPobox:   $('fPobox'),
    fEmirate: $('fEmirate'),
    fLic:     $('fLic'),
    fNote:    $('fNote'),
    licRow:   $('licRow'),

    // Toggles
    logoToggle: $('logoToggle'),
    licToggle:  $('licToggle'),
    logoInfo:   $('logoInfo'),

    // Logo upload
    uploadZone:   $('uploadZone'),
    logoFile:     $('logoFile'),
    fileRow:      $('fileRow'),
    fileName:     $('fileName'),
    uploadMeta:   $('uploadMeta'),
    removeLogoBtn: $('removeLogoBtn'),

    // License upload
    licenseUploadZone: $('licenseUploadZone'),
    licenseFile:       $('licenseFile'),
    licenseFileRow:    $('licenseFileRow'),
    licenseFileName:   $('licenseFileName'),
    removeLicenseBtn:  $('removeLicenseBtn'),

    // Own design (customer uploads their existing stamp artwork)
    ownDesign:        $('ownDesign'),
    ownDesignInput:   $('ownDesignInput'),
    ownPreview:       $('ownPreview'),
    ownPreviewImg:    $('ownPreviewImg'),
    ownPreviewPdf:    $('ownPreviewPdf'),
    ownPreviewFname:  $('ownPreviewFname'),
    ownPreviewRemove: $('ownPreviewRemove'),
    fNoteOwn:         $('fNoteOwn'),
    cfgLeft:          document.querySelector('.cfg-left'),

    // Preview + pricing
    stampSvg:  $('stampSvg'),
    priceVal:  $('priceVal'),
    qtyVal:    $('qtyVal'),
    qtyMinus:  $('qtyMinus'),
    qtyPlus:   $('qtyPlus'),

    // Order
    checkoutBtn: $('checkoutBtn')
  };

  /* ── SVG helpers ───────────────────────────────── */
  function mk(tag, attrs) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function tx(attrs, txt) {
    const e = mk('text', attrs);
    e.textContent = txt;
    return e;
  }

  /* ── Pickers ───────────────────────────────────── */
  function setActive(group, target) {
    group.forEach((b) => b.classList.remove('active'));
    target.classList.add('active');
  }

  // Update the right-side value label with a smooth flash animation
  function flashValue(el, newText) {
    if (!el) return;
    if (el.textContent === newText) return;
    el.textContent = newText;
    el.classList.remove('flash');
    void el.offsetWidth;     // restart animation
    el.classList.add('flash');
  }

  function pickShape(val, btn) {
    S.shape = val;
    setActive(els.shapeBtns, btn);

    // Update the "Shape: Round" badge above
    flashValue(els.shapeValue, btn.dataset.name || val);

    const isCircle = val === 'circle';
    const isRect   = val === 'rect';

    els.sizePicker.style.display     = isCircle ? 'flex' : 'none';
    els.rectSizePicker.style.display = isRect   ? 'flex' : 'none';
    els.sizeTag.style.display = (isCircle || isRect) ? 'none' : 'inline-block';

    if (!isCircle && !isRect) els.sizeTxt.textContent = SZ[val];
    render();
  }

  function pickColor(val, btn) {
    S.color = val;
    setActive(els.colorBtns, btn);

    // Update the "Ink Color: Royal Blue" badge above
    flashValue(els.colorValue, btn.dataset.name || val);

    render();
  }

  function pickSize(size, btn) {
    S.circleSize = size;
    setActive(els.sizePills, btn);
    render();
  }

  function pickRectSize(size, btn) {
    S.rectSize = size;
    setActive(els.rectSizePills, btn);
    render();
  }

  /* ── Fast upload helper ────────────────────────────
     Phone-camera photos (logo scans, licence photos, ID
     photos) can be 4-10MB at full resolution. Uploading
     that over a mobile connection is what makes "sending
     a document" feel slow. We downscale + re-compress any
     image client-side before it ever leaves the device —
     PDFs and other non-image files pass through untouched. */
  function compressImageDataUrl(file, maxDim, quality) {
    return new Promise((resolve) => {
      var isImage = !!file.type && file.type.indexOf('image/') === 0;
      var reader = new FileReader();
      reader.onerror = function () { resolve(null); };
      reader.onload = function (e) {
        if (!isImage) {
          // PDFs / non-images: keep as-is, nothing to compress
          resolve({ dataUrl: e.target.result, type: file.type || '' });
          return;
        }
        var img = new Image();
        img.onerror = function () {
          // If it can't be decoded as an image, fall back to the original
          resolve({ dataUrl: e.target.result, type: file.type || '' });
        };
        img.onload = function () {
          try {
            var w = img.width, h = img.height;
            var scale = Math.min(1, (maxDim || 1600) / Math.max(w, h));
            var outW = Math.max(1, Math.round(w * scale));
            var outH = Math.max(1, Math.round(h * scale));
            var canvas = document.createElement('canvas');
            canvas.width = outW; canvas.height = outH;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outW, outH);
            ctx.drawImage(img, 0, 0, outW, outH);
            var outUrl = canvas.toDataURL('image/jpeg', quality || 0.82);
            // Safety net: if compression somehow produced something bigger
            // (rare, e.g. tiny already-optimised images), keep the original.
            if (outUrl.length >= e.target.result.length) {
              resolve({ dataUrl: e.target.result, type: file.type || '' });
            } else {
              resolve({ dataUrl: outUrl, type: 'image/jpeg' });
            }
          } catch (err) {
            resolve({ dataUrl: e.target.result, type: file.type || '' });
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ── Toggles ───────────────────────────────────── */
  function toggleLogo() {
    const on = els.logoToggle.checked;
    const hasFile = !!S.logoData;
    els.uploadZone.style.display = (on && !hasFile) ? 'flex' : 'none';
    els.fileRow.style.display = (on && hasFile) ? 'flex' : 'none';
    els.logoInfo.style.display = on ? 'flex' : 'none';
    calcPrice();
    render();
  }

  function toggleLic() {
    els.licRow.style.display = els.licToggle.checked ? 'flex' : 'none';
    render();
  }

  /* ── Logo upload ───────────────────────────────── */
  function handleLogoUpload(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      els.fileName.textContent = file.name + ' · optimising…';
      els.fileRow.style.display = 'flex';
      els.uploadZone.style.display = 'none';
      compressImageDataUrl(file, 1600, 0.85).then((result) => {
        S.logoData = result ? result.dataUrl : null;
        S.logoName = file.name;
        S.logoType = (result && result.type) || file.type || '';
        els.fileName.textContent = file.name;
        render();
      });
    }
  }

  function removeLogo() {
    S.logoData = null;
    els.logoFile.value = '';
    els.fileRow.style.display = 'none';
    els.uploadZone.style.display = 'flex';
    render();
  }

  /* ── License upload ────────────────────────────── */
  function handleLicenseUpload(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      S.licenseFile = file.name;
      els.licenseFileName.textContent = file.name;
      els.licenseFileRow.style.display = 'flex';
      els.licenseUploadZone.style.display = 'none';
      // Keep the full file (base64) + type so checkout can upload it.
      // Photos of the licence get downscaled; PDFs pass through untouched.
      compressImageDataUrl(file, 1800, 0.85).then((result) => {
        S.licenseData = result ? result.dataUrl : null;
        S.licenseType = (result && result.type) || file.type || '';
      });
    }
  }

  function removeLicense() {
    S.licenseFile = null;
    S.licenseData = null;
    S.licenseType = null;
    els.licenseFile.value = '';
    els.licenseFileRow.style.display = 'none';
    els.licenseUploadZone.style.display = 'flex';
  }

  /* ── Own design upload (customer's existing stamp artwork) ── */
  function handleOwnDesignUpload(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 25 * 1024 * 1024) { alert('Please upload a file under 25MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      S.ownDesignData = e.target.result;
      S.ownDesignName = file.name;
      S.ownDesignType = file.type || '';
      showOwnDesign();
    };
    reader.readAsDataURL(file);
  }

  function showOwnDesign() {
    const isPdf = (S.ownDesignType === 'application/pdf') || /\.pdf$/i.test(S.ownDesignName || '');
    if (isPdf) {
      els.ownPreviewImg.style.display = 'none';
      els.ownPreviewPdf.style.display = 'block';
      els.ownPreviewPdf.src = S.ownDesignData;
    } else {
      els.ownPreviewPdf.style.display = 'none';
      els.ownPreviewImg.style.display = 'block';
      els.ownPreviewImg.src = S.ownDesignData;
    }
    els.ownPreviewFname.textContent = S.ownDesignName || '';
    // Hide the builder controls + the live SVG preview; show the uploaded design
    if (els.cfgLeft) els.cfgLeft.style.display = 'none';
    hideBuilderPreviewBits(true);
    els.ownPreview.style.display = 'block';
    if (els.ownDesign) els.ownDesign.classList.add('is-active');
  }

  function removeOwnDesign() {
    S.ownDesignData = null;
    S.ownDesignName = null;
    S.ownDesignType = null;
    els.ownDesignInput.value = '';
    els.ownPreview.style.display = 'none';
    els.ownPreviewImg.src = '';
    els.ownPreviewPdf.src = '';
    if (els.cfgLeft) els.cfgLeft.style.display = '';
    hideBuilderPreviewBits(false);
    if (els.ownDesign) els.ownDesign.classList.remove('is-active');
  }

  // Toggle visibility of the builder's own preview bits (SVG canvas, info boxes,
  // size pickers, "preview only" note) so only the uploaded design shows.
  function hideBuilderPreviewBits(hide) {
    const disp = hide ? 'none' : '';
    const canvas = els.stampSvg ? els.stampSvg.closest('.canvas-wrap') : null;
    if (canvas) canvas.style.display = disp;
    document.querySelectorAll('.preview-card .info-box, .preview-card .preview-note, #sizePicker, #rectSizePicker').forEach((el) => {
      // remember original display for info boxes that were already hidden
      if (hide) { el.dataset._od = el.style.display || ''; el.style.display = 'none'; }
      else { el.style.display = el.dataset._od || ''; }
    });
  }

  /* ── Quantity & price ──────────────────────────── */
  function changeQty(d) {
    S.qty = Math.max(1, S.qty + d);
    els.qtyVal.textContent = S.qty;
    calcPrice();
  }

  function calcPrice() {
    const logoFee = els.logoToggle.checked ? S.logoFee : 0;
    els.priceVal.textContent = (S.base + logoFee) * S.qty;
  }

  /* ════════════════════════════════════════════════
     RENDER — Live SVG stamp preview
  ════════════════════════════════════════════════ */
  function render() {
    calcPrice();

    const C  = S.color;
    const en = els.fName.value.trim()   || 'Company Name in English';
    // Arabic name is auto-extracted by the team from the trade license.
    // We show a stable placeholder so the preview keeps its bilingual layout.
    const ar = 'اسم الشركة بالعربية';
    // Real iOS Safari has a longstanding bug combining Arabic bidi + SVG
    // <textPath> on a curve: characters render disconnected/out of order
    // (desktop Chrome hides this bug, so it looked fine there). The fix:
    // pre-shape the Arabic into its correct joined presentation-form
    // glyphs ourselves, put them in left-to-right visual order, and render
    // with direction="ltr" + unicode-bidi="bidi-override" so the browser
    // never runs its own (buggy) RTL-on-path logic — same code path as the
    // English arc, which already renders correctly everywhere.
    const arVisual = 'ﺔﻴﺑﺮﻌﻟﺎﺑ ﺔﻛﺮﺸﻟﺍ ﻢﺳﺍ';
    const emVal = els.fEmirate.value.trim();
    const em = emVal ? (emVal.toUpperCase() + ' - U.A.E') : 'EMIRATE - U.A.E';
    const po = els.fPobox.value.trim();
    const licNum = els.fLic.value.trim();
    const lc = els.licToggle.checked ? licNum : '';
    // When the toggle is on, the design shows "License №:" and appends the
    // number beside it as the customer types it in.
    const lcText = els.licToggle.checked ? ('License №:' + (licNum ? ' ' + licNum : '')) : '';

    const svg = els.stampSvg;
    svg.innerHTML = '';
    // Reset any inline sizing from a previous render (shape switch)
    svg.style.width = '';
    svg.style.height = '';
    svg.style.maxWidth = '';

    // Re-trigger fade-in animation
    svg.style.animation = 'none';
    void svg.offsetWidth;
    svg.style.animation = '';

    /* Center lines helper — auto-shrinks long emirate names */
    function centerLines(cx, cy, lines) {
      const sy = cy - (lines.length - 1) * 10 + 4;
      lines.forEach((l, i) => {
        let fontSize, letterSpacing;
        if (i === 0) {
          const len = l.length;
          if (len > 18)      { fontSize = '10'; letterSpacing = '0.5'; }
          else if (len > 14) { fontSize = '11'; letterSpacing = '1';   }
          else               { fontSize = '12'; letterSpacing = '2';   }
          svg.appendChild(tx({
            x: cx, y: sy + i * 20,
            'font-family': FF, 'font-size': fontSize, 'font-weight': '700',
            'fill': C, 'text-anchor': 'middle', 'letter-spacing': letterSpacing
          }, l));
        } else {
          svg.appendChild(tx({
            x: cx, y: sy + i * 20,
            'font-family': FF, 'font-size': '10.5', 'font-weight': '500',
            'fill': C, 'text-anchor': 'middle', 'letter-spacing': '0'
          }, l));
        }
      });
    }

    /* Helper: shrink font size so text fits within safe arc length */
    function fitFontSize(text, baseSize, maxLength, charWidthAtBase) {
      const estimatedWidth = text.length * charWidthAtBase;
      if (estimatedWidth <= maxLength) return baseSize;
      return Math.max(9, Math.floor(baseSize * (maxLength / estimatedWidth)));
    }

    /* Helper: append text, then measure its real width and shrink the
       font-size down until it fits inside maxWidth px. Prevents long
       company names from spilling outside the rect/square borders. */
    function fitTextToWidth(attrs, txt, maxWidth, minSize) {
      const el = tx(attrs, txt);
      svg.appendChild(el);
      const baseSize = parseFloat(attrs['font-size']);
      const floor = minSize || 8;
      try {
        let measured = el.getComputedTextLength();
        if (measured > maxWidth) {
          let newSize = Math.max(floor, baseSize * (maxWidth / measured));
          el.setAttribute('font-size', String(newSize));
          // One more pass in case letter-spacing skewed the estimate
          measured = el.getComputedTextLength();
          if (measured > maxWidth) {
            newSize = Math.max(floor, newSize * (maxWidth / measured));
            el.setAttribute('font-size', String(newSize));
          }
        }
      } catch (e) { /* getComputedTextLength unavailable — leave as-is */ }
      return el;
    }

    /* ── CIRCLE ── */
    if (S.shape === 'circle') {
      const cx = 150, cy = 150;
      const R1 = 135, R2 = 125, R3 = 93;
      const RmEn = 101;  // English arc — TOP
      const RmAr = 118;  // Arabic arc — BOTTOM

      svg.setAttribute('viewBox', '0 0 300 300');
      // 30mm's fill ratio (68%) looks clean with good breathing room —
      // 38mm should read as only a little bigger than that, not crowd
      // the box edge.
      const sizePct = S.circleSize === 38 ? 76 : 68;
      svg.setAttribute('width', 300);
      svg.setAttribute('height', 300);
      svg.style.width = sizePct + '%';
      svg.style.height = 'auto';
      svg.style.maxWidth = sizePct + '%';

      svg.appendChild(mk('circle', { cx, cy, r: R1, fill: 'none', stroke: C, 'stroke-width': '4.5' }));
      svg.appendChild(mk('circle', { cx, cy, r: R2, fill: 'none', stroke: C, 'stroke-width': '1.5' }));
      svg.appendChild(mk('circle', { cx, cy, r: R3, fill: 'none', stroke: C, 'stroke-width': '1.5' }));

      const defs = mk('defs', {});
      svg.appendChild(defs);

      const enD = `M ${cx - RmEn},${cy} A ${RmEn},${RmEn} 0 0,1 ${cx + RmEn},${cy}`;
      const arD = `M ${cx - RmAr},${cy} A ${RmAr},${RmAr} 0 0,0 ${cx + RmAr},${cy}`;

      defs.appendChild(mk('path', { id: 'pAr', d: arD, fill: 'none' }));
      defs.appendChild(mk('path', { id: 'pEn', d: enD, fill: 'none' }));

      // English — TOP
      const enFontSize = fitFontSize(en, 16, 240, 8);
      const tEn = document.createElementNS(NS, 'text');
      // Use our own loaded web font instead of the system's Times New
      // Roman — the fallback that different phones/OSes pick for "serif"
      // varies a lot and can look slanted/script-like. Manrope renders
      // identically everywhere and reads as a clean, normal (non-italic)
      // typeface.
      tEn.setAttribute('font-family', "'Manrope', sans-serif");
      tEn.setAttribute('font-style', 'normal');
      tEn.setAttribute('font-size', enFontSize);
      tEn.setAttribute('fill', C);
      tEn.setAttribute('font-weight', '700');
      tEn.setAttribute('text-anchor', 'middle');
      const pEn = document.createElementNS(NS, 'textPath');
      pEn.setAttribute('href', '#pEn');
      pEn.setAttribute('startOffset', '50%');
      pEn.textContent = en;
      tEn.appendChild(pEn);
      svg.appendChild(tEn);

      // Arabic — BOTTOM (see arVisual comment above for why this is
      // pre-shaped + reversed + rendered as forced LTR)
      const arFontSize = fitFontSize(arVisual, 19, 280, 9);
      const tAr = document.createElementNS(NS, 'text');
      tAr.setAttribute('font-family', FF);
      tAr.setAttribute('font-size', arFontSize);
      tAr.setAttribute('fill', C);
      tAr.setAttribute('font-weight', '700');
      tAr.setAttribute('text-anchor', 'middle');
      tAr.setAttribute('direction', 'ltr');
      tAr.setAttribute('unicode-bidi', 'bidi-override');
      const pAr = document.createElementNS(NS, 'textPath');
      pAr.setAttribute('href', '#pAr');
      pAr.setAttribute('startOffset', '50%');
      pAr.setAttribute('direction', 'ltr');
      pAr.setAttribute('unicode-bidi', 'bidi-override');
      pAr.textContent = arVisual;
      tAr.appendChild(pAr);
      svg.appendChild(tAr);

      // Side stars
      const starR = 109;
      svg.appendChild(tx({ x: cx - starR, y: cy + 6, 'font-size': '15', 'fill': C, 'text-anchor': 'middle', 'font-family': 'serif' }, '★'));
      svg.appendChild(tx({ x: cx + starR, y: cy + 6, 'font-size': '15', 'fill': C, 'text-anchor': 'middle', 'font-family': 'serif' }, '★'));

      // Center layout
      const logoOn = els.logoToggle.checked;
      if (logoOn) {
        svg.appendChild(tx({
          x: cx, y: cy - 18,
          'font-family': FF, 'font-size': '16', 'font-weight': '800',
          'fill': C, 'text-anchor': 'middle', 'letter-spacing': '1'
        }, 'YOUR LOGO'));
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lcText) lines.push(lcText);
        centerLines(cx, cy + 42, lines);
      } else {
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lcText) lines.push(lcText);
        centerLines(cx, cy, lines);
      }
    }

    /* ── SQUARE ── */
    else if (S.shape === 'square') {
      const W = 300, H = 300;
      const p = 14;
      svg.setAttribute('viewBox', '0 0 300 300');
      svg.setAttribute('width', '260');
      svg.setAttribute('height', '260');

      // Heavy outer (6px) + thin inner (1.5px) — SHARP corners (no radius)
      svg.appendChild(mk('rect', {
        x: p, y: p, width: W - p * 2, height: H - p * 2,
        fill: 'none', stroke: C, 'stroke-width': '6'
      }));
      svg.appendChild(mk('rect', {
        x: p + 10, y: p + 10, width: W - p * 2 - 20, height: H - p * 2 - 20,
        fill: 'none', stroke: C, 'stroke-width': '1.5'
      }));

      const innerLeft = p + 14;
      const innerRight = W - p - 14;
      const innerTop = p + 14;
      const innerBot = H - p - 14;
      const innerH = innerBot - innerTop;
      const dividerY = innerTop + innerH * 0.72;
      svg.appendChild(mk('line', {
        x1: innerLeft + 4, y1: dividerY, x2: innerRight - 4, y2: dividerY,
        stroke: C, 'stroke-width': '1.2'
      }));

      // UPPER section
      const logoOn = els.logoToggle.checked;
      const upperItems = [];
      if (logoOn) upperItems.push({ type: 'logo', text: 'YOUR LOGO' });
      upperItems.push({ type: 'ar', text: ar });
      upperItems.push({ type: 'en', text: en });

      const upperH = dividerY - innerTop;
      const upperLineH = upperH / upperItems.length;
      const upperStartY = innerTop + upperLineH / 2;
      const sqMaxW = (innerRight - innerLeft) - 8;  // safe inner width

      upperItems.forEach((it, i) => {
        const y = upperStartY + i * upperLineH;
        let attrs = {
          x: W / 2, y: y + 5, fill: C, 'text-anchor': 'middle',
          'font-family': FF  // Manrope — same for all
        };
        if (it.type === 'logo') {
          attrs['font-size'] = '16';
          attrs['font-weight'] = '800';
          attrs['letter-spacing'] = '1';
        } else if (it.type === 'ar') {
          attrs['font-size'] = '20';
          attrs['font-weight'] = '700';
        } else if (it.type === 'en') {
          attrs['font-size'] = '18';
          attrs['font-weight'] = '700';
          attrs['letter-spacing'] = '0.5';
        }
        fitTextToWidth(attrs, it.text, sqMaxW, 9);
      });

      // LOWER section
      const lowerItems = [];
      if (po) lowerItems.push('P.O. Box: ' + po);
      lowerItems.push(em);
      if (lcText) lowerItems.push(lcText);

      const lowerH = innerBot - dividerY;
      const lowerLineH = lowerH / lowerItems.length;
      const lowerStartY = dividerY + lowerLineH / 2;

      lowerItems.forEach((line, i) => {
        const y = lowerStartY + i * lowerLineH;
        // Center line (emirate) is bigger; surrounding lines are smaller
        const isEmirate = (line === em);
        fitTextToWidth({
          x: W / 2, y: y + 4,
          'font-family': FF,    // Manrope — same for all
          'font-size': isEmirate ? '14' : '12',
          'font-weight': '700',
          'letter-spacing': isEmirate ? '2' : '0',
          'fill': C,
          'text-anchor': 'middle'
        }, line, sqMaxW, 8);
      });
    }

    /* ── RECTANGLE ── */
    else if (S.shape === 'rect') {
      // Rectangle sizes (width × height in mm) → SVG dimensions
      // Scale: 8px per mm
      const dims = {
        '55x30': { W: 440, H: 240 }   // 55×30 → standard landscape
      };
      const { W, H } = dims[S.rectSize] || dims['55x30'];

      // Padding from the SVG edge — NO corner radius (sharp/right angles)
      const p = 14;

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const maxDisplay = 320;
      const scale = Math.min(maxDisplay / W, 260 / H);
      svg.setAttribute('width',  Math.round(W * scale));
      svg.setAttribute('height', Math.round(H * scale));

      // ─── BORDERS — heavy outer (6px) + thin inner (1.5px), SHARP corners ───
      svg.appendChild(mk('rect', {
        x: p, y: p, width: W - p * 2, height: H - p * 2,
        fill: 'none', stroke: C, 'stroke-width': '6'
      }));
      svg.appendChild(mk('rect', {
        x: p + 10, y: p + 10, width: W - p * 2 - 20, height: H - p * 2 - 20,
        fill: 'none', stroke: C, 'stroke-width': '1.5'
      }));

      // Inner usable area (inside the inner border, with small breathing room)
      const innerLeft  = p + 14;
      const innerRight = W - p - 14;
      const innerTop   = p + 14;
      const innerBot   = H - p - 14;
      const innerH     = innerBot - innerTop;
      const cx         = W / 2;
      const cy         = H / 2;   // TRUE vertical center of the stamp

      const logoOn = els.logoToggle.checked;

      // ─── BUILD ALL TEXT LINES IN ORDER (top to bottom) ───
      const allLines = [];

      if (logoOn) allLines.push({ text: 'YOUR LOGO',  role: 'logo' });
      allLines.push({ text: ar,                       role: 'ar' });
      allLines.push({ text: en,                       role: 'en' });
      allLines.push({ text: em,                       role: 'em' });
      if (po) allLines.push({ text: 'P.O. Box: ' + po, role: 'small' });
      if (lcText) allLines.push({ text: lcText, role: 'small' });

      // ─── ADAPTIVE FONT SIZING based on available height ───
      // Tight (50×20) gets BIGGER fonts now — previous sizes were too small
      const isTight = innerH < 150;
      const styleMap = {
        logo:  { fs: isTight ? 17 : 19, weight: '800', ls: '1'   },
        ar:    { fs: isTight ? 17 : 21, weight: '700', ls: '0'   },
        en:    { fs: isTight ? 17 : 21, weight: '700', ls: '0.5' },
        em:    { fs: isTight ? 13 : 15, weight: '700', ls: '2'   },
        small: { fs: isTight ? 10 : 12, weight: '600', ls: '0'   }
      };

      // ─── COMPUTE LINE HEIGHT — bigger lineH for bigger fonts ───
      const n = allLines.length;
      const maxLineH = isTight ? 22 : 30;
      const minLineH = 16;
      const idealLineH = innerH / n;
      const lineH = Math.max(minLineH, Math.min(maxLineH, idealLineH));

      // Total block height — center the WHOLE block around cy
      const blockH = lineH * n;
      const startY = cy - blockH / 2 + lineH / 2;

      // ─── DRAW EACH LINE ───
      // Keep text clear of the side stars: reserve ~26px on each side.
      const rectMaxW = (innerRight - innerLeft) - 52;
      allLines.forEach((line, i) => {
        const y = startY + i * lineH;
        const style = styleMap[line.role];

        fitTextToWidth({
          x: cx, y: y + style.fs * 0.35,
          'font-family': FF,
          'font-size': String(style.fs),
          'font-weight': style.weight,
          'letter-spacing': style.ls,
          'fill': C,
          'text-anchor': 'middle'
        }, line.text, rectMaxW, line.role === 'small' ? 8 : 10);
      });

      // ─── DRAW STARS AT THE TRUE VERTICAL CENTER (cy) ───
      // Stars are INDEPENDENT of text lines — they always sit at the math center
      // of the stamp's height, hugging the inner border on both sides.
      const starFs = isTight ? 16 : 20;
      svg.appendChild(tx({
        x: innerLeft + 10, y: cy + starFs * 0.35,
        'font-size': String(starFs),
        'fill': C, 'text-anchor': 'middle', 'font-family': 'serif'
      }, '★'));
      svg.appendChild(tx({
        x: innerRight - 10, y: cy + starFs * 0.35,
        'font-size': String(starFs),
        'fill': C, 'text-anchor': 'middle', 'font-family': 'serif'
      }, '★'));
    }

    /* ── OVAL ── */
    else if (S.shape === 'oval') {
      const cx = 190, cy = 120;
      const RX1 = 175, RY1 = 108;
      const RX2 = 166, RY2 = 99;
      const RX3 = 138, RY3 = 73;
      const RXen = 145, RYen = 82;
      const RXar = 160, RYar = 94;

      svg.setAttribute('viewBox', '0 0 380 240');
      svg.setAttribute('width', '360');
      svg.setAttribute('height', '227');

      svg.appendChild(mk('ellipse', { cx, cy, rx: RX1, ry: RY1, fill: 'none', stroke: C, 'stroke-width': '4.5' }));
      svg.appendChild(mk('ellipse', { cx, cy, rx: RX2, ry: RY2, fill: 'none', stroke: C, 'stroke-width': '1.5' }));
      svg.appendChild(mk('ellipse', { cx, cy, rx: RX3, ry: RY3, fill: 'none', stroke: C, 'stroke-width': '1.5' }));

      const defs = mk('defs', {});
      svg.appendChild(defs);

      const enD = `M ${cx - RXen},${cy} A ${RXen},${RYen} 0 0,1 ${cx + RXen},${cy}`;
      const arD = `M ${cx - RXar},${cy} A ${RXar},${RYar} 0 0,0 ${cx + RXar},${cy}`;

      defs.appendChild(mk('path', { id: 'oEn', d: enD, fill: 'none' }));
      defs.appendChild(mk('path', { id: 'oAr', d: arD, fill: 'none' }));

      // English on TOP
      const enFs = fitFontSize(en, 16, 240, 8);
      const tEnO = document.createElementNS(NS, 'text');
      // Same reasoning as the round stamp: use our own web font instead of
      // a system serif fallback that can look slanted/script-like.
      tEnO.setAttribute('font-family', "'Manrope', sans-serif");
      tEnO.setAttribute('font-style', 'normal');
      tEnO.setAttribute('font-size', enFs);
      tEnO.setAttribute('fill', C);
      tEnO.setAttribute('font-weight', '700');
      tEnO.setAttribute('text-anchor', 'middle');
      const pEnO = document.createElementNS(NS, 'textPath');
      pEnO.setAttribute('href', '#oEn');
      pEnO.setAttribute('startOffset', '50%');
      pEnO.textContent = en;
      tEnO.appendChild(pEnO);
      svg.appendChild(tEnO);

      // Arabic on BOTTOM (see arVisual comment above for why this is
      // pre-shaped + reversed + rendered as forced LTR)
      const arFs = fitFontSize(arVisual, 19, 260, 9.5);
      const tArO = document.createElementNS(NS, 'text');
      tArO.setAttribute('font-family', FF);
      tArO.setAttribute('font-size', arFs);
      tArO.setAttribute('fill', C);
      tArO.setAttribute('font-weight', '700');
      tArO.setAttribute('text-anchor', 'middle');
      tArO.setAttribute('direction', 'ltr');
      tArO.setAttribute('unicode-bidi', 'bidi-override');
      const pArO = document.createElementNS(NS, 'textPath');
      pArO.setAttribute('href', '#oAr');
      pArO.setAttribute('startOffset', '50%');
      pArO.setAttribute('direction', 'ltr');
      pArO.setAttribute('unicode-bidi', 'bidi-override');
      pArO.textContent = arVisual;
      tArO.appendChild(pArO);
      svg.appendChild(tArO);

      // Side stars
      const starRX = (RX2 + RX3) / 2;
      svg.appendChild(tx({ x: cx - starRX, y: cy + 6, 'font-size': '15', 'fill': C, 'text-anchor': 'middle', 'font-family': 'serif' }, '★'));
      svg.appendChild(tx({ x: cx + starRX, y: cy + 6, 'font-size': '15', 'fill': C, 'text-anchor': 'middle', 'font-family': 'serif' }, '★'));

      // Center layout
      const logoOn = els.logoToggle.checked;
      if (logoOn) {
        svg.appendChild(tx({
          x: cx, y: cy - 12,
          'font-family': FF, 'font-size': '16', 'font-weight': '800',
          'fill': C, 'text-anchor': 'middle', 'letter-spacing': '1'
        }, 'YOUR LOGO'));
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lcText) lines.push(lcText);
        centerLines(cx, cy + 30, lines);
      } else {
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lcText) lines.push(lcText);
        centerLines(cx, cy, lines);
      }
    }
  }

  /* ── Checkout ──────────────────────────────────── */
  function checkout() {
    // When the customer uploaded their OWN existing design, the builder fields
    // (company name, emirate, licence) are hidden and not required — their
    // artwork already contains everything. Skip those validations entirely.
    const hasOwnDesign = !!S.ownDesignData;

    let firstInvalid = null;

    if (!hasOwnDesign) {
      // Validate required builder fields
      const required = [
        { el: els.fName,    name: 'Company Name' },
        { el: els.fEmirate, name: 'Emirate' }
      ];
      required.forEach(({ el }) => {
        const val = (el.value || '').trim();
        if (!val) {
          el.style.borderColor = '#ef4444';
          el.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.12)';
          if (!firstInvalid) firstInvalid = el;
          setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }, 2500);
        }
      });

      // License file required (only in builder mode)
      if (!S.licenseFile) {
        els.licenseUploadZone.style.borderColor = '#ef4444';
        els.licenseUploadZone.style.background = 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)';
        if (!firstInvalid) firstInvalid = els.licenseUploadZone;
        setTimeout(() => {
          els.licenseUploadZone.style.borderColor = '';
          els.licenseUploadZone.style.background = '';
        }, 2500);
      }
    }

    if (firstInvalid) {
      // A tiny delay lets the mobile keyboard finish closing (from whatever
      // field was focused before) before we scroll — otherwise the viewport
      // is still resizing and the "center" position lands in the wrong
      // spot, making it look like nothing happened.
      var target = firstInvalid;
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.focus) target.focus();
      }, 120);
      return;
    }

    // Build order summary and navigate to checkout page.
    // In production this would POST to backend / link to /checkout
    const orderData = {
      shape:       S.shape,
      color:       S.color,
      size:        S.shape === 'circle' ? S.circleSize + 'MM'
                  : S.shape === 'rect'  ? S.rectSize + 'MM'
                  : SZ[S.shape],
      withLogo:    els.logoToggle.checked && !S.ownDesignData,
      logoFile:    (S.logoData && !S.ownDesignData) ? 'uploaded' : null,
      // Full files (base64) so checkout can upload them to storage
      logoData:    S.ownDesignData ? null : (S.logoData || null),
      logoName:    S.ownDesignData ? null : (S.logoName || null),
      logoType:    S.ownDesignData ? null : (S.logoType || null),
      withLicNum:  els.licToggle.checked,
      licNum:      els.fLic.value.trim(),
      company:     els.fName.value.trim(),
      pobox:       els.fPobox.value.trim(),
      emirate:     els.fEmirate.value,
      note:        (S.ownDesignData && els.fNoteOwn ? els.fNoteOwn.value.trim() : (els.fNote ? els.fNote.value.trim() : '')),
      ownDesignData: S.ownDesignData,
      ownDesignName: S.ownDesignName,
      ownDesignType: S.ownDesignType,
      license:     S.licenseFile,
      licenseData: S.licenseData || null,
      licenseType: S.licenseType || null,
      quantity:    S.qty,
      total:       parseInt(els.priceVal.textContent, 10),
      // Snapshot of the live stamp preview so checkout can show exactly
      // what the customer designed.
      previewSvg:  (function () {
        try {
          const clone = els.stampSvg.cloneNode(true);
          clone.removeAttribute('style');
          clone.setAttribute('width', '300');
          clone.setAttribute('height', '300');
          return new XMLSerializer().serializeToString(clone);
        } catch (e) { return null; }
      })()
    };

    // Store for checkout page. If the logo/license base64 makes it too big
    // for sessionStorage (~5MB), retry without them so checkout still works
    // (Emirates ID is uploaded on the checkout page itself).
    try {
      sessionStorage.setItem('mystamp_order', JSON.stringify(orderData));
    } catch (e) {
      try {
        var slim = Object.assign({}, orderData);
        slim.logoData = null; slim.licenseData = null;
        slim._filesDropped = true;
        sessionStorage.setItem('mystamp_order', JSON.stringify(slim));
      } catch (e2) { /* give up silently */ }
    }

    // Replace with actual checkout URL when ready
    window.location.href = 'checkout.html';
  }

  /* ── Bind events ───────────────────────────────── */
  function bindEvents() {
    // Shape buttons
    els.shapeBtns.forEach((btn) => {
      btn.addEventListener('click', () => pickShape(btn.dataset.shape, btn));
    });

    // Color buttons
    els.colorBtns.forEach((btn) => {
      btn.addEventListener('click', () => pickColor(btn.dataset.color, btn));
    });

    // Size pills
    els.sizePills.forEach((btn) => {
      btn.addEventListener('click', () => pickSize(parseInt(btn.dataset.size, 10), btn));
    });
    els.rectSizePills.forEach((btn) => {
      btn.addEventListener('click', () => pickRectSize(btn.dataset.rectsize, btn));
    });

    // Form live updates
    ['fName', 'fPobox', 'fLic'].forEach((id) => {
      els[id].addEventListener('input', render);
    });
    els.fEmirate.addEventListener('change', render);

    // Special note — live counter + auto-grow (stays compact, expands as needed)
    if (els.fNote) {
      var noteCount = document.getElementById('noteCount');
      var grow = function () {
        els.fNote.style.height = 'auto';
        els.fNote.style.height = Math.min(els.fNote.scrollHeight, 120) + 'px';
      };
      els.fNote.addEventListener('input', function () {
        if (noteCount) noteCount.textContent = els.fNote.value.length + '/240';
        grow();
      });
    }
    // Own-design note — same counter + auto-grow
    if (els.fNoteOwn) {
      var noteOwnCount = document.getElementById('noteOwnCount');
      els.fNoteOwn.addEventListener('input', function () {
        if (noteOwnCount) noteOwnCount.textContent = els.fNoteOwn.value.length + '/240';
        els.fNoteOwn.style.height = 'auto';
        els.fNoteOwn.style.height = Math.min(els.fNoteOwn.scrollHeight, 120) + 'px';
      });
    }

    // Toggles
    els.logoToggle.addEventListener('change', toggleLogo);
    els.licToggle.addEventListener('change', toggleLic);

    // Logo upload
    els.uploadZone.addEventListener('click', (e) => {
      // Avoid double-trigger when clicking the hidden file input
      if (e.target.tagName !== 'INPUT') els.logoFile.click();
    });
    els.logoFile.addEventListener('change', () => handleLogoUpload(els.logoFile));
    els.removeLogoBtn.addEventListener('click', removeLogo);

    // License upload
    els.licenseUploadZone.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') els.licenseFile.click();
    });
    els.licenseFile.addEventListener('change', () => handleLicenseUpload(els.licenseFile));
    els.removeLicenseBtn.addEventListener('click', removeLicense);

    // Own design upload
    if (els.ownDesignInput) els.ownDesignInput.addEventListener('change', () => handleOwnDesignUpload(els.ownDesignInput));
    if (els.ownPreviewRemove) els.ownPreviewRemove.addEventListener('click', removeOwnDesign);

    // Quantity
    els.qtyMinus.addEventListener('click', () => changeQty(-1));
    els.qtyPlus.addEventListener('click', () => changeQty(1));

    // Checkout
    els.checkoutBtn.addEventListener('click', checkout);
  }

  /* ── Restore prior design (when returning via "Edit design") ── */
  function restoreState() {
    var shouldRestore = false;
    try { shouldRestore = sessionStorage.getItem('mystamp_edit') === '1'; } catch (e) {}
    if (!shouldRestore) return;

    var data = null;
    try { data = JSON.parse(sessionStorage.getItem('mystamp_order') || 'null'); } catch (e) {}
    try { sessionStorage.removeItem('mystamp_edit'); } catch (e) {}
    if (!data) return;

    // Shape
    if (data.shape) {
      S.shape = data.shape;
      els.shapeBtns.forEach(function (b) {
        b.classList.toggle('active', b.dataset.shape === data.shape);
        if (b.dataset.shape === data.shape && els.shapeValue) els.shapeValue.textContent = b.dataset.name;
      });
      const isCircle = data.shape === 'circle';
      const isRect = data.shape === 'rect';
      els.sizePicker.style.display = isCircle ? 'flex' : 'none';
      els.rectSizePicker.style.display = isRect ? 'flex' : 'none';
      els.sizeTag.style.display = (isCircle || isRect) ? 'none' : 'inline-block';
      if (!isCircle && !isRect && els.sizeTxt) els.sizeTxt.textContent = SZ[data.shape];
    }

    // Color
    if (data.color) {
      S.color = data.color;
      els.colorBtns.forEach(function (b) {
        var on = (b.dataset.color || '').toLowerCase() === data.color.toLowerCase();
        b.classList.toggle('active', on);
        if (on && els.colorValue) els.colorValue.textContent = b.dataset.name;
      });
    }

    // Size (circle / rect)
    if (data.size) {
      var sz = String(data.size).replace('MM', '');
      if (S.shape === 'circle') {
        S.circleSize = parseInt(sz, 10) || S.circleSize;
        els.sizePills.forEach(function (b) {
          b.classList.toggle('active', parseInt(b.dataset.size, 10) === S.circleSize);
        });
      } else if (S.shape === 'rect') {
        S.rectSize = sz;
        els.rectSizePills.forEach(function (b) {
          b.classList.toggle('active', b.dataset.rectsize === sz);
        });
      }
    }

    // Form fields
    if (data.company && els.fName) els.fName.value = data.company;
    if (data.pobox && els.fPobox) els.fPobox.value = data.pobox;
    if (data.emirate && els.fEmirate) els.fEmirate.value = data.emirate;
    if (data.note && els.fNote) els.fNote.value = data.note;

    // License number toggle
    if (data.withLicNum && els.licToggle) {
      els.licToggle.checked = true;
      els.licRow.style.display = 'flex';
      if (data.licNum && els.fLic) els.fLic.value = data.licNum;
    }

    // Logo toggle (file itself can't be restored for security; flag the intent)
    if (data.withLogo && els.logoToggle) {
      els.logoToggle.checked = true;
      els.uploadMeta.style.display = 'flex';
      els.logoInfo.style.display = 'flex';
      els.uploadZone.classList.add('show');
    }

    // Quantity
    if (data.quantity) {
      S.qty = Math.max(1, parseInt(data.quantity, 10) || 1);
      if (els.qtyVal) els.qtyVal.textContent = S.qty;
    }
  }

  /* ── Init ──────────────────────────────────────── */
  function selectShapeFromUrl() {
    // Allow deep links like  index.html?shape=oval#configurator
    // or  index.html#configurator=square  to preselect a stamp shape.
    var shape = null;
    try {
      var params = new URLSearchParams(window.location.search);
      shape = params.get('shape');
      if (!shape && window.location.hash) {
        var m = window.location.hash.match(/(?:shape[=-]|configurator[=-])(circle|oval|rect|square)/i);
        if (m) shape = m[1];
      }
    } catch (e) {}
    if (!shape) return;
    shape = shape.toLowerCase();
    var map = { round: 'circle', circle: 'circle', oval: 'oval', rectangle: 'rect', rect: 'rect', square: 'square' };
    var target = map[shape];
    if (!target) return;
    var btn = document.querySelector('.shape-card[data-shape="' + target + '"]');
    if (btn) pickShape(target, btn);
  }

  function init() {
    bindEvents();
    restoreState();
    selectShapeFromUrl();
    calcPrice();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
