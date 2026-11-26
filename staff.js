/* ============================================================
   BLUE ELEMENT — Staff log (staff.html)

   Unlisted app page for Blue Element staff. Each person opens it from
   their own private link (staff.html#k=<id>.<signature>, sent by Harry);
   the key is remembered on the device. Talks to the be-staff-log Worker,
   which holds the rates (from the staff agreements) and works out pay.
   Built 26 Nov 2026.
   ============================================================ */
(function () {
  var API = 'https://be-staff-log.deepfieldstudios.workers.dev';
  // Local testing only: staff.html?api=http://127.0.0.1:8789#k=...
  try {
    var api = new URLSearchParams(location.search).get('api');
    if (api && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) API = api.replace(/\/$/, '');
  } catch (e) {}
  var LS = 'be-staff-key';

  var $ = function (id) { return document.getElementById(id); };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function d8(ymd) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd || ''); return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] : ''; }
  function dow(ymd) { return DOW[new Date(ymd + 'T12:00:00Z').getUTCDay()]; }
  function addDays(ymd, n) { return new Date(Date.parse(ymd + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
  function money(n) { n = Math.round(n * 100) / 100; return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
  // ['2026-11-08', …, '2026-11-12', '2026-11-14'] -> "8–12 Nov, 14 Nov"
  function dayRanges(days) {
    var out = [], a = null, b = null;
    days.slice().sort().forEach(function (dd) {
      if (b && addDays(b, 1) === dd) { b = dd; return; }
      if (a) out.push([a, b]); a = b = dd;
    });
    if (a) out.push([a, b]);
    return out.map(function (r) {
      if (r[0] === r[1]) return d8(r[0]);
      return r[0].slice(5, 7) === r[1].slice(5, 7) ? (+r[0].slice(8)) + '–' + d8(r[1]) : d8(r[0]) + '–' + d8(r[1]);
    }).join(', ');
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- key ---------- */
  var key = '';
  var m = /[#&]k=([a-z0-9-]+\.[a-f0-9]{32})/.exec(location.hash || '');
  if (m) { key = m[1]; try { localStorage.setItem(LS, key); } catch (e) {} }
  else { try { key = localStorage.getItem(LS) || ''; } catch (e) {} }
  if (!key) return gate();

  var S = null;       // last /api/me payload
  var viewing = '';   // period being viewed

  function gate(msg) {
    $('slLoad').hidden = true; $('slApp').hidden = true; $('slGate').hidden = false;
    if (msg) $('slGateMsg').textContent = msg;
  }

  function call(method, path, body) {
    return fetch(API + path, {
      method: method,
      headers: body ? { 'Content-Type': 'application/json', 'X-Staff-Key': key } : { 'X-Staff-Key': key },
      body: body ? JSON.stringify(body) : undefined,
    }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Something went wrong (' + r.status + ').' }; }).then(function (j) { j._status = r.status; return j; }); });
  }

  function load(p) {
    return call('GET', '/api/me' + (p ? '?p=' + p : '')).then(function (j) {
      if (!j.ok) {
        if (j._status === 401) { try { localStorage.removeItem(LS); } catch (e) {} }
        return gate(j.error || 'Could not load your log.');
      }
      S = j; viewing = j.period.period;
      $('slLoad').hidden = true; $('slGate').hidden = true; $('slApp').hidden = false;
      setupOnce(); render();
    }).catch(function () { gate('No connection. Check your signal and reload.'); });
  }

  /* ---------- static setup (lists, steppers) ---------- */
  var setup = false;
  function setupOnce() {
    if (setup) return; setup = true;
    $('slName').textContent = S.me.name;
    $('slRole').textContent = S.me.role;
    if (!S.me.hourly) { document.querySelector('[data-tab="hours"]').hidden = true; $('slActions').classList.add('two'); }

    var cs = $('cCourse');
    S.courses.forEach(function (c) { var o = document.createElement('option'); o.value = c.id; o.textContent = c.name + (c.fee != null ? ' · ' + money(c.fee) : ''); cs.appendChild(o); });
    var es = $('eEvent');
    var started = S.events.filter(function (e) { return e.start <= S.today; });
    S.events.forEach(function (e) {
      var o = document.createElement('option'); o.value = e.id;
      o.textContent = e.name + ' · ' + d8(e.start) + '–' + d8(e.end) + (e.start > S.today ? ' (upcoming)' : '');
      o.disabled = e.start > S.today; es.appendChild(o);
    });
    if (started.length) es.value = started[started.length - 1].id;

    document.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { openTab(b.dataset.tab === openTabName ? '' : b.dataset.tab); }); });
    document.querySelectorAll('.sl-step').forEach(function (box) {
      var input = box.querySelector('input'), isInt = box.dataset.step === 'students';
      box.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = parseFloat(input.value) || 0; v = Math.max(isInt ? 1 : 0, Math.min(isInt ? 12 : 16, v + parseFloat(b.dataset.d)));
          input.value = v; input.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });
    });
    $('hRates').textContent = money(S.rules.rateLand) + '/h on land · ' + money(S.rules.rateWater) + '/h in the water';
    ['fHours', 'fCourse', 'fEvent'].forEach(function (id) { $(id).addEventListener('input', live); $(id).addEventListener('change', live); });
    cs.addEventListener('change', courseDefaults);
    es.addEventListener('change', eventDefaults);
    $('eRole').addEventListener('change', live);
    $('eAll').addEventListener('click', function () { $('eDays').querySelectorAll('input:not(:disabled)').forEach(function (c) { c.checked = true; }); live(); });
    $('fHours').addEventListener('submit', function (ev) { ev.preventDefault(); saveHours(); });
    $('fCourse').addEventListener('submit', function (ev) { ev.preventDefault(); saveCourse(); });
    $('fEvent').addEventListener('submit', function (ev) { ev.preventDefault(); saveEvent(); });
    $('slPrev').addEventListener('click', function () { var i = periodIndex(); if (i < S.periods.length - 1) load(S.periods[i + 1].p); });
    $('slNext').addEventListener('click', function () { var i = periodIndex(); if (i > 0) load(S.periods[i - 1].p); });
    $('slSendBtn').addEventListener('click', send);
    resetForms();
  }
  function periodIndex() { for (var i = 0; i < S.periods.length; i++) if (S.periods[i].p === viewing) return i; return 0; }

  var openTabName = '';
  function openTab(name) {
    openTabName = name;
    document.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tab === name ? 'true' : 'false'); });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; p.querySelector('.sl-err').hidden = true; });
    $('slToast').hidden = true;
    live();
  }

  function resetForms() {
    var f = $('fHours'); f.date.value = S.today; f.date.max = S.today; f.land.value = 0; f.water.value = 0; f.note.value = '';
    var c = $('fCourse'); c.start.value = S.today; c.end.value = S.today; c.start.max = S.today; c.end.max = S.today; c.students.value = 1; c.studentNames.value = ''; courseDefaults();
    $('fEvent').note.value = ''; eventDefaults();
  }
  function courseDefaults() {
    var c = courseById($('cCourse').value);
    $('cFee').value = c && c.fee != null ? c.fee : '';
    $('cNameBox').hidden = !(c && c.id === 'other');
    live();
  }
  function courseById(id) { for (var i = 0; i < S.courses.length; i++) if (S.courses[i].id === id) return S.courses[i]; return null; }
  function eventById(id) { for (var i = 0; i < S.events.length; i++) if (S.events[i].id === id) return S.events[i]; return null; }
  function eventDefaults() {
    var ev = eventById($('eEvent').value), rs = $('eRole'), prev = rs.value;
    rs.innerHTML = '';
    S.roles.forEach(function (r) {
      var p = ev && ev.pay[r.id], o = document.createElement('option'); o.value = r.id;
      o.textContent = r.name + (p && p.fee != null ? ' · ' + money(p.fee) : p && p.perDay != null ? ' · ' + money(p.perDay) + '/day' : '');
      rs.appendChild(o);
    });
    if (prev) rs.value = prev;
    var box = $('eDays'); box.innerHTML = '';
    if (ev) for (var dd = ev.start; dd <= ev.end; dd = addDays(dd, 1)) {
      var l = document.createElement('label');
      l.innerHTML = '<input type="checkbox" value="' + dd + '"' + (dd > S.today ? ' disabled' : '') + ' /><span>' + d8(dd) + '<small>' + dow(dd) + '</small></span>';
      box.appendChild(l);
    }
    live();
  }

  /* ---------- live previews ---------- */
  function live() {
    if (!S) return;
    var h = $('fHours');
    var land = parseFloat(h.land.value) || 0, water = parseFloat(h.water.value) || 0;
    $('hLive').textContent = money(land * S.rules.rateLand + water * S.rules.rateWater);

    var c = $('fCourse'), course = courseById(c.course.value);
    $('cNameBox').hidden = !(course && course.id === 'other');
    var fee = parseFloat(c.fee.value), n = parseInt(c.students.value, 10) || 0;
    if (isNaN(fee)) { $('cLive').textContent = 'Add the fee'; $('cHow').textContent = '50% of the fee'; }
    else {
      $('cLive').textContent = (course && course.estimate ? '≈ ' : '') + money(fee * n * S.rules.commission);
      $('cHow').textContent = course && course.estimate ? '50% of the fee, before AIDA fees and consumables come off' : '50% of the fee · your AIDA fees are yours to cover';
    }

    var ev = eventById($('eEvent').value), role = $('eRole').value, p = ev && ev.pay[role];
    var days = $('eDays').querySelectorAll('input:checked').length;
    $('eRoleNameBox').hidden = role !== 'other';
    if (p && p.fee != null) { $('eLive').textContent = money(p.fee); $('eHow').textContent = 'For the event' + (p.note ? ' (' + p.note + ')' : '') + ' · on top of your $' + S.rules.guarantee + ' minimum'; }
    else if (p && p.perDay != null) { $('eLive').textContent = money(p.perDay * days); $('eHow').textContent = money(p.perDay) + ' a day × ' + days + ' · on top of your minimum'; }
    else { $('eLive').textContent = 'To confirm'; $('eHow').textContent = 'Fee agreed with Harry for this event · paid on top of your minimum'; }
  }

  /* ---------- render ---------- */
  function render() {
    var P = S.period, current = viewing === S.current, editable = current && S.open && !P.approvedAt;
    var i = periodIndex();
    $('slPeriod').textContent = P.label;
    $('slPayday').textContent = 'Payday ' + P.payday + (current ? ' · log by ' + d8(P.end) : '');
    $('slPrev').disabled = i >= S.periods.length - 1;
    $('slNext').disabled = i <= 0;
    $('slEdit').hidden = !editable;

    $('slPayK').textContent = P.approvedAt ? 'Approved pay' : current ? 'Your pay so far' : 'Pay for this period';
    $('slTotal').textContent = money(P.total);
    var chip = $('slStatus');
    chip.className = 'sl-chip' + (P.approvedAt ? ' ok' : P.submittedAt ? ' sent' : '');
    chip.textContent = P.approvedAt ? 'Approved' : P.submittedAt ? 'Sent to Harry' : current ? 'Open' : 'Not sent';

    var g = P.guarantee, e = P.earnings, scale = Math.max(g * 1.3, e * 1.08, 1);
    var bar = $('slBar'); bar.hidden = !g;
    bar.querySelector('i').style.width = Math.min(100, e / scale * 100) + '%';
    bar.querySelector('i').classList.toggle('over', e >= g);
    bar.querySelector('em').style.left = (g / scale * 100) + '%';
    var msg = '';
    if (g && e < g) msg = 'You’ve earned ' + money(e) + (S.me.hourly ? ' from hours and courses' : ' in commission') + '. Your $' + g + ' minimum covers you this month' + (e > 0 ? ': pass $' + g + ' and every dollar is yours.' : '.');
    else if (g) msg = 'You’ve earned ' + money(e) + ', ' + money(e - g) + ' above the $' + g + ' minimum. All of it is paid.';
    if (P.events) msg += ' Plus ' + money(P.events) + ' event pay on top.';
    if (P.tbc) msg += ' ' + P.tbc + ' item' + (P.tbc > 1 ? 's' : '') + ' still to be confirmed by Harry.';
    $('slMsg').textContent = msg;

    var b = '';
    if (S.me.hourly) {
      b += '<div><span>On land</span><b>' + money(P.landPay) + '</b><small>' + P.land + ' h</small></div>';
      b += '<div><span>In the water</span><b>' + money(P.waterPay) + '</b><small>' + P.water + ' h</small></div>';
    }
    b += '<div><span>Courses</span><b>' + (P.estimate ? '≈ ' : '') + money(P.commission) + '</b><small>' + P.courses + ' course' + (P.courses === 1 ? '' : 's') + ' · ' + P.students + ' student' + (P.students === 1 ? '' : 's') + '</small></div>';
    b += '<div><span>Events</span><b>' + money(P.events) + '</b><small>' + (P.tbc ? 'some to confirm' : 'on top of the minimum') + '</small></div>';
    if (P.topUp > 0) b += '<div class="wide"><span>$' + g + ' minimum top-up</span><b>+' + money(P.topUp) + '</b></div>';
    $('slBreak').innerHTML = b;

    // list
    var list = $('slList'); list.innerHTML = '';
    $('slCount').textContent = P.entries.length ? P.entries.length + ' entr' + (P.entries.length === 1 ? 'y' : 'ies') : '';
    if (!P.entries.length) list.innerHTML = '<div class="sl-empty">' + (editable ? 'Nothing logged yet. Tap ' + (S.me.hourly ? 'Hours, Course or Event' : 'Course or Event') + ' above.' : 'Nothing logged in this period.') + '</div>';
    P.entries.forEach(function (x) { list.appendChild(item(x, editable)); });

    // send box
    var sb = $('slSend'), sm = $('slSendMsg'), btn = $('slSendBtn');
    sb.hidden = !P.entries.length && !P.approvedAt;
    btn.hidden = !!P.approvedAt || !current;
    btn.disabled = !!P.submittedAt;
    btn.textContent = P.submittedAt ? 'Sent' : 'Send my log to Harry';
    if (P.approvedAt) sm.textContent = 'Harry approved this period. ' + money(P.total) + ' is paid on ' + P.payday + '.';
    else if (P.submittedAt) sm.textContent = 'Sent to Harry. If you add or remove anything, send it again. Payday ' + P.payday + '.';
    else if (current) sm.textContent = 'When the month is complete, send it to Harry: by the end of ' + d8(P.end) + ' for payday ' + P.payday + '. Anything logged after the 14th moves to the next payday.';
    else sm.textContent = 'This period has closed.';

    var r = S.me.hourly ? money(S.rules.rateLand) + '/h on land · ' + money(S.rules.rateWater) + '/h in the water · ' : '';
    $('slRules').textContent = 'Your agreement: ' + r + '50% of the fee for courses you teach (you cover your own AIDA fees) · paid the higher of $' + S.rules.guarantee + ' or your earnings each month · event pay on top · log by the 14th, paid on the 15th.';
  }

  var ICON = {
    hours: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    course: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l9-4 9 4-9 4-9-4z"/><path d="M7 10v5c0 1.5 2.5 3 5 3s5-1.5 5-3v-5"/></svg>',
    event: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/></svg>',
  };
  function item(x, editable) {
    var el = document.createElement('div'); el.className = 'sl-item';
    var title = '', sub = '';
    if (x.type === 'hours') {
      title = dow(x.date) + ' ' + d8(x.date);
      sub = [x.land ? x.land + ' h on land' : '', x.water ? x.water + ' h in the water' : ''].filter(Boolean).join(' · ') + (x.note ? ' · ' + esc(x.note) : '');
    } else if (x.type === 'course') {
      title = esc(x.name);
      var fee = x.override != null ? x.override : x.fee;
      sub = d8(x.start) + (x.end !== x.start ? '–' + d8(x.end) : '') + ' · ' + x.students + ' student' + (x.students > 1 ? 's' : '') + (fee != null ? ' × ' + money(fee) : '') + (x.studentNames ? ' · ' + esc(x.studentNames) : '');
    } else {
      title = esc(x.roleName) + ' · ' + esc(x.name.replace(/ \(.*\)$/, ''));
      sub = x.days.length + ' day' + (x.days.length > 1 ? 's' : '') + ': ' + dayRanges(x.days);
    }
    if (x.rolledFrom) sub += ' · logged late, moved to this payday';
    var amt = x.tbc ? '<b>To confirm</b>' : '<b>' + (x.estimate ? '≈ ' : '') + money(x.amount) + '</b>';
    el.innerHTML = '<span class="sl-ic ' + x.type + '">' + ICON[x.type] + '</span><div><b>' + title + '</b><small>' + sub + '</small></div>' +
      '<div class="sl-amt">' + amt + (x.override != null ? '<small>set by Harry</small>' : '') + (editable ? '<button type="button">Remove</button>' : '') + '</div>';
    if (editable) {
      var btn = el.querySelector('button'), armed = null;
      btn.addEventListener('click', function () {
        if (!armed) { btn.textContent = 'Tap to confirm'; armed = setTimeout(function () { armed = null; btn.textContent = 'Remove'; }, 3000); return; }
        clearTimeout(armed); btn.disabled = true; btn.textContent = 'Removing…';
        call('POST', '/api/delete', { p: viewing, id: x.id }).then(function (j) {
          if (!j.ok) { btn.disabled = false; btn.textContent = 'Remove'; return toast(j.error, true); }
          S.period = j.period; render();
        });
      });
    }
    return el;
  }

  /* ---------- save ---------- */
  function post(form, body, label) {
    var err = form.querySelector('.sl-err'), btn = form.querySelector('.sl-save');
    err.hidden = true; btn.disabled = true; var t = btn.textContent; btn.textContent = 'Saving…';
    call('POST', '/api/entry', body).then(function (j) {
      btn.disabled = false; btn.textContent = t;
      if (!j.ok) { err.textContent = j.error || 'Could not save.'; err.hidden = false; return; }
      if (j.p === viewing) { S.period = j.period; }
      openTab(''); resetForms(); render();
      toast(label + ' saved.' + (j.note ? ' ' + j.note : ''));
    }).catch(function () { btn.disabled = false; btn.textContent = t; err.textContent = 'No connection. Nothing was saved: try again.'; err.hidden = false; });
  }
  function toast(msg, bad) {
    var el = $('slToast'); el.textContent = msg; el.hidden = false;
    el.style.background = bad ? '#fbefef' : ''; el.style.color = bad ? '#9a2b2b' : '';
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 6000);
  }
  function saveHours() {
    var f = $('fHours');
    post(f, { type: 'hours', date: f.date.value, land: parseFloat(f.land.value) || 0, water: parseFloat(f.water.value) || 0, note: f.note.value }, 'Hours');
  }
  function saveCourse() {
    var f = $('fCourse');
    post(f, { type: 'course', course: f.course.value, name: f.name.value, start: f.start.value, end: f.end.value, students: parseInt(f.students.value, 10), fee: f.fee.value === '' ? '' : parseFloat(f.fee.value), studentNames: f.studentNames.value }, 'Course');
  }
  function saveEvent() {
    var f = $('fEvent'), days = [];
    $('eDays').querySelectorAll('input:checked').forEach(function (c) { days.push(c.value); });
    post(f, { type: 'event', event: f.event.value, role: f.role.value, roleName: f.roleName.value, days: days, note: f.note.value }, 'Event');
  }
  function send() {
    var btn = $('slSendBtn'); btn.disabled = true; btn.textContent = 'Sending…';
    call('POST', '/api/submit', { p: viewing }).then(function (j) {
      if (!j.ok) { btn.disabled = false; btn.textContent = 'Send my log to Harry'; return toast(j.error, true); }
      S.period = j.period; render(); toast('Sent to Harry.');
    });
  }

  load();
})();
