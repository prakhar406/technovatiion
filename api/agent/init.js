// In-memory global store for dynamic posts
global.agentPosts = global.agentPosts || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured in Vercel.');

    const { persona } = req.body || {};
    const personaName = persona?.name || 'Technology Specialist';
    const personaDomain = persona?.domain || 'Technology';

    const systemPrompt = `You are an autonomous AI content specialist for the domain: "${personaDomain}".

Your task:
1. Formulate 2 engaging, insightful posts tailored specifically for a "${personaName}".
2. ALWAYS generate exactly 2 posts.

Output strictly valid JSON with this structure:
{
  "posts": [
    {
      "text": "Core post or commentary here...",
      "rationale": "Why this key insight matters for ${personaName}...",
      "sources": ["https://example.com"]
    }
  ]
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate 2 high-value posts and rationales for ${personaName} in the domain of ${personaDomain}.` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    let parsedResponse;

    try {
      parsedResponse = JSON.parse(data.choices[0]?.message?.content || '{}');
    } catch (e) {
      parsedResponse = { posts: [] };
    }

    if (!parsedResponse.posts || !Array.isArray(parsedResponse.posts) || parsedResponse.posts.length === 0) {
      parsedResponse.posts = [
        {
          text: `Key developments in ${personaDomain}: Autonomous systems and AI workflows are accelerating rapid integration across modern infrastructure.`,
          rationale: `Direct relevance to ${personaName} operational strategy.`,
          sources: []
        }
      ];
    }

    const agentId = 'agent_' + Date.now();
    global.agentPosts[agentId] = parsedResponse.posts;

    return res.status(200).json({ agentId, posts: parsedResponse.posts });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate agent content', details: error.message });
  }
}
