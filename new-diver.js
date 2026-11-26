/* ============================================================
   BLUE ELEMENT — New diver form (new-diver.html)

   Unlisted page (noindex, not in the nav or sitemap) for guests coming
   to learn: details, the AIDA Medical Statement and the AIDA Liability
   Release, both signed on screen. Posts multipart to the be-new-diver
   Worker, which stores everything in R2 and shows the team a
   password-protected tracker at <worker>/admin.

   ?for=<product> (same slugs as onboarding.html) is recorded with the
   submission. Built 26 Nov 2026.
   ============================================================ */
(function () {
  var API = 'https://be-new-diver.deepfieldstudios.workers.dev';
  // Local testing only: new-diver.html?api=http://127.0.0.1:8788
  try {
    var api = new URLSearchParams(location.search).get('api');
    if (api && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) API = api.replace(/\/$/, '');
  } catch (e) {}
  var ENDPOINT = API + '/api/submit';
  var MAX = 10 * 1024 * 1024;
  var OK_EXT = /\.(pdf|jpe?g|png|heic|heif|webp)$/i;
  var QUESTIONS = 11;

  var form = document.getElementById('ndForm');
  if (!form) return;
  var card = document.getElementById('ndCard');
  var errBox = document.getElementById('ndErrors');
  var submitBtn = document.getElementById('ndSubmit');
  var progress = document.getElementById('ndProgress');
  var el = function (n) { return form.elements[n]; };
  var v = function (n) { return String(el(n).value || '').trim(); };
  var sending = false;

  // dates in Dominica time (AST, UTC-4, no DST)
  var nowAst = new Date(Date.now() - 4 * 3600 * 1000);
  var today = nowAst.toISOString().slice(0, 10);
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function nice(ymd) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : ''; }
  function ageOn(dob, on) {
    var a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || ''), b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(on);
    if (!a || !b) return null;
    var age = +b[1] - +a[1];
    if (+b[2] < +a[2] || (+b[2] === +a[2] && +b[3] < +a[3])) age--;
    return age;
  }

  el('dob').max = today;
  el('arrival_date').min = new Date(nowAst.getTime() - 60 * 86400000).toISOString().slice(0, 10);

  // ?for=<product>
  try {
    var forParam = new URLSearchParams(location.search).get('for') || '';
    if (/^[a-z0-9-]{2,60}$/.test(forParam)) el('for').value = forParam;
  } catch (e) {}

  /* ---------- echo name / dates into the documents ---------- */
  function echo() {
    var name = v('name'), dob = v('dob'), g = v('guardian_name');
    document.querySelectorAll('[data-echo]').forEach(function (n) {
      var k = n.dataset.echo;
      if (k === 'name') n.textContent = name || (n.classList.contains('nd-fill') ? 'your name' : 'from section 01');
      if (k === 'dob') n.textContent = nice(dob) || 'from section 01';
      if (k === 'today') n.textContent = nice(today);
      if (k === 'guardian') n.textContent = g || 'their parent or guardian';
    });
    var minor = isMinor();
    document.querySelectorAll('[data-guardian]').forEach(function (b) {
      var was = b.hidden; b.hidden = !minor;
      if (was && minor) setTimeout(function () { pads.forEach(function (p) { p.resize(); }); }, 0);
    });
  }
  function isMinor() { var a = ageOn(v('dob'), today); return a !== null && a < 18; }
  ['name', 'dob', 'guardian_name'].forEach(function (n) { el(n).addEventListener('input', echo); el(n).addEventListener('change', echo); });

  /* ---------- medical questions ---------- */
  function answer(q) { var r = form.querySelector('input[name="med_q' + q + '"]:checked'); return r ? r.value : ''; }
  function anyYes() { for (var q = 1; q <= QUESTIONS; q++) if (answer(q) === 'yes') return true; return false; }
  function syncQuestions() {
    document.querySelectorAll('.nd-q').forEach(function (row) {
      var q = row.dataset.q, yes = answer(q) === 'yes', spec = row.querySelector('.nd-spec');
      row.classList.toggle('is-yes', yes);
      if (yes && answer(q)) row.classList.remove('is-bad');
      if (answer(q)) row.classList.remove('is-bad');
      if (spec) { spec.hidden = !yes; if (!yes) spec.querySelector('textarea').value = ''; }
    });
    document.getElementById('ndDoctor').hidden = !anyYes();
  }
  form.querySelectorAll('.nd-yn input').forEach(function (r) { r.addEventListener('change', syncQuestions); });

  /* ---------- doctor's sign-off upload ---------- */
  var drop = document.getElementById('ndDrop');
  var fileInput = el('doctor_file');
  var dropDefault = drop.querySelector('.tx').innerHTML;
  function fmtSize(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    drop.classList.toggle('has-file', !!f);
    drop.querySelector('.tx').innerHTML = dropDefault;
    if (f) { drop.querySelector('.tx b').textContent = f.name; drop.querySelector('.tx small').textContent = fmtSize(f.size) + ' · tap to change'; }
  });

  /* ---------- signature pads ---------- */
  function Pad(canvas) {
    var ctx = canvas.getContext('2d'), drawing = false, dirty = false, last = null;
    var pending = null; // a signature image waiting for the pad to be visible
    function resize() {
      var r = canvas.getBoundingClientRect();
      if (!r.width) return;
      var ratio = Math.max(window.devicePixelRatio || 1, 1);
      var img = pending || (dirty ? canvas.toDataURL() : null);
      if (pending) { dirty = true; pending = null; }
      canvas.width = r.width * ratio; canvas.height = r.height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0a1722';
      if (img) { var i = new Image(); i.onload = function () { ctx.drawImage(i, 0, 0, r.width, r.height); }; i.src = img; }
    }
    function pos(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    canvas.addEventListener('pointerdown', function (e) { drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.arc(last.x, last.y, 1.1, 0, 7); ctx.fillStyle = '#0a1722'; ctx.fill(); dirty = true; canvas.classList.remove('is-bad'); });
    canvas.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; dirty = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { canvas.addEventListener(t, function () { if (drawing) { drawing = false; changed(); } }); });
    return {
      name: canvas.dataset.pad, canvas: canvas, resize: resize,
      clear: function () { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; pending = null; changed(); },
      isEmpty: function () { return !dirty && !pending; },
      load: function (url) { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; pending = url; resize(); canvas.classList.remove('is-bad'); changed(); },
      dataUrl: function () { return pending || (dirty ? canvas.toDataURL('image/png') : ''); },
    };
  }
  var pads = [].map.call(document.querySelectorAll('canvas[data-pad]'), Pad);
  var padBy = {}; pads.forEach(function (p) { padBy[p.name] = p; p.resize(); });
  window.addEventListener('resize', function () { pads.forEach(function (p) { p.resize(); }); });
  document.querySelectorAll('[data-clear]').forEach(function (b) { b.addEventListener('click', function () { padBy[b.dataset.clear].clear(); }); });
  // "Use my signature from above": copies the medical statement signature into the release pad
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { var src = padBy[b.dataset.from]; if (src && !src.isEmpty()) padBy[b.dataset.copy].load(src.dataUrl()); });
  });
  function syncCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(function (b) { b.hidden = padBy[b.dataset.from].isEmpty(); });
  }
  function changed() { syncCopyButtons(); setTimeout(refresh, 0); }

  /* ---------- validation ---------- */
  function bad(node) {
    var f = node.closest('.ci-field') || node.closest('.nd-check') || node.closest('.nd-spec') || node.closest('.nd-q') || node;
    f.classList.add('is-bad');
    if (node.classList.contains('nd-pad')) node.classList.add('is-bad');
    return node;
  }
  function clearBad() { form.querySelectorAll('.is-bad').forEach(function (n) { n.classList.remove('is-bad'); }); }

  function validate(silent) {
    var errs = [], first = null, sec = { you: true, medical: true, medsign: true, release: true, consent: true };
    function need(cond, msg, node, s) {
      if (cond) return;
      errs.push(msg); sec[s] = false;
      if (!silent && node) { bad(node); if (!first) first = node; }
    }
    need(v('name').split(/\s+/).length >= 2, 'Your full name (first name and surname).', el('name'), 'you');
    need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), 'A valid email address.', el('email'), 'you');
    need(v('whatsapp').replace(/\D/g, '').length >= 7, 'Your WhatsApp number, with the country code.', el('whatsapp'), 'you');
    need(/^\d{4}-\d{2}-\d{2}$/.test(v('arrival_date')), 'Your arrival date in Dominica.', el('arrival_date'), 'you');
    var age = ageOn(v('dob'), today);
    need(age !== null && age >= 5 && age <= 100 && v('dob') <= today, 'Your date of birth.', el('dob'), 'you');

    var missingQ = [];
    for (var q = 1; q <= QUESTIONS; q++) {
      var a = answer(q), row = form.querySelector('.nd-q[data-q="' + q + '"]');
      if (!a) { missingQ.push(q); sec.medical = false; if (!silent) { bad(row); if (!first) first = row; } }
      else if (a === 'yes' && q < QUESTIONS && !v('med_q' + q + '_detail')) {
        need(false, 'Question ' + q + ': you answered YES, so please say what it is.', el('med_q' + q + '_detail'), 'medical');
      }
    }
    if (missingQ.length) errs.push(missingQ.length === QUESTIONS ? 'Answer the 11 medical questions, YES or NO.' : 'Medical question' + (missingQ.length > 1 ? 's ' : ' ') + missingQ.join(', ') + ': answer YES or NO.');
    need(el('med_certify').checked, 'Tick the medical statement declaration.', el('med_certify'), 'medsign');
    need(!padBy.sig_medical.isEmpty(), 'Sign the medical statement.', padBy.sig_medical.canvas, 'medsign');

    var f = fileInput.files && fileInput.files[0];
    if (f && anyYes()) {
      need(f.size <= MAX, "The doctor's sign-off file is over 10 MB.", drop, 'medical');
      need(OK_EXT.test(f.name || '') || /^(image\/|application\/pdf)/.test(f.type || ''), "The doctor's sign-off must be a PDF or a photo.", drop, 'medical');
    }

    need(el('agree_release').checked, 'Tick that you agree to the liability release.', el('agree_release'), 'release');
    need(!padBy.sig_release.isEmpty(), 'Sign the liability release.', padBy.sig_release.canvas, 'release');

    if (isMinor()) {
      need(v('guardian_name').split(/\s+/).length >= 2, "Your parent or guardian's full name.", el('guardian_name'), 'medsign');
      need(!padBy.sig_medical_guardian.isEmpty(), 'Your parent or guardian signs the medical statement.', padBy.sig_medical_guardian.canvas, 'medsign');
      need(!padBy.sig_release_guardian.isEmpty(), 'Your parent or guardian signs the liability release.', padBy.sig_release_guardian.canvas, 'release');
    }

    need(el('consent_data').checked && el('consent_true').checked, 'Tick both consent boxes.', !el('consent_data').checked ? el('consent_data') : el('consent_true'), 'consent');
    return { errs: errs, first: first, sec: sec };
  }

  var checklist = document.getElementById('ndChecklist');
  var countEl = document.getElementById('ndCount');
  function refresh() {
    if (sending) return;
    var r = validate(true), done = 0, total = 0;
    checklist.querySelectorAll('li').forEach(function (li) {
      total++; var ok = r.sec[li.dataset.sec]; if (ok) done++;
      li.classList.toggle('ok', ok);
    });
    countEl.textContent = done === total ? 'Everything is in. Ready to submit.' : done + ' of ' + total + ' done';
    submitBtn.classList.toggle('is-locked', done !== total);
  }
  form.addEventListener('input', function () { setTimeout(refresh, 0); });
  form.addEventListener('change', function () { setTimeout(refresh, 0); });
  echo(); syncQuestions(); syncCopyButtons(); refresh();

  function showErrors(list) {
    errBox.innerHTML = '';
    var p = document.createElement('b'); p.textContent = list.length === 1 ? 'One thing to fix:' : list.length + ' things to fix:';
    var ul = document.createElement('ul');
    list.slice(0, 8).forEach(function (m) { var li = document.createElement('li'); li.textContent = m; ul.appendChild(li); });
    if (list.length > 8) { var li = document.createElement('li'); li.textContent = '…and ' + (list.length - 8) + ' more, marked in red.'; ul.appendChild(li); }
    errBox.appendChild(p); errBox.appendChild(ul); errBox.hidden = false;
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    clearBad(); errBox.hidden = true;
    if (el('company').value) return;
    var r = validate(false);
    if (r.errs.length) {
      showErrors(r.errs);
      var target = r.first || errBox;
      target.scrollIntoView({ block: 'center' });
      if (target.focus) try { target.focus({ preventScroll: true }); } catch (e) {}
      return;
    }
    send();
  });

  function toBlob(dataUrl) { return fetch(dataUrl).then(function (r) { return r.blob(); }); }

  function send() {
    var minor = isMinor(), yes = anyYes();
    var fd = new FormData();
    [].forEach.call(form.elements, function (i) {
      if (!i.name || i.type === 'file' || i.disabled) return;
      if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked) fd.append(i.name, i.value || 'yes'); return; }
      if (!minor && i.name === 'guardian_name') return;
      fd.append(i.name, i.value);
    });
    var f = fileInput.files && fileInput.files[0];
    if (f && yes) fd.append('doctor_file', f, f.name);
    var sigs = ['sig_medical', 'sig_release'].concat(minor ? ['sig_medical_guardian', 'sig_release_guardian'] : []);
    Promise.all(sigs.map(function (n) { return toBlob(padBy[n].dataUrl()); })).then(function (blobs) {
      blobs.forEach(function (b, i) { fd.append(sigs[i], b, sigs[i] + '.png'); });
      upload(fd, yes && !f);
    }).catch(function () { fail('Your signature could not be read. Clear it, sign again and press Submit.'); });
  }

  function upload(fd, doctorStillNeeded) {
    sending = true;
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
    progress.hidden = false; var bar = progress.querySelector('i'); bar.style.width = '2%';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT);
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) bar.style.width = Math.max(2, Math.round(e.loaded / e.total * 100)) + '%'; };
    xhr.onload = function () {
      var res = {}; try { res = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status === 200 && res.ok) return done(res.ref, doctorStillNeeded);
      fail(res.error || 'Something went wrong on our side (' + xhr.status + ').');
    };
    xhr.onerror = function () { fail('The form didn’t go through. Check your connection and press Submit again.'); };
    xhr.send(fd);
  }

  function done(ref, doctorStillNeeded) {
    document.getElementById('ndRef').textContent = 'Ref ' + ref;
    document.getElementById('ndDoneDoctor').hidden = !doctorStillNeeded;
    card.classList.add('is-done');
    card.scrollIntoView({ block: 'start' });
  }

  function fail(msg) {
    sending = false; submitBtn.disabled = false; submitBtn.textContent = 'Submit'; progress.hidden = true;
    showErrors([msg + ' If it keeps happening, WhatsApp us on +44 7554 739347.']);
    errBox.scrollIntoView({ block: 'center' });
  }
})();
