/* ============================================================
   BLUE ELEMENT — Email capture + event-pack unlock (shared)
   Used by every gated event page (November, Invitational, March
   Mini, May Open). Captures the visitor's email, subscribes them
   to your list so your provider auto-emails the pack, then unlocks
   the hidden pack content on the page.

   The POST uses mode:'no-cors', so it works from a static site with
   no backend and nothing is ever blocked on the wire.

   ── TO GO LIVE — fill `endpoint` once, here, for ALL pages ─────────
   • MailerLite (recommended): create an embedded form, then from its
     HTML snippet copy the form's action URL into `endpoint`:
       endpoint   -> "https://assets.mailerlite.com/jsonp/<ACCT>/forms/<FORMID>/subscribe"
       emailField -> 'fields[email]'
       extra      -> { 'ml-submit': '1', 'anticsrf': 'true' }
   • Mailchimp: from your list's embedded-form code copy its action,
     but change "/post?" to "/post-json?":
       endpoint   -> "https://<dc>.list-manage.com/subscribe/post-json?u=XXX&id=YYY"
       emailField -> 'EMAIL'
       extra      -> {}   (leave empty)

   Each page sets its own localStorage key via  data-storage-key  on
   the #gate element, and an emailed link ending in #unlocked opens
   the pack straight away.
   ============================================================ */
(function () {
  var LEAD = {
    endpoint: '',                 // <-- paste your MailerLite/Mailchimp subscribe URL (applies to every event page)
    emailField: 'fields[email]',  // MailerLite. For Mailchimp use 'EMAIL'
    extra: { 'ml-submit': '1', 'anticsrf': 'true' } // MailerLite. For Mailchimp use {}
  };

  var pack = document.getElementById('packContent');
  if (!pack) return; // page has no gated pack
  var gate = document.getElementById('gate');
  var form = document.getElementById('gateForm');
  var input = document.getElementById('gateEmail');
  var KEY = (gate && gate.getAttribute('data-storage-key')) || 'be_event_pack';

  function unlock(skipScroll) {
    pack.classList.add('open');
    if (gate) gate.classList.add('done');
    // let the newly shown sections appear (chrome.js reveal-observer may have missed them)
    pack.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    if (!skipScroll) {
      var s = pack.querySelector('section');
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Returning visitor, or arrived via an emailed link (#unlocked)
  try {
    if (localStorage.getItem(KEY) || location.hash === '#unlocked') unlock(true);
  } catch (e) {}

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = (input.value || '').trim();
      if (!email || email.indexOf('@') < 1 || email.indexOf('.') < 0) {
        input.focus();
        return;
      }
      try { localStorage.setItem(KEY, email); } catch (e) {}

      // Subscribe to the email list if configured (non-blocking, no-cors)
      if (LEAD.endpoint) {
        var params = new URLSearchParams();
        params.append(LEAD.emailField, email);
        var extra = LEAD.extra || {};
        Object.keys(extra).forEach(function (k) { params.append(k, extra[k]); });
        fetch(LEAD.endpoint, { method: 'POST', mode: 'no-cors', body: params }).catch(function () {});
      }

      unlock(false);
    });
  }
})();
