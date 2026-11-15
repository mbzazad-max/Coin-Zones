# Coin Zones

The Coin Zones board, rebuilt on GitHub and shown on Cloudflare. Claude only loads data; it does not run the board's logic.

- **Data**: read from the shared repo `mbzazad-max/market-data` (closed candles only).
- **Logic**: `build/build.js` runs the original engine files in `public/` (`engine.js`, `series.js`, `holdodds.js`, `pnl.js`), byte-identical to the Claude artifact. The workflow checks this on every run against `reference/ENGINE_SHA256SUMS`.
- **Address**: none of its own. It opens at `/coin-zones/` on the home site (repo `dashboards`), which holds the one login lock.
- **Display**: `public/index.html` is the original page plus two script tags: `shim.js` (read-only data) and `cloud.js` (Refresh button and freshness strip). The original is kept in `reference/index.original.html`.
- **Runs**: when market-data gets new candles, once a day as a safety net, or when Refresh is pressed. If no new candles arrived, nothing is rebuilt.
- **Safety**: a coin or gauge that cannot be built keeps its last good version and is listed in `public/freshness.json` and on the page. If validation fails, nothing is written.
- **Structure layer** (added 15 Nov 2026; `public/structure.js`, `build/structure.js`, `public/structure-ui.js`): a buy zone alone is not an entry. For every coin the build looks for a 4H market structure shift (MSS): price sweeps a swing low, then a 4H candle closes above the last lower high with displacement (a fair value gap, or a body of 1.2× ATR). Entry is the middle of that gap, stop just below the sweep low; it stands 5 days. The page shows it as a card on All coins, on each coin's Spot setup tab, and on Top 20 P&L, where the paper test is replayed with that entry next to the original, and both rules are replayed since 1 Jan 2025 on the advice the original engine gives for each closed day (kept by month in `history/plans/`). First run, 20 coins: buy the zone 1,078 trades, −1.18% per trade, net −$11,671; zone + structure shift 132 trades, +0.71% per trade (+0.42% without its best), net +$934. **Buy rule on Top 20 P&L (owner's choice, 15 Nov 2026): both must agree**, the board's buy zone and a 4H structure shift from it. `build/structure.js` rewrites the advice in `public/pnl.json` so the unchanged `pnl.js` sees no order until a shift from the zone is confirmed, then that shift's entry and stop with the board's targets for 12 candles. `state/pnl/` still records the board's own zone advice, and the page shows the old rule's result next to the new one. The engine files are unchanged.

Parity test (original page code vs build.js on identical candles):
`node tests/parity.js <market-data dir> <path to jsdom>`

To add a coin: add a line to `config/board.json` and its two series to `market-data/series.json`.
