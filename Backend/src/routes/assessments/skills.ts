import { Router, Request, Response } from "express";
import {
  SkillVerificationService,
  SkillInput,
} from "../../services/skillVerificationService";
import { AIQuestionGenerator } from "../../services/aiQuestionGenerator";

const router = Router();

// POST /api/assessments/skills/generate
// Accepts JSON with skills and generates questions using Gemini AI
router.post("/generate", async (_req: Request, res: Response) => {
  try {
    const { skills, technologies, candidateName, numQuestionsPerSkill } =
      _req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: "Configuration error",
        message: "GEMINI_API_KEY is not set in the Backend/.env file",
      });
      return;
    }

    // Validate input
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      res.status(400).json({
        error: "Invalid input",
        message:
          "Please provide an array of skills in the 'skills' field",
      });
      return;
    }

    // Combine skills and technologies
    const allSkills = [
      ...new Set([
        ...skills,
        ...(technologies || []),
      ].map((s: string) => s.trim())),
    ];

    // Generate questions using AI
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

    // Generate verification result with shuffled questions
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
    
    // Check if it's an API key error
    const errorMessage = (error as Error).message || String(error);
    if (errorMessage.includes("API key") || errorMessage.includes("auth")) {
      res.status(401).json({
        error: "Authentication failed",
        message: "Invalid API key. Please check your Gemini API key.",
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
        message: errorMessage || "Failed to generate skill verification questions",
      });
    }
  }
});

// POST /api/assessments/skills/verify
// Accepts answers and answer key, returns score
router.post("/verify", (_req: Request, res: Response) => {
  try {
    const { answers, answerKey } = _req.body;

    // Validate input
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

    // Validate answers
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

// GET /api/assessments/skills/supported
// Returns list of supported skills
router.get("/supported", (_req: Request, res: Response) => {
  const supportedSkills = [
    "SQL",
    "JavaScript",
    "React",
    "TypeScript",
    "Node.js",
    "Express.js",
    "MongoDB",
    "Docker",
    "Python",
    "AWS",
  ];

  res.json({
    success: true,
    data: {
      supportedSkills,
      total: supportedSkills.length,
    },
  });
});

export default router;
