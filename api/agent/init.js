import { db } from '../../src/db.js';
import { runAutonomousPipeline } from '../../src/agent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { persona } = req.body || {};

  if (!persona || !persona.name || !persona.domain) {
    return res.status(400).json({ error: 'persona.name and persona.domain are required.' });
  }

  const agentId = `agent-${Date.now()}`;
  const agent = {
    id: agentId,
    name: persona.name,
    domain: persona.domain,
    createdAt: new Date().toISOString(),
  };

  db.saveAgent(agent);

  // Trigger initial topic evaluation & post generation in background
  runAutonomousPipeline(agentId).catch((err) =>
    console.error('[Init Trigger Error]', err)
  );

  return res.status(200).json({ agentId });
}