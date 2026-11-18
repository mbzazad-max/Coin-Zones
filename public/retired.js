/* Coin Zones on Cloudflare: paper tests retired (18 Nov 2026, owner's request). Paper trading now lives on the
   Paper-Trade dashboard (/paper-trade/). This removes the "Top 20 P&L" buttons from the original page's navigation and
   sends the old #pnl and #lab addresses to the board, without touching the original page code. The board, the buy
   zones and the 4H structure signals are unchanged. The results so far are kept in archive/paper-tests-2026-11-18/. */
(function () {
  'use strict';
  function tidy() {
    var b = document.querySelectorAll('[data-nav="pnl"]');
    for (var i = 0; i < b.length; i++) b[i].parentNode.removeChild(b[i]);
  }
  function away() {
    var h = decodeURIComponent((location.hash || '').replace('#', ''));
    if (h === 'pnl' || h === 'lab') location.replace('#overview');
  }
  away();
  window.addEventListener('hashchange', away);
  tidy();
  new MutationObserver(tidy).observe(document.body, { childList: true, subtree: true });
})();
