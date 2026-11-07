# NEPSE Research Desk — v0.1

Offline-first Android PWA for personal position-trading research.

## Current watchlist
ADBLCIT, GBIME, HIDCL, ICFC, KBL, MMF1, NBL, NLIC, PRVU, SBL, SFMF

The duplicate GBIME and trailing comma in the submitted list were normalised. 11 unique symbols remain.

## Run on Android
1. Extract this ZIP.
2. Publish the folder to a static HTTPS host you control, or run it locally with a development server.
3. Open the HTTPS address in Chrome on Android.
4. Chrome menu → Add to Home screen / Install app.
5. Open Data & settings and import authorised CSV data.

A service worker/PWA requires HTTPS (localhost is the usual development exception). Opening `index.html` directly from a file manager will not enable full PWA installation/offline caching.

## CSV format
`date,symbol,open,high,low,close,volume,source`

- Date format: YYYY-MM-DD
- Symbol must be in your current watchlist
- OHLCV values must be numeric
- One row per symbol per date
- Duplicate symbol/date imports replace the previous row

## Data rights and sources
This build does not scrape NEPSE, bypass controls, or silently call third-party endpoints. Import data only when the source terms permit personal storage and analysis.

NEPSE's data use is subject to its data-use procedure and fees. A public API endpoint or MIT-licensed scraper code does not by itself grant rights to the underlying exchange data. Confirm permission and permitted personal use with the data owner/provider before connecting an automated feed.

Reference links:
- NEPSE: https://www.nepalstock.com/
- NEPSE data-use procedure reporting / SEBON clarification: https://www.sharesansar.com/newsdetail/sebon-clarifies-that-nepses-api-data-usage-procedure-fees-have-not-increased-2022-09-27
- YONEPSE public dataset docs (unofficial; investigate permissions): https://shubhamnpk.github.io/yonepse/pages/docs.html

## Implemented
- Watchlist and duplicate removal
- Local browser storage
- CSV import with validation and upsert by symbol/date
- Backup export and local deletion
- Daily price history chart
- EMA 20/50/200, RSI 14, MACD line and volume ratio screen
- Responsive Android-friendly UI
- PWA manifest and offline shell

## Not yet implemented
- Automated external data connector (intentionally gated pending written data-use confirmation)
- True intraday / real-time quotes
- Adjusted prices for dividends, bonus shares and rights issues
- Full MACD signal/histogram, ATR, financial fundamentals and sector scoring
- Scheduled background refresh (mobile browsers restrict background execution)
- Push notifications and broker/order integration

## Important analytical limitations
The technical screen requires at least 50 observations; EMA200 requires 200. The initial score model is not presented as a total score because fundamental and sector inputs are not yet populated. Signals are research prompts, not investment advice or trade instructions.
