/* ============================================================
   BLUE ELEMENT — Arrival form (onboarding.html)

   Seven answers, one email. Same delivery pattern as
   comp-interest.js: with ENDPOINT set it posts as JSON and the
   guest never leaves the page; with it empty it opens the guest's
   mail client with everything pre-written to MAIL.

   ── TO GO LIVE — fill ENDPOINT once ─────────────────────────────
   • FormSubmit (no account): ENDPOINT =
       'https://formsubmit.co/ajax/blueelementfreediving@gmail.com'
     First submission sends a one-time confirmation email to that
     inbox — click the link, then every later one is forwarded.
   • Formspree: ENDPOINT = 'https://formspree.io/f/<FORM_ID>'

   Pre-selecting from a link: onboarding.html?for=comp-nov-2026
   The Stripe Payment Link "after payment" URL can point here with
   the matching value so the guest lands with the right thing chosen.
   ============================================================ */
(function () {
  var ENDPOINT = ''; // <-- paste a FormSubmit or Formspree URL
  var MAIL = 'blueelementfreediving@gmail.com';

  var form = document.getElementById('obForm');
  if (!form) return;
  var card = document.getElementById('obCard');
  var err = document.getElementById('obError');
  var submit = document.getElementById('obSubmit');

  // Preselect from ?for=
  try {
    var pre = new URLSearchParams(location.search).get('for');
    if (pre) {
      var sel = document.getElementById('obFor');
      if (sel && sel.querySelector('option[value="' + pre + '"]')) sel.value = pre;
    }
  } catch (e) {}

  function val(name) {
    var el = form.elements[name];
    return el ? String(el.value || '').trim() : '';
  }
  function text(name) {
    var el = form.elements[name];
    if (!el || !el.value) return '';
    return el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : String(el.value).trim();
  }
  function fail(msg, el) {
    err.textContent = msg; err.hidden = false;
    if (el) el.focus();
  }
  function done() { card.classList.add('is-done'); window.scrollTo({ top: card.offsetTop - 120, behavior: 'smooth' }); }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;
    if (val('company')) { done(); return; } // bot

    var name = val('name'), email = val('email');
    if (!name) return fail('Your name, please.', form.elements.name);
    if (!email || email.indexOf('@') < 1) return fail('That email doesn’t look right.', form.elements.email);
    if (!val('arrival_date')) return fail('When do you land in Dominica?', form.elements.arrival_date);
    if (!val('signed_up_for')) return fail('Tell us what you’ve signed up for.', form.elements.signed_up_for);
    if (!val('insured')) return fail('Are you insured to freedive?', form.elements.insured);
    if (!val('highest_certificate')) return fail('Your highest certificate, or “None yet”.', form.elements.highest_certificate);

    var pbs = ['CWT ' + val('pb_cwt'), 'CWTB ' + val('pb_cwtb'), 'CNF ' + val('pb_cnf'),
               'FIM ' + val('pb_fim'), 'STA ' + val('pb_sta'), 'DYN ' + val('pb_dyn')]
      .filter(function (s) { return s.split(' ')[1]; }).join(' · ') || 'none given';

    var lines = [
      'Name: ' + name,
      'Email: ' + email,
      'Arrival: ' + val('arrival_date'),
      'Signed up for: ' + text('signed_up_for'),
      'Insured: ' + text('insured'),
      'Highest certificate: ' + text('highest_certificate'),
      'PBs (last 3 months): ' + pbs,
      'Note: ' + (val('note') || '—')
    ];
    var subject = 'Arrival form — ' + name + ' — ' + text('signed_up_for');

    if (!ENDPOINT) {
      location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      done();
      return;
    }

    submit.disabled = true; submit.textContent = 'Sending…';
    var payload = {
      _subject: subject, name: name, email: email, _replyto: email,
      arrival_date: val('arrival_date'), signed_up_for: text('signed_up_for'),
      insured: text('insured'), highest_certificate: text('highest_certificate'),
      pbs_last_3_months: pbs, note: val('note') || '', _template: 'table'
    };
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad status');
      done();
    }).catch(function () {
      submit.disabled = false; submit.textContent = 'Send';
      fail('That didn’t send. Try again, or email ' + MAIL + '.');
    });
  });
})();
