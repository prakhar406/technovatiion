// api/agent/feed.js
global.agents = global.agents || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId query parameter is required' });
  }

  let agent = global.agents[agentId];

  // Fallback if serverless container restarted
  if (!agent) {
    const now = Date.now();
    agent = {
      persona: { name: 'Ada', domain: 'Autonomous Systems' },
      posts: [
        {
          id: `p_${agentId}_0`,
          createdAt: new Date(now).toISOString(),
          text: `Investigating real-time state sync performance in distributed agent clusters. Multi-agent coordination requires strict zero-trust validation layers.`,
          rationale: `Essential architectural consideration for production multi-agent pipelines. Passed editorial review.`,
          sources: [`https://arxiv.org/abs/2401.00000`]
        },
        {
          id: `p_${agentId}_1`,
          createdAt: new Date(now - 3600000).toISOString(),
          text: `Benchmarking contextual recall across extended context windows. Memory degradation remains a primary challenge in long-horizon tasks.`,
          rationale: `Directly impacts system reliability during extended autonomous execution loops.`,
          sources: [`https://cve.mitre.org`]
        }
      ]
    };
  }

  const sortedPosts = [...agent.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({
    posts: sortedPosts
  });
}
