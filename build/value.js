/* Coin Zones "Value" logic (premium / discount framework), added 25 Nov 2026.
   Pure function of closed candles + the engine's own merged zones (coin.zones). Uses ZE (engine.js) helpers only.

   Per timeframe (4H, 1D, 1W = 1D resampled with the engine's own week key):
   1. Swing pivots: 5 bars each side, kept only if the swing from the previous opposite pivot is >= 2 x ATR(14).
   2. Range = most recent confirmed swing high and swing low that are not broken-and-accepted. A broken edge is
      replaced by the extreme of the impulse leg since the break (dealing range of the last impulse leg).
   3. Acceptance: 2 consecutive closes beyond the edge, or a close beyond followed by a retest that holds
      (later bar trades back to the edge and closes beyond it). A wick through with a close back inside = rejection.
   4. Position = (close - low) / (high - low), bands 0-25 deep discount, 25-45 discount, 45-55 equilibrium,
      55-75 premium, 75-100 deep premium.
   5. Structure from the last 2 swing highs and lows: HH+HL up, LH+LL down, otherwise mixed.
   Label (1D only): Cheap = discount side + (HL confirmed or upward break of structure) + 3+ method support zone in the
   discount half. Expensive = mirror. Otherwise Discount / Premium on that side, Fair at equilibrium.
   1W adds the bias wording, 4H only the timing note. Volume / RSI divergence are +/-1 notes, never a label. */
