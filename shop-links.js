/* ============================================================
   BLUE ELEMENT — Stripe Payment Link wiring (single source of truth)
   Paste each product's Stripe Payment Link URL below. Any element with
   data-buy="<id>" becomes a live buy/checkout link pointing at it.
   Optional data-fallback="<url>" sets where the element goes until its
   Stripe link exists (otherwise it falls back to an enquiry email).
   ============================================================ */
window.STRIPE_LINKS = {
  'course-try': 'https://book.stripe.com/14A3cudxl7UR11C7wWdby04',
  'course-freediver': 'https://buy.stripe.com/8x23cueBp1wt39K04udby05',
  'course-advanced': 'https://buy.stripe.com/eVqcN48d10sp4dOaJ8dby06',
  'course-master': 'https://buy.stripe.com/fZuaEW2SHb735hS6sSdby07',
  'course-vb-safety': 'https://buy.stripe.com/8x2fZgeBp2Ax6lW8B0dby08',
  'course-nolimits': 'https://buy.stripe.com/aFacN4gJx4IF8u4eZodby09',
  'course-instructor': '',
  'eq-clinic': '',
  'coaching-private': '',
  'camp-week': '',
  'retreat-matt-hill': '',
  'comp-nov-aida': 'https://book.stripe.com/14A5kC50Pa2Z39KdVkdby00',
  'comp-nov-cmas': 'https://book.stripe.com/dRm6oGcthejffWw6sSdby01',
  'comp-mar-aida': 'https://book.stripe.com/5kQ6oG9h5grn6lWg3sdby02',
  'comp-may-open': 'https://book.stripe.com/eVq6oG0Kz8YVh0AcRgdby03',
  'train-auto-day': '',
  'train-auto-week': '',
  'train-auto-month': '',
  'train-elite-day': '',
  'train-elite-month': ''
};
(function () {
  var MAIL = 'blueelementfreediving@gmail.com';
  var links = window.STRIPE_LINKS || {};
  document.querySelectorAll('[data-buy]').forEach(function (el) {
    var id = el.getAttribute('data-buy');
    var url = links[id];
    if (url) {
      el.setAttribute('href', url);
      el.setAttribute('rel', 'noopener');
      el.classList.remove('is-enquire');
    } else if (el.getAttribute('data-fallback')) {
      el.setAttribute('href', el.getAttribute('data-fallback'));
    } else {
      el.setAttribute('href', 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Booking enquiry — ' + id));
      el.classList.add('is-enquire');
      var lbl = el.querySelector('.buy-label');
      if (lbl) lbl.textContent = 'Enquire';
    }
  });
})();
