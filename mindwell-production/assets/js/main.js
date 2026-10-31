/* MINDWELL — site behaviour (no dependencies)
 * 1. Mobile navigation   2. Testimonial carousel   3. Contact form
 */
(function () {
  'use strict';

  /* ---- Configuration ---------------------------------------------------
   * FORM_ENDPOINT: URL that accepts a POST (Formspree, Netlify, Basin, your own).
   *   Leave empty and the form opens the visitor's email app with the message
   *   pre-filled, so it still works on any static host with zero setup.
   * Formspree example:  'https://formspree.io/f/xxxxxxxx'
   * --------------------------------------------------------------------- */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'mindwellreiki@gmail.com';

  /* ---- Footer year ------------------------------------------------------ */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- 1. Mobile navigation -------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.setAttribute('data-open', String(open));
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---- 2. Testimonial carousel ----------------------------------------- */
  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
    if (slides.length < 2) return;
    var dotsWrap = root.querySelector('[data-dots]');
    var live = root.querySelector('[data-live]');
    var index = 0;
    var dots = [];

    slides.forEach(function (sl, i) {
      sl.setAttribute('aria-roledescription', 'slide');
      sl.setAttribute('aria-label', (i + 1) + ' of ' + slides.length);
    });

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel__dot';
      b.setAttribute('aria-label', 'Show testimonial ' + (i + 1) + ' of ' + slides.length);
      b.addEventListener('click', function () { show(i, true); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });

    function show(i, announce) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.hidden = n !== index; });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', String(n === index)); });
      if (live) live.setAttribute('aria-live', announce ? 'polite' : 'off');
    }

    root.querySelector('[data-prev]').addEventListener('click', function () { show(index - 1, true); });
    root.querySelector('[data-next]').addEventListener('click', function () { show(index + 1, true); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1, true);
      if (e.key === 'ArrowRight') show(index + 1, true);
    });

    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 48) show(index + (dx < 0 ? 1 : -1), true);
      startX = null;
    }, { passive: true });

    show(0, false);
  }
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);

  /* ---- Share links: use this page's canonical address (falls back to the current URL) ---- */
  document.querySelectorAll('[data-share="whatsapp"]').forEach(function (a) {
    var canon = document.querySelector('link[rel="canonical"]');
    var url = (canon && canon.href) || window.location.href.split('#')[0];
    a.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent('I wanted to share this great website with you ' + url);
  });

  /* ---- 3. Contact form -------------------------------------------------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('[data-status]');

    var setStatus = function (kind, text) {
      status.hidden = false;
      status.className = 'form-status form-status--' + kind;
      status.textContent = text;
    };
    var fieldError = function (input, message) {
      var holder = input.closest('.field');
      var err = holder.querySelector('.field-error');
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (!err) {
          err = document.createElement('p');
          err.className = 'field-error';
          err.id = input.id + '-error';
          input.setAttribute('aria-describedby', err.id);
          holder.appendChild(err);
        }
        err.textContent = message;
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
        if (err) err.remove();
      }
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var email = form.elements.email;
      var phone = form.elements.phone;
      var message = form.elements.message;
      var firstBad = null;

      [name, email, phone, message].forEach(function (i) { fieldError(i, ''); });
      status.hidden = true;

      if (!name.value.trim()) { fieldError(name, 'Enter your full name.'); firstBad = firstBad || name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        fieldError(email, 'Enter a valid email address, like name@example.com.');
        firstBad = firstBad || email;
      }
      if (!message.value.trim()) {
        fieldError(message, 'Describe your current and desired state in a few words.');
        firstBad = firstBad || message;
      }
      if (firstBad) { firstBad.focus(); return; }

      if (form.elements['bot-field'] && form.elements['bot-field'].value) return; // spam trap

      var payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        message: message.value.trim(),
        _subject: 'Consultation request from ' + name.value.trim()
      };

      if (!FORM_ENDPOINT) {
        var body = 'Name: ' + payload.name + '\nEmail: ' + payload.email +
          (payload.phone ? '\nPhone: ' + payload.phone : '') + '\n\n' + payload.message;
        window.location.href = 'mailto:' + CONTACT_EMAIL +
          '?subject=' + encodeURIComponent('Consultation request from ' + payload.name) +
          '&body=' + encodeURIComponent(body);
        setStatus('ok', 'Your email app should open with your message ready to send. If it does not, write to ' + CONTACT_EMAIL + '.');
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        setStatus('ok', 'Thank you for contacting us. We will get back to you as soon as possible.');
      }).catch(function () {
        setStatus('err', 'Your message was not sent. Please try again, or write to ' + CONTACT_EMAIL + '.');
      }).then(function () { btn.disabled = false; });
    });
  }
})();
