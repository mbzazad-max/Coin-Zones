/* Public board: show saved-data freshness, never expose a rebuild button. */
(function () {
  'use strict';
  var row = document.querySelector('header .row');
  if (!row) return;
  var pill = document.createElement('span');
  pill.className = 'pill';
  pill.textContent = 'Public · read-only';
  row.appendChild(pill);
  fetch('freshness.json', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw Error('Unavailable'); return r.json(); })
    .then(function (f) {
      var note = document.createElement('div');
      note.className = 'banner';
      note.textContent = 'Saved market data · last board build: ' + (f.generated || 'unknown') +
        '. Updates are published automatically; no live refresh is available on this shared view.';
      var banner = document.getElementById('banner');
      if (banner && banner.parentNode) banner.parentNode.insertBefore(note, banner);
    }).catch(function () {});
})();
