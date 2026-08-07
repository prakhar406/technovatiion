import fs from 'fs';
import path from 'path';

// Store in Vercel's writable /tmp directory so memory persists during executions
const DB_PATH = path.join('/tmp', 'agent_memory.json');

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify({ agents: {}, posts: [], topicMemory: [] }, null, 2)
    );
  }
}

function readDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { agents: {}, posts: [], topicMemory: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[DB Write Error]', err);
  }
}

export const db = {
  getAgent(agentId) {
    const data = readDB();
    return data.agents[agentId] || null;
  },

  getAllAgents() {
    const data = readDB();
    return Object.values(data.agents);
  },

  saveAgent(agent) {
    const data = readDB();
    data.agents[agent.id] = agent;
    writeDB(data);
  },

  getPosts(agentId) {
    const data = readDB();
    return data.posts
      .filter((p) => p.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  savePost(post) {
    const data = readDB();
    data.posts.push(post);
    writeDB(data);
  },

  getMemory(agentId) {
    const data = readDB();
    return data.topicMemory.filter((m) => m.agentId === agentId);
  },

  saveMemory(agentId, topicSummary, verdict, reason) {
    const data = readDB();
    data.topicMemory.push({
      agentId,
      topicSummary,
      verdict,
      reason,
      createdAt: new Date().toISOString(),
    });
    writeDB(data);
  },
};