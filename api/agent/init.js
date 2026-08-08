import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { persona } = req.body;
    const personaName = persona?.name || 'Technology Specialist';
    const personaDomain = persona?.domain || 'Technology';

    const systemPrompt = `You are an autonomous AI content specialist for the domain: "${personaDomain}".

Your task:
1. Analyze the provided RSS context or web topics.
2. Formulate 2 engaging, insightful posts tailored specifically for a "${personaName}".
3. ALWAYS generate exactly 2 posts. If source material is sparse or missing, synthesize industry insights based on standard domain knowledge for "${personaDomain}".

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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate 2 high-value posts and rationales for ${personaName} in the domain of ${personaDomain}.` }
      ],
      model: 'llama3-8b-8192',
      response_format: { type: 'json_object' }
    });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(completion.choices[0]?.message?.content || '{}');
    } catch (e) {
      parsedResponse = { posts: [] };
    }

    // Safety fallback: Ensure an empty posts array is never returned
    if (!parsedResponse.posts || !Array.isArray(parsedResponse.posts) || parsedResponse.posts.length === 0) {
      parsedResponse.posts = [
        {
          text: `Key developments in ${personaDomain}: Autonomous systems and AI workflows are accelerating rapid integration across modern infrastructure.`,
          rationale: `Direct relevance to ${personaName} operational strategy.`,
          sources: []
        },
        {
          text: `Strategic focus for ${personaName}: Optimizing multi-agent automation tools to streamline real-time data analysis.`,
          rationale: `Enhances decision-making efficiency within ${personaDomain}.`,
          sources: []
        }
      ];
    }

    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Error in agent execution:', error);
    return res.status(500).json({ 
      error: 'Failed to generate agent content',
      details: error.message 
    });
  }
}
