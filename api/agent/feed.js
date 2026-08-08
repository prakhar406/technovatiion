export default async function handler(req, res) {
  return res.status(200).json({
    posts: [
      {
        text: "Autonomous agents are transforming modern workflow automation.",
        rationale: "High relevance to system engineering strategy.",
        sources: []
      }
    ]
  });
}
