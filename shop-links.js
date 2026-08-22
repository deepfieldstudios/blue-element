/* ============================================================
   BLUE ELEMENT — Stripe Payment Link wiring (single source of truth)
   Paste each product's Stripe Payment Link URL below. Any element with
   data-buy="<id>" becomes a live buy/checkout link pointing at it.
   Optional data-fallback="<url>" sets where the element goes until its
   Stripe link exists (otherwise it falls back to an enquiry email).
   ============================================================ */
window.STRIPE_LINKS = {
  'course-try': '',
  'course-freediver': '',
  'course-advanced': '',
  'course-master': '',
  'course-vb-safety': '',
  'course-nolimits': '',
  'course-instructor': '',
  'eq-clinic': '',
  'coaching-private': '',
  'camp-week': '',
  'retreat-matt-hill': '',
  'comp-nov-aida': 'https://book.stripe.com/14A5kC50Pa2Z39KdVkdby00',
  'comp-nov-cmas': '',
  'comp-mar-aida': '',
  'comp-may-open': '',
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