'use strict';
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.VALUE = factory;
})(typeof self !== 'undefined' ? self : this, function (ZE) {
  const ENV = (typeof process !== 'undefined' && process.env) || {};
  const LR = +(ENV.VALUE_LR || 5), ATR_N = 14, ATR_MULT = +(ENV.VALUE_ATRM || 2);   // env overrides are for the backtest only

  function atrSeries(B) {
    const n = B.c.length, out = new Array(n).fill(null); let a = null, s = 0;
    for (let i = 0; i < n; i++) {
      const tr = i === 0 ? B.h[i] - B.l[i] : Math.max(B.h[i] - B.l[i], Math.abs(B.h[i] - B.c[i - 1]), Math.abs(B.l[i] - B.c[i - 1]));
      if (i < ATR_N) { s += tr; if (i === ATR_N - 1) { a = s / ATR_N; out[i] = a; } }
      else { a = (a * (ATR_N - 1) + tr) / ATR_N; out[i] = a; }
    }
    return out;
  }

  // significant alternating pivots confirmed by the last bar
  function pivots(B, A) {
    const n = B.c.length, raw = [];
    for (let i = LR; i < n - LR; i++) {
      let hi = true, lo = true;
      for (let k = 1; k <= LR; k++) {
        if (!(B.h[i] > B.h[i - k] && B.h[i] >= B.h[i + k])) hi = false;
        if (!(B.l[i] < B.l[i - k] && B.l[i] <= B.l[i + k])) lo = false;
      }
      if (hi) raw.push({ i, t: 'H', p: B.h[i] });
      if (lo) raw.push({ i, t: 'L', p: B.l[i] });
    }
    const P = [];
    for (const q of raw) {
      const a = A[q.i] || A[Math.min(n - 1, ATR_N)] || 0, last = P[P.length - 1];
      if (!last) { P.push(q); continue; }
      if (last.t === q.t) {            // same side twice: keep the more extreme
        if ((q.t === 'H' && q.p >= last.p) || (q.t === 'L' && q.p <= last.p)) P[P.length - 1] = q;
        continue;
      }
      if (Math.abs(q.p - last.p) >= ATR_MULT * a) P.push(q);
    }
    return P;
  }

  // has edge p (from pivot bar i) been broken and accepted by bar n-1? returns {acc, at, rej}
  function acceptance(B, i, p, up) {
    const n = B.c.length; let rej = 0;
    for (let j = i + 1; j < n; j++) {
      const beyond = up ? B.c[j] > p : B.c[j] < p;
      if (beyond) {
        if (j + 1 < n && (up ? B.c[j + 1] > p : B.c[j + 1] < p)) return { acc: true, at: j, rej };
        // retest that holds: a later bar trades back to the edge and still closes beyond it (before closing back inside)
        for (let k = j + 1; k < n; k++) {
          const backIn = up ? B.c[k] <= p : B.c[k] >= p;
          if (backIn) break;
          const touch = up ? B.l[k] <= p : B.h[k] >= p;
          if (touch) return { acc: true, at: k, rej };
        }
      } else if (up ? B.h[j] > p : B.l[j] < p) rej++;
    }
    return { acc: false, at: -1, rej };
  }

  function band(pos) {
    return pos < 25 ? 'deep discount' : pos < 45 ? 'discount' : pos <= 55 ? 'equilibrium' : pos <= 75 ? 'premium' : 'deep premium';
  }

  function analyseTF(B) {
    const n = B.c.length;
    if (n < 2 * LR + ATR_N + 5) return null;
    const A = atrSeries(B), P = pivots(B, A), close = B.c[n - 1];
    const Hs = P.filter(x => x.t === 'H'), Ls = P.filter(x => x.t === 'L');
    if (!Hs.length || !Ls.length) return null;
    const h1 = Hs[Hs.length - 1], l1 = Ls[Ls.length - 1], h0 = Hs[Hs.length - 2], l0 = Ls[Ls.length - 2];
    const aH = acceptance(B, h1.i, h1.p, true), aL = acceptance(B, l1.i, l1.p, false);
    let hi = h1.p, lo = l1.p, hiSrc = 'swing high', loSrc = 'swing low';
    if (aH.acc) { hi = Math.max(...B.h.slice(aH.at)); hiSrc = 'impulse high (swing high broken and accepted)'; }
    if (aL.acc) { lo = Math.min(...B.l.slice(aL.at)); loSrc = 'impulse low (swing low broken and accepted)'; }
    if (aH.acc && !aL.acc) lo = Math.min(lo, ...B.l.slice(aH.at));         // keep low below the leg
    if (aL.acc && !aH.acc) hi = Math.max(hi, ...B.h.slice(aL.at));
    if (!(hi > lo)) return null;
    let pos = (close - lo) / (hi - lo) * 100; pos = Math.max(0, Math.min(100, pos));
    const HH = h0 ? h1.p > h0.p : null, HL = l0 ? l1.p > l0.p : null;
    const STRICT = !(typeof process !== 'undefined' && process.env && process.env.VALUE_V10);   // v1.1: a HL / LH whose edge was broken and accepted no longer counts
    const structure = HH === true && HL === true ? 'up' : HH === false && HL === false ? 'down' : 'mixed';
    const bosUp = aH.acc, bosDn = aL.acc;
    return { pos, band: band(pos), hi, lo, hiSrc, loSrc, structure, hl: HL === true && !(STRICT && aL.acc), lh: HH === false && !(STRICT && aH.acc), bosUp, bosDn,
      rejHi: aH.acc ? 0 : aH.rej, rejLo: aL.acc ? 0 : aL.rej, close, n };
  }

  function rsiDiv(Bd, side) {             // bullish: lower low in price, higher low in RSI at the last two 1D swing lows
    try {
      const r = ZE.rsi(Bd.c, 14), A = atrSeries(Bd), P = pivots(Bd, A).filter(x => x.t === (side === 'L' ? 'L' : 'H'));
      if (P.length < 2) return false;
      const a = P[P.length - 2], b = P[P.length - 1];
      if (b.i < Bd.c.length - 30) return false;
      return side === 'L' ? (b.p < a.p && r[b.i] > r[a.i]) : (b.p > a.p && r[b.i] < r[a.i]);
    } catch (e) { return false; }
  }
  function volDry(Bd) {
    const v = Bd.v, n = v.length; if (n < 60) return false;
    const m = a => a.reduce((s, x) => s + x, 0) / a.length;
    return m(v.slice(n - 5)) < 0.7 * m(v.slice(n - 55, n - 5));
  }

  function confluence(zones, r, side) {    // 3+ method zone inside the discount (S) or premium (R) half of the 1D range
    const mid = (r.hi + r.lo) / 2;
    const zs = (zones || []).filter(z => z.count >= 3 && z.role === side &&
      (side === 'S' ? (z.hi >= r.lo && z.lo <= mid) : (z.lo <= r.hi && z.hi >= mid)));
    zs.sort((a, b) => b.count - a.count);
    return zs[0] || null;
  }

  const f0 = x => Math.round(x) + '%';
  function compute(B4, Bd, zones) {
    const Bw = ZE.resample(Bd, ZE.week);
    const r4 = analyseTF(B4), rd = analyseTF(Bd), rw = analyseTF(Bw);
    if (!rd) return null;
    const disc = rd.pos < 45, prem = rd.pos > 55;
    let label = 'Fair', reasons = [], conf = 0, zone = null, structNote = '';
    const sWord = rd.structure === 'up' ? 'structure up' : rd.structure === 'down' ? 'structure down' : 'structure mixed';
    if (disc) {
      zone = confluence(zones, rd, 'S');
      const trig = rd.hl || rd.bosUp;
      const trigTxt = rd.bosUp ? 'upward break of structure' : rd.hl ? 'HL confirmed' : 'no HL yet';
      if (trig && zone) label = 'Cheap'; else label = 'Discount';
      if (rd.structure === 'down' && !trig) structNote = ', structure bearish';
      reasons.push('1D: ' + f0(rd.pos) + ' of range (' + rd.band + ')');
      reasons.push(zone ? 'at/above ' + zone.count + '-method support' : 'no 3+ method support in the discount half');
      reasons.push(sWord + ' (' + trigTxt + ')');
      if (rsiDiv(Bd, 'L')) { conf++; reasons.push('bullish RSI divergence (+1)'); }
      if (volDry(Bd)) { conf++; reasons.push('selling volume drying up (+1)'); }
    } else if (prem) {
      zone = confluence(zones, rd, 'R');
      const trig = rd.lh || rd.bosDn;
      const trigTxt = rd.bosDn ? 'downward break of structure' : rd.lh ? 'LH confirmed' : 'no LH yet';
      if (trig && zone) label = 'Expensive'; else label = 'Premium';
      if (rd.structure === 'up' && !trig) structNote = ', trend intact';
      reasons.push('1D: ' + f0(rd.pos) + ' of range (' + rd.band + ')');
      reasons.push(zone ? 'under ' + zone.count + '-method resistance' : 'no 3+ method resistance in the premium half');
      reasons.push(sWord + ' (' + trigTxt + ')');
      if (rsiDiv(Bd, 'H')) { conf--; reasons.push('bearish RSI divergence (-1)'); }
      if (volDry(Bd)) { conf--; reasons.push('buying volume drying up (-1)'); }
    } else {
      reasons.push('1D: ' + f0(rd.pos) + ' of range (equilibrium)');
      reasons.push(sWord);
    }
    let verdict = label === 'Cheap' ? 'Cheap on the daily' : label === 'Expensive' ? 'Expensive on the daily'
      : label === 'Discount' ? 'Discount on the daily' + (structNote || ((rd.hl || rd.bosUp) ? ', not cheap until a 3+ method support lines up' : ', not cheap until a HL or break up confirms'))
      : label === 'Premium' ? 'Premium on the daily' + (structNote || ((rd.lh || rd.bosDn) ? ', not expensive until a 3+ method resistance lines up' : ', not expensive until a LH or break down confirms'))
      : 'Fair value on the daily';
    const bias = rw ? '1W bias: ' + f0(rw.pos) + ' (' + rw.band + '), structure ' + rw.structure : '1W: not enough history';
    let timing = '';
    if (r4) {
      if (label === 'Cheap' || label === 'Discount') timing = r4.pos > 55 ? '4H still in ' + r4.band + ', wait for a pullback' : r4.pos < 45 ? '4H also in ' + r4.band + ', timing ok' : '4H at equilibrium';
      else if (label === 'Expensive' || label === 'Premium') timing = r4.pos < 45 ? '4H already in ' + r4.band + ', wait for a bounce to trim' : r4.pos > 55 ? '4H also in ' + r4.band : '4H at equilibrium';
      else timing = '4H ' + f0(r4.pos) + ' (' + r4.band + ')';
    }
    const text = reasons.join(', ') + '. ' + verdict + (timing ? '; ' + timing : '') + '. ' + bias + '.';
    // info-only wording (no Cheap/Expensive verdict): what the board shows since 25 Nov 2026 (owner chose option A)
    const info = reasons.join(', ') + (timing ? '; ' + timing : '') + '. ' + bias + '.';
    const pack = r => r ? { pos: +r.pos.toFixed(1), band: r.band, hi: r.hi, lo: r.lo, structure: r.structure, hl: r.hl, lh: r.lh, bos_up: r.bosUp, bos_dn: r.bosDn, rej_hi: r.rejHi, rej_lo: r.rejLo } : null;
    return { label, text, info, conf, zone: zone ? { lo: zone.lo, hi: zone.hi, count: zone.count } : null, tf: { '4H': pack(r4), '1D': pack(rd), '1W': pack(rw) } };
  }

  return { compute, analyseTF, pivots, atrSeries, acceptance, band };
});
