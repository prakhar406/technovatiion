import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'AIPersonaAgent/1.0' },
});

const RSS_FEEDS = [
  'https://news.ycombinator.com/rss',
  'https://huggingface.co/blog/feed.xml',
  'https://export.arxiv.org/rss/cs.AI',
  'https://venturebeat.com/category/ai/feed/',
];

export async function discoverTopics() {
  const candidates = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const recentItems = feed.items.slice(0, 4);

      for (const item of recentItems) {
        if (item.title && (item.link || item.guid)) {
          candidates.push({
            title: item.title,
            snippet: item.contentSnippet ? item.contentSnippet.slice(0, 250) : item.title,
            link: item.link || item.guid,
          });
        }
      }
    } catch (err) {
      console.warn(`[RSS Error] Failed fetching ${feedUrl}:`, err.message);
    }
  }

  return candidates;
}