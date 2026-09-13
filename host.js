/* ============================================================
   BLUE ELEMENT — "Host with us" package builder
   Renders the offerings matrix, keeps a live total, and on submit
   sends an itemised enquiry (email to BE, cc the instructor) plus a
   WhatsApp option. No backend — the total is a quote; BE follows up
   with a Stripe payment link.

   UPGRADE PATH: when the Cloudflare Worker (Phase 2) exists, point the
   submit at it to create a Stripe Checkout for the exact line items.
   Prices mirror the BE Events Price List (USD).
   ============================================================ */
(function () {
  var ENDPOINT = '';                          // optional FormSubmit/Formspree URL to also POST the enquiry
  var TO = 'blueelementfreediving@gmail.com';
  var WA = '447554739347';

  var ITEMS = [
    { id: 'platform', name: 'Platform + Facility', tag: 'per person · per week', unit: 'pp', tiered: true, price: 150, price6: 125, qlbl: 'weeks', qty: 1 },
    { id: 'ai-half',  name: 'Assistant Instructor — half day (3 hrs)', tag: '1 per 4 guests', unit: 'flat', price: 100, qlbl: 'half-days', qty: 0 },
    { id: 'ai-full',  name: 'Assistant Instructor — full day (6 hrs)', unit: 'flat', price: 200, qlbl: 'days', qty: 0 },
    { id: 'photo1',   name: 'Individual photoshoot 1:1', unit: 'flat', price: 180, qlbl: 'shoots', qty: 0 },
    { id: 'pvweek',   name: 'Group photo + video — 1 week', unit: 'flat', price: 400, qlbl: 'pkgs', qty: 0 },
    { id: 'pvday',    name: 'Group photo + video — 1 day', unit: 'flat', price: 175, qlbl: 'days', qty: 0 },
    { id: 'yogagrp',  name: 'Group yoga session (60–75 min)', tag: 'per person', unit: 'pp', price: 12, qlbl: 'sessions', qty: 0 },
    { id: 'yogapriv', name: 'Private yoga + breathwork', tag: 'per person', unit: 'pp', price: 40, qlbl: 'sessions', qty: 0 },
    { id: 'coach',    name: '1:1 Private Freediving coaching', tag: 'per person', unit: 'pp', price: 150, qlbl: 'sessions', qty: 0 },
    { id: 'snorkel',  name: 'Guided snorkeling trip (incl. transport)', tag: 'per person', unit: 'pp', price: 35, qlbl: 'trips', qty: 0 },
    { id: 'waterfall',name: 'Half-day waterfall excursion', tag: 'per person', unit: 'pp', price: 55, qlbl: 'trips', qty: 0 },
    { id: 'dinner',   name: 'Catered group sunset dinner (excl. alcohol)', tag: 'per person', unit: 'pp', price: 35, qlbl: 'dinners', qty: 0 },
    { id: 'gear',     name: 'One-week gear rental', unit: 'flat', price: 55, qlbl: 'weeks', qty: 0 }
  ];

  var menu = document.getElementById('hm-menu');
  if (!menu) return;
  var guests = 6;
  var guestsEl = document.getElementById('guests');
  var msg = document.getElementById('hm-msg');
  var okText = msg ? msg.textContent : '';

  function priceOf(it) { return it.tiered ? (guests >= 6 ? it.price6 : it.price) : it.price; }
  function lineOf(it) { return it.unit === 'pp' ? priceOf(it) * guests * it.qty : priceOf(it) * it.qty; }
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  function unitText(it) { return it.unit === 'pp' ? money(priceOf(it)) + ' pp' : money(priceOf(it)); }
  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  ITEMS.forEach(function (it) {
    var row = document.createElement('div');
    row.className = 'hm-row';
    row.innerHTML =
      '<div class="hm-name">' + it.name + (it.tag ? ' <span class="hm-tag">' + it.tag + '</span>' : '') + '</div>' +
      '<div class="hm-unit" data-unit>' + unitText(it) + '</div>' +
      '<div class="stepper"><button type="button" data-step="-1" aria-label="Less">−</button>' +
      '<span class="q" data-q>' + it.qty + '</span>' +
      '<button type="button" data-step="1" aria-label="More">+</button><span class="qlbl">' + it.qlbl + '</span></div>' +
      '<div class="hm-line zero" data-line>—</div>';
    menu.appendChild(row);
    it._row = row;
    row.querySelectorAll('[data-step]').forEach(function (b) {
      b.addEventListener('click', function () {
        it.qty = Math.max(0, it.qty + parseInt(b.getAttribute('data-step'), 10));
        render();
      });
    });
  });

  function render() {
    if (guestsEl) guestsEl.textContent = guests;
    var total = 0;
    ITEMS.forEach(function (it) {
      var line = lineOf(it); total += line;
      it._row.querySelector('[data-q]').textContent = it.qty;
      it._row.querySelector('[data-unit]').textContent = unitText(it);
      var le = it._row.querySelector('[data-line]');
      if (it.qty > 0) { le.textContent = money(line); le.classList.remove('zero'); it._row.classList.add('on'); }
      else { le.textContent = '—'; le.classList.add('zero'); it._row.classList.remove('on'); }
    });
    document.getElementById('hm-total').innerHTML = money(total) + '<small>USD</small>';
    var wa = document.getElementById('hm-whatsapp');
    if (wa) wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(summary(total));
    return total;
  }

  function summary(total) {
    var L = ['Blue Element — Host with us enquiry', '', 'Group size: ' + guests + ' guests'];
    var nm = val('hm-name'), em = val('hm-email'), org = val('hm-org'), dt = val('hm-dates'), notes = val('hm-notes');
    if (nm) L.push('Name: ' + nm);
    if (org) L.push('School / brand: ' + org);
    if (em) L.push('Email: ' + em);
    if (dt) L.push('Preferred dates: ' + dt);
    L.push('', 'Selected package:');
    ITEMS.forEach(function (it) {
      if (it.qty > 0) {
        var per = it.unit === 'pp'
          ? money(priceOf(it)) + ' × ' + guests + ' guests × ' + it.qty + ' ' + it.qlbl
          : money(priceOf(it)) + ' × ' + it.qty + ' ' + it.qlbl;
        L.push('• ' + it.name + '  —  ' + per + ' = ' + money(lineOf(it)));
      }
    });
    L.push('', 'ESTIMATED TOTAL: ' + money(total) + ' USD');
    if (notes) L.push('', 'Notes: ' + notes);
    L.push('', '(Sent from the Host with us builder — blueelementstore.com/host-with-us.html)');
    return L.join('\n');
  }

  document.querySelectorAll('[data-guests]').forEach(function (b) {
    b.addEventListener('click', function () {
      guests = Math.max(1, guests + parseInt(b.getAttribute('data-guests'), 10));
      render();
    });
  });

  var submit = document.getElementById('hm-submit');
  if (submit) submit.addEventListener('click', function () {
    var total = render();
    if (!msg) return;
    if (total <= 0) { msg.textContent = 'Please add at least one item to your package first.'; msg.classList.add('show'); return; }
    var body = summary(total), em = val('hm-email'), nm = val('hm-name');
    if (ENDPOINT) {
      var p = new URLSearchParams(); p.append('email', em); p.append('name', nm); p.append('message', body);
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: p }).catch(function () {});
    }
    var url = 'mailto:' + TO + '?subject=' + encodeURIComponent('Host with us enquiry — ' + (nm || 'instructor')) +
      (em ? '&cc=' + encodeURIComponent(em) : '') + '&body=' + encodeURIComponent(body);
    msg.textContent = okText; msg.classList.add('show');
    window.location.href = url;
  });

  render();
})();
