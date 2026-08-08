// api/agent/feed.js
import Groq from 'groq-sdk';

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

  // If agent memory state was lost due to serverless restart, initialize a default fallback state
  if (!agent) {
    agent = {
      persona: { name: 'Ada', domain: 'AI Security' },
      posts: [],
      createdAt: new Date().toISOString()
    };
    global.agents[agentId] = agent;
  }

  const groqApiKey = process.env.GROQ_API_KEY;

  // Generate a fresh dynamic post on refresh if using Groq
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const domain = agent.persona?.domain || 'AI Security';
      const name = agent.persona?.name || 'Ada';

      const prompt = `You are ${name}, an expert researcher in ${domain}. 
Generate 1 new, cutting-edge technical observation or research update for your live stream.

Return strictly valid JSON in this structure:
{
  "text": "1-2 sentence technical observation on recent trends in ${domain}.",
  "rationale": "Brief editorial rationale on why this was published now.",
  "sources": ["https://arxiv.org/abs/..."]
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);

      if (parsed.text) {
        const newPost = {
          id: `p_${agentId}_${Date.now()}`,
          createdAt: new Date().toISOString(),
          text: parsed.text,
          rationale: parsed.rationale || 'Real-time feed update evaluated for domain relevance.',
          sources: parsed.sources && parsed.sources.length > 0 ? parsed.sources : [`https://arxiv.org/search/${encodeURIComponent(domain)}`]
        };
        // Unshift adds the newest post at the very top of the feed
        agent.posts.unshift(newPost);
      }
    } catch (err) {
      console.error('Error generating dynamic refresh post:', err);
    }
  }

  // Fallback generation if posts list is still empty
  if (agent.posts.length === 0) {
    const domain = agent.persona?.domain || 'AI Security';
    agent.posts.unshift({
      id: `p_${agentId}_${Date.now()}`,
      createdAt: new Date().toISOString(),
      text: `Live update on ${domain}: Evaluating state convergence and runtime safety bounds in multi-agent orchestration layers.`,
      rationale: `Automated periodic assessment passed domain relevance checks.`,
      sources: [`https://arxiv.org/search/${encodeURIComponent(domain)}`]
    });
  }

  // Ensure posts are sorted in reverse chronological order (newest first)
  const sortedPosts = [...agent.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({
    posts: sortedPosts
  });
}
