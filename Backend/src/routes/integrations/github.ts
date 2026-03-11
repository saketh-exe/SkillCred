import { Router } from "express";
import { analyzeGithubProfile } from "../../services/github/analyzer";

const router = Router();

// GET /api/integrations/github/analyze?username=<github_username>
router.get("/analyze", async (req, res) => {
  const username = req.query["username"];

  if (typeof username !== "string" || !username.trim()) {
    res.status(400).json({ error: "Query param 'username' is required" });
    return;
  }

  try {
    const analysis = await analyzeGithubProfile(username.trim());
    res.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not found") ? 404 : message.includes("rate limit") ? 429 : 500;
    res.status(status).json({ error: message });
  }
});

export default router;
