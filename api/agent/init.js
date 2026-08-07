// Basic in-memory store (for testing endpoints)
const DB = {
  agents: {},
  posts: {}
};

export default function handler(req, res) {
  const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

  // 1. Endpoint: POST /api/agent/init
  if (req.method === 'POST' && pathname === '/api/agent/init') {
    const { persona } = req.body || {};
    
    if (!persona || !persona.name || !persona.domain) {
      return res.status(400).json({ error: "persona with name and domain is required" });
    }

    const agentId = "abc-123"; // Dummy hardcoded ID for basic test
    DB.agents[agentId] = persona;
    DB.posts[agentId] = [
      {
        id: "p1",
        createdAt: new Date().toISOString(),
        text: `Initial post initialized for ${persona.name} covering ${persona.domain}.`,
        rationale: "Selected to confirm system setup and endpoint connectivity.",
        sources: ["https://huggingface.co/papers"]
      }
    ];

    return res.status(200).json({ agentId });
  }

  // 2. Endpoint: GET /api/agent/feed?agentId=abc-123
  if (req.method === 'GET' && pathname === '/api/agent/feed') {
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return res.status(400).json({ error: "agentId query parameter is required" });
    }

    const posts = DB.posts[agentId] || [];
    return res.status(200).json({ posts });
  }

  // Fallback for unmatched routes
  return res.status(404).json({ error: "Endpoint not found" });
}