/* Page check after the paper tests were retired (18 Nov 2026): the board opens with no errors, the "Top 20 P&L"
   buttons are gone, the old #pnl and #lab addresses go to the board, and the structure cards still draw.
   usage: node tests/retired.js <jsdom module path> */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), { JSDOM, VirtualConsole } = require(process.argv[2]);
const PUB = path.resolve(__dirname, '..', 'public'), wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  for (const start of ['', '#pnl', '#lab', '#BTC-spot']) {
    const errs = [], vc = new VirtualConsole(); vc.on('jsdomError', (e) => { const m = String(e.message || e); if (!/Could not load (link|script).*https?:/.test(m)) errs.push(m); });
    const dom = new JSDOM(fs.readFileSync(path.join(PUB, 'index.html'), 'utf8'), { virtualConsole: vc, url: 'file://' + path.join(PUB, 'index.html') + start, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
      beforeParse(w) { w.fetch = async (u) => { const f = path.join(PUB, String(u).split('?')[0].replace(/^.*\//, '')); return fs.existsSync(f) ? { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(f, 'utf8')) } : { ok: false, status: 404, json: async () => ({}) }; }; } });
    const d = dom.window.document; for (let i = 0; i < 100 && !d.querySelector('#main .card'); i++) await wait(100); await wait(400);
    assert.equal(d.querySelectorAll('[data-nav="pnl"]').length, 0, start + ': Top 20 P&L button still there');
    const h = dom.window.location.hash; if (start === '#pnl' || start === '#lab') assert.equal(h, '#overview', start + ' did not go to the board');
    const txt = d.getElementById('main').textContent;
    assert.doesNotMatch(txt, /paper test|Strategy test/i, start + ': paper test text still shown');
    if (start === '') assert(d.getElementById('structCard') || /structure/i.test(txt), 'structure card missing on the board');
    assert.deepEqual(errs, [], start + ': page errors'); dom.window.close();
  }
  console.log('retired: ok (no Top 20 P&L or Strategy test; #pnl and #lab go to the board; structure cards still there)');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
