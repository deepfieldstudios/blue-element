/* ============================================================
   BLUE ELEMENT — Live-stream headshot (headshot.html)

   Unlisted page (noindex, not in the nav or sitemap). Shared with
   athletes in the event chat. Posts one photo to the be-athlete-info
   Worker (/api/headshot), which stores it in R2; the team sees them
   all at <worker>/admin/headshots and passes them to Diveye.

   Very large photos are shrunk in the browser (longest side 2000 px,
   JPEG) before upload, so they go through quickly on island wifi.
   ============================================================ */
(function () {
  var API = 'https://be-athlete-info.deepfieldstudios.workers.dev';
  // Local testing only: headshot.html?api=http://localhost:8787
  try {
    var api = new URLSearchParams(location.search).get('api');
    if (api && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) API = api.replace(/\/$/, '');
  } catch (e) {}
  var ENDPOINT = API + '/api/headshot';

  var MAX = 10 * 1024 * 1024;
  var OK_EXT = /\.(jpe?g|png|webp|heic|heif)$/i;
  var OK_TYPE = /^image\/(jpeg|png|webp|heic|heif)$/i;
  var LONG_EDGE = 2000, SHRINK_OVER = 2400;

  var form = document.getElementById('hsForm');
  if (!form) return;
  var card = document.getElementById('hsCard');
  var errBox = document.getElementById('hsErrors');
  var submitBtn = document.getElementById('hsSubmit');
  var progress = document.getElementById('hsProgress');
  var drop = document.getElementById('hDrop');
  var input = document.getElementById('hPhoto');
  var thumb = document.getElementById('hThumb');
  var thumbIcon = thumb.innerHTML;
  var title = document.getElementById('hDropTitle');
  var sub = document.getElementById('hDropSub');
  var agreeWrap = document.getElementById('hAgreeWrap');

  var photo = null;      // Blob or File to send
  var photoName = '';
  var previewUrl = '';
  var sending = false;

  /* ---------- photo ---------- */
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
  input.addEventListener('change', function () { pick(input.files && input.files[0]); });

  function sizeText(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }

  function reset(msg) {
    photo = null; photoName = '';
    drop.classList.remove('has-file');
    thumb.innerHTML = thumbIcon;
    title.textContent = 'Choose a photo';
    sub.textContent = msg || 'or drag it here';
  }

  function pick(f) {
    clearBad(drop);
    if (!f) return reset();
    if (!OK_TYPE.test(f.type || '') && !OK_EXT.test(f.name || '')) { input.value = ''; return reset('That file isn’t a photo. Use a JPG, PNG or HEIC.'); }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    photo = f; photoName = f.name || 'headshot.jpg';
    drop.classList.add('has-file');
    title.textContent = photoName;
    sub.textContent = sizeText(f.size) + ' · tap to change';
    var img = new Image();
    img.onload = function () {
      thumb.innerHTML = ''; thumb.appendChild(img);
      if (img.naturalWidth > SHRINK_OVER || img.naturalHeight > SHRINK_OVER || f.size > MAX) shrink(img, f);
    };
    img.onerror = function () {
      // the browser can't preview it (e.g. HEIC outside Safari): send the original
      thumb.innerHTML = thumbIcon;
      if (f.size > MAX) { photo = null; reset('That photo is over 10 MB. Try a smaller copy.'); }
    };
    img.alt = 'Your photo';
    img.src = previewUrl;
  }

  function shrink(img, f) {
    var k = LONG_EDGE / Math.max(img.naturalWidth, img.naturalHeight);
    var c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(function (b) {
      if (!b || photo !== f) return;
      photo = b;
      photoName = (f.name || 'headshot').replace(/\.[^.]+$/, '') + '.jpg';
      sub.textContent = sizeText(b.size) + ' · tap to change';
    }, 'image/jpeg', 0.9);
  }

  /* ---------- validation ---------- */
  function markBad(node) { node.classList.add('is-bad'); }
  function clearBad(node) { node.classList.remove('is-bad'); }
  [form.elements.name, form.elements.email].forEach(function (i) { i.addEventListener('input', function () { clearBad(i.closest('.ci-field')); }); });
  form.elements.agree_headshot.addEventListener('change', function () { clearBad(agreeWrap); });

  function check() {
    var problems = [];
    var name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    if (name.length < 2) { problems.push('Your full name'); markBad(form.elements.name.closest('.ci-field')); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { problems.push('A valid email address'); markBad(form.elements.email.closest('.ci-field')); }
    if (!photo) { problems.push('Your photo'); markBad(drop); }
    if (!form.elements.agree_headshot.checked) { problems.push('Tick the box to agree to the photo being shown'); markBad(agreeWrap); }
    return problems;
  }

  function showErrors(list, intro) {
    errBox.innerHTML = '';
    var p = document.createElement('div'); p.textContent = intro || 'Still needed:';
    errBox.appendChild(p);
    var ul = document.createElement('ul');
    list.forEach(function (m) { var li = document.createElement('li'); li.textContent = m; ul.appendChild(li); });
    errBox.appendChild(ul);
    errBox.hidden = false;
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;
    errBox.hidden = true;
    var problems = check();
    if (problems.length) { showErrors(problems); errBox.scrollIntoView({ block: 'center' }); return; }
    var fd = new FormData();
    fd.append('name', form.elements.name.value.trim());
    fd.append('email', form.elements.email.value.trim());
    fd.append('agree_headshot', 'yes');
    fd.append('company', form.elements.company.value);
    fd.append('photo', photo, photoName);
    upload(fd);
  });

  function upload(fd) {
    sending = true;
    submitBtn.disabled = true; submitBtn.textContent = 'Uploading…';
    progress.hidden = false; var bar = progress.querySelector('i'); bar.style.width = '2%';
    var xhr = new XMLHttpRequest();
    xhr.open('POST', ENDPOINT);
    xhr.upload.onprogress = function (e) { if (e.lengthComputable) bar.style.width = Math.max(2, Math.round(e.loaded / e.total * 100)) + '%'; };
    xhr.onload = function () {
      var res = {}; try { res = JSON.parse(xhr.responseText); } catch (e) {}
      if (xhr.status === 200 && res.ok) return done();
      fail(res.error || 'Something went wrong on our side (' + xhr.status + ').');
    };
    xhr.onerror = function () { fail('The upload didn’t go through. Check your connection and press Upload photo again.'); };
    xhr.send(fd);
  }

  function fail(msg) {
    sending = false; submitBtn.disabled = false; submitBtn.textContent = 'Upload photo'; progress.hidden = true;
    showErrors([msg + ' If it keeps happening, WhatsApp us on +44 7554 739347.'], 'That didn’t work:');
    errBox.scrollIntoView({ block: 'center' });
  }

  function done() {
    var img = document.getElementById('hsDoneImg');
    if (thumb.querySelector('img') && previewUrl) { img.src = previewUrl; img.hidden = false; }
    card.classList.add('is-done');
    card.scrollIntoView({ block: 'start' });
  }
})();
