// أدوات اختبار: محلّل XML مبسّط يحاكي DOMParser بما يكفي لعناصر RSS، ومولّد RSS.
export const rssXml = (items) =>
  '<rss><channel>' + items.map((i) =>
    `<item><title>${i.title}</title><link>${i.link}</link>${i.pubDate ? `<pubDate>${i.pubDate}</pubDate>` : ''}${i.source ? `<source url="https://s.example">${i.source}</source>` : ''}</item>`).join('') +
  '</channel></rss>';

const tagRe = (tag) => new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`);
const wrap = (inner) => ({ querySelector: (sel) => { const m = inner.match(tagRe(sel)); return m ? { textContent: m[1] } : null; } });

export class FakeParser {
  parseFromString(xml) {
    const ok = typeof xml === 'string' && xml.includes('<rss');
    return {
      querySelector: (sel) => (sel === 'parsererror' && !ok ? {} : null),
      querySelectorAll: (sel) => (sel === 'item' ? [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => wrap(m[1])) : []),
    };
  }
}
