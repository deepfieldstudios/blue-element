/* ============================================================
   BLUE ELEMENT — subpage interactions
   Accordion (FAQ) + gallery filter. Loaded after chrome.js.
   ============================================================ */
(function () {
  // ---- Accordion ----
  document.querySelectorAll('.acc-item .acc-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.acc-item');
      var ans = item.querySelector('.acc-a');
      var isOpen = item.classList.contains('open');
      // Close siblings in the same accordion for a clean single-open feel
      var acc = item.closest('.acc');
      if (acc) {
        acc.querySelectorAll('.acc-item.open').forEach(function (other) {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.acc-a').style.maxHeight = null;
          }
        });
      }
      if (isOpen) {
        item.classList.remove('open');
        ans.style.maxHeight = null;
      } else {
        item.classList.add('open');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  // ---- Gallery filter ----
  var chips = document.querySelectorAll('.gal-chip');
  var items = document.querySelectorAll('.gal-grid .g-item');
  if (chips.length && items.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var f = chip.getAttribute('data-filter');
        items.forEach(function (it) {
          var cats = (it.getAttribute('data-cat') || '').split(' ');
          var show = f === 'all' || cats.indexOf(f) !== -1;
          it.classList.toggle('hide', !show);
        });
      });
    });
  }
  // ---- Official top countdown ----
  var clock = document.querySelector('.topclock');
  if (clock) {
    var target = new Date(clock.getAttribute('data-top')).getTime();
    var cells = {
      d: clock.querySelector('[data-u="d"]'),
      h: clock.querySelector('[data-u="h"]'),
      m: clock.querySelector('[data-u="m"]'),
      s: clock.querySelector('[data-u="s"]')
    };
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var setCell = function (cell, val) {
      if (cell.textContent === val) return;
      cell.textContent = val;
      cell.classList.remove('tick');
      void cell.offsetWidth; // restart animation
      cell.classList.add('tick');
    };
    var render = function () {
      var diff = target - Date.now();
      if (diff <= 0) {
        clock.querySelector('.tc-label').lastChild.textContent = 'Official top — divers are up!';
        setCell(cells.d, '00'); setCell(cells.h, '00'); setCell(cells.m, '00'); setCell(cells.s, '00');
        clearInterval(timer);
        return;
      }
      var sec = Math.floor(diff / 1000);
      setCell(cells.d, pad(Math.floor(sec / 86400)));
      setCell(cells.h, pad(Math.floor(sec / 3600) % 24));
      setCell(cells.m, pad(Math.floor(sec / 60) % 60));
      setCell(cells.s, pad(sec % 60));
    };
    render();
    var timer = setInterval(render, 1000);
  }
})();
