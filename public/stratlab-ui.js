/* Coin Zones on Cloudflare: the Strategy test section (added 16 Nov 2026). Reads stratlab.json (build/stratlab.js)
   and adds a "Strategy test" button to the navigation and its own page at #lab, without touching the original page
   code, the board or the Top 20 P&L test. If stratlab.json is missing, nothing is added. Uses the page's own styles. */
(function () {
  'use strict';
  var D = null, main = document.getElementById('main'), rail = document.getElementById('rail'), strip = document.getElementById('strip'), busy = false;
  if (!main) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var px = function (x) { if (x == null || isNaN(x)) return '-'; var a = Math.abs(x); return a >= 1000 ? x.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a >= 100 ? x.toFixed(1) : a >= 1 ? x.toFixed(3) : x.toPrecision(4); };
  var usd = function (x) { if (x == null || isNaN(x)) return '-'; var a = Math.abs(x); return (x < 0 ? '-' : x > 0 ? '+' : '') + '$' + (a >= 1000 ? a.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a.toFixed(2)); };
  var pc = function (x, d) { return x == null || isNaN(x) ? '-' : (x > 0 ? '+' : '') + (Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('en-US') : x.toFixed(d == null ? 1 : d)) + '%'; };
  var when = function (t) { if (!t) return '-'; var d = new Date(t * 1000); return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  var day = function (t) { return new Date(t * 1000).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }); };
  var kpi = function (lab, val, sub, k) { return '<div><b>' + lab + '</b><span class="' + (k || '') + '">' + val + '</span>' + (sub ? '<div class="note">' + sub + '</div>' : '') + '</div>'; };
  var tone = function (x) { return x > 0 ? 'good' : x < 0 ? 'bad' : ''; };
  var sidePill = function (s) { return s > 0 ? '<span class="pill sup">Long</span>' : s < 0 ? '<span class="pill res">Short</span>' : '<span class="pill warn">Flat</span>'; };
  var isLab = function () { return decodeURIComponent((location.hash || '').replace('#', '')) === 'lab'; };

  function head() {
    var L = D.live, days = D.params.mom / 6, vf = D.params.vfast / 6, vs = D.params.vslow / 6;
    var h = '<div class="card" id="labRoot"><div class="row" style="margin-bottom:8px"><div class="grow"><h2 style="margin:0">Strategy test: ' + esc(D.name) + ' (' + esc(D.id) + ')</h2>'
      + '<div class="note">Paper test, separate from Top 20 P&amp;L &middot; started ' + esc(when(D.start)) + ' &middot; $' + D.size.toLocaleString('en-US') + ' per trade &middot; ' + D.fee + '% fee each side &middot; no leverage &middot; ' + D.order.map(esc).join(', ') + '</div></div>'
      + '<span class="pill warn">Not proven</span></div>';
    h += '<div class="kv">' + kpi('Net so far', usd(L.net), 'closed ' + usd(L.realised) + ' &middot; open ' + usd(L.unrealised), tone(L.net))
      + kpi('Closed trades', String(L.closed), L.wins + ' won &middot; ' + L.losses + ' lost')
      + kpi('Open positions', L.open + ' of ' + D.order.length, 'one per coin at most')
      + kpi('Built', esc(D.generated), 'closed 4H candles only') + '</div>';
    h += '<h3 style="margin-top:14px">The rule (checked when each 4H candle closes)</h3><div class="scroll"><table><tbody>'
      + '<tr><td><span class="pill sup">Long</span></td><td>The market is active <b>and</b> price is higher than ' + days + ' days ago.</td></tr>'
      + '<tr><td><span class="pill res">Short</span></td><td>The market is active <b>and</b> price is lower than ' + days + ' days ago.</td></tr>'
      + '<tr><td><span class="pill warn">Flat</span></td><td>The market is quiet. Any open position is closed.</td></tr>'
      + '<tr><td>Active</td><td>Average volume of the last ' + vf + ' days is above the average of the last ' + vs + ' days.</td></tr>'
      + '<tr><td>Stop loss</td><td>None, and no take profit. A position ends only when the signal changes. A long can flip straight to a short.</td></tr>'
      + '</tbody></table></div>';
    return h + '<p class="note" style="margin:8px 0 0">Orders are filled at the close of the candle that gives the signal. If the rule was already in a position when the test started, the test joined it at that candle\'s close. Shorts need a futures account; the rest of this board is spot only.</p></div>';
  }
  function now() {
    var h = '<div class="card"><h2>Now</h2><div class="scroll"><table><thead><tr><th>Coin</th><th>Signal</th><th>Market</th><th class="r">' + (D.params.mom / 6) + '-day move</th><th>In it since</th><th class="r">Entry</th><th class="r">Price</th><th class="r">Open result</th></tr></thead><tbody>';
    D.order.forEach(function (s) { var c = D.coins[s], op = (c.live.trades || []).filter(function (t) { return t.open; })[0];
      h += '<tr><td><a href="#' + encodeURIComponent(s) + '"><b>' + esc(s) + '</b></a></td><td>' + sidePill(c.signal) + '</td>'
        + '<td style="white-space:nowrap">' + (c.active ? 'Active' : 'Quiet') + ' <span class="note">volume &times;' + (c.vol_ratio == null ? '-' : c.vol_ratio.toFixed(2)) + '</span></td>'
        + '<td class="num r ' + tone(c.mom_ret) + '">' + pc(c.mom_ret) + '</td>'
        + '<td style="white-space:nowrap">' + (op ? esc(when(op.entry_t)) + (op.joined ? ' <span class="note">(joined at start)</span>' : '') : '<span class="note">-</span>') + '</td>'
        + '<td class="num r">' + (op ? px(op.entry) : '-') + '</td><td class="num r">' + px(c.price) + '</td>'
        + '<td class="num r ' + (op ? tone(op.usd) : '') + '">' + (op ? pc(op.ret, 2) + ' <span class="note">' + usd(op.usd) + '</span>' : '-') + '</td></tr>'; });
    return h + '</tbody></table></div><p class="note" style="margin:8px 0 0">Price is the last closed 4H candle (' + esc(when(D.coins[D.order[0]].last_close)) + '). "Volume &times;" is recent volume against its longer average: above 1 means active.</p></div>';
  }
  function tradesCard() {
    var rows = [];
    D.order.forEach(function (s) { (D.coins[s].live.trades || []).forEach(function (t) { rows.push({ s: s, t: t }); }); });
    rows.sort(function (a, b) { return b.t.entry_t - a.t.entry_t; });
    var h = '<div class="card"><h2>Paper test trades</h2>';
    if (!rows.length) return h + '<p class="note">No trades yet. The first one appears when a coin gives a signal.</p></div>';
    h += '<div class="scroll"><table><thead><tr><th>Coin</th><th>Side</th><th>Entry</th><th class="r">Entry price</th><th>Exit</th><th class="r">Exit price</th><th class="r">Result</th><th class="r">On $' + D.size.toLocaleString('en-US') + '</th></tr></thead><tbody>';
    rows.forEach(function (r) { var t = r.t;
      h += '<tr><td><b>' + esc(r.s) + '</b></td><td>' + sidePill(t.side) + '</td><td style="white-space:nowrap">' + esc(when(t.entry_t)) + (t.joined ? ' <span class="note">(joined)</span>' : '') + '</td><td class="num r">' + px(t.entry) + '</td>'
        + '<td style="white-space:nowrap">' + (t.open ? '<span class="note">open</span>' : esc(when(t.exit_t))) + '</td><td class="num r">' + (t.open ? '<span class="note">' + px(t.exit) + '</span>' : px(t.exit)) + '</td>'
        + '<td class="num r ' + tone(t.ret) + '">' + pc(t.ret, 2) + '</td><td class="num r ' + tone(t.usd) + '">' + usd(t.usd) + '</td></tr>'; });
    return h + '</tbody></table></div><p class="note" style="margin:8px 0 0">Results include the fee. An open trade shows the result at the last closed candle with the entry fee paid. Up to 30 trades per coin are listed.</p></div>';
  }
  function past() {
    var h = '<div class="card"><h2>The same rule on past candles</h2><div class="scroll"><table><thead><tr><th>Coin</th><th>Period</th><th class="r">Trades</th><th class="r">Win rate</th><th class="r">Avg per trade</th><th class="r">All trades compounded</th><th class="r">Just holding</th></tr></thead><tbody>';
    var line = function (s, lab, p) { return '<tr><td>' + (s ? '<b>' + esc(s) + '</b>' : '') + '</td><td style="white-space:nowrap">' + lab + '</td><td class="num r">' + p.trades + '</td><td class="num r">' + (p.win_rate == null ? '-' : p.win_rate.toFixed(0) + '%') + '</td><td class="num r ' + tone(p.avg_ret) + '">' + pc(p.avg_ret, 2) + '</td><td class="num r ' + tone(p.total_ret) + '">' + pc(p.total_ret) + '</td><td class="num r">' + pc(p.hold) + '</td></tr>'; };
    D.order.forEach(function (s) { var c = D.coins[s];
      h += line(s, 'On paper: ' + esc(day(c.built.from)) + ' to 31 Oct 2025', c.built) + line('', 'Hidden year: 1 Nov 2025 to 31 Oct 2026', c.hidden); });
    return h + '</tbody></table></div><p class="note" style="margin:8px 0 0">The AI that wrote this rule saw only BTC candles to 31 Oct 2025. It never saw the hidden year, and never saw ETH, BNB or SOL at all. Same fee as the paper test, one position at a time, profits reinvested. On paper the rule made far less than holding; it did better than holding only in the falling year. Past results do not promise future ones.</p></div>';
  }
  function why() {
    var T = D.tests_btc, h = '<div class="card"><h2>Why this one, and what it does not prove</h2><p style="margin:6px 0">' + esc(D.source) + '</p>';
    if (T && T.rows) {
      h += '<div class="scroll"><table><thead><tr><th>Test</th><th>Result</th><th></th></tr></thead><tbody>';
      T.rows.forEach(function (r) { h += '<tr><td>' + esc(r.test) + '</td><td>' + esc(r.result) + '</td><td>' + (r.pass ? '<span class="pill sup">Pass</span>' : '<span class="pill res">Fail</span>') + '</td></tr>'; });
      h += '</tbody></table></div><p class="note" style="margin:6px 0">' + esc(T.note) + '</p>';
    }
    return h + '<ul class="note" style="margin:6px 0 0;padding-left:18px"><li><b>It was picked after the hidden year was opened.</b> Out of 200 strategies, 2 passed all five tests; luck alone can produce that. Only the trades from the start date above are a clean test.</li>'
      + '<li>Give it at least 30 closed trades per coin before judging it.</li><li>No stop loss: one trade can lose a lot before the signal changes.</li><li>Fees do not include futures funding. Paper test only, not financial advice.</li></ul></div>';
  }
  function render() {
    if (!D || busy || !isLab() || document.getElementById('labRoot')) return;
    busy = true;
    main.innerHTML = head() + now() + tradesCard() + past() + why();
    mark();
    busy = false;
  }
  function mark() {
    var on = isLab(), els = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < els.length; i++) { var k = els[i].getAttribute('data-nav');
      if (k === 'lab') { if (on) els[i].setAttribute('aria-current', 'true'); else els[i].removeAttribute('aria-current'); }
      else if (on) els[i].removeAttribute('aria-current'); }
  }
  function nav() {
    if (!D) return;
    [[rail, 'Strategy test', 'home'], [strip, 'Strategy test', '']].forEach(function (x) {
      var box = x[0]; if (!box || box.querySelector('[data-nav="lab"]')) return;
      var after = box.querySelector('[data-nav="pnl"]'); if (!after) return;
      var b = document.createElement('button'); if (x[2]) b.className = x[2];
      b.setAttribute('data-nav', 'lab'); b.setAttribute('data-go', 'lab'); b.textContent = x[1];
      after.parentNode.insertBefore(b, after.nextSibling);
    });
    mark();
  }
  new MutationObserver(function () { if (!busy) render(); }).observe(main, { childList: true });
  [rail, strip].forEach(function (b) { if (b) new MutationObserver(nav).observe(b, { childList: true }); });
  window.addEventListener('hashchange', function () { render(); mark(); });
  fetch('stratlab.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.coins && j.order && j.order.length) { D = j; nav(); render(); } }).catch(function () {});
})();
