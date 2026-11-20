# Bayazit Live-Chart

Eigener Live-Chart für Krypto unter **chart.kompassapps.de**.

- `index.html` – die Seite (Live-Kurse von OKX-Perpetuals per WebSocket, Ersatz Binance Spot; Indikatoren nach den TradingView-Namen)
- `ex.js` – weitere Börsen (Bybit, Binance Futures, Bitget, Hyperliquid, BingX); `boersen-test.html` prüft im Browser, welche erreichbar sind
- `dw.js` – Einstellfenster für Zeichnungen (Stil, Koordinaten, Sichtbarkeit, Vorlagen)
- `wl.js` – Watchlist, `al.js` – Alarme, `bps.js` – Pattern Scanner, `split.js` – geteilte Ansicht
- `chart-core.js`, `gz-core.js` – Rechen- und Zeichenkern (Ursprung: Repo coin-scanner, Chart-Bot)
- Risiko-Daten kommen weiter aus dem Repo coin-scanner (scanner.kompassapps.de/data)

Änderungen am Live-Chart bitte hier machen, nicht mehr in `live.html` im Repo coin-scanner.
