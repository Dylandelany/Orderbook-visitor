// api/prices.js
//
// Endpoint ini render 3 mini price panel (IHSG Composite, SPY, Bitcoin) bergaya
// dark trading terminal, mirip Bloomberg tapi versi simpel. Datanya diambil dari
// endpoint publik Yahoo Finance (gratis, tanpa API key). Bukan real-time detik-
// per-detik, tapi cukup update tiap kali gambar di-load.
//
// Pasang di README dengan:
// <img src="https://<domain-vercel-kamu>/api/prices" width="100%">

const SYMBOLS = [
  { symbol: '^JKSE', label: 'IHSG' },
  { symbol: 'SPY', label: 'SPY' },
  { symbol: 'BTC-USD', label: 'BTC' },
];

const FETCH_TIMEOUT_MS = 2500;

async function fetchSymbol({ symbol, label }) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=1mo&interval=1d`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GithubReadmeBot/1.0)' },
    });
    const json = await r.json();
    const result = json?.chart?.result?.[0];
    const closesRaw = result?.indicators?.quote?.[0]?.close ?? [];
    const closes = closesRaw.filter((c) => typeof c === 'number');

    if (closes.length < 2) throw new Error('data tidak cukup');

    const last = closes[closes.length - 1];
    const prevClose = result?.meta?.chartPreviousClose ?? closes[closes.length - 2];
    const changePct = ((last - prevClose) / prevClose) * 100;

    return { label, closes, last, changePct, ok: true };
  } catch (e) {
    return { label, ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

function fmtPrice(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toFixed(2);
}

function sparklinePoints(closes, x, y, w, h) {
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const step = w / (closes.length - 1);

  return closes
    .map((c, i) => {
      const px = x + i * step;
      const py = y + h - ((c - min) / range) * h;
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(' ');
}

function buildPanel(data, x, width) {
  const height = 140;
  const positive = data.ok ? data.changePct >= 0 : true;
  const color = positive ? '#3fb950' : '#f85149';

  let inner = '';
  inner += `<rect x="${x}" y="0" width="${width}" height="${height}" fill="#0d1117" stroke="#21262d" />`;
  inner += `<text x="${x + 16}" y="26" fill="#8b949e" font-family="Consolas, monospace" font-size="12" font-weight="bold">${data.label}</text>`;

  if (!data.ok) {
    inner += `<text x="${x + 16}" y="70" fill="#6e7681" font-family="Consolas, monospace" font-size="13">data unavailable</text>`;
    return inner;
  }

  inner += `<text x="${x + 16}" y="52" fill="#c9d1d9" font-family="Consolas, monospace" font-size="22">${fmtPrice(
    data.last
  )}</text>`;
  inner += `<text x="${x + 16}" y="72" fill="${color}" font-family="Consolas, monospace" font-size="13">${
    data.changePct >= 0 ? '▲' : '▼'
  } ${Math.abs(data.changePct).toFixed(2)}%</text>`;

  const points = sparklinePoints(data.closes, x + 12, 84, width - 24, 44);
  inner += `<polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" />`;

  return inner;
}

module.exports = async (req, res) => {
  const results = await Promise.all(SYMBOLS.map(fetchSymbol));

  const panelWidth = 300;
  const width = panelWidth * results.length;
  const height = 140;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="#0d1117" />`;
  results.forEach((data, i) => {
    svg += buildPanel(data, i * panelWidth, panelWidth);
  });
  svg += `</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(svg);
};
