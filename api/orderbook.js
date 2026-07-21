// api/orderbook.js
//
// Endpoint ini dipanggil lewat <img src="..."> di README GitHub kamu.
// Setiap kali gambar ini di-fetch (setiap kali profil dibuka / README direfresh):
//   1) counter total visit ditambah lewat countapi.xyz (gratis, tanpa auth)
//   2) beberapa baris "wallet" digenerate dengan data acak (SOL bal, bought, sold, pnl)
//   3) semuanya dirender jadi SVG bertema dark trading terminal
//
// GANTI "NAMESPACE" di bawah jadi sesuatu yang unik (misal username GitHub kamu),
// biar counter-nya nggak nyampur sama punya orang lain yang pakai script yang sama.

const NAMESPACE = 'Dylandelany';
const KEY = 'profile-visits';
const ROWS = 6; // jumlah baris wallet yang ditampilkan tiap load

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function randomWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  const part = (len) =>
    Array.from({ length: len }, () => chars[randInt(0, chars.length - 1)]).join('');
  return `${part(4)}...${part(4)}`;
}

function fmtMoney(n) {
  return `$${n.toFixed(n < 1 ? 3 : 0)}`;
}

function generateRow() {
  const isProfit = Math.random() > 0.45;
  const solBal = rand(0.05, 3.5);
  const bought = rand(0.5, 100);
  const boughtMC = randInt(100, 500);
  const sold = rand(0.5, 100);
  const soldMC = randInt(100, 500);
  const pnlPct = isProfit ? rand(0.5, 120) : -rand(0.5, 60);
  const pnlUsd = (pnlPct / 100) * bought;

  return {
    wallet: randomWalletAddress(),
    solBal: solBal.toFixed(3),
    lastActive: `${randInt(1, 59)}m`,
    bought: fmtMoney(bought),
    boughtMC: `$${boughtMC}K`,
    sold: fmtMoney(sold),
    soldMC: `$${soldMC}K`,
    pnlUsd: `${pnlUsd >= 0 ? '+' : ''}${fmtMoney(Math.abs(pnlUsd))}`,
    pnlPct: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`,
    positive: pnlPct >= 0,
  };
}

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[c]));
}

function buildSvg(rows, totalVisits) {
  const width = 900;
  const rowHeight = 32;
  const headerHeight = 48;
  const height = headerHeight + rows.length * rowHeight + 20;

  const cols = [
    { key: 'wallet', label: 'WALLET', x: 20 },
    { key: 'solBal', label: 'SOL BAL', x: 220 },
    { key: 'bought', label: 'BOUGHT', x: 330 },
    { key: 'sold', label: 'SOLD', x: 460 },
    { key: 'pnlUsd', label: 'PNL', x: 590 },
    { key: 'pnlPct', label: 'PNL %', x: 720 },
  ];

  let rowsSvg = '';
  rows.forEach((row, i) => {
    const y = headerHeight + i * rowHeight + 22;
    const color = row.positive ? '#3fb950' : '#f85149';
    rowsSvg += `<rect x="0" y="${headerHeight + i * rowHeight}" width="${width}" height="${rowHeight}" fill="${
      i % 2 === 0 ? '#0d1117' : '#0a0d12'
    }" />`;
    rowsSvg += `<text x="${cols[0].x}" y="${y}" fill="#c9d1d9" font-family="Consolas, monospace" font-size="13">${escapeXml(
      row.wallet
    )}</text>`;
    rowsSvg += `<text x="${cols[1].x}" y="${y}" fill="#c9d1d9" font-family="Consolas, monospace" font-size="13">${row.solBal} (${row.lastActive})</text>`;
    rowsSvg += `<text x="${cols[2].x}" y="${y}" fill="#3fb950" font-family="Consolas, monospace" font-size="13">${row.bought} / ${row.boughtMC}</text>`;
    rowsSvg += `<text x="${cols[3].x}" y="${y}" fill="#f85149" font-family="Consolas, monospace" font-size="13">${row.sold} / ${row.soldMC}</text>`;
    rowsSvg += `<text x="${cols[4].x}" y="${y}" fill="${color}" font-family="Consolas, monospace" font-size="13">${row.pnlUsd}</text>`;
    rowsSvg += `<text x="${cols[5].x}" y="${y}" fill="${color}" font-family="Consolas, monospace" font-size="13">${row.pnlPct}</text>`;
  });

  const headerSvg = cols
    .map(
      (c) =>
        `<text x="${c.x}" y="30" fill="#8b949e" font-family="Consolas, monospace" font-size="12" font-weight="bold">${c.label}</text>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#0d1117" rx="6" />
  <rect width="${width}" height="${headerHeight}" fill="#161b22" />
  <text x="20" y="18" fill="#58a6ff" font-family="Consolas, monospace" font-size="11">LIVE ORDERBOOK · TOTAL VISITS: ${totalVisits}</text>
  ${headerSvg}
  ${rowsSvg}
</svg>`;
}

module.exports = async (req, res) => {
  let totalVisits = Date.now() % 100000; // fallback kalau countapi lagi down

  try {
    const r = await fetch(`https://api.countapi.xyz/hit/${NAMESPACE}/${KEY}`);
    const data = await r.json();
    if (data && typeof data.value === 'number') totalVisits = data.value;
  } catch (e) {
    // biarkan pakai fallback di atas
  }

  const rows = Array.from({ length: ROWS }, generateRow);
  const svg = buildSvg(rows, totalVisits);

  res.setHeader('Content-Type', 'image/svg+xml');
  // Header ini penting: minta browser/GitHub camo proxy jangan cache gambar ini,
  // supaya tiap kali di-load datanya benar-benar baru.
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(svg);
};
