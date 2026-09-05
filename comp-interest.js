/* ============================================================
   BLUE ELEMENT — Competition interest form (shared)

   Turns any element carrying  data-comp-interest  into a trigger
   that opens a modal form: name, email, which competition, and an
   optional note. Competitions only — courses and camps keep their
   own booking flows.

   Add  data-comp="nov-2026"  to a trigger to preselect an event.

   ── TO GO LIVE — fill ENDPOINT once, here ────────────────────────
   Until ENDPOINT is set the form still works: it opens the
   visitor's mail client with every answer already written into the
   message, addressed to MAIL. Nothing is lost, but the visitor has
   to press send, and people on webmail-only devices may drop out.

   With ENDPOINT set the form posts straight to the inbox and the
   visitor never leaves the page. Two options that need no backend:

   • FormSubmit  (no account): ENDPOINT =
       'https://formsubmit.co/ajax/blueelementfreediving@gmail.com'
     The first submission triggers a one-time confirmation email —
     click the link in it and every later submission is forwarded.

   • Formspree (free account, 50/month): create a form, then
       ENDPOINT = 'https://formspree.io/f/<FORM_ID>'

   Both accept the same JSON body, so no other change is needed.
   Note either service receives the visitor's name and email, so it
   is a third party handling personal data.
   ============================================================ */
(function () {
  var ENDPOINT = ''; // <-- paste a FormSubmit or Formspree URL to post straight to the inbox
  var MAIL = 'blueelementfreediving@gmail.com';

  var COMPS = [
    { id: 'nov-2026',    label: 'Blue Element · November — Nov 8–17, 2026' },
    { id: 'inv-2026',    label: 'Blue Element Invitational — Nov 20–24, 2026' },
    { id: 'mini-2027',   label: 'Blue Element March Mini — Mar 18–23, 2027' },
    { id: 'may-2027',    label: 'Blue Element May · Open — May 8–17, 2027' },
    { id: 'undecided',   label: 'Not sure yet / more than one' }
  ];

  var triggers = document.querySelectorAll('[data-comp-interest]');
  if (!triggers.length) return;

  // ---- Build the dialog once ----
  var options = COMPS.map(function (c) {
    return '<option value="' + c.id + '">' + c.label + '</option>';
  }).join('');

  var dlg = document.createElement('dialog');
  dlg.className = 'ci-modal';
  dlg.setAttribute('aria-labelledby', 'ciTitle');
  dlg.innerHTML =
    '<form class="ci-form" id="ciForm" novalidate>' +
      '<button class="ci-close" type="button" id="ciClose" aria-label="Close">&times;</button>' +
      '<p class="ci-eyebrow">Competitions</p>' +
      '<h2 class="ci-title" id="ciTitle">Register your interest</h2>' +
      '<p class="ci-sub">Tell us who you are and which event you have your eye on. We’ll come back to you with entry details, training options and what the week looks like.</p>' +
      '<div class="ci-field">' +
        '<label for="ciName">Your name</label>' +
        '<input id="ciName" name="name" type="text" autocomplete="name" required />' +
      '</div>' +
      '<div class="ci-field">' +
        '<label for="ciEmail">Email</label>' +
        '<input id="ciEmail" name="email" type="email" autocomplete="email" required />' +
      '</div>' +
      '<div class="ci-field">' +
        '<label for="ciComp">Which competition?</label>' +
        '<select id="ciComp" name="competition">' + options + '</select>' +
      '</div>' +
      '<div class="ci-field">' +
        '<label for="ciNote">Anything else? <span class="ci-opt">Optional</span></label>' +
        '<textarea id="ciNote" name="message" rows="3" placeholder="Personal bests, disciplines you’re chasing, questions about travel…"></textarea>' +
      '</div>' +
      '<p class="ci-error" id="ciError" role="alert" hidden></p>' +
      '<button class="btn btn-teal btn-lg ci-submit" type="submit" id="ciSubmit">Send it over</button>' +
      '<p class="ci-note">Goes straight to the Blue Element team. No list, no spam.</p>' +
    '</form>' +
    '<div class="ci-done" id="ciDone" hidden>' +
      '<p class="ci-eyebrow">Got it</p>' +
      '<h2 class="ci-title">Thanks &mdash; that’s with us.</h2>' +
      '<p class="ci-sub">We’ll be in touch shortly with everything you need. If it’s urgent, message us on WhatsApp and we’ll pick it up faster.</p>' +
      '<button class="btn btn-teal btn-lg" type="button" id="ciDoneClose">Close</button>' +
    '</div>';
  document.body.appendChild(dlg);

  var form = dlg.querySelector('#ciForm');
  var done = dlg.querySelector('#ciDone');
  var err = dlg.querySelector('#ciError');
  var submit = dlg.querySelector('#ciSubmit');
  var nameEl = dlg.querySelector('#ciName');
  var emailEl = dlg.querySelector('#ciEmail');
  var compEl = dlg.querySelector('#ciComp');
  var noteEl = dlg.querySelector('#ciNote');
  var lastFocus = null;

  function labelFor(id) {
    for (var i = 0; i < COMPS.length; i++) if (COMPS[i].id === id) return COMPS[i].label;
    return id;
  }

  function open(trigger) {
    lastFocus = trigger || document.activeElement;
    form.hidden = false;
    done.hidden = true;
    err.hidden = true;
    var pre = trigger && trigger.getAttribute('data-comp');
    if (pre) compEl.value = pre;
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
    nameEl.focus();
  }

  function close() {
    if (typeof dlg.close === 'function') dlg.close();
    else dlg.removeAttribute('open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  Array.prototype.forEach.call(triggers, function (t) {
    t.addEventListener('click', function (ev) {
      ev.preventDefault();
      open(t);
    });
  });

  dlg.querySelector('#ciClose').addEventListener('click', close);
  dlg.querySelector('#ciDoneClose').addEventListener('click', close);
  // Click the backdrop (the dialog element itself, outside the panel) to dismiss
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg) close(); });

  function fail(msg, el) {
    err.textContent = msg;
    err.hidden = false;
    if (el) el.focus();
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;

    var name = (nameEl.value || '').trim();
    var email = (emailEl.value || '').trim();
    var comp = labelFor(compEl.value);
    var note = (noteEl.value || '').trim();

    if (!name) return fail('Please add your name so we know who we’re replying to.', nameEl);
    if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
      return fail('That email doesn’t look right — we need it to reply.', emailEl);
    }

    var subject = 'Competition interest — ' + comp;
    var body = 'Name: ' + name + '\nEmail: ' + email + '\nCompetition: ' + comp +
               (note ? '\n\nNotes:\n' + note : '');

    if (!ENDPOINT) {
      // No endpoint yet — hand the fully-written message to their mail client.
      window.location.href = 'mailto:' + MAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
      form.hidden = true;
      done.hidden = false;
      dlg.querySelector('#ciDoneClose').focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sending…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: name, email: email, competition: comp, message: note,
        _subject: subject
      })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.hidden = true;
      done.hidden = false;
      dlg.querySelector('#ciDoneClose').focus();
    }).catch(function () {
      submit.disabled = false;
      submit.textContent = 'Send it over';
      fail('That didn’t send. Email us at ' + MAIL + ' and we’ll pick it up.');
    });
  });
})();
