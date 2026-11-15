/* Coin Zones on Cloudflare: the structure layer's cards (added 15 Nov 2026). Reads structure.json (build/structure.js)
   and adds, without touching the original page code:
     All coins     one card: which coins have a 4H structure shift up from their buy zone now, and which say trim
     Spot setup    one card per coin: the standing 4H shift, its entry and stop, or "wait"
     Top 20 P&L    one card: the paper test with the structure-shift entry next to the original, and both replayed since 2025
   If structure.json is missing, nothing is added. Uses the page's own styles. */
(function () {
  'use strict';
  var D = null, main = document.getElementById('main'), busy = false;
  if (!main) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var px = function (x) { if (x == null || isNaN(x)) return '-'; var a = Math.abs(x); return a >= 1000 ? x.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a >= 100 ? x.toFixed(1) : a >= 1 ? x.toFixed(3) : a >= 0.01 ? x.toFixed(5) : x.toPrecision(4); };
  var usd = function (x) { if (x == null || isNaN(x)) return '-'; var a = Math.abs(x); return (x < 0 ? '-' : x > 0 ? '+' : '') + '$' + (a >= 1000 ? a.toLocaleString('en-US', { maximumFractionDigits: 0 }) : a.toFixed(2)); };
  var pc = function (x, d) { return x == null || isNaN(x) ? '-' : (x > 0 ? '+' : '') + x.toFixed(d == null ? 1 : d) + '%'; };
  var when = function (t) { var d = new Date(t * 1000); return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  var kpi = function (lab, val, sub, k) { return '<div><b>' + lab + '</b><span class="' + (k || '') + '">' + val + '</span>' + (sub ? '<div class="note">' + sub + '</div>' : '') + '</div>'; };
  var RULE = 'A structure shift (MSS) is a 4H candle closing above the last lower high after price swept a swing low, with a strong move (a fair value gap, or a candle body of 1.2&times; ATR). Entry is the middle of that gap, stop is just below the sweep low. It stands for 5 days unless a 4H candle closes below the sweep low. Closed candles only. Rules of thumb, spot only, not financial advice.';

  function shiftLine(e, up) {
    return (up ? 'Closed above ' : 'Closed below ') + '<span class="num">' + px(e.level) + '</span> after a sweep to <span class="num">' + px(e.sweep) + '</span> &middot; ' + esc(when(e.at)) + ' (' + e.age + ' candle' + (e.age === 1 ? '' : 's') + ' ago)';
  }
  function coinCard(sym) {
    var c = D.coins[sym]; if (!c) return '';
    var pill = c.buy === 'BUY' ? '<span class="pill sup">Structure confirms: buy</span>' : c.buy === 'NO ROOM' ? '<span class="pill warn">Shifted up, no room to target</span>' : c.buy === 'NO ZONE' ? '<span class="pill warn">No buy zone</span>' : '<span class="pill warn">Wait: no structure shift</span>';
    var h = '<div class="card" id="structCard"><div class="row" style="margin-bottom:6px"><div class="grow"><h2 style="margin:0">4H structure shift</h2></div>' + pill + (c.trim ? ' <span class="pill res">Trim signal</span>' : '') + '</div>';
    h += '<p style="margin:6px 0">' + esc(c.why) + (c.buy === 'WAIT' ? ' <b>Buying the zone before structure turns is catching a falling price.</b>' : '') + '</p>';
    if (c.bull) {
      var b = c.bull, inPlay = c.buy === 'BUY';
      h += '<div class="scroll"><table><tbody><tr><td>Shift up</td><td>' + shiftLine(b, true) + '</td></tr>'
        + '<tr><td>' + (inPlay ? 'Buy at' : 'Its entry') + '</td><td><span class="num">' + px(b.entry) + '</span>' + (b.fvg ? ' <span class="note">(middle of the gap ' + px(b.fvg[0]) + ' - ' + px(b.fvg[1]) + ')</span>' : ' <span class="note">(retest of the broken level)</span>')
        + (inPlay ? (c.price > b.entry ? ' <span class="note">price is above it: wait for the pullback</span>' : ' <span class="note">price is at or below it now</span>') : '') + '</td></tr>'
        + '<tr><td>Stop</td><td><span class="num">' + px(b.stop) + '</span> <span class="note">(' + pc((b.stop / b.entry - 1) * 100) + ' from entry, below the sweep low)</span></td></tr>'
        + (inPlay ? '<tr><td>Targets</td><td><span class="num">' + [c.t1, c.t2].filter(function (x) { return x != null && x - b.entry >= b.entry - b.stop; }).map(px).join('</span> then <span class="num">') + '</span> <span class="note">(the board\'s targets at least 1R away)</span></td></tr>' : '')
        + '</tbody></table></div>';
    }
    if (c.bear) h += '<p class="note" style="margin:6px 0">Shift down: ' + shiftLine(c.bear, false) + (c.trim ? '. It came from the 1D sell zone: if you hold this coin, consider trimming.' : '.') + '</p>';
    var p = D.history && D.history.per && D.history.per[sym];
    if (p && (p.zone.closed || p.mss.closed)) h += '<p class="note" style="margin:6px 0">' + esc(sym) + ' since ' + esc(D.history.from) + ': zone only ' + p.zone.closed + ' trades, ' + pc(p.zone.avg_ret, 2) + ' each on average &middot; with a structure shift ' + p.mss.closed + ' trades, ' + pc(p.mss.avg_ret, 2) + ' each.</p>';
    return h + '<p class="note" style="margin:6px 0 0">' + RULE + '</p></div>';
  }
  /* Market gauges: monitor only (they cannot be bought or sold), same 4H MSS rules as the coins. */
  var GRULE = 'Same 4H structure-shift rules as the coins. Monitor only: a gauge cannot be bought or sold, so there is no entry, stop or P&amp;L test. Market read counts TOTAL, TOTAL2ES, TOTAL3ES and stablecoin dominance (a shift up in stablecoin dominance is risk-off); ETHBTC, Gold and Silver are context.';
  function gPill(g) {
    if (g.state === 'NONE') return '<span class="pill warn">No shift</span>';
    var good = g.crypto > 0, bad = g.crypto < 0, cls = good ? 'sup' : bad ? 'res' : 'acc';
    return '<span class="pill ' + cls + '">Shifted ' + (g.state === 'UP' ? 'up' : 'down') + (good ? ': risk-on' : bad ? ': risk-off' : '') + '</span>';
  }
  function gLast(g) {
    var e = g.state === 'UP' ? g.bull : g.state === 'DOWN' ? g.bear : g.last;
    if (!e) return '<span class="note">none in the last 1000 candles</span>';
    return (g.state === 'NONE' ? '<span class="note">last: ' + (e.dir > 0 ? 'up' : 'down') + ', expired &middot; </span>' : '') + shiftLine(e, e.dir > 0);
  }
  function marketLine() {
    var G = D.gauges; if (!G || !G.market) return '';
    var m = G.market, cls = m === 'RISK-ON' ? 'sup' : m === 'RISK-OFF' ? 'res' : 'warn';
    var txt = m === 'RISK-ON' ? 'Gauges shifted risk-on: ' + G.on.join(', ') + '.' : m === 'RISK-OFF' ? 'Gauges shifted risk-off: ' + G.off.join(', ') + '.' : m === 'MIXED' ? 'Gauges disagree. Risk-on: ' + G.on.join(', ') + '; risk-off: ' + G.off.join(', ') + '.' : 'No market gauge has a standing 4H structure shift.';
    return '<span class="pill ' + cls + '">Market: ' + esc(m.toLowerCase()) + '</span> ' + esc(txt);
  }
  function gaugeTable() {
    var G = D.gauges; if (!G || !G.list) return '';
    var day = function (t) { return new Date(t * 1000).toLocaleDateString([], { day: 'numeric', month: 'short' }); };
    var h = '<h3 style="margin-top:14px">Market gauges: 4H structure (monitor only)</h3><p style="margin:6px 0">' + marketLine() + '</p><div class="scroll"><table><thead><tr><th>Gauge</th><th>4H structure</th><th>Last shift</th></tr></thead><tbody>';
    Object.keys(G.list).forEach(function (s) { var g = G.list[s], e = g.state === 'UP' ? g.bull : g.state === 'DOWN' ? g.bear : g.last;
      h += '<tr><td><a href="#' + encodeURIComponent(s) + '"><b>' + esc(s) + '</b></a>' + (g.context ? '<div class="note">context</div>' : '') + '</td><td>' + gPill(g) + (g.state !== 'NONE' ? '<div class="note">' + esc(g.read) + '</div>' : '') + '</td><td class="note">' + (e ? (e.dir > 0 ? 'up' : 'down') + ', ' + esc(day(e.at)) + (g.state === 'NONE' ? ' (expired)' : '') : '-') + '</td></tr>'; });
    return h + '</tbody></table></div>';
  }
  function gaugeCard(sym) {
    var g = D.gauges.list[sym];
    var h = '<div class="card" id="structCard"><div class="row" style="margin-bottom:6px"><div class="grow"><h2 style="margin:0">4H structure shift (monitor only)</h2></div>' + gPill(g) + '</div>';
    h += '<p style="margin:6px 0"><b>' + esc(g.read) + '</b>' + (g.context ? ' <span class="note">Context gauge: not counted in the market read.</span>' : '') + '</p>';
    h += '<div class="scroll"><table><tbody>';
    if (g.bull) h += '<tr><td>Shift up</td><td>' + shiftLine(g.bull, true) + (g.bull.fvg ? ' <span class="note">(gap ' + px(g.bull.fvg[0]) + ' - ' + px(g.bull.fvg[1]) + ')</span>' : '') + '</td></tr><tr><td>Fails if</td><td>a 4H close below <span class="num">' + px(g.bull.sweep) + '</span></td></tr>';
    if (g.bear) h += '<tr><td>Shift down</td><td>' + shiftLine(g.bear, false) + (g.bear.fvg ? ' <span class="note">(gap ' + px(g.bear.fvg[0]) + ' - ' + px(g.bear.fvg[1]) + ')</span>' : '') + '</td></tr><tr><td>Fails if</td><td>a 4H close above <span class="num">' + px(g.bear.sweep) + '</span></td></tr>';
    if (!g.bull && !g.bear) h += '<tr><td>Last shift</td><td>' + gLast(g) + '</td></tr>';
    h += '<tr><td>Now</td><td><span class="num">' + px(g.price) + '</span> <span class="note">(last closed 4H candle)</span></td></tr></tbody></table></div>';
    h += '<p style="margin:6px 0">' + marketLine() + '</p>';
    return h + '<p class="note" style="margin:6px 0 0">' + GRULE + ' ' + RULE.replace(/ Entry is[^.]*\./, '').replace(/ Rules of thumb.*$/, '') + '</p></div>';
  }
  function overviewCard() {
    var buy = [], trim = [], n = 0;
    Object.keys(D.coins).forEach(function (s) { n++; var c = D.coins[s]; if (c.buy === 'BUY') buy.push(s); if (c.trim) trim.push(s); });
    var link = function (s) { return '<a href="#' + encodeURIComponent(s) + '-spot"><b>' + esc(s) + '</b></a>'; };
    return '<div class="card" id="structCard"><h2>4H structure shift</h2><p style="margin:6px 0">'
      + (buy.length ? 'Shifted up from the buy zone: ' + buy.map(link).join(', ') + '. ' : '<b>No coin has a structure shift up from its buy zone right now.</b> ')
      + (n - buy.length) + ' of ' + n + ' coins: wait.' + (trim.length ? ' Trim signal (shift down from the sell zone): ' + trim.map(link).join(', ') + '.' : '') + '</p>'
      + '<p class="note" style="margin:6px 0 0">A buy zone alone is not an entry: wait for 4H structure to turn up inside it. Details on each coin\'s Spot setup tab; the test of this rule is on Top 20 P&amp;L.</p>' + gaugeTable() + (D.gauges ? '<p class="note" style="margin:6px 0 0">' + GRULE + '</p>' : '') + '</div>';
  }
  function row(lab, s) {
    return '<tr><td>' + lab + '</td><td class="num r">' + s.closed + '</td><td class="num r">' + (s.win_rate == null ? '-' : s.win_rate.toFixed(0) + '%') + '</td><td class="num r">' + pc(s.avg_ret, 2) + '</td><td class="num r">' + (s.pf == null ? '-' : s.pf.toFixed(2)) + '</td><td class="num r">' + usd(s.net) + '</td></tr>';
  }
  function pnlCard() {
    var L = D.live, H = D.history, h = '<div class="card" id="structCard"><h2>Buy rule: buy zone + 4H structure shift (both must agree)</h2>';
    if (L) {
      h += '<p style="margin:6px 0">The test above now buys only when price is at the board\'s buy zone <b>and</b> a 4H structure shift confirms there. Until then a coin shows no order.</p>'
        + '<div class="kv">' + kpi('This test (zone + structure shift)', usd(L.mss.net), L.mss.wins + ' W &middot; ' + L.mss.losses + ' L &middot; ' + L.mss.open + ' open &middot; ' + L.mss.pending + ' pending', L.mss.net > 0 ? 'good' : L.mss.net < 0 ? 'bad' : '')
        + kpi('Old rule (buy the zone alone)', usd(L.zone.net), L.zone.wins + ' W &middot; ' + L.zone.losses + ' L &middot; ' + L.zone.open + ' open', L.zone.net > 0 ? 'good' : L.zone.net < 0 ? 'bad' : '')
        + kpi('Difference', usd(L.mss.net - L.zone.net), 'same window, size and fee') + '</div>';
    }
    if (H) {
      h += '<h3 style="margin-top:14px">Both ways since ' + esc(H.from) + ' (' + H.coins_n + ' coins, $' + H.size + ' per trade, ' + H.fee + '% fee each side)</h3>'
        + '<div class="scroll"><table><thead><tr><th>Entry rule</th><th class="r">Trades</th><th class="r">Win rate</th><th class="r">Avg per trade</th><th class="r">Profit factor</th><th class="r">Net</th></tr></thead><tbody>'
        + row('Buy the zone (original rule)', H.zone) + row('Zone + 4H structure shift', H.mss) + '</tbody></table></div>'
        + '<p class="note" style="margin:6px 0 0">Replayed on closed 4H candles to ' + esc(H.to) + ', with the advice the board\'s own engine gives at the end of each day. A win is any trade that closed with a profit. Without its single best trade the structure rule averages ' + pc(H.mss.avg_ret_ex_best, 2) + ' per trade, the original ' + pc(H.zone.avg_ret_ex_best, 2) + '. Past results do not promise future ones.</p>';
    }
    return h + '<p class="note" style="margin:6px 0 0">' + RULE + ' Targets are the board\'s T1 and T2 that sit at least 1R above the entry; half is sold at T1 and the stop moves to breakeven, as in the original test.</p></div>';
  }
  function place() {
    if (!D || busy || document.getElementById('structCard')) return;
    var h = decodeURIComponent((location.hash || '').replace('#', '')), sym = h.split('-')[0], html = '', before = null;
    var cards = main.querySelectorAll('.card'); if (!cards.length) return;
    if (sym === 'pnl') { if (!/paper test/.test(cards[0].textContent)) return; html = pnlCard(); before = cards[1] || null; }
    else if (D.coins[sym]) {
      var spot = [].filter.call(main.querySelectorAll('.card h2'), function (x) { return /Buy and sell zones by timeframe/.test(x.textContent); })[0];
      if (!spot) return; html = coinCard(sym); before = spot.closest('.card');
    } else if (D.gauges && D.gauges.list && D.gauges.list[sym]) {
      var zt = [].filter.call(main.querySelectorAll('.card h2'), function (x) { return /Resistance \(nearest first\)/.test(x.textContent); })[0];
      if (!zt) return; html = gaugeCard(sym); before = zt.closest('.card');
    } else if (!sym || sym === 'overview') { html = overviewCard(); before = cards[0]; }
    if (!html) return;
    busy = true;
    var t = document.createElement('div'); t.innerHTML = html;
    var parent = before ? before.parentNode : cards[0].parentNode; parent.insertBefore(t.firstChild, before);
    busy = false;
  }
  new MutationObserver(function () { if (!busy) place(); }).observe(main, { childList: true, subtree: true });
  fetch('structure.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.coins) { D = j; place(); } }).catch(function () {});
})();
