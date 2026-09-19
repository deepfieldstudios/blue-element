/* ============================================================
   BLUE ELEMENT — Enquiry form (enquire.html)

   One page, four avenues (competition / course / training /
   1:1 coaching). Picking an avenue reveals its field block; the
   universal contact fields and the lower section stay put.

   DUAL DELIVERY — both fire on submit, independently:
     1. MailerLite  — subscribes the enquirer to your list/group so
        the info-pack automation fires. no-cors, non-blocking.
     2. Team inbox  — posts the full enquiry (all fields) so a human
        follows up personally. This is what gates the "done" state.
   If the team endpoint is empty, it falls back to the visitor's
   mail client with everything pre-written (nothing is lost).

   ── TO GO LIVE ──────────────────────────────────────────────────
   • FORM_ENDPOINT is already the shared FormSubmit inbox (same as
     the arrival form). Enquiries land in blueelementfreediving@gmail.com.
   • ML_ENDPOINT — paste the MailerLite embedded-form subscribe URL
     (from its HTML snippet's <form action="…">) to switch on the
     auto info-pack:
       ML_ENDPOINT -> "https://assets.mailerlite.com/jsonp/<ACCT>/forms/<FORMID>/subscribe"
     For per-avenue routing later, swap to a map of avenue -> URL.

   Deep-link a starting avenue:  enquire.html?for=course
   (values: competition · course · training · coaching)
   ============================================================ */
(function () {
  // ---- Delivery config ----
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/blueelementfreediving@gmail.com'; // team inbox (same as onboarding)
  var ML_ENDPOINT   = '';                 // <-- paste MailerLite subscribe URL to switch on the auto info-pack
  var ML_EMAIL_FIELD = 'fields[email]';
  var ML_NAME_FIELD  = 'fields[name]';
  var ML_EXTRA = { 'ml-submit': '1', 'anticsrf': 'true' };
  var MAIL = 'blueelementfreediving@gmail.com';

  var AVENUE_LABEL = {
    competition: 'Competition',
    course: 'Course',
    training: 'Training',
    coaching: '1:1 Coaching'
  };
  // Required fields per avenue (plus the universal set below).
  var REQUIRED = {
    _all: ['name', 'email', 'phone', 'country'],
    competition: ['comp_which'],
    course: ['course_which'],
    training: ['train_which'],
    coaching: ['coach_goals']
  };

  var form = document.getElementById('eqForm');
  if (!form) return;
  var card = document.getElementById('eqCard');
  var err = document.getElementById('eqError');
  var submit = document.getElementById('eqSubmit');
  var interestInput = document.getElementById('eqInterest');
  var segBtns = document.querySelectorAll('.eq-seg-btn');
  var blocks = document.querySelectorAll('.eq-block');

  var avenue = 'competition';

  function setAvenue(a) {
    if (!AVENUE_LABEL[a]) a = 'competition';
    avenue = a;
    interestInput.value = a;
    Array.prototype.forEach.call(segBtns, function (b) {
      var on = b.getAttribute('data-avenue') === a;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(blocks, function (bl) {
      bl.hidden = bl.getAttribute('data-block') !== a;
    });
    err.hidden = true;
  }

  Array.prototype.forEach.call(segBtns, function (b) {
    b.addEventListener('click', function () { setAvenue(b.getAttribute('data-avenue')); });
  });

  // Preselect from ?for=
  try {
    var pre = new URLSearchParams(location.search).get('for');
    setAvenue(pre || 'competition');
  } catch (e) { setAvenue('competition'); }

  function labelText(el) {
    var l = el.id ? form.querySelector('label[for="' + el.id + '"]') : null;
    var t = l ? l.textContent : el.name;
    return t.replace(/\s*Optional[\s\S]*$/i, '').replace(/\s+/g, ' ').trim();
  }

  function fieldValue(el) {
    if (el.tagName === 'SELECT') {
      if (el.selectedIndex < 0 || el.value === '') return '';
      return el.options[el.selectedIndex].text.trim();
    }
    return String(el.value || '').trim();
  }

  function fail(msg, el) {
    err.textContent = msg;
    err.hidden = false;
    if (el && el.focus) el.focus();
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function done() {
    card.classList.add('is-done');
    window.scrollTo({ top: card.offsetTop - 120, behavior: 'smooth' });
  }

  // Gather every visible, filled field into ordered rows + a flat map.
  function collect() {
    var rows = ['Interested in: ' + AVENUE_LABEL[avenue]];
    var flat = { interest: AVENUE_LABEL[avenue] };
    var skip = { company: 1, disciplines: 1, consent: 1, interest: 1 };

    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || skip[el.name]) return;
      if (el.type === 'hidden') return;
      if (el.offsetParent === null) return;            // not in the visible block
      var v = fieldValue(el);
      if (!v) return;
      rows.push(labelText(el) + ': ' + v);
      flat[el.name] = v;
    });

    var discs = [];
    Array.prototype.forEach.call(form.querySelectorAll('input[name="disciplines"]'), function (c) {
      if (c.checked && c.offsetParent !== null) discs.push(c.value);
    });
    if (discs.length) { rows.push('Disciplines: ' + discs.join(', ')); flat.disciplines = discs.join(', '); }

    var consentEl = form.elements.consent;
    var consent = !!(consentEl && consentEl.checked);
    rows.push('Marketing consent: ' + (consent ? 'yes' : 'no'));
    flat.marketing_consent = consent ? 'yes' : 'no';

    return { rows: rows, flat: flat, consent: consent };
  }

  function validate() {
    var req = REQUIRED._all.concat(REQUIRED[avenue] || []);
    for (var i = 0; i < req.length; i++) {
      var el = form.elements[req[i]];
      if (!el) continue;
      if (!fieldValue(el)) return el;
    }
    var email = String(form.elements.email.value || '').trim();
    if (email.indexOf('@') < 1 || email.indexOf('.') < 0) return form.elements.email;
    return null;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;

    if (form.elements.company && form.elements.company.value) { done(); return; } // bot

    var bad = validate();
    if (bad) {
      if (bad.name === 'email') return fail('That email doesn’t look right — we need it to reply.', bad);
      return fail('Please fill in: ' + labelText(bad) + '.', bad);
    }

    var data = collect();
    var who = String(form.elements.name.value || '').trim();
    var email = String(form.elements.email.value || '').trim();
    var subject = 'Enquiry — ' + AVENUE_LABEL[avenue] + ' — ' + who;

    // 1) MailerLite subscribe (background, non-blocking)
    if (ML_ENDPOINT) {
      try {
        var p = new URLSearchParams();
        p.append(ML_EMAIL_FIELD, email);
        p.append(ML_NAME_FIELD, who);
        p.append('fields[interest]', AVENUE_LABEL[avenue]);
        p.append('fields[marketing_consent]', data.consent ? 'yes' : 'no');
        Object.keys(ML_EXTRA).forEach(function (k) { p.append(k, ML_EXTRA[k]); });
        fetch(ML_ENDPOINT, { method: 'POST', mode: 'no-cors', body: p }).catch(function () {});
      } catch (e) {}
    }

    // 2) Team inbox (gates the done state), or mailto fallback
    if (!FORM_ENDPOINT) {
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(data.rows.join('\n'));
      done();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';

    var payload = data.flat;
    payload._subject = subject;
    payload._replyto = email;
    payload._template = 'table';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      done();
    }).catch(function () {
      submit.disabled = false;
      submit.textContent = 'Send enquiry';
      fail('That didn’t send. Email us at ' + MAIL + ' and we’ll pick it up.');
    });
  });
})();
