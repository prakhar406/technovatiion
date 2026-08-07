import { db } from '../../src/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId query parameter is required.' });
  }

  const posts = db.getPosts(agentId);

  // Format response to match official evaluation schema exactly
  const formattedPosts = posts.map(({ id, createdAt, text, rationale, sources }) => ({
    id,
    createdAt,
    text,
    rationale,
    sources,
  }));

  return res.status(200).json({ posts: formattedPosts });
}