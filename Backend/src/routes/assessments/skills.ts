import { Router, Request, Response } from "express";
import {
  SkillVerificationService,
  SkillInput,
} from "../../services/assessment/skillVerificationService";
import { AIQuestionGenerator } from "../../services/assessment/aiQuestionGenerator";

const router = Router();

// POST /api/assessments/skills/generate
router.post("/generate", async (_req: Request, res: Response) => {
  try {
    const { skills, technologies, candidateName, numQuestionsPerSkill } =
      _req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: "Configuration error",
        message: "GEMINI_API_KEY is not set",
      });
      return;
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      res.status(400).json({
        error: "Invalid input",
        message: "Please provide an array of skills",
      });
      return;
    }

    const allSkills = [
      ...new Set([
        ...skills,
        ...(technologies || []),
      ].map((s: string) => s.trim())),
    ];

    const aiGenerator = new AIQuestionGenerator(apiKey);
    const generatedQuestions = await aiGenerator.generateQuestions({
      skills: allSkills,
      apiKey,
      numQuestionsPerSkill: numQuestionsPerSkill || 3,
    });

    const input: SkillInput = {
      skills: allSkills,
      numQuestionsPerSkill: numQuestionsPerSkill || 3,
    };

    const verificationResult =
      SkillVerificationService.generateVerificationQuestions(
        input,
        generatedQuestions as any,
        candidateName
      );

    res.json({
      success: true,
      data: verificationResult,
      message: `Generated ${verificationResult.totalQuestionsGenerated} questions for ${verificationResult.skills.length} skill(s)`,
    });
  } catch (error) {
    console.error("Error generating skill verification questions:", error);

    const errorMessage = (error as Error).message || String(error);
    if (errorMessage.includes("API key") || errorMessage.includes("auth")) {
      res.status(401).json({
        error: "Authentication failed",
        message: "Invalid API key. Please check your Gemini API key.",
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
        message: errorMessage || "Failed to generate questions",
      });
    }
  }
});

// POST /api/assessments/skills/verify
router.post("/verify", (_req: Request, res: Response) => {
  try {
    const { answers, answerKey } = _req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      res.status(400).json({
        error: "Invalid input",
        message: "Please provide an array of answers",
      });
      return;
    }

    if (!answerKey || !Array.isArray(answerKey)) {
      res.status(400).json({
        error: "Invalid input",
        message: "Please provide the answer key",
      });
      return;
    }

    const result = SkillVerificationService.validateAnswers(answers, answerKey);

    res.json({
      success: true,
      data: result,
      message: `Assessment complete. Score: ${result.score}%`,
    });
  } catch (error) {
    console.error("Error verifying skill assessment:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to verify skill assessment",
    });
  }
});

export default router;
