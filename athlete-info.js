/* ============================================================
   BLUE ELEMENT — Athlete info (athlete-info.html)

   Unlisted page (noindex, not in the nav or sitemap). Shared with
   athletes in the event chat. Posts multipart to the be-athlete-info
   Worker, which stores everything in R2 and shows the team a
   password-protected tracker at <worker>/admin.

   Form design: Viktoria Urbanek, Oct 2026.
   ============================================================ */
(function () {
  var API = 'https://be-athlete-info.deepfieldstudios.workers.dev';
  // Local testing only: athlete-info.html?api=http://localhost:8787
  try {
    var api = new URLSearchParams(location.search).get('api');
    if (api && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) API = api.replace(/\/$/, '');
  } catch (e) {}
  var ENDPOINT = API + '/api/submit';
  var LS_FIELDS = 'be-athlete-info:fields', LS_TOKEN = 'be-athlete-info:draft';

  var MAX = 10 * 1024 * 1024;
  var OK_EXT = /\.(pdf|jpe?g|png|heic|heif|webp)$/i;
  var COMP_START = '2026-11-08';
  var MED_MIN = '2025-11-10'; // within 12 months of the first competition day
  var PB_MIN = '2026-08-08', PB_MAX = '2026-11-07';

  var COUNTRIES = ['Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bermuda','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','British Virgin Islands','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Cape Verde','Cayman Islands','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica','Croatia','Cuba','Curaçao','Cyprus','Czech Republic','DR Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','French Polynesia','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guadeloupe','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Macau','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Martinique','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Montserrat','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Caledonia','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Puerto Rico','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','São Tomé and Príncipe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Sint Maarten','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Turks and Caicos Islands','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','US Virgin Islands','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];

  var form = document.getElementById('aiForm');
  if (!form) return;
  var card = document.getElementById('aiCard');
  var errBox = document.getElementById('aiErrors');
  var submitBtn = document.getElementById('aiSubmit');
  var progress = document.getElementById('aiProgress');
  var el = function (n) { return form.elements[n]; };
  var today = new Date().toISOString().slice(0, 10);

  /* ---------- countries ---------- */
  document.querySelectorAll('select[data-countries]').forEach(function (s) {
    COUNTRIES.forEach(function (c) { var o = document.createElement('option'); o.textContent = c; s.appendChild(o); });
  });
  el('nationality').addEventListener('change', function () {
    if (!el('citizenship').value) el('citizenship').value = this.value;
  });

  /* ---------- date limits ---------- */
  el('medical_date').min = MED_MIN; el('medical_date').max = today;
  el('dob').max = '2010-12-31';
  el('last_injury').max = today; el('last_blackout').max = today;

  /* ---------- team ---------- */
  var teamBox = document.getElementById('aiTeam');
  var youName = document.getElementById('aiYouName');
  var youGender = document.getElementById('aiYouGender');
  var rules = document.getElementById('aiRules');
  var signAuto = '';
  function syncYou() {
    var nm = el('name').value.trim();
    if (!el('sign_name').value.trim() || el('sign_name').value.trim() === signAuto) { el('sign_name').value = nm; signAuto = nm; }
    youName.textContent = nm || 'You';
    youGender.textContent = el('gender').value || '—';
    checkTeam();
  }
  el('name').addEventListener('input', syncYou);
  el('gender').addEventListener('change', syncYou);
  el('team_on').addEventListener('change', function () { teamBox.hidden = !this.checked; checkTeam(); });
  ['tm2_name', 'tm3_name'].forEach(function (n) { el(n).addEventListener('input', checkTeam); });
  ['my_team_dive', 'tm2_gender', 'tm2_dive', 'tm3_gender', 'tm3_dive', 'my_wr', 'tm2_wr', 'tm3_wr'].forEach(function (n) {
    el(n).addEventListener('change', checkTeam);
  });
  function teamState() {
    var g = [el('gender').value, el('tm2_gender').value, el('tm3_gender').value];
    var d = [el('my_team_dive').value, el('tm2_dive').value, el('tm3_dive').value];
    var wr = [el('my_wr').checked, el('tm2_wr').checked, el('tm3_wr').checked].filter(Boolean).length;
    var allG = g.every(Boolean), allD = d.every(Boolean);
    return {
      mixed: allG ? (g.indexOf('Female') > -1 && g.indexOf('Male') > -1) : null,
      wr: (allG && el('tm2_name').value.trim() && el('tm3_name').value.trim()) ? wr <= 1 : (wr > 1 ? false : null),
      dives: allD ? (new Set(d).size === 3) : null,
    };
  }
  function checkTeam() {
    var s = teamState();
    rules.querySelectorAll('li').forEach(function (li) {
      var v = s[li.dataset.rule];
      li.className = v === true ? 'ok' : v === false ? 'bad' : '';
    });
    return s;
  }

  /* ---------- competition form mode ---------- */
  var modeInput = document.getElementById('fCompMode');
  var upBox = document.getElementById('aiCompUpload'), onBox = document.getElementById('aiCompOnline');
  document.querySelectorAll('.ai-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.ai-tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      modeInput.value = b.dataset.mode;
      upBox.hidden = b.dataset.mode !== 'upload';
      onBox.hidden = b.dataset.mode !== 'online';
      if (!onBox.hidden) pads.forEach(function (p) { p.resize(); });
    });
  });

  /* ---------- not-applicable ticks ---------- */
  document.querySelectorAll('.ai-pb').forEach(function (row) {
    var na = row.querySelector('input[type=checkbox]');
    var inputs = row.querySelectorAll('input[type=number],input[type=date]');
    na.addEventListener('change', function () { inputs.forEach(function (i) { i.disabled = na.checked; if (na.checked) i.value = ''; }); });
  });
  [['inj_na', 'last_injury'], ['bo_na', 'last_blackout']].forEach(function (p) {
    el(p[0]).addEventListener('change', function () { el(p[1]).disabled = this.checked; if (this.checked) el(p[1]).value = ''; });
  });

  /* ---------- file drops ---------- */
  var draftFiles = {}; // documents already saved with a draft on the server
  function fmtSize(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function showDrop(name) {
    var drop = el(name).closest('.ai-drop'), b = drop.querySelector('b'), small = drop.querySelector('small');
    var f = fileOf(name), d = draftFiles[name];
    drop.classList.toggle('has-file', !!(f || d));
    if (f) { b.textContent = 'Replace file'; small.textContent = f.name + ' · ' + fmtSize(f.size); }
    else if (d) { b.textContent = 'Saved \u2713'; small.textContent = d.name + ' · ' + fmtSize(d.size) + ' · choose to replace'; }
    else { b.textContent = 'Choose file'; small.textContent = 'or drag it here'; }
  }
  document.querySelectorAll('.ai-drop').forEach(function (drop) {
    var input = drop.querySelector('input[type=file]');
    var small = drop.querySelector('small'), b = drop.querySelector('b');
    ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
    input.addEventListener('change', function () { drop.classList.remove('is-bad'); showDrop(input.name); });
  });

  /* ---------- signature pads ---------- */
  function Pad(canvas) {
    var ctx = canvas.getContext('2d'), drawing = false, dirty = false, last = null;
    var pending = null; // a saved signature waiting for the pad to be visible
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
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { canvas.addEventListener(t, function () { drawing = false; }); });
    return {
      name: canvas.dataset.pad, canvas: canvas, resize: resize,
      clear: function () { ctx.clearRect(0, 0, canvas.width, canvas.height); dirty = false; pending = null; },
      isEmpty: function () { return !dirty && !pending; },
      load: function (url) { pending = url; resize(); },
      dataUrl: function () { return pending || (dirty ? canvas.toDataURL('image/png') : ''); },
      blob: function () { return new Promise(function (res) { canvas.toBlob(res, 'image/png'); }); },
    };
  }
  var pads = [].map.call(document.querySelectorAll('canvas[data-pad]'), Pad);
  var padBy = {}; pads.forEach(function (p) { padBy[p.name] = p; p.resize(); });
  window.addEventListener('resize', function () { pads.forEach(function (p) { p.resize(); }); });
  document.querySelectorAll('[data-clear]').forEach(function (b) { b.addEventListener('click', function () { padBy[b.dataset.clear].clear(); }); });

  /* ---------- validation ---------- */
  function bad(node) {
    var f = node.closest('.ci-field') || node.closest('.ai-check') || node;
    f.classList.add('is-bad');
    if (node.classList.contains('ai-drop') || node.classList.contains('ai-pad')) node.classList.add('is-bad');
    return node;
  }
  function clearBad() { form.querySelectorAll('.is-bad').forEach(function (n) { n.classList.remove('is-bad'); }); }
  function fileOf(n) { var i = el(n); return i && i.files && i.files[0]; }

  // silent: count what's missing per section for the checklist, without marking fields red
  function validate(silent) {
    var errs = [], first = null, bySec = {}, cur = 'athlete';
    function need(cond, msg, node) {
      if (cond) return;
      errs.push(msg); bySec[cur] = (bySec[cur] || 0) + 1;
      if (silent) return;
      var n = node ? bad(node) : null; if (!first && n) first = n;
    }
    var v = function (n) { return String(el(n).value || '').trim(); };
    var phone = /^\+\d[\d\s().-]{5,}$/;

    need(v('name'), 'Your full name.', el('name'));
    need(v('nationality'), 'Your nationality.', el('nationality'));
    need(v('gender'), 'Your gender.', el('gender'));
    need(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), 'A valid email.', el('email'));
    need(phone.test(v('whatsapp')), 'Your WhatsApp number, starting with + and the country code.', el('whatsapp'));

    cur = 'team';
    if (el('team_on').checked) {
      need(v('team_name'), 'Your team name.', el('team_name'));
      need(v('my_team_dive'), 'Your team dive.', el('my_team_dive'));
      [2, 3].forEach(function (n) {
        need(v('tm' + n + '_name'), 'Teammate ' + n + "'s name.", el('tm' + n + '_name'));
        need(v('tm' + n + '_gender'), 'Teammate ' + n + "'s gender.", el('tm' + n + '_gender'));
        need(v('tm' + n + '_dive'), 'Teammate ' + n + "'s team dive.", el('tm' + n + '_dive'));
      });
      var s = checkTeam();
      need(s.mixed !== false, 'The team must be mixed: at least one woman and one man.');
      need(s.wr !== false, 'A team can have no more than one world record holder.');
      need(s.dives !== false, 'Each team member needs a different discipline: CNF, FIM and CWT/CWTB.');
    }

    cur = 'ec';
    need(v('ec_name'), "Your emergency contact's name.", el('ec_name'));
    need(v('ec_relationship'), "Your emergency contact's relationship to you.", el('ec_relationship'));
    need(phone.test(v('ec_phone')), "Your emergency contact's phone, starting with + and the country code.", el('ec_phone'));

    function needFile(n, msg, required) {
      var f = fileOf(n), drop = el(n).closest('.ai-drop');
      if (!f) { if (required && !draftFiles[n]) need(false, msg, drop); return; }
      need(f.size <= MAX, msg.replace(/\.$/, '') + ' is over 10 MB. A phone photo or a smaller PDF works.', drop);
      need(OK_EXT.test(f.name) || /^(image\/|application\/pdf)/.test(f.type), msg.replace(/\.$/, '') + ' must be a PDF or a photo.', drop);
    }
    cur = 'insurance';
    needFile('insurance_file', 'Your insurance document.', true);
    need(v('ins_provider'), 'Your insurance provider.', el('ins_provider'));
    need(phone.test(v('ins_hotline')), "Your insurer's emergency hotline, starting with + and the country code.", el('ins_hotline'));
    need(v('ins_number'), 'Your insurance number.', el('ins_number'));

    cur = 'medical';
    needFile('medical_file', 'Your medical certificate.', true);
    var med = v('medical_date');
    need(med, "Your medical certificate's examination date.", el('medical_date'));
    if (med) need(med >= MED_MIN && med <= today, 'The medical certificate must be from the last 12 months (examined on or after 10 Nov 2025).', el('medical_date'));

    cur = 'compform';
    if (modeInput.value === 'upload') {
      needFile('compform_file', 'Your signed AIDA Competition Form, or choose "Fill in online".', true);
    } else {
      need(v('dob'), 'Your date of birth.', el('dob'));
      need(v('birth_country'), 'Your country of birth.', el('birth_country'));
      need(v('citizenship'), 'Your citizenship.', el('citizenship'));
      ['cwt', 'cwtb', 'cnf', 'fim'].forEach(function (d) {
        if (el('pb_' + d + '_na').checked) return;
        var dep = v('pb_' + d + '_depth'), dt = v('pb_' + d + '_date');
        need(dep && dt, d.toUpperCase() + ' personal best: depth and date, or tick Not applicable.', !dep ? el('pb_' + d + '_depth') : el('pb_' + d + '_date'));
        if (dt) need(dt >= PB_MIN && dt <= PB_MAX, d.toUpperCase() + ' personal best must be between 8 Aug and 7 Nov 2026.', el('pb_' + d + '_date'));
      });
      need(el('inj_na').checked || v('last_injury'), 'Your last pressure-related injury date, or tick Not applicable.', el('last_injury'));
      need(el('bo_na').checked || v('last_blackout'), 'Your last blackout date, or tick Not applicable.', el('last_blackout'));
      var window3 = '2026-08-08';
      [['last_injury', 'pressure-related injury'], ['last_blackout', 'blackout']].forEach(function (p) {
        var d = v(p[0]);
        if (d && med && d >= window3 && med < d) need(false, 'Your ' + p[1] + ' on ' + d + ' was in the last three months, so you need a new medical certificate dated after it.', el('medical_date'));
      });
      need(!padBy.sig_compform_athlete.isEmpty(), "Your signature on the competition form.", padBy.sig_compform_athlete.canvas);
      need(!padBy.sig_compform_witness.isEmpty(), "Your witness's signature on the competition form.", padBy.sig_compform_witness.canvas);
      need(v('witness_name'), "Your witness's name.", el('witness_name'));
      need(el('compform_confirm').checked, 'Tick to confirm the competition form is correct.', el('compform_confirm'));
    }
    cur = 'passport';
    needFile('passport_file', 'A photo of your passport.', true);

    cur = 'declarations';
    need(el('agree_liability').checked, 'Tick to agree to the liability release.', el('agree_liability'));
    need(el('agree_image').checked, 'Tick to agree to the AIDA image rights.', el('agree_image'));
    need(el('agree_media').checked, 'Tick to agree to Blue Element and DiveEye filming.', el('agree_media'));
    need(el('iwr_choice').value === 'consent' || el('iwr_choice').value === 'decline', 'Choose whether you consent to in-water recompression.', form.querySelector('input[name=iwr_choice]'));
    need(!padBy.sig_declarations.isEmpty(), 'Your signature under the declarations.', padBy.sig_declarations.canvas);
    var norm = function (x) { return x.toLowerCase().replace(/\s+/g, ' '); };
    need(v('sign_name') && norm(v('sign_name')) === norm(v('name')), 'The name under your signature must match your name in section 1.', el('sign_name'));
    need(v('sign_place').length > 2, 'Where you are signing (city, country).', el('sign_place'));

    cur = 'consent';
    need(el('consent_data').checked, 'Tick the data consent.', el('consent_data'));
    need(el('consent_ec').checked, 'Tick to confirm your emergency contact agreed.', el('consent_ec'));
    need(el('consent_true').checked, 'Tick to confirm your information is correct.', el('consent_true'));
    return { errs: errs, first: first, bySec: bySec };
  }

  /* ---------- live checklist: Submit stays locked until every section is complete ---------- */
  var checklist = document.getElementById('aiChecklist');
  var countEl = document.getElementById('aiCount');
  var sending = false;
  function refresh() {
    if (sending) return;
    var r = validate(true), total = 0, ok = 0;
    checklist.querySelectorAll('li').forEach(function (li) {
      var sec = li.dataset.sec;
      var good = !r.bySec[sec];
      if (sec === 'team') li.querySelector('span').textContent = el('team_on').checked ? 'Team event' : 'Team event (not entering)';
      li.className = good ? 'ok' : '';
      total++; if (good) ok++;
    });
    var all = ok === total;
    if (all) errBox.hidden = true;
    countEl.textContent = all ? 'Everything is in. Ready to submit.' : ok + ' of ' + total + ' sections complete';
    submitBtn.classList.toggle('is-locked', !all);
    submitBtn.setAttribute('aria-disabled', all ? 'false' : 'true');
    submitBtn.textContent = all ? 'Submit' : 'Complete all sections';
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  pads.forEach(function (p) { p.canvas.addEventListener('pointerup', function () { setTimeout(refresh, 0); }); });
  document.querySelectorAll('[data-clear], .ai-tabs button').forEach(function (b) { b.addEventListener('click', function () { setTimeout(refresh, 0); }); });
  refresh();

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

  function send() {
    var online = modeInput.value === 'online';
    var fd = new FormData();
    [].forEach.call(form.elements, function (i) {
      if (!i.name || i.type === 'file' || i.disabled) return;
      if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked) fd.append(i.name, i.value || 'yes'); return; }
      if (!online && /^(dob|birth_country|citizenship|pb_|last_|inj_na|bo_na|witness_name|compform_confirm)/.test(i.name)) return;
      if (!el('team_on').checked && /^(team_name|my_team_dive|my_wr|tm[23]_)/.test(i.name)) return;
      fd.append(i.name, i.value);
    });
    ['insurance_file', 'medical_file', 'passport_file'].concat(online ? [] : ['compform_file']).forEach(function (n) {
      var f = fileOf(n); if (f) fd.append(n, f, f.name); // otherwise the Worker takes it from the saved draft
    });
    if (draftToken) fd.append('draft', draftToken);
    var sigs = ['sig_declarations'].concat(online ? ['sig_compform_athlete', 'sig_compform_witness'] : []);
    Promise.all(sigs.map(function (n) { return padBy[n].blob(); })).then(function (blobs) {
      blobs.forEach(function (b, i) { fd.append(sigs[i], b, sigs[i] + '.png'); });
      upload(fd);
    });
  }

  function upload(fd) {
    sending = true;
    submitBtn.disabled = true; submitBtn.textContent = 'Sending…';
    progress.hidden = false; var bar = progress.querySelector('i'); bar.style.width = '2%';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT);
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) bar.style.width = Math.max(2, Math.round(e.loaded / e.total * 100)) + '%'; };
    xhr.onload = function () {
      var res = {}; try { res = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status === 200 && res.ok) return done(res.ref);
      fail(res.error || 'Something went wrong on our side (' + xhr.status + ').');
    };
    xhr.onerror = function () { fail('The upload didn’t go through. Check your connection and press Submit again.'); };
    xhr.send(fd);
  }

  function fail(msg) {
    sending = false; submitBtn.disabled = false; submitBtn.textContent = 'Submit'; progress.hidden = true;
    showErrors([msg + ' If it keeps happening, WhatsApp us on +44 7554 739347.']);
    errBox.scrollIntoView({ block: 'center' });
  }

  /* ---------- save progress ----------
     1. Every change is kept on this device (localStorage), so a closed tab loses nothing.
     2. "Save and finish later" stores everything, documents and signatures included, on the
        Worker and gives a private link that reopens the form on any device. */
  var draftToken = '';
  var banner = document.getElementById('aiRestored');
  var savedBox = document.getElementById('aiSaved');
  var saveBtn = document.getElementById('aiSave');
  var lastSaved = {}; // file field -> File already uploaded with the draft

  function collect() {
    var out = {};
    [].forEach.call(form.elements, function (i) {
      if (!i.name || i.type === 'file' || i.name === 'company') return;
      if (i.type === 'checkbox') out[i.name] = i.checked ? (i.value || 'yes') : '';
      else if (i.type === 'radio') { if (i.checked) out[i.name] = i.value; }
      else out[i.name] = i.value;
    });
    return out;
  }
  function apply(vals, sigs) {
    Object.keys(vals || {}).forEach(function (k) {
      var node = form.elements[k];
      if (!node || k === 'compform_mode') return;
      if (node.length && node[0] && node[0].type === 'radio') { [].forEach.call(node, function (r) { r.checked = r.value === vals[k]; }); return; }
      if (node.type === 'checkbox') node.checked = !!vals[k];
      else if (node.type !== 'file') node.value = vals[k];
    });
    // re-run the dependent UI
    teamBox.hidden = !el('team_on').checked;
    document.querySelectorAll('.ai-pb input[type=checkbox], input[name=inj_na], input[name=bo_na]').forEach(function (c) {
      if (c.checked) c.dispatchEvent(new Event('change'));
    });
    if (vals && vals.compform_mode === 'online') document.querySelector('.ai-tabs button[data-mode=online]').click();
    Object.keys(sigs || {}).forEach(function (k) { if (padBy[k] && sigs[k]) padBy[k].load(sigs[k]); });
    signAuto = el('sign_name').value.trim() === el('name').value.trim() ? el('name').value.trim() : signAuto;
    syncYou();
    refresh();
  }
  var finished = false; // after a successful submit nothing is kept on the device
  var KEEP_MS = 72 * 3600 * 1000; // device copies expire after 72 hours
  function clearDevice() { try { localStorage.removeItem(LS_FIELDS); localStorage.removeItem(LS_TOKEN); } catch (e) {} }
  // Answers only: signatures are never kept on the device, which may be shared
  function storeLocal() {
    if (finished || sending) return;
    try {
      localStorage.setItem(LS_FIELDS, JSON.stringify({ at: Date.now(), token: draftToken, vals: collect() }));
      if (!draftToken) localStorage.removeItem(LS_TOKEN); // typing without loading the stored draft means it isn't theirs: forget it
    } catch (e) {}
  }
  function storeToken() { try { localStorage.setItem(LS_TOKEN, JSON.stringify({ token: draftToken, at: Date.now() })); } catch (e) {} }
  var lsTimer;
  function queueLocal() { clearTimeout(lsTimer); lsTimer = setTimeout(storeLocal, 400); }
  form.addEventListener('input', queueLocal);
  form.addEventListener('change', queueLocal);

  function showBanner(msg, actions) {
    banner.querySelector('span').textContent = msg;
    var box = banner.querySelector('.ai-restored-actions');
    box.innerHTML = '';
    (actions || []).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = a[0]; if (a[2]) b.className = a[2];
      b.addEventListener('click', a[1]);
      box.appendChild(b);
    });
    banner.hidden = false;
  }
  function startFresh() {
    clearDevice();
    var u = new URL(location.href); u.searchParams.delete('resume'); location.replace(u.toString());
  }

  function resumeLink() {
    var u = new URL(location.href); u.search = ''; u.hash = '';
    u.searchParams.set('resume', draftToken);
    try { var a = new URLSearchParams(location.search).get('api'); if (a && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) u.searchParams.set('api', a); } catch (e) {}
    return u.toString();
  }
  function showSaved() {
    var link = resumeLink();
    document.getElementById('aiSavedLink').value = link;
    var mail = document.getElementById('aiSavedMail');
    var em = el('email').value.trim();
    mail.href = 'mailto:' + (/^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]+$/.test(em) ? em : '') + '?subject=' + encodeURIComponent('My Blue Element athlete info link') +
      '&body=' + encodeURIComponent('Continue my athlete info for Blue Element November 2026:\n' + link);
    savedBox.hidden = false;
  }
  document.getElementById('aiSavedCopy').addEventListener('click', function () {
    var inp = document.getElementById('aiSavedLink'), btn = this;
    inp.select();
    (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(function () { document.execCommand('copy'); })
      .then(function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy link'; }, 1800); });
  });

  saveBtn.addEventListener('click', function () {
    if (el('company').value) return;
    var fd = new FormData();
    var vals = collect();
    Object.keys(vals).forEach(function (k) { fd.append(k, vals[k]); });
    ['insurance_file', 'medical_file', 'compform_file', 'passport_file'].forEach(function (n) {
      var f = fileOf(n);
      if (f && lastSaved[n] !== f && f.size <= MAX) fd.append(n, f, f.name);
    });
    if (draftToken) fd.append('token', draftToken);
    var sigNames = pads.filter(function (p) { return !p.isEmpty(); }).map(function (p) { return p.name; });
    Promise.all(sigNames.map(function (n) { return padBy[n].blob(); })).then(function (blobs) {
      blobs.forEach(function (b, i) { fd.append(sigNames[i], b, sigNames[i] + '.png'); });
      saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API + '/api/draft');
      xhr.onload = function () {
        var res = {}; try { res = JSON.parse(xhr.responseText); } catch (e) {}
        saveBtn.disabled = false; saveBtn.textContent = 'Save and finish later';
        if (xhr.status === 200 && res.ok) {
          draftToken = res.token;
          draftFiles = res.files || draftFiles;
          ['insurance_file', 'medical_file', 'compform_file', 'passport_file'].forEach(function (n) { var f = fileOf(n); if (f && draftFiles[n]) lastSaved[n] = f; });
          storeToken();
          storeLocal();
          showSaved();
          savedBox.scrollIntoView({ block: 'center' });
        } else {
          showErrors([(res.error || 'Saving didn’t work (' + xhr.status + ').') + ' Your answers are still kept on this device.']);
        }
      };
      xhr.onerror = function () {
        saveBtn.disabled = false; saveBtn.textContent = 'Save and finish later';
        showErrors(['Saving didn’t go through. Check your connection and try again. Your answers are still kept on this device.']);
      };
      xhr.send(fd);
    });
  });

  // on load: a private link loads straight away; anything kept on this device is offered first,
  // because the phone or laptop may be shared
  function loadDraft(token, withSigs, local) {
    return fetch(API + '/api/draft?token=' + token).then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (d) {
      draftToken = token;
      draftFiles = d.files || {};
      Object.keys(draftFiles).forEach(showDrop);
      var useLocal = local && local.token === token && local.at > (d.savedAt || 0);
      apply(useLocal ? local.vals : d.fields, withSigs ? d.sigs : null);
      storeToken();
      var n = Object.keys(draftFiles).length;
      showBanner('Welcome back. Your saved progress is loaded' + (n ? ', including ' + n + ' document' + (n > 1 ? 's' : '') : '') +
        (withSigs ? '.' : '. Please sign again before you submit.'), [['Start over', startFresh]]);
    });
  }
  (function restore() {
    var urlToken = '', dev = null, local = null, now = Date.now();
    try { urlToken = new URLSearchParams(location.search).get('resume') || ''; } catch (e) {}
    try { dev = JSON.parse(localStorage.getItem(LS_TOKEN) || 'null'); } catch (e) { dev = null; }
    try { local = JSON.parse(localStorage.getItem(LS_FIELDS) || 'null'); } catch (e) { local = null; }
    if (!dev || typeof dev !== 'object' || !/^[a-f0-9]{32}$/.test(dev.token || '') || now - (dev.at || 0) > KEEP_MS) dev = null;
    if (!local || !local.vals || now - (local.at || 0) > KEEP_MS) local = null;
    // the prompt's name must come from the record that Continue loads
    if (dev && local && local.token !== dev.token) { dev = null; try { localStorage.removeItem(LS_TOKEN); } catch (e) {} }
    if (!dev && !local) clearDevice();

    if (/^[a-f0-9]{32}$/.test(urlToken)) {
      var u = new URL(location.href); u.searchParams.delete('resume'); history.replaceState(null, '', u); // keep the token out of the address bar
      loadDraft(urlToken, true, local).catch(function () {
        showBanner('That saved link has expired, or the form was already submitted.', [['OK', function () { banner.hidden = true; }]]);
      });
      return;
    }
    if (!dev && !local) return;
    var who = (local && local.vals.name || '').trim();
    var first = who.split(/\s+/)[0];
    showBanner(who ? 'Continue as ' + who + '?' : 'Continue the form you started on this device?', [
      ['Continue', function () {
        banner.hidden = true;
        if (dev) {
          loadDraft(dev.token, false, local).catch(function () { if (local) apply(local.vals, null); });
        } else {
          apply(local.vals, null);
          showBanner('Your answers are back. Choose your documents and sign again before you submit.', [['Start over', startFresh]]);
        }
      }, 'is-primary'],
      [who ? 'Not ' + first + '? Start fresh' : 'Start fresh', startFresh],
    ]);
  })();

  function done(ref) {
    finished = true; clearTimeout(lsTimer);
    try { localStorage.removeItem(LS_FIELDS); localStorage.removeItem(LS_TOKEN); } catch (e) {}
    var u = new URL(location.href); if (u.searchParams.has('resume')) { u.searchParams.delete('resume'); history.replaceState(null, '', u); }
    document.getElementById('aiRef').textContent = 'Ref ' + ref;
    card.classList.add('is-done');
    card.scrollIntoView({ block: 'start' });
  }
})();
