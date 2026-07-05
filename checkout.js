/* ═══════════════════════════════════════════════════════════
   CHECKOUT LOGIC — MyStamp.ae
   - Hydrates the order from sessionStorage (set by configurator.js)
   - Pricing, bundle offers, delivery, Dubai-time ETA
   - Emirates ID upload, validation, confirm → WhatsApp handoff
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config ──────────────────────────────────── */
  var BASE_PRICE   = 99;             // AED per stamp
  var LOGO_FEE     = 19;             // AED — added once when a logo is included
  var WA_NUMBER    = '971544032018';
  // Next-day delivery price depends on emirate
  var DELIVERY_BY_EMIRATE = {
    'Dubai': 25,
    'Sharjah': 25,
    'Ajman': 25,
    'Abu Dhabi': 30,
    'Ras Al Khaimah': 30,
    'Fujairah': 30,
    'Umm Al Quwain': 30
  };
  var DEFAULT_NEXTDAY = 25;          // before an emirate is chosen
  var EXPRESS_PRICE   = 89;          // 4-hour express (flat)

  var SHAPE_LABEL = { circle: 'Round', oval: 'Oval', rect: 'Rectangle', square: 'Square', signature: 'Signature' };

  /* ── State ───────────────────────────────────── */
  var order = loadOrder();
  var state = {
    qty: Math.max(1, order.quantity || 1),
    delivery: 'nextday'
  };

  /* ── Elements ────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  var els = {
    previewMount: $('previewMount'),
    specCompany:  $('specCompany'),
    specList:     $('specList'),
    lineThumb:    $('lineThumb'),
    lineName:     $('lineName'),
    lineMeta:     $('lineMeta'),
    qtyVal:       $('qtyVal'),
    qtyMinus:     $('qtyMinus'),
    qtyPlus:      $('qtyPlus'),
    cartBadge:    $('cartBadge'),
    freeStampRow: $('freeStampRow'),
    sumSubtotal:  $('sumSubtotal'),
    discountRow:  $('discountRow'),
    sumDiscount:  $('sumDiscount'),
    sumDelivery:  $('sumDelivery'),
    sumDeliveryLabel: $('sumDeliveryLabel'),
    sumGrand:     $('sumGrand'),
    savedPill:    $('savedPill'),
    savedText:    $('savedText'),
    confirmAmt:   $('confirmAmt'),
    mobileTotal:  $('mobileTotal'),
    promoBanner:  $('promoBanner'),
    promoText:    $('promoText'),
    promoAdd:     $('promoAdd'),
    pickupInfo:   $('pickupInfo'),
    addrTitle:    $('addrTitle'),
    confirmBtn:   $('confirmBtn'),
    mobileConfirm:$('mobileConfirm'),
    coTerms:      $('coTerms')
  };

  /* ── Load order from configurator ────────────── */
  function loadOrder() {
    try {
      var raw = sessionStorage.getItem('mystamp_order');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    // Fallback demo order so the page is never empty
    return {
      shape: 'circle', color: '#3a67ff', size: '38MM',
      company: 'Your Company', quantity: 1, total: BASE_PRICE,
      withLogo: false, previewSvg: null
    };
  }

  /* ── Render the stamp preview ────────────────── */
  function renderPreview() {
    // Customer uploaded their OWN existing design — show it exactly
    if (order.ownDesignData) {
      var isPdf = (order.ownDesignType === 'application/pdf') || /\.pdf$/i.test(order.ownDesignName || '');
      var ownHtml;
      if (isPdf) {
        ownHtml = '<embed src="' + order.ownDesignData + '" type="application/pdf" style="width:100%;height:100%;min-height:200px;background:#fff;border-radius:8px;">';
      } else {
        ownHtml = '<img src="' + order.ownDesignData + '" alt="Your uploaded design" style="width:100%;height:100%;object-fit:contain;background:#fff;">';
      }
      els.previewMount.innerHTML = ownHtml;
      els.lineThumb.innerHTML = ownHtml;
      return;
    }
    // Signature stamp — show the captured signature image
    if (order.type === 'signature' && order.signatureData) {
      var sigImg = '<img src="' + order.signatureData + '" alt="Your signature" style="width:100%;height:100%;object-fit:contain;background:#fff;">';
      els.previewMount.innerHTML = sigImg;
      els.lineThumb.innerHTML = sigImg;
      return;
    }
    var svg = order.previewSvg;
    if (svg && /<svg/i.test(svg)) {
      els.previewMount.innerHTML = svg;
      // also into the summary thumbnail
      var thumb = els.lineThumb;
      thumb.innerHTML = svg;
    } else {
      // Graceful fallback shape if no preview was captured
      var c = order.color || '#3a67ff';
      var fb = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="50" cy="50" r="44" fill="none" stroke="' + c + '" stroke-width="3"/>' +
        '<circle cx="50" cy="50" r="34" fill="none" stroke="' + c + '" stroke-width="1"/>' +
        '<text x="50" y="55" text-anchor="middle" font-family="Manrope" font-size="11" font-weight="700" fill="' + c + '">STAMP</text>' +
        '</svg>';
      els.previewMount.innerHTML = fb;
      els.lineThumb.innerHTML = fb;
    }
  }

  /* ── Render specs ────────────────────────────── */
  function renderSpecs() {
    var company = order.company && order.company.trim() ? order.company.trim() : 'Your Company Stamp';
    els.specCompany.textContent = company;

    // Own-design order — the customer's uploaded artwork is the design
    if (order.ownDesignData) {
      els.specCompany.textContent = 'Your uploaded design';
      els.lineName.textContent = 'Custom Stamp';
      els.lineMeta.textContent = 'From your own design';
      var ownRows = [];
      ownRows.push('<li><span class="co-spec-k">Design</span> Your uploaded artwork</li>');
      if (order.note) ownRows.push('<li><span class="co-spec-k">Note</span> ' + escapeHtml(order.note) + '</li>');
      if (order.emirate) ownRows.push('<li><span class="co-spec-k">Emirate</span> ' + escapeHtml(order.emirate) + '</li>');
      els.specList.innerHTML = ownRows.join('');
      return;
    }

    els.lineName.textContent = (SHAPE_LABEL[order.shape] || 'Custom') + ' Stamp';
    els.lineMeta.textContent = (SHAPE_LABEL[order.shape] || '') + ' · ' + (order.size || '');

    var rows = [];
    rows.push('<li><span class="co-spec-k">Shape</span> ' + (SHAPE_LABEL[order.shape] || 'Custom') + '</li>');
    rows.push('<li><span class="co-spec-k">Size</span> ' + (order.size || '—') + '</li>');
    rows.push('<li><span class="co-spec-k">Ink</span> <span class="co-spec-swatch" style="background:' + (order.color || '#3a67ff') + '"></span> ' + inkName(order.color) + '</li>');
    if (order.withLogo && !order.ownDesignData) rows.push('<li><span class="co-spec-k">Logo</span> Included</li>');
    if (order.withLicNum && order.licNum) rows.push('<li><span class="co-spec-k">License №</span> ' + escapeHtml(order.licNum) + '</li>');
    if (order.emirate) rows.push('<li><span class="co-spec-k">Emirate</span> ' + escapeHtml(order.emirate) + '</li>');
    if (order.note) rows.push('<li><span class="co-spec-k">Note</span> ' + escapeHtml(order.note) + '</li>');
    els.specList.innerHTML = rows.join('');
  }

  function inkName(hex) {
    var map = {
      '#3a67ff': 'Royal Blue', '#111827': 'Jet Black',
      '#16a34a': 'Forest Green', '#dc2626': 'Crimson Red'
    };
    return map[(hex || '').toLowerCase()] || 'Custom';
  }

  /* ── Pricing engine ──────────────────────────── */
  function currentNextdayPrice() {
    // Price depends on the chosen emirate; fall back to default before selection
    var em = (order.emirate || state.emirate || '').trim();
    return DELIVERY_BY_EMIRATE[em] || DEFAULT_NEXTDAY;
  }

  function compute() {
    var qty = state.qty;   // quantity the customer pays for

    // Offer: buy 3 → get the 4th free. For every 3 paid stamps, 1 is gifted.
    var freeStamps = Math.floor(qty / 3);
    var received   = qty + freeStamps;
    // Logo is an add-on per stamp (matches the configurator: (base + logo) * qty)
    var hasLogo    = !!order.withLogo && !order.ownDesignData;
    var baseSubtotal = qty * BASE_PRICE;        // stamps only
    var logoTotal  = hasLogo ? (qty * LOGO_FEE) : 0;
    var subtotal   = baseSubtotal + logoTotal;  // what the customer pays for items

    // Delivery base by method
    var deliveryBase;
    if (state.delivery === 'pickup')      deliveryBase = 0;
    else if (state.delivery === 'express') deliveryBase = EXPRESS_PRICE;
    else                                   deliveryBase = currentNextdayPrice();

    // Free shipping (qty >= 2) applies ONLY to standard next-day delivery,
    // NOT to 4-hour express (express is always paid).
    var deliveryFree = (qty >= 2) && (state.delivery === 'nextday');
    var deliveryCost = deliveryFree ? 0 : deliveryBase;

    var grand = subtotal + deliveryCost;

    return {
      qty: qty, freeStamps: freeStamps, received: received,
      subtotal: subtotal, baseSubtotal: baseSubtotal, hasLogo: hasLogo, logoTotal: logoTotal,
      deliveryBase: deliveryBase, deliveryCost: deliveryCost, deliveryFree: deliveryFree,
      grand: grand,
      // value of what they got free (gifted stamps + waived next-day delivery)
      saved: (freeStamps * BASE_PRICE) + (deliveryFree ? deliveryBase : 0)
    };
  }

  /* ── Dubai-time ETA strings ──────────────────── */
  function dubaiNow() {
    // Dubai = UTC+4, no DST
    var now = new Date();
    var utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 4 * 3600000);
  }
  function fmtDay(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
  }
  function computeEtas() {
    var d = dubaiNow();
    var hour = d.getHours();

    // Next-day: before 2 PM tomorrow
    var nd = new Date(d); nd.setDate(nd.getDate() + 1);
    var ndEl = $('etaNextday');
    if (ndEl) ndEl.textContent = 'Arrives ' + fmtDay(nd) + ' before 2 PM';

    // Express (Careem Box): within 4 hours if shop open (9–20)
    var exEl = $('etaExpress');
    if (exEl) {
      if (hour >= 9 && hour < 20) {
        var ex = new Date(d.getTime() + 4 * 3600000);
        exEl.textContent = 'Arrives by ' + ex.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' today';
      } else {
        exEl.textContent = 'Starts 9 AM — arrives within 4 hrs';
      }
    }

    // Pickup: ready in 3 hours if shop open
    var pkEl = $('etaPickup');
    if (pkEl) {
      if (hour >= 9 && hour < 20) {
        var pk = new Date(d.getTime() + 3 * 3600000);
        pkEl.textContent = 'Ready by ' + pk.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true }) + ' today';
      } else {
        pkEl.textContent = 'Ready 3 hrs after we open (9 AM)';
      }
    }
  }

  /* ── Update all UI from state ────────────────── */
  function update() {
    var p = compute();

    els.qtyVal.textContent = p.qty;
    els.cartBadge.textContent = p.qty;

    // Free / gifted stamp row
    els.freeStampRow.hidden = p.freeStamps < 1;
    if (p.freeStamps >= 1) {
      var giftLabel = p.freeStamps === 1
        ? '4th stamp — free gift'
        : p.freeStamps + ' free stamps — gift';
      var giftEl = els.freeStampRow.querySelector('.co-free-gift');
      if (giftEl) {
        giftEl.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/></svg> ' + giftLabel;
      }
    }

    // Subtotal — stamps only; logo shown as its own line
    els.sumSubtotal.textContent = 'AED ' + p.baseSubtotal;
    els.discountRow.hidden = true;
    var logoRow = document.getElementById('logoRow');
    var sumLogo = document.getElementById('sumLogo');
    if (logoRow) {
      logoRow.style.display = p.hasLogo ? 'flex' : 'none';
      if (p.hasLogo && sumLogo) sumLogo.textContent = 'AED ' + p.logoTotal;
    }

    // Delivery line
    if (p.deliveryFree && p.deliveryBase > 0) {
      els.sumDelivery.innerHTML = '<span style="text-decoration:line-through;color:#9aa1ad;font-weight:500;margin-right:6px;">AED ' + p.deliveryBase + '</span><span style="color:#16a34a;font-weight:700;">FREE</span>';
    } else if (p.deliveryCost === 0) {
      els.sumDelivery.innerHTML = '<span style="color:#16a34a;font-weight:700;">FREE</span>';
    } else {
      els.sumDelivery.textContent = 'AED ' + p.deliveryCost;
    }
    els.sumDeliveryLabel.textContent = state.delivery === 'pickup' ? 'Pickup' : 'Delivery';

    els.sumGrand.textContent = p.grand;
    els.confirmAmt.textContent = 'AED ' + p.grand;
    els.mobileTotal.textContent = p.grand;

    // Keep the next-day option's displayed price in sync with the chosen emirate
    var ndAmt = document.querySelector('.co-deliv[data-method="nextday"] .co-deliv-amt');
    if (ndAmt) ndAmt.dataset.price = String(currentNextdayPrice());

    // Delivery option "was" strikethroughs — free applies to NEXT-DAY only
    document.querySelectorAll('.co-deliv-amt[data-price]').forEach(function (amt) {
      var method = amt.closest('.co-deliv').dataset.method;
      var base = parseInt(amt.dataset.price, 10);
      var was = amt.parentElement.querySelector('.co-deliv-was');
      var freeForThis = (state.qty >= 2) && (method === 'nextday') && base > 0;
      if (freeForThis) {
        amt.textContent = 'Free';
        amt.classList.add('is-free');
        if (was) { was.textContent = 'AED ' + base; was.classList.add('show'); }
      } else {
        amt.textContent = base === 0 ? 'Free' : 'AED ' + base;
        amt.classList.toggle('is-free', base === 0);
        if (was) was.classList.remove('show');
      }
    });

    // Savings pill
    if (p.saved > 0) {
      els.savedPill.hidden = false;
      els.savedText.textContent = "You're saving AED " + p.saved;
    } else {
      els.savedPill.hidden = true;
    }

    // Promo banner messaging
    updatePromo(p);

    // Pickup info + address title
    var isPickup = state.delivery === 'pickup';
    els.pickupInfo.hidden = !isPickup;
    els.addrTitle.textContent = isPickup ? 'Your contact details' : 'Delivery details';
  }

  function updatePromo(p) {
    var b = els.promoBanner, t = els.promoText;
    b.classList.remove('is-unlocked');
    els.promoAdd.style.display = '';
    if (p.qty === 1) {
      t.innerHTML = '<strong>Add 1 more</strong><span>and get free delivery 🎉</span>';
    } else if (p.qty === 2) {
      b.classList.add('is-unlocked');
      t.innerHTML = '<strong>Free standard delivery unlocked 🎉</strong><span>Add 1 more → your 4th stamp is free.</span>';
    } else if (p.qty >= 3) {
      b.classList.add('is-unlocked');
      var extra = p.freeStamps > 1 ? (' + ' + p.freeStamps + ' free stamps') : ' + 1 free stamp';
      t.innerHTML = '<strong>Best value unlocked 🎁</strong><span>Free standard delivery' + extra + '. You get ' + p.received + ' stamps.</span>';
      els.promoAdd.style.display = 'none';
    }
  }

  /* ── Quantity controls ───────────────────────── */
  function setQty(n) {
    state.qty = Math.max(1, Math.min(99, n));
    bump(els.qtyVal);
    update();
  }
  function bump(el) {
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
      { duration: 280, easing: 'cubic-bezier(0.34,1.56,0.64,1)' }
    );
  }

  els.qtyMinus.addEventListener('click', function () { setQty(state.qty - 1); });
  els.qtyPlus.addEventListener('click', function () { setQty(state.qty + 1); });
  els.promoAdd.addEventListener('click', function () { setQty(state.qty + 1); });

  /* ── Delivery selection ──────────────────────── */
  document.querySelectorAll('input[name="delivery"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      state.delivery = radio.value;
      update();
    });
  });

  /* ── Emirate selection drives next-day delivery price ── */
  (function () {
    var sel = $('coEmirate');
    if (!sel) return;
    // initialise from any saved order emirate
    if (order.emirate) { try { sel.value = order.emirate; } catch (e) {} }
    state.emirate = sel.value || order.emirate || '';
    sel.addEventListener('change', function () {
      state.emirate = sel.value;
      order.emirate = sel.value;
      update();
    });
  })();

  /* ── Emirates ID upload ──────────────────────── */
  var getIdFiles = function () { return []; };
  (function () {
    var drop = $('idDrop'), input = $('idInput'), list = $('idFiles');
    if (!drop || !input) return;
    var files = [];

    function render() {
      list.innerHTML = '';
      files.forEach(function (f, i) {
        var row = document.createElement('div');
        row.className = 'lic-compact-done';
        row.style.marginTop = '8px';
        row.innerHTML =
          '<span class="lic-compact-check"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' +
          '<div class="lic-compact-info"><div class="lic-compact-fname">' + escapeHtml(f.name) + '</div><div class="lic-compact-status">Uploaded successfully · ' + fmtSize(f.size) + '</div></div>' +
          '<button class="lic-compact-del" data-i="' + i + '" title="Remove" type="button"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>';
        list.appendChild(row);
      });
      // Hide the upload prompt once at least one file is added (like the licence flow)
      drop.style.display = files.length ? 'none' : '';
      // Clear the required-error highlight once a file is added
      if (files.length) {
        var blk = document.getElementById('idBlock');
        if (blk) blk.classList.remove('co-id-error');
      }
      list.querySelectorAll('.lic-compact-del').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          files.splice(parseInt(btn.dataset.i, 10), 1); render();
        });
      });
    }
    // Downscale phone-camera photos of the Emirates ID before we ever queue
    // them for upload — this is the single biggest lever on "sending a
    // document takes forever" over a mobile connection. PDFs are untouched.
    function compressToFile(file, maxDim, quality) {
      return new Promise(function (resolve) {
        if (!file.type || file.type.indexOf('image/') !== 0) { resolve(file); return; }
        var reader = new FileReader();
        reader.onerror = function () { resolve(file); };
        reader.onload = function (e) {
          var img = new Image();
          img.onerror = function () { resolve(file); };
          img.onload = function () {
            try {
              var w = img.width, h = img.height;
              var scale = Math.min(1, (maxDim || 1800) / Math.max(w, h));
              var outW = Math.max(1, Math.round(w * scale));
              var outH = Math.max(1, Math.round(h * scale));
              var canvas = document.createElement('canvas');
              canvas.width = outW; canvas.height = outH;
              var ctx = canvas.getContext('2d');
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, outW, outH);
              ctx.drawImage(img, 0, 0, outW, outH);
              canvas.toBlob(function (blob) {
                if (!blob || blob.size >= file.size) { resolve(file); return; }
                var newName = file.name.replace(/\.[a-z0-9]+$/i, '') + '.jpg';
                resolve(new File([blob], newName, { type: 'image/jpeg' }));
              }, 'image/jpeg', quality || 0.82);
            } catch (err) { resolve(file); }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    function add(fileList) {
      var incoming = Array.prototype.filter.call(fileList, function (f) {
        return f.size <= 25 * 1024 * 1024;
      });
      if (!incoming.length) return;
      Promise.all(incoming.map(function (f) { return compressToFile(f, 1800, 0.82); }))
        .then(function (compressed) {
          compressed.forEach(function (f) { files.push(f); });
          render();
        });
    }
    input.addEventListener('change', function () { add(input.files); input.value = ''; });
    drop.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('drag'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('drag'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files);
    });

    // Expose the current file list so the confirm flow can upload them
    getIdFiles = function () { return files.slice(); };
  })();

  /* ── Phone: combine country code select + local number ───── */
  function getFullPhone() {
    var codeSel = $('coPhoneCode');
    var code = codeSel ? codeSel.value : '971';
    var local = ($('coPhone').value || '').trim();
    if (!local) return '';
    return '+' + code + ' ' + local;
  }

  /* ── Confirm → validate + WhatsApp handoff ───── */
  function validate() {
    var problems = [];
    var name = ($('coName').value || '').trim();
    var phone = (getFullPhone() || '').trim();
    var emirate = $('coEmirate').value;
    var isPickup = state.delivery === 'pickup';

    if (!name) problems.push($('coName'));
    if (!phone) problems.push($('coPhone'));
    if (!isPickup && !($('coAddress').value || '').trim()) problems.push($('coAddress'));
    if (!isPickup && !emirate) problems.push($('coEmirate'));
    if (!els.coTerms.checked) problems.push(els.coTerms.closest('.co-terms'));

    // Emirates ID is required — but only when the ID block is shown
    // (signature orders already provided it earlier, so the block is hidden).
    var idBlock = $('idBlock');
    var idShown = idBlock && idBlock.style.display !== 'none';
    if (idShown && getIdFiles().length === 0) {
      idBlock.classList.add('co-id-error');
      problems.push(idBlock);
    } else if (idBlock) {
      idBlock.classList.remove('co-id-error');
    }

    problems.forEach(function (el) {
      if (!el) return;
      var target = el.matches('input,select') ? el : el;
      flashError(target);
    });
    if (problems.length) {
      // Small delay so the mobile keyboard (from whichever field was
      // focused before tapping "Pay") finishes closing first — otherwise
      // the viewport is still resizing and "center" scrolls to the wrong
      // spot, making it look like the page never moved.
      var target = problems[0];
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.focus) target.focus();
      }, 120);
      return false;
    }
    return true;
  }
  function flashError(el) {
    var orig = el.style.boxShadow, ob = el.style.borderColor;
    el.style.borderColor = '#ef4444';
    el.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.14)';
    el.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' },
       { transform: 'translateX(5px)' }, { transform: 'translateX(0)' }],
      { duration: 360, easing: 'ease-in-out' }
    );
    setTimeout(function () { el.style.boxShadow = orig; el.style.borderColor = ob; }, 1800);
  }

  function buildWaMessage(p, ref) {
    var L = [];
    L.push('🧾 *New MyStamp order* — ' + ref);
    L.push('');
    L.push('*Stamp:* ' + (SHAPE_LABEL[order.shape] || 'Custom') + ' · ' + (order.size || ''));
    L.push('*Ink:* ' + inkName(order.color));
    if (order.company) L.push('*Company:* ' + order.company);
    if (order.withLogo && !order.ownDesignData) L.push('*Logo:* included (+AED ' + (p.logoTotal || LOGO_FEE) + ')');
    if (order.note) L.push('*Note:* ' + order.note);
    L.push('*Quantity:* ' + p.qty + (p.freeStamps ? ' paid + ' + p.freeStamps + ' free = ' + p.received + ' stamps' : ''));
    L.push('');
    var methodName = state.delivery === 'nextday' ? 'Next-day delivery'
      : state.delivery === 'express' ? '4-hour express (Careem Box)' : 'Pickup — Deira, Dubai';
    L.push('*Method:* ' + methodName);
    L.push('*Name:* ' + ($('coName').value || '').trim());
    L.push('*Phone:* ' + getFullPhone());
    if (state.delivery !== 'pickup') {
      L.push('*Address:* ' + ($('coAddress').value || '').trim() + ', ' + $('coEmirate').value);
    }
    var em = ($('coEmail').value || '').trim();
    if (em) L.push('*Email:* ' + em);
    L.push('');
    L.push('*Total:* AED ' + p.grand + (p.deliveryCost === 0 ? ' (free standard delivery)' : ''));
    if (p.saved > 0) L.push('💰 Saved AED ' + p.saved);
    L.push('');
    L.push('— I\'ll send my Emirates ID + design here. ✍️');
    return encodeURIComponent(L.join('\n'));
  }

  /* ── Payment method: card only (Telr) ───────────── */
  var payMethod = 'card';

  function refreshConfirmButton() {
    var p = compute();
    var icon = $('confirmIcon'), text = $('confirmText'), trust = $('payTrustText');
    if (text) text.textContent = 'Pay securely';
    if (icon) icon.innerHTML = '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>';
    if (icon) icon.setAttribute('fill', 'none');
    if (icon) icon.setAttribute('stroke', 'currentColor');
    if (trust) trust.textContent = 'Secure card payment via Telr';
  }

  /* ── Confirm → card payment (Telr) ── */
  function buildOrderRow(p, ref, fileRefs, payVia) {
    return {
      order_ref: ref,
      status: 'pending',
      pay_method: payVia,
      // Design
      shape: order.shape || null,
      size: order.size || null,
      ink_color: order.color || null,
      company: order.company || null,
      pobox: order.pobox || null,
      with_logo: !!order.withLogo && !order.ownDesignData,
      with_license_number: !!order.withLicNum,
      is_own_design: !!order.ownDesignData,
      license_number: order.licNum || null,
      note: order.note || null,
      // Quantity & pricing
      quantity: p.qty,
      free_stamps: p.freeStamps,
      total_aed: p.grand,
      // Delivery
      delivery_method: state.delivery,
      delivery_fee: p.deliveryCost,
      // Customer
      customer_name: ($('coName').value || '').trim() || null,
      customer_phone: getFullPhone() || null,
      customer_email: ($('coEmail').value || '').trim() || null,
      customer_address: ($('coAddress').value || '').trim() || null,
      emirate: $('coEmirate').value || null,
      // Files (array of {name, path})
      documents: fileRefs && fileRefs.length ? fileRefs : null
    };
  }

  async function persistToSupabase(p, ref, payVia) {
    // Best-effort: uploads files + saves the order. Never blocks the
    // customer from paying if Supabase is momentarily unavailable.
    // All documents (ID, logo, licence, design) upload IN PARALLEL —
    // this is what makes "sending documents" fast instead of waiting
    // through 4+ uploads one after another.
    if (!window.mystampOrders) return;
    try {
      var jobs = [];

      // 1) Emirates ID files (already compressed at selection time)
      jobs.push(
        window.mystampOrders.uploadFiles(ref, getIdFiles())
          .then(function (refs) { return refs || []; })
          .catch(function () { return []; })
      );

      // 2) Logo (carried over from the configurator as base64, already compressed)
      if (order.logoData) {
        jobs.push(
          window.mystampOrders.uploadDataUrl(ref, order.logoData, order.logoName || 'logo', order.logoType || 'image/png')
            .then(function (r) { if (r) r.kind = 'logo'; return r ? [r] : []; })
        );
      }

      // 3) License document (carried over from the configurator as base64, already compressed if it's a photo)
      if (order.licenseData) {
        jobs.push(
          window.mystampOrders.uploadDataUrl(ref, order.licenseData, order.license || 'license', order.licenseType || 'application/octet-stream')
            .then(function (r) { if (r) r.kind = 'license'; return r ? [r] : []; })
        );
      }

      // 4) The stamp DESIGN itself.
      //    If the customer uploaded their OWN existing artwork, that IS the
      //    design — upload it exactly as provided (full quality, not
      //    compressed, since this goes straight to production). Otherwise,
      //    render the builder's SVG preview to a PNG.
      if (order.ownDesignData) {
        var extMatch = (order.ownDesignName || '').match(/\.[a-z0-9]+$/i);
        var ownName = 'customer-design' + (extMatch ? extMatch[0] : '.png');
        jobs.push(
          window.mystampOrders.uploadDataUrl(ref, order.ownDesignData, ownName, order.ownDesignType || 'image/png')
            .then(function (r) { if (r) r.kind = 'customer-design'; return r ? [r] : []; })
        );
      } else if (order.type === 'signature' && order.signatureData) {
        jobs.push(
          window.mystampOrders.uploadDataUrl(ref, order.signatureData, 'signature.png', 'image/png')
            .then(function (r) { if (r) r.kind = 'signature'; return r ? [r] : []; })
        );
      } else if (order.previewSvg && window.mystampOrders.svgToPngDataUrl) {
        jobs.push(
          window.mystampOrders.svgToPngDataUrl(order.previewSvg, 600).then(function (designPng) {
            if (!designPng) return [];
            return window.mystampOrders.uploadDataUrl(ref, designPng, 'stamp-design.png', 'image/png')
              .then(function (r) { if (r) r.kind = 'design'; return r ? [r] : []; });
          })
        );
      }

      var jobResults = await Promise.all(jobs);
      var fileRefs = [].concat.apply([], jobResults);

      var saveRes = await window.mystampOrders.saveOrder(buildOrderRow(p, ref, fileRefs, payVia));
      if (saveRes && saveRes.ok) {
        console.log('[mystamp] Order saved to Supabase ✓', ref);
      } else {
        console.error('[mystamp] Order save FAILED →', saveRes && saveRes.error, ref);
      }
    } catch (e) { console.error('[mystamp] persistToSupabase threw →', e); }
  }

  async function doConfirm(btn) {
    if (!validate()) return;
    var p = compute();
    var ref = 'MS-' + String(Date.now()).slice(-6);
    try { sessionStorage.setItem('mystamp_order_ref', ref); } catch (e) {}

    // Card path — save to Supabase first, then create the Telr payment
    var orig = btn.innerHTML;
    btn.disabled = true;
    setLoading(btn, 'Saving your order…');
    await persistToSupabase(p, ref, 'card');
    startCardPayment(btn, p, ref, orig);
  }

  function startCardPayment(btn, p, ref, orig) {
    if (typeof orig === 'undefined') orig = btn.innerHTML;
    btn.disabled = true;
    setLoading(btn, 'Starting secure payment…');

    var fullName = ($('coName').value || '').trim();
    var parts = fullName.split(/\s+/);
    var firstName = parts.shift() || '';
    var lastName = parts.join(' ') || firstName;

    fetch('/api/telr-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: p.grand,
        cartId: ref,
        description: (SHAPE_LABEL[order.shape] || 'Custom') + ' Stamp × ' + p.qty,
        firstName: firstName,
        lastName: lastName,
        email: ($('coEmail').value || '').trim(),
        phone: getFullPhone(),
        address: ($('coAddress').value || '').trim(),
        city: $('coEmirate').value || ''
      })
    })
    .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
    .then(function (res) {
      if (res.ok && res.body && res.body.url) {
        // Redirect the customer to Telr's secure payment page
        window.location.href = res.body.url;
      } else {
        var msg = (res.body && res.body.error) || 'Could not start payment. Please try again or use WhatsApp.';
        showPayError(btn, orig, msg);
      }
    })
    .catch(function () {
      showPayError(btn, orig, 'Network error. Please try again or order on WhatsApp.');
    });
  }

  function setLoading(btn, label) {
    btn.innerHTML = '<span class="co-confirm-content"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" style="animation:coSpin 0.7s linear infinite"><circle cx="12" cy="12" r="9" stroke-dasharray="40 60"/></svg><span class="co-confirm-text">' + label + '</span></span>';
    if (!document.getElementById('co-spin-style')) {
      var s = document.createElement('style'); s.id = 'co-spin-style';
      s.textContent = '@keyframes coSpin{to{transform:rotate(360deg)}}';
      document.head.appendChild(s);
    }
  }

  function showPayError(btn, orig, msg) {
    btn.disabled = false;
    btn.innerHTML = orig;
    var trust = $('payTrustText');
    if (trust) {
      var old = trust.textContent;
      trust.textContent = msg;
      trust.style.color = '#ef4444';
      setTimeout(function () { trust.textContent = old; trust.style.color = ''; }, 5000);
    }
  }

  function showSuccess(p, ref) {
    var ov = $('successOverlay');
    $('successRef').textContent = ref;
    var sub = $('successSub');
    if (state.delivery === 'pickup') {
      sub.textContent = "Your stamp will be ready for pickup in Deira, Dubai in about 3 hours. We'll WhatsApp you the moment it's ready to collect.";
    } else if (state.delivery === 'express') {
      sub.textContent = "Express order received. We'll WhatsApp you to confirm and dispatch via Careem Box within 4 hours.";
    } else {
      sub.textContent = "We've got your design. We'll WhatsApp you shortly to finalize and deliver before 2 PM tomorrow.";
    }
    $('successWa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + buildWaMessage(p, ref);
    ov.hidden = false;
  }

  els.confirmBtn.addEventListener('click', function () { doConfirm(els.confirmBtn); });
  els.mobileConfirm.addEventListener('click', function () { doConfirm(els.mobileConfirm); });

  /* ── Edit design → return to configurator with same data ── */
  var editLink = $('editDesignLink');
  if (editLink) {
    editLink.addEventListener('click', function () {
      // Persist current quantity back into the saved order, then flag a restore
      try {
        order.quantity = state.qty;
        sessionStorage.setItem('mystamp_order', JSON.stringify(order));
        sessionStorage.setItem('mystamp_edit', '1');
      } catch (e) {}
      // navigation proceeds via the href
    });
  }

  /* ── Reveal-on-scroll ────────────────────────── */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── Helpers ─────────────────────────────────── */
  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(0) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Prefill name/phone/emirate if configurator captured them */
  function prefill() {
    if (order.company && $('coName') && !$('coName').value) {
      // company isn't a person name — leave name empty, but prefill phone/emirate
    }
    if (order.phone && $('coPhone')) {
      // Strip any leading "+<code> " so it doesn't duplicate the country selector
      $('coPhone').value = String(order.phone).replace(/^\+\d{1,4}\s*/, '');
    }
    if (order.emirate && $('coEmirate')) {
      var opt = Array.prototype.find.call($('coEmirate').options, function (o) { return o.value === order.emirate; });
      if (opt) $('coEmirate').value = order.emirate;
    }
  }

  /* ── Init ────────────────────────────────────── */
  renderPreview();
  renderSpecs();
  prefill();
  computeEtas();
  update();
  refreshConfirmButton();
  initReveal();

  /* For the signature flow the customer already uploaded their ID/passport
     on the signature page — don't ask for it again here. */
  (function () {
    var idBlock = $('idBlock');
    if (idBlock && order.type === 'signature' && order.licenseData) {
      idBlock.style.display = 'none';
    }
  })();

  /* Logo fallback (shared header behavior) */
  var logoImg = $('logoImg'), logoFallback = $('logoFallback');
  if (logoImg) logoImg.addEventListener('error', function () {
    this.style.display = 'none';
    if (logoFallback) logoFallback.style.display = 'flex';
  });
})();
