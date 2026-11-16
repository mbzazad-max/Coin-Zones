/* Render test for the Strategy test section: loads public/index.html in jsdom, opens All coins, Top 20 P&L and #lab,
   and checks that the new section draws and that the other two pages are the same with and without it.
   usage: node tests/stratlab.js <jsdom module path> */
'use strict';
const fs = require('fs'), path = require('path'), { JSDOM, VirtualConsole } = require(process.argv[2]);
const PUB = path.resolve(__dirname, '..', 'public');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(withLab) {
  let html = fs.readFileSync(path.join(PUB, 'index.html'), 'utf8');
  if (!withLab) html = html.replace('<script src="stratlab-ui.js"></script>', '');
  const errs = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => { const m = String(e.message || e); if (!/Could not load (link|script).*https?:/.test(m)) errs.push(m); });
  const dom = new JSDOM(html, { virtualConsole: vc, url: 'file://' + path.join(PUB, 'index.html'), runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    beforeParse(w) { w.fetch = async (u) => { const f = path.join(PUB, String(u).split('?')[0].replace(/^.*\//, '')); if (!fs.existsSync(f)) return { ok: false, status: 404, json: async () => null, text: async () => '' };
      const b = fs.readFileSync(f, 'utf8'); return { ok: true, status: 200, json: async () => JSON.parse(b), text: async () => b }; }; } });
  await wait(2500);
  const w = dom.window, d = w.document, go = async (h) => { w.location.hash = h; await wait(700); return d.getElementById('main').innerHTML; };
  return { w, d, go, errs };
}
(async () => {
  const a = await open(true), b = await open(false); let bad = 0;
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
  const lab = await a.go('lab');
  ok(/Strategy test: Participation regime/.test(lab), 'the section draws at #lab');
  ok(['BTC', 'ETH', 'BNB', 'SOL'].every((s) => new RegExp('<b>' + s + '</b>').test(lab)), 'all four coins listed');
  ok(!/XRP|DOGE|HYPE/.test(lab), 'no other coin in the section');
  ok(a.d.querySelectorAll('#rail [data-nav="lab"]').length === 1 && a.d.querySelectorAll('#strip [data-nav="lab"]').length === 1, 'one Strategy test button in each navigation');
  ok(a.d.querySelector('#rail [data-nav="lab"]').getAttribute('aria-current') === 'true' && !a.d.querySelector('#rail [data-nav="overview"]').getAttribute('aria-current'), 'its button is the highlighted one');
  for (const h of ['pnl', 'overview', 'BTC-spot']) { const x = await a.go(h), y = await b.go(h); ok(x === y && x.length > 500, h + ' page identical with and without the section (' + x.length + ' chars)'); }
  ok(!/labRoot/.test(await a.go('pnl')), 'leaving #lab restores the normal page');
  ok(/labRoot/.test(await a.go('lab')), 'coming back to #lab draws it again');
  ok(a.errs.length === 0, 'no script errors' + (a.errs.length ? ': ' + a.errs.slice(0, 3).join(' | ') : ''));
  fs.writeFileSync('/tmp/lab.html', await a.go('lab'));
  process.exit(bad ? 1 : 0);
})();
