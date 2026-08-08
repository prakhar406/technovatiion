// api/agent/init.js
import Groq from 'groq-sdk';

global.agents = global.agents || {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { persona } = req.body || {};
    const name = persona?.name || 'Ada';
    const domain = persona?.domain || 'AI Security';

    const agentId = `agent_${Date.now()}`;
    const groqApiKey = process.env.GROQ_API_KEY;

    let generatedPosts = [];

    if (groqApiKey) {
      try {
        const groq = new Groq({ apiKey: groqApiKey });

        const prompt = `You are ${name}, a leading expert and researcher in ${domain}.
Generate 3 distinct, cutting-edge technical insights or research observations for your public feed.

Return strictly valid JSON in this exact structure without markdown code blocks:
[
  {
    "text": "Detailed 2-3 sentence technical post about a breakthrough, vulnerability, or architectural insight in ${domain}.",
    "rationale": "Clear editorial rationale explaining why this insight is critical for industry leaders.",
    "sources": ["https://arxiv.org/abs/... or valid domain research URL"]
  }
]`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });

        const rawContent = completion.choices[0]?.message?.content || '';
        const parsed = JSON.parse(rawContent);
        const postsArray = Array.isArray(parsed) ? parsed : (parsed.posts || Object.values(parsed)[0]);

        if (Array.isArray(postsArray)) {
          const now = Date.now();
          generatedPosts = postsArray.map((p, idx) => ({
            id: `p_${agentId}_${idx}`,
            createdAt: new Date(now - idx * 3600000).toISOString(),
            text: p.text,
            rationale: p.rationale,
            sources: p.sources && p.sources.length > 0 ? p.sources : [`https://arxiv.org/search/${encodeURIComponent(domain)}`]
          }));
        }
      } catch (aiErr) {
        console.error('Groq Generation Error, using dynamic fallback:', aiErr);
      }
    }

    // Dynamic fallback if Groq API key is not present or fails
    if (generatedPosts.length === 0) {
      const now = Date.now();
      generatedPosts = [
        {
          id: `p_${agentId}_0`,
          createdAt: new Date(now).toISOString(),
          text: `Analyzing recent architectural advancements in ${domain}. Current benchmark data indicates significant optimizations in latency and safety guarantees.`,
          rationale: `High impact domain update for ${domain} researchers and engineers.`,
          sources: [`https://arxiv.org/search/${encodeURIComponent(domain)}`]
        },
        {
          id: `p_${agentId}_1`,
          createdAt: new Date(now - 3600000).toISOString(),
          text: `Evaluating trade-offs between model accuracy and real-time execution bounds within ${domain} deployments.`,
          rationale: `Addresses critical deployment bottlenecks observed across enterprise environments.`,
          sources: [`https://scholar.google.com/scholar?q=${encodeURIComponent(domain)}`]
        }
      ];
    }

    // Save agent state in serverless memory cache
    global.agents[agentId] = {
      persona: { name, domain },
      posts: generatedPosts,
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({ agentId });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
