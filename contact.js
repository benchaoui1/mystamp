/* ════════════════════════════════════════════════════════════════
   CONTACT.JS — Studio status + form interactivity
   - Studio hours: 9 AM – 10 PM (every day, 7 days a week, Dubai time)
   - Orders: 24/7 (always open online)
   - Live status badge updates every minute
   - Phone auto-format, char counter, validation, success state
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Dubai time (UTC+4, no DST) */
  function getDubaiNow() {
    const now = new Date();
    const dubaiMs = now.getTime() + (now.getTimezoneOffset() * 60000) + (4 * 3600000);
    return new Date(dubaiMs);
  }

  /* ──────────────────────────────────────────────────────
     STUDIO STATUS — 9 AM – 10 PM every day
  ────────────────────────────────────────────────────── */
  function updateStudioStatus() {
    const dubaiNow = getDubaiNow();
    const hour = dubaiNow.getHours();
    const min  = dubaiNow.getMinutes();

    const statusText = document.getElementById('hoursStatusText');
    const statusDot  = document.getElementById('hoursStatusDot');
    if (!statusText) return;

    const statusBadge = statusText.closest('.contact-hours-badge-studio');

    const OPEN_HOUR  = 9;
    const CLOSE_HOUR = 22; // 10 PM

    let isOpen = false;
    let label  = '';

    if (hour < OPEN_HOUR) {
      // Before opening
      const hoursUntil = OPEN_HOUR - hour;
      if (hoursUntil === 1) {
        label = 'Opens in ' + (60 - min) + ' min';
      } else {
        label = 'Opens today · 9 AM';
      }
    } else if (hour >= CLOSE_HOUR) {
      // After closing — opens next day 9 AM
      label = 'Opens tomorrow · 9 AM';
    } else {
      // Open!
      isOpen = true;
      const hoursLeft = CLOSE_HOUR - hour;
      if (hoursLeft === 1) {
        const minsLeft = (CLOSE_HOUR - hour) * 60 - min;
        label = 'Open · Closes in ' + minsLeft + ' min';
      } else {
        label = 'Open · 9 AM – 10 PM';
      }
    }

    statusText.textContent = label;

    if (statusBadge) {
      if (isOpen) {
        statusBadge.classList.remove('closed');
      } else {
        statusBadge.classList.add('closed');
      }
    }
  }

  /* ──────────────────────────────────────────────────────
     PHONE AUTO-FORMAT (UAE: 50 123 4567)
  ────────────────────────────────────────────────────── */
  function bindPhoneFormat() {
    const phone = document.getElementById('cPhone');
    if (!phone) return;
    phone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('971')) v = v.slice(3);
      if (v.startsWith('0'))   v = v.slice(1);
      let formatted = '';
      if (v.length > 0) formatted = v.slice(0, 2);
      if (v.length > 2) formatted += ' ' + v.slice(2, 5);
      if (v.length > 5) formatted += ' ' + v.slice(5, 9);
      e.target.value = formatted;
    });
  }

  /* ──────────────────────────────────────────────────────
     CHAR COUNTER
  ────────────────────────────────────────────────────── */
  function bindCharCount() {
    const textarea = document.getElementById('cMessage');
    const counter  = document.getElementById('charCount');
    if (!textarea || !counter) return;
    const MAX = 500;
    textarea.setAttribute('maxlength', MAX);
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = len;
      if (len > MAX * 0.9)      counter.style.color = '#ef4444';
      else if (len > MAX * 0.7) counter.style.color = '#f59e0b';
      else                      counter.style.color = '';
    });
  }

  /* ──────────────────────────────────────────────────────
     FORM SUBMISSION
  ────────────────────────────────────────────────────── */
  function bindForm() {
    const form = document.getElementById('contactForm');
    const btn  = document.getElementById('contactSubmit');
    if (!form || !btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const fields = [
        document.getElementById('cName'),
        document.getElementById('cEmail'),
        document.getElementById('cSubject'),
        document.getElementById('cMessage')
      ];

      let firstInvalid = null;
      fields.forEach((el) => {
        if (!el) return;
        el.classList.remove('contact-input-error');
        if (!(el.value || '').trim()) {
          el.classList.add('contact-input-error');
          if (!firstInvalid) firstInvalid = el;
        }
      });

      const emailEl = document.getElementById('cEmail');
      if (emailEl && emailEl.value) {
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
        if (!ok) {
          emailEl.classList.add('contact-input-error');
          if (!firstInvalid) firstInvalid = emailEl;
        }
      }

      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        try { firstInvalid.focus(); } catch (e2) {}
        return;
      }

      const data = {
        name:      document.getElementById('cName').value.trim(),
        email:     document.getElementById('cEmail').value.trim(),
        phone:     document.getElementById('cPhone').value.trim(),
        subject:   document.getElementById('cSubject').value,
        message:   document.getElementById('cMessage').value.trim(),
        timestamp: new Date().toISOString()
      };

      // Loading state
      btn.disabled = true;
      btn.innerHTML = '<span class="contact-submit-spinner"></span><span>Sending...</span>';

      // Inject spinner CSS once
      if (!document.getElementById('contact-spinner-style')) {
        const s = document.createElement('style');
        s.id = 'contact-spinner-style';
        s.textContent = '.contact-submit-spinner{width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:contactSpin 0.7s linear infinite}@keyframes contactSpin{to{transform:rotate(360deg)}}';
        document.head.appendChild(s);
      }

      setTimeout(() => {
        const success = document.createElement('div');
        success.className = 'contact-form-success show';
        success.innerHTML = '<div class="contact-form-success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h3>Message sent!</h3><p>Thank you, <strong>' + escapeHtml(data.name) + '</strong>. We\'ll get back to you within 24 hours.</p><p style="margin-top:18px;font-size:12px;">In the meantime, feel free to <a href="https://wa.me/971544032018" target="_blank" rel="noopener" style="color:#16a34a;font-weight:700;text-decoration:none;">chat with us on WhatsApp →</a></p>';
        form.style.display = 'none';
        form.parentNode.appendChild(success);
        try { sessionStorage.setItem('mystamp_contact_message', JSON.stringify(data)); } catch (e3) {}
      }, 1200);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function init() {
    updateStudioStatus();
    setInterval(updateStudioStatus, 60000); // refresh every minute
    bindPhoneFormat();
    bindCharCount();
    bindForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
