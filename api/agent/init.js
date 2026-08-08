export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured in Vercel.');

    const { action, domain, selectedTopic } = req.body || {};
    const targetDomain = domain || 'Technology';

    // ACTION 1: Generate Full Blog Post
    if (action === 'generate_blog') {
      const topicToWrite = selectedTopic || targetDomain;

      const blogPrompt = `You are a professional technical writer and researcher.
Write a comprehensive, engaging, and well-structured blog post about: "${topicToWrite}".

Output strictly valid JSON with this format:
{
  "title": "Compelling Title",
  "readTime": "4 min read",
  "imageKeyword1": "technology abstract",
  "imageKeyword2": "futuristic innovation",
  "introduction": "Engaging introduction paragraph...",
  "sections": [
    {
      "heading": "Section 1 Heading",
      "content": "Detailed explanation..."
    },
    {
      "heading": "Section 2 Heading",
      "content": "Detailed explanation..."
    }
  ],
  "conclusion": "Key takeaway and concluding paragraph..."
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: blogPrompt }],
          response_format: { type: 'json_object' }
        })
      });

      const data = await response.json();
      const blogContent = JSON.parse(data.choices[0]?.message?.content || '{}');
      return res.status(200).json({ type: 'blog', blog: blogContent });
    }

    // ACTION 2: Generate 5 Topics (Default)
    const topicPrompt = `You are an expert content strategist for "${targetDomain}".
Formulate EXACTLY 5 high-value, trending, and distinct article topics for a specialist in "${targetDomain}".

Output strictly valid JSON with this format:
{
  "topics": [
    {
      "title": "Topic Headline",
      "summary": "Brief 1-2 sentence rationale or teaser."
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
        messages: [{ role: 'system', content: topicPrompt }],
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const topicData = JSON.parse(data.choices[0]?.message?.content || '{}');

    return res.status(200).json({ type: 'topics', topics: topicData.topics || [] });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
}
