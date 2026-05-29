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
    base:        129,
    logoFee:     49,
    logoData:    null,
    circleSize:  38,
    rectSize:    '50x20',
    licenseFile: null
  };

  const SZ = {
    circle: '38MM',
    square: '40x40MM',
    rect:   '50x20MM',
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
    fPhone:   $('fPhone'),
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

  /* ── Toggles ───────────────────────────────────── */
  function toggleLogo() {
    const on = els.logoToggle.checked;
    const hasFile = !!S.logoData;
    els.uploadZone.classList.toggle('show', on && !hasFile);
    els.fileRow.style.display = (on && hasFile) ? 'flex' : 'none';
    els.uploadMeta.style.display = on ? 'flex' : 'none';
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
      const reader = new FileReader();
      reader.onload = (e) => {
        S.logoData = e.target.result;
        els.fileName.textContent = file.name;
        els.fileRow.style.display = 'flex';
        els.uploadZone.classList.remove('show');
        render();
      };
      reader.readAsDataURL(file);
    }
  }

  function removeLogo() {
    S.logoData = null;
    els.logoFile.value = '';
    els.fileRow.style.display = 'none';
    els.uploadZone.classList.add('show');
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
    }
  }

  function removeLicense() {
    S.licenseFile = null;
    els.licenseFile.value = '';
    els.licenseFileRow.style.display = 'none';
    els.licenseUploadZone.style.display = 'flex';
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
    const emVal = els.fEmirate.value.trim();
    const em = emVal ? (emVal.toUpperCase() + ' - U.A.E') : 'EMIRATE - U.A.E';
    const po = els.fPobox.value.trim();
    const lc = els.licToggle.checked ? (els.fLic.value.trim() || '') : '';

    const svg = els.stampSvg;
    svg.innerHTML = '';

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

    /* ── CIRCLE ── */
    if (S.shape === 'circle') {
      const cx = 150, cy = 150;
      const R1 = 135, R2 = 125, R3 = 93;
      const RmEn = 101;  // English arc — TOP
      const RmAr = 118;  // Arabic arc — BOTTOM

      svg.setAttribute('viewBox', '0 0 300 300');
      const displayPx = Math.round(300 * (S.circleSize / 38));
      svg.setAttribute('width', displayPx);
      svg.setAttribute('height', displayPx);

      svg.appendChild(mk('circle', { cx, cy, r: R1, fill: 'none', stroke: C, 'stroke-width': '4.5' }));
      svg.appendChild(mk('circle', { cx, cy, r: R2, fill: 'none', stroke: C, 'stroke-width': '1.5' }));
      svg.appendChild(mk('circle', { cx, cy, r: R3, fill: 'none', stroke: C, 'stroke-width': '1.5' }));

      const defs = mk('defs', {});
      svg.appendChild(defs);

      const enD = `M ${cx - RmEn},${cy} A ${RmEn},${RmEn} 0 0,1 ${cx + RmEn},${cy}`;
      const arD = `M ${cx - RmAr},${cy} A ${RmAr},${RmAr} 0 0,0 ${cx + RmAr},${cy}`;

      defs.appendChild(mk('path', { id: 'pAr', d: arD, fill: 'none' }));
      defs.appendChild(mk('path', { id: 'pEn', d: enD, fill: 'none' }));

      // English — TOP, Times New Roman
      const enFontSize = fitFontSize(en, 16, 240, 8);
      const tEn = document.createElementNS(NS, 'text');
      tEn.setAttribute('font-family', "'Times New Roman', serif");
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

      // Arabic — BOTTOM
      const arFontSize = fitFontSize(ar, 19, 280, 9);
      const tAr = document.createElementNS(NS, 'text');
      tAr.setAttribute('font-family', FF);
      tAr.setAttribute('font-size', arFontSize);
      tAr.setAttribute('fill', C);
      tAr.setAttribute('font-weight', '700');
      tAr.setAttribute('text-anchor', 'middle');
      const pAr = document.createElementNS(NS, 'textPath');
      pAr.setAttribute('href', '#pAr');
      pAr.setAttribute('startOffset', '50%');
      pAr.textContent = ar;
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
        if (lc) lines.push('License №: ' + lc);
        centerLines(cx, cy + 42, lines);
      } else {
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lc) lines.push('License №: ' + lc);
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
        svg.appendChild(tx(attrs, it.text));
      });

      // LOWER section
      const lowerItems = [];
      if (po) lowerItems.push('P.O. Box: ' + po);
      lowerItems.push(em);
      if (lc) lowerItems.push('License №: ' + lc);

      const lowerH = innerBot - dividerY;
      const lowerLineH = lowerH / lowerItems.length;
      const lowerStartY = dividerY + lowerLineH / 2;

      lowerItems.forEach((line, i) => {
        const y = lowerStartY + i * lowerLineH;
        // Center line (emirate) is bigger; surrounding lines are smaller
        const isEmirate = (line === em);
        svg.appendChild(tx({
          x: W / 2, y: y + 4,
          'font-family': FF,    // Manrope — same for all
          'font-size': isEmirate ? '14' : '12',
          'font-weight': '700',
          'letter-spacing': isEmirate ? '2' : '0',
          'fill': C,
          'text-anchor': 'middle'
        }, line));
      });
    }

    /* ── RECTANGLE ── */
    else if (S.shape === 'rect') {
      // Rectangle sizes (width × height in mm) → SVG dimensions
      // Scale: 8px per mm
      const dims = {
        '50x20': { W: 400, H: 160 },  // 50×20 → wide landscape (default)
        '50x30': { W: 400, H: 240 },  // 50×30 → standard landscape
        '55x30': { W: 440, H: 240 }   // 55×30 → wider landscape
      };
      const { W, H } = dims[S.rectSize] || dims['50x20'];

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
      if (lc) allLines.push({ text: 'License №: ' + lc, role: 'small' });

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
      allLines.forEach((line, i) => {
        const y = startY + i * lineH;
        const style = styleMap[line.role];

        svg.appendChild(tx({
          x: cx, y: y + style.fs * 0.35,
          'font-family': FF,
          'font-size': String(style.fs),
          'font-weight': style.weight,
          'letter-spacing': style.ls,
          'fill': C,
          'text-anchor': 'middle'
        }, line.text));
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
      tEnO.setAttribute('font-family', "'Times New Roman', serif");
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

      // Arabic on BOTTOM
      const arFs = fitFontSize(ar, 19, 260, 9.5);
      const tArO = document.createElementNS(NS, 'text');
      tArO.setAttribute('font-family', FF);
      tArO.setAttribute('font-size', arFs);
      tArO.setAttribute('fill', C);
      tArO.setAttribute('font-weight', '700');
      tArO.setAttribute('text-anchor', 'middle');
      const pArO = document.createElementNS(NS, 'textPath');
      pArO.setAttribute('href', '#oAr');
      pArO.setAttribute('startOffset', '50%');
      pArO.textContent = ar;
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
        if (lc) lines.push('License №: ' + lc);
        centerLines(cx, cy + 30, lines);
      } else {
        const lines = [em];
        if (po) lines.push('P.O. Box: ' + po);
        if (lc) lines.push('License №: ' + lc);
        centerLines(cx, cy, lines);
      }
    }
  }

  /* ── Checkout ──────────────────────────────────── */
  function checkout() {
    // Validate required fields
    const required = [
      { el: els.fName,    name: 'Company Name' },
      { el: els.fEmirate, name: 'Emirate' },
      { el: els.fPhone,   name: 'Phone Number' }
    ];

    let firstInvalid = null;
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

    // License file required
    if (!S.licenseFile) {
      els.licenseUploadZone.style.borderColor = '#ef4444';
      els.licenseUploadZone.style.background = 'linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)';
      if (!firstInvalid) firstInvalid = els.licenseUploadZone;
      setTimeout(() => {
        els.licenseUploadZone.style.borderColor = '';
        els.licenseUploadZone.style.background = '';
      }, 2500);
    }

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (firstInvalid.focus) firstInvalid.focus();
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
      withLogo:    els.logoToggle.checked,
      logoFile:    S.logoData ? 'uploaded' : null,
      withLicNum:  els.licToggle.checked,
      licNum:      els.fLic.value.trim(),
      company:     els.fName.value.trim(),
      pobox:       els.fPobox.value.trim(),
      emirate:     els.fEmirate.value,
      phone:       els.fPhone.value.trim(),
      license:     S.licenseFile,
      quantity:    S.qty,
      total:       parseInt(els.priceVal.textContent, 10)
    };

    // Store for checkout page
    try { sessionStorage.setItem('mystamp_order', JSON.stringify(orderData)); } catch (e) {}

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

    // Quantity
    els.qtyMinus.addEventListener('click', () => changeQty(-1));
    els.qtyPlus.addEventListener('click', () => changeQty(1));

    // Checkout
    els.checkoutBtn.addEventListener('click', checkout);
  }

  /* ── Init ──────────────────────────────────────── */
  function init() {
    bindEvents();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
