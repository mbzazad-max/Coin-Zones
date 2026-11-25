/* Coin Zones "What voids the setup" (confirmed-break void + early 4H warning), added 25 Nov 2026.
   Approved by the owner after the 22-25 Nov fakeout / confirmed-break backtest (BTC ETH SOL LINK DOGE):
   fakeouts were 10-15% of first closes outside a zone; reclaims after the signal fell from ~51% (one close)
   to ~40% (confirmed break); an early 4H close below a daily zone preceded a daily close below it 64-67% of the
   time vs 5% without one. Control levels behaved the same, so this is a better close filter, not a zone edge.

   floor = spot_setup.void (the 1D buy zone floor the old rule used), A = coin.atr_d (daily ATR(14), engine value).
   (A) Void only on a confirmed break, judged on the last closed daily candles:
         one daily close below floor - 0.5 A (hard), or two daily closes in a row each below floor - 0.1 A (soft).
       Last close below the floor but not confirmed -> status 'watch'.
   (B) Warning only: a closed 4H candle of the current, not-yet-closed UTC day closed below the floor.
   Pure function of closed candles; engine.js and spot_setup are not touched. */
'use strict';
const DAY = 86400;

function g6(x) { return String(parseFloat(Number(x).toPrecision(6))); }

function compute(b4, bd, coin) {
  const ss = coin && coin.spot_setup;
  if (!ss || ss.void == null || ss.entry == null) return null;
  const floor = ss.void, A = coin.atr_d;
  if (!(floor > 0) || !(A > 0) || !bd || bd.c.length < 2) return null;
  const hard = floor - 0.5 * A, soft = floor - 0.1 * A;
  const n = bd.c.length, c0 = bd.c[n - 1], c1 = bd.c[n - 2], day_t = bd.t[n - 1];

  let status = 'ok', note = null;
  if (c0 < hard) {
    status = 'void';
    note = `Void: the last daily close ${g6(c0)} is more than 0.5 x ATR below the floor (under ${g6(hard)}). Confirmed break, the zone no longer holds.`;
  } else if (c0 < soft && c1 < soft) {
    status = 'void';
    note = `Void: the last two daily closes (${g6(c1)}, ${g6(c0)}) were both more than 0.1 x ATR below the floor (under ${g6(soft)}). Confirmed break, the zone no longer holds.`;
  } else if (c0 < floor) {
    status = 'watch';
    note = `Watch: the last daily close ${g6(c0)} is below the floor ${g6(floor)}, but the break is not confirmed. `
      + (c0 < soft ? `One more daily close below ${g6(soft)} confirms it` : `A next daily close below ${g6(soft)} plus one more, or any close below ${g6(hard)}, confirms it`)
      + `; a close back above ${g6(floor)} cancels the watch.`;
  }

  // (B) closed 4H candles of the UTC day after the last closed daily candle (that day has not closed yet)
  let warn = null;
  if (b4 && b4.t.length) {
    const dayStart = day_t + DAY;
    let worst = null;
    for (let i = b4.t.length - 1; i >= 0 && b4.t[i] >= dayStart; i--)
      if (b4.t[i] < dayStart + DAY && b4.c[i] < floor && (worst === null || b4.c[i] < b4.c[worst])) worst = i;
    if (worst !== null && status !== 'void') {
      const hh = new Date(b4.t[worst] * 1000).toISOString().slice(11, 16);
      warn = `The ${hh} UTC 4H candle closed at ${g6(b4.c[worst])}, below ${g6(floor)}, before today's daily close. Early warning only, not a void; in the backtest the day then closed below the floor about two times in three.`;
    }
  }

  const rule = 'Confirmed break of the 1D buy zone floor';
  const text = `The setup is void only on a confirmed break: one daily close below ${g6(hard)} (floor ${g6(floor)} minus 0.5 x daily ATR ${g6(A)}), `
    + `or two daily closes in a row below ${g6(soft)} (floor minus 0.1 x ATR). A single close just under the floor is a watch, not a void.`;
  return { rule, floor, atr_d: A, hard, soft, status, text, note, warn, day_close: c0, day_t };
}

module.exports = { compute };
