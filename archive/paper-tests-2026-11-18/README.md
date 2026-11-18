# Coin Zones paper tests — retired 18 Nov 2026

The owner moved paper trading to the Paper-Trade dashboard (repo mbzazad-max/Paper-Trade, /paper-trade/), which
runs the same rules from a fresh start with manual Close all / Book %. Coin Zones now shows the board only.

Kept here exactly as they were at retirement (results since 16 Nov 2026 01:05 UTC):
- `state-pnl/` — the Top 20 P&L paper test state (cfg.json, advice snapshots s_*, closed 4H candles b_*), 26 coins.
- `pnl.json` — what the page read for the Top 20 P&L tab (including the with-MSS orders).
- `structure-tests.json` — the live zone vs zone+MSS figures and the since-2025 replay from structure.json.
- `stratlab.json`, `stratlab-ui.js`, `stratlab-test.js` — the s083 Strategy test page, its data and its test.

To bring a test back: move `state-pnl/` to `state/pnl/` (recording resumes in build.js), restore the workflow step
and script tag. The engine files and the original page were never changed.
