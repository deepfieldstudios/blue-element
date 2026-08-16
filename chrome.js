/* ============================================================
   BLUE ELEMENT — shared chrome + behaviour (v2.0)
   Injects the header, mobile drawer and footer into every page
   from one source of truth, sets the active nav state from
   <body data-page="…">, then wires sticky header, mobile menu,
   scroll reveals and gentle hero parallax.
   ============================================================ */
(function () {
  var docEl = document.documentElement;
  var body = document.body;
  var current = body.getAttribute('data-page') || '';
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var LOGO = 'assets/logo/be_logo_darkblue_white.png';
  var MAIL = 'blueelementfreediving@gmail.com';

  // ---- Navigation model (single source of truth) ----
  var NAV = [
    { id: 'freedive', label: 'Freedive With Us', href: 'courses.html', pages: ['courses', 'training', 'camps', 'calendar'], items: [
      { t: 'Courses', s: 'AIDA & Molchanovs · to instructor', href: 'courses.html' },
      { t: 'Training', s: 'Autonomous & elite · to 90m+', href: 'training.html' },
      { t: 'Private Coaching & Camps', s: 'Depth camps · from $725 a week', href: 'camps.html' },
      { t: 'Calendar', s: "25/26 season · what's on, when", href: 'calendar.html' }
    ]},
    { id: 'competition', label: 'Competitions', href: 'competition.html', pages: ['competition'], items: [
      { t: 'Annual Competition', s: 'Nov 8–17, 2026 · Soufrière Bay', href: 'competition.html' },
      { t: 'Results & Records', s: 'National & world records set here', href: 'competition.html#results' },
      { t: 'Past Events', s: 'A decade of deep diving', href: 'competition.html#past' },
      { t: 'Calendar', s: "25/26 season · what's on, when", href: 'calendar.html' }
    ]},
    { id: 'athletes', label: 'Athletes', href: 'athletes.html', pages: ['athletes', 'sponsorship'], items: [
      { t: 'Harry McCahill', s: 'Co-founder · UK · CNF #1', href: 'athlete-harry.html' },
      { t: 'Arron Walker', s: 'Depth · UK · to 90m', href: 'athlete-arron.html' },
      { t: 'Natalie Bruce', s: 'Pool & Depth · USA · World #7', href: 'athlete-natalie.html' },
      { t: 'Kathleen Greubel', s: 'Depth · Germany · NR holder', href: 'athlete-kathleen.html' },
      { t: 'Sponsor the Team', s: '2026 partnership prospectus', href: 'sponsorship.html' }
    ]},
    { id: 'about', label: 'About', href: 'about.html', pages: ['about'], items: [
      { t: 'Our Story', s: 'Why Blue Element exists', href: 'about.html' },
      { t: 'Meet the Team', s: 'Learn from record holders', href: 'about.html#team' },
      { t: 'Platform & Conditions', s: 'Built for performance & safety', href: 'about.html#platform' }
    ]},
    { id: 'dominica', label: 'Dominica', href: 'dominica.html', pages: ['dominica'], items: [
      { t: 'Discover Dominica', s: "The Caribbean's Nature Island", href: 'dominica.html' },
      { t: 'Travel & Logistics', s: 'Getting here, stay, transport', href: 'dominica.html#travel' }
    ]},
    { id: 'gallery', label: 'Gallery', href: 'gallery.html', pages: ['gallery'], items: null }
  ];

  function isActive(group) { return group.pages.indexOf(current) !== -1; }

  // ---- Build desktop nav ----
  var navHtml = NAV.map(function (g) {
    var active = isActive(g) ? ' active' : '';
    if (!g.items) {
      return '<div class="nav-item"><a class="nav-link' + active + '" href="' + g.href + '">' + g.label + '</a></div>';
    }
    var drop = g.items.map(function (i) {
      return '<a href="' + i.href + '"><span class="d-title">' + i.t + '</span><span class="d-sub">' + i.s + '</span></a>';
    }).join('');
    return '<div class="nav-item"><a class="nav-link' + active + '" href="' + g.href + '">' + g.label +
           ' <i class="caret"></i></a><div class="dropdown">' + drop + '</div></div>';
  }).join('');

  var headerHtml =
    '<div class="header-inner">' +
      '<a class="brand" href="index.html" aria-label="Blue Element — home"><img src="' + LOGO + '" alt="Blue Element Freediving" /></a>' +
      '<nav class="nav" aria-label="Primary">' + navHtml + '</nav>' +
      '<div class="header-cta">' +
        '<a class="btn btn-teal btn-sm" href="book.html">Book Now</a>' +
        '<button class="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div>';

  var header = document.createElement('header');
  header.className = 'site-header';
  header.id = 'header';
  header.innerHTML = headerHtml;

  // ---- Build mobile drawer ----
  var mobileHtml = NAV.map(function (g) {
    if (!g.items) return '<div class="m-group"><a class="m-head m-head-link" href="' + g.href + '">' + g.label + '</a></div>';
    var links = g.items.map(function (i) { return '<a class="m-link" href="' + i.href + '">' + i.t + '</a>'; }).join('');
    return '<div class="m-group"><div class="m-head">' + g.label + '</div>' + links + '</div>';
  }).join('');
  mobileHtml += '<a class="btn btn-teal btn-lg" href="book.html" style="margin-top:28px;width:100%;">Book Now</a>';

  var drawer = document.createElement('div');
  drawer.className = 'mobile-nav';
  drawer.id = 'mobileNav';
  drawer.innerHTML = mobileHtml;

  // ---- Build footer ----
  var footerHtml =
    '<div class="container-wide"><div class="footer-top">' +
      '<div class="footer-brand"><img src="' + LOGO + '" alt="Blue Element Freediving" />' +
        '<p>World-class freediving courses, training and competition in Soufrière, Dominica — the Caribbean\u2019s Nature Island.</p>' +
        '<p class="three">No waves. No current. No depth limit.</p></div>' +
      '<div class="footer-col"><h4>Freedive</h4>' +
        '<a href="courses.html">Courses</a><a href="training.html">Training</a><a href="camps.html">Private Coaching &amp; Camps</a><a href="about.html#platform">Platform &amp; Conditions</a></div>' +
      '<div class="footer-col"><h4>Competition</h4>' +
        '<a href="competition.html">Annual Competition</a><a href="athletes.html">Athletes</a><a href="sponsorship.html">Sponsor the Team</a><a href="gallery.html">Gallery &amp; Media</a></div>' +
      '<div class="footer-col"><h4>Visit</h4>' +
        '<a href="dominica.html">Discover Dominica</a><a href="dominica.html#travel">Travel &amp; Logistics</a><a href="about.html">About Us</a><a href="mailto:' + MAIL + '">Book / Contact</a></div>' +
    '</div>' +
    '<div class="footer-bottom">' +
      '<span>© 2026 Blue Element Freediving · Soufrière, Dominica · <a href="mailto:' + MAIL + '" style="color:var(--be-surface-teal);">' + MAIL + '</a></span>' +
      '<div class="socials">' +
        '<a href="https://instagram.com/blueelementfreediving" aria-label="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.1 3.3c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-3.3s0-2.1-.1-3.3c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4-1.2-.1-1.6-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0z"/></svg></a>' +
        '<a href="https://facebook.com/blueelementfreediving" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.3-1.5 1.6-1.5h1.6V3.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8.2V13h2.4v8h2.9z"/></svg></a>' +
        '<a href="https://youtube.com/@blueelementfreediving" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M23.5 7.2c-.3-1-1-1.8-2-2.1C19.7 4.6 12 4.6 12 4.6s-7.7 0-9.5.5c-1 .3-1.8 1.1-2 2.1C0 9 0 12 0 12s0 3 .5 4.8c.3 1 1 1.8 2 2.1 1.8.5 9.5.5 9.5.5s7.7 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.8.5-4.8.5-4.8s0-3-.5-4.8zM9.6 15.4V8.6l6.4 3.4-6.4 3.4z"/></svg></a>' +
      '</div>' +
    '</div></div>';

  var footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = footerHtml;

  // ---- Mount ----
  body.insertBefore(drawer, body.firstChild);
  body.insertBefore(header, body.firstChild);
  body.appendChild(footer);

  // ---- Sticky header state ----
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 40); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Mobile menu ----
  var toggle = document.getElementById('menuToggle');
  toggle.addEventListener('click', function () {
    var open = drawer.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      drawer.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ---- Scroll reveal ----
  var reveals = document.querySelectorAll('.reveal');
  if (!prefersReduced && 'IntersectionObserver' in window) {
    docEl.classList.add('anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 2500);
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  // ---- Gentle hero parallax ----
  var heroImg = document.getElementById('heroImg');
  if (heroImg && !prefersReduced) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        heroImg.style.transform = 'translateY(' + (y * 0.16) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }
})();
