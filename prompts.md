# AI Collaboration Log (PROMPTS.md)

## 1. Planning & Setup
* Asked AI to explain the project requirements and help design the backend API routes needed for the hackathon (`/api/agent/init` and `/api/agent/feed`).
* Worked through how serverless functions work on Vercel and why we needed a simple memory structure based on `agentId`.

## 2. Backend & AI Integration
* Prompted AI to help write Node.js handlers in `api/agent/init.js` and `api/agent/feed.js` using Next.js/Vercel serverless format.
* Integrated the Groq SDK (`llama-3.1-8b-instant`) to generate persona-based content, publishing rationales, and research source links as structured JSON.
* Added fallback logic so the feed still returns valid data if API rate limits are hit or if serverless memory resets.

## 3. Frontend & Iteration
* Built a clean single-page dashboard in `index.html` to test initializing agents and fetching feed data.
* Refined the UI with AI assistance to replace free-text domain inputs with a dropdown select menu and added a live Refresh button to trigger new post updates.
