// api/news.js
//
// Endpoint ini render panel "news feed" bergaya Bloomberg Terminal untuk
// ditempel di README lewat <img>. Berita ditentukan lewat query ?q=nama_company,
// kalau tidak diisi, dipilih random dari daftar company di lib/googleNews.js.
//
// Contoh pemakaian di README:
// <img src="https://<domain-vercel-kamu>/api/news" width="100%">
// atau kalau mau company tertentu:
// <img src="https://<domain-vercel-kamu>/api/news?q=Boeing" width="100%">

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
  const rowHeight = 26;
  const headerHeight = 68;
  const rows = ok && news.length > 0 ? news : [{ title: 'Tidak ada berita ditemukan saat ini', source: '', time: '' }];
  const height = headerHeight + rows.length * rowHeight + 16;

  let rowsSvg = '';
  rows.forEach((item, i) => {
    const y = headerHeight + i * rowHeight + 18;
    rowsSvg += `<text x="20" y="${y}" fill="#6e7681" font-family="Consolas, monospace" font-size="12">${i + 1})</text>`;
    rowsSvg += `<text x="55" y="${y}" fill="#f0a020" font-family="Consolas, monospace" font-size="13">${escapeXml(
      truncate(item.title, 78)
    )}</text>`;
    rowsSvg += `<text x="${width - 140}" y="${y}" fill="#8b949e" font-family="Consolas, monospace" font-size="12">${escapeXml(
      truncate(item.source, 18)
    )}</text>`;
    rowsSvg += `<text x="${width - 55}" y="${y}" fill="#58a6ff" font-family="Consolas, monospace" font-size="12">${item.time}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#000000" rx="4" />
  <rect width="${width}" height="30" fill="#8b0000" />
  <text x="16" y="20" fill="#ffffff" font-family="Consolas, monospace" font-size="13" font-weight="bold">Search News</text>
  <text x="150" y="20" fill="#ffd9a0" font-family="Consolas, monospace" font-size="13">Actions</text>
  <text x="240" y="20" fill="#ffd9a0" font-family="Consolas, monospace" font-size="13">Key Themes</text>
  <rect y="30" width="${width}" height="30" fill="#c47a1f" />
  <text x="16" y="50" fill="#000000" font-family="Consolas, monospace" font-size="14" font-weight="bold">${escapeXml(
    query
  )}</text>
  <text x="16" y="${headerHeight - 6}" fill="#6e7681" font-family="Consolas, monospace" font-size="11">NEWS FEED</text>
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
