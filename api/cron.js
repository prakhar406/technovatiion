import { runAutonomousPipeline } from '../src/agent.js';

export default async function handler(req, res) {
  try {
    await runAutonomousPipeline();
    return res.status(200).json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}