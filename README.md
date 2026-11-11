# Coin Zones

The Coin Zones board, rebuilt on GitHub and shown on Cloudflare. Claude only loads data; it does not run the board's logic.

- **Data**: read from the shared repo `mbzazad-max/market-data` (closed candles only).
- **Logic**: `build/build.js` runs the original engine files in `public/` (`engine.js`, `series.js`, `holdodds.js`, `pnl.js`), byte-identical to the Claude artifact. The workflow checks this on every run against `reference/ENGINE_SHA256SUMS`.
- **Display**: `public/index.html` is the original page plus two script tags: `shim.js` (read-only data) and `cloud.js` (Refresh button and freshness strip). The original is kept in `reference/index.original.html`.
- **Runs**: when market-data gets new candles, once a day as a safety net, or when Refresh is pressed. If no new candles arrived, nothing is rebuilt.
- **Safety**: a coin or gauge that cannot be built keeps its last good version and is listed in `public/freshness.json` and on the page. If validation fails, nothing is written.

Parity test (original page code vs build.js on identical candles):
`node tests/parity.js <market-data dir> <path to jsdom>`

To add a coin: add a line to `config/board.json` and its two series to `market-data/series.json`.
