/* Coin Zones on Cloudflare: read-only stand-in for the Claude page database.
   The board itself arrives fully built in data.json (built on GitHub), so the "board" collection is empty here.
   The P&L paper test reads collection "pnl" from pnl.json. Nothing can be written from the page.
   TradingView is not reachable from this page, so the in-page TradingView buttons stay hidden. */
(function () {
  'use strict';
  var pnl = null;
  function getPnl() { if (!pnl) pnl = fetch('pnl.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); return pnl; }
  var RO = new Error('This board is read-only; it is rebuilt on GitHub.');
  var DB = {
    collection: function (name) {
      return { get: function () {
        if (name !== 'pnl') return Promise.resolve({ docs: [] });
        return getPnl().then(function (all) { return { docs: Object.keys(all).map(function (id) { return { id: id, data: function () { return JSON.parse(JSON.stringify(all[id])); } }; }) }; });
      } };
    },
    doc: function () { return { set: function () { return Promise.reject(RO); }, get: function () { return Promise.reject(RO); } }; }
  };
  window.claude = { use: function (k) { return Promise.resolve(k === 'db' ? DB : null); } };
})();
