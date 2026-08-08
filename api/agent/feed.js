global.agentPosts = global.agentPosts || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  const { agentId } = req.query;
  const posts = global.agentPosts[agentId] || [
    {
      text: "Autonomous agents are transforming modern workflow automation.",
      rationale: "High relevance to system engineering strategy.",
      sources: []
    }
  ];

  return res.status(200).json({ posts });
}
