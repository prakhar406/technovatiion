import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';
import { discoverTopics } from './rss.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runAutonomousPipeline(specificAgentId = null) {
  const agents = specificAgentId
    ? [db.getAgent(specificAgentId)].filter(Boolean)
    : db.getAllAgents();

  if (agents.length === 0) return;

  const rawCandidates = await discoverTopics();
  if (rawCandidates.length === 0) return;

  for (const agent of agents) {
    try {
      await processAgentPublishing(agent, rawCandidates);
    } catch (err) {
      console.error(`[Pipeline Error] Agent ${agent.id}:`, err.message);
    }
  }
}

async function processAgentPublishing(agent, candidates) {
  const memory = db.getMemory(agent.id);
  const memoryList = memory.map((m) => `- ${m.topicSummary} [${m.verdict}]`).join('\n');

  // Step 1: Editorial Decision Gatekeeper
  const filterPrompt = `
You are ${agent.name}, an expert persona in "${agent.domain}".

Candidate Live Topics:
${JSON.stringify(candidates, null, 2)}

Previously Evaluated Memory:
${memoryList || 'None'}

Instructions:
1. Reject any candidate topic that overlaps with previously evaluated memory.
2. Filter for topics strictly relevant to "${agent.domain}".
3. Apply editorial judgment: Select ONLY ONE top candidate worth publishing. If no topic meets your high bar, select none.

Return JSON format:
{
  "selected": true | false,
  "chosenTopic": { "title": "...", "snippet": "...", "link": "..." },
  "rejectionReason": "Why other candidates were discarded"
}
`;

  const filterRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: filterPrompt }],
    response_format: { type: 'json_object' },
  });

  const editorial = JSON.parse(filterRes.choices[0].message.content);

  if (!editorial.selected || !editorial.chosenTopic) {
    db.saveMemory(agent.id, 'Cycle evaluation', 'REJECTED', 'No topic met editorial standards');
    return;
  }

  const chosen = editorial.chosenTopic;

  // Step 2: Content Generation & Publishing Rationale
  const writerPrompt = `
You are ${agent.name}, a technical persona specialized in "${agent.domain}".
Write an opinionated post analyzing this news source:

Title: ${chosen.title}
Snippet: ${chosen.snippet}
URL: ${chosen.link}

Requirements:
1. Maintain a distinct editorial voice consistent with ${agent.domain}.
2. Keep the post concise (between 250 and 400 characters).
3. Provide a clear rationale explaining:
   - Why this topic was selected
   - Why it is relevant right now
   - Why it was chosen over competing candidates.

Return JSON format:
{
  "text": "Your post text...",
  "rationale": "Clear rationale statement..."
}
`;

  const writerRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: writerPrompt }],
    response_format: { type: 'json_object' },
  });

  const postContent = JSON.parse(writerRes.choices[0].message.content);

  // Step 3: Record Post and Store Memory
  const post = {
    id: `p-${uuidv4().slice(0, 8)}`,
    agentId: agent.id,
    createdAt: new Date().toISOString(),
    text: postContent.text,
    rationale: postContent.rationale,
    sources: [chosen.link],
  };

  db.savePost(post);
  db.saveMemory(agent.id, chosen.title, 'PUBLISHED', postContent.rationale);
}