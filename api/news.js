
const { fetchCompanyNews } = require('../lib/googleNews');

function escapeXml(str) {
  return String(str).replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }[c]));
}

function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

function buildSvg({ query, news, ok }) {
  const width = 900;
  const rowHeight = 28;
  const topBarHeight = 30;
  const bannerHeight = 30;
  const labelHeight = 22;
  const headerHeight = topBarHeight + bannerHeight + labelHeight;
  const rows = ok && news.length > 0 ? news : [{ title: 'Tidak ada berita ditemukan saat ini', source: '', time: '' }];
  const height = headerHeight + rows.length * rowHeight + 16;
  const dividerX = width - 96; // posisi garis vertikal pemisah kolom source/time

  let rowsSvg = '';
  rows.forEach((item, i) => {
    const rowTop = headerHeight + i * rowHeight;
    const y = rowTop + 19;

    // sekat horizontal tipis antar baris, biar kesan grid/tabel jadul
    if (i > 0) {
      rowsSvg += `<line x1="0" y1="${rowTop}" x2="${width}" y2="${rowTop}" stroke="#1f1f1f" stroke-width="1" />`;
    }

    rowsSvg += `<text x="20" y="${y}" fill="#6e7681" font-family="Consolas, monospace" font-size="12">${i + 1})</text>`;
    rowsSvg += `<text x="55" y="${y}" fill="#f0a020" font-family="Consolas, monospace" font-size="13">${escapeXml(
      truncate(item.title, 74)
    )}</text>`;
    rowsSvg += `<text x="${width - 80}" y="${y}" fill="#8b949e" font-family="Consolas, monospace" font-size="12" text-anchor="end">${escapeXml(
      truncate(item.source, 16)
    )}</text>`;
    rowsSvg += `<text x="${width - 16}" y="${y}" fill="#4ea8de" font-family="Consolas, monospace" font-size="12" text-anchor="end">${item.time}</text>`;
  });

  // sekat vertikal pemisah antara judul dan kolom source/time
  let vDivider = `<line x1="${dividerX}" y1="${headerHeight}" x2="${dividerX}" y2="${height - 8}" stroke="#1f1f1f" stroke-width="1" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#000000" rx="4" />
  <rect width="${width}" height="${topBarHeight}" fill="#4a0000" />
  <line x1="0" y1="${topBarHeight}" x2="${width}" y2="${topBarHeight}" stroke="#2a0000" stroke-width="2" />
  <text x="16" y="20" fill="#ffffff" font-family="Consolas, monospace" font-size="13" font-weight="bold">Search News</text>
  <text x="150" y="20" fill="#e0b978" font-family="Consolas, monospace" font-size="13">Actions</text>
  <text x="240" y="20" fill="#e0b978" font-family="Consolas, monospace" font-size="13">Key Themes</text>
  <rect y="${topBarHeight}" width="${width}" height="${bannerHeight}" fill="#a8681f" />
  <line x1="0" y1="${topBarHeight + bannerHeight}" x2="${width}" y2="${topBarHeight + bannerHeight}" stroke="#6e4514" stroke-width="2" />
  <text x="16" y="${topBarHeight + 20}" fill="#000000" font-family="Consolas, monospace" font-size="14" font-weight="bold">${escapeXml(
    query
  )}</text>
  <text x="16" y="${topBarHeight + bannerHeight + 15}" fill="#6e7681" font-family="Consolas, monospace" font-size="11">NEWS FEED</text>
  ${vDivider}
  ${rowsSvg}
</svg>`;
}

module.exports = async (req, res) => {
  const query = req.query?.q;
  const data = await fetchCompanyNews(query, 8);
  const svg = buildSvg(data);

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).send(svg);
};
