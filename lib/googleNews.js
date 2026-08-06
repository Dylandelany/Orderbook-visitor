// lib/googleNews.js
//
// Helper bersama, dipakai oleh api/news.js (versi gambar untuk README) dan
// api/news-data.js (versi JSON untuk halaman live search).
// Sumber data: Google News RSS -> gratis, tanpa API key, tanpa daftar apapun.

const DEFAULT_COMPANIES = [
  'Bank Central Asia',
  'Bank Mandiri',
  'Telkom Indonesia',
  'Astra International',
  'Boeing',
  'Apple',
  'Tesla',
  'Nvidia',
  'Amazon',
  'Microsoft',
];

function pickRandomCompany() {
  return DEFAULT_COMPANIES[Math.floor(Math.random() * DEFAULT_COMPANIES.length)];
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  return m[1].replace('<![CDATA[', '').replace(']]>', '').trim();
}

function timeAgo(pubDate) {
  const diffMs = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

async function fetchCompanyNews(query, limit = 10) {
  const q = query && query.trim() ? query.trim() : pickRandomCompany();
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    q
  )}&hl=en-US&gl=US&ceid=US:en`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GithubReadmeBot/1.0)' },
    });
    const xml = await r.text();
    const items = xml.split('<item>').slice(1, limit + 1);

    const news = items.map((raw) => {
      const title = extractTag(raw, 'title');
      const pubDate = extractTag(raw, 'pubDate');
      const sourceMatch = raw.match(/<source[^>]*>([\s\S]*?)<\/source>/);
      const source = sourceMatch ? sourceMatch[1].trim() : '';
      return {
        title,
        source,
        time: pubDate ? timeAgo(pubDate) : '',
      };
    });

    return { query: q, news, ok: news.length > 0 };
  } catch (e) {
    return { query: q, news: [], ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchCompanyNews, pickRandomCompany };
