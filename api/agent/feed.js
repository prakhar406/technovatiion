global.agents = global.agents || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { agentId } = req.query;

  if (!agentId || !global.agents[agentId]) {
    return res.status(200).json({ posts: [] });
  }

  const agent = global.agents[agentId];
  const now = new Date();

  // Filter posts that have "published" based on ISO timestamp
  const visiblePosts = agent.posts.filter(post => new Date(post.createdAt) <= now);

  // If no post has reached time yet, show at least the initial post
  const activePosts = visiblePosts.length > 0 ? visiblePosts : [agent.posts[0]];

  // Sort reverse chronological (newest first)
  const sortedPosts = [...activePosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({
    posts: sortedPosts
  });
}
