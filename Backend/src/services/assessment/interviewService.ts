import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export interface InterviewContext {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  candidateName: string;
}

export interface InterviewTurn {
  role: "interviewer" | "candidate";
  text: string;
}

export interface InterviewEvaluation {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Builds the system instruction for the Gemini Live audio interviewer.
 */
export function buildInterviewSystemInstruction(ctx: InterviewContext): string {
  return `You are an experienced, professional job interviewer conducting a real-time voice interview for the position of "${ctx.jobTitle}".

Job Description:
${ctx.jobDescription}

Key skills to evaluate: ${ctx.requiredSkills.join(", ")}

Interview Rules:
1. Act like a real human interviewer — be professional yet friendly.
2. Ask ONE question at a time. Wait for the candidate's answer before moving on.
3. Start with a brief greeting and an easy warm-up question (e.g. "Tell me about yourself").
4. Progress through: warm-up → technical/skill questions → situational/behavioral → closing.
5. Ask follow-up questions when answers are vague or incomplete.
6. Cover the key skills listed above through practical scenario questions.
7. Keep your responses concise (2-4 sentences max) since this is a spoken conversation.
8. After about 8-10 questions total, wrap up the interview naturally.
9. Do NOT reveal scores, evaluations, or that you are an AI during the interview.
10. Respond ONLY with what the interviewer would say — no stage directions, no parenthetical notes.

The candidate's name is ${ctx.candidateName}. Begin with a greeting.`;
}

// ── Zod schema for structured evaluation output ──────────────────────────────

const InterviewEvaluationSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe("0–100 score reflecting the candidate's overall interview performance."),
  summary: z
    .string()
    .describe("2-3 sentence summary of the candidate's performance during the interview."),
  strengths: z
    .array(z.string())
    .describe("Concrete strengths demonstrated by the candidate during the interview."),
  improvements: z
    .array(z.string())
    .describe("Specific areas where the candidate could improve, with actionable feedback."),
});

/**
 * Evaluates a completed interview transcript using LangChain + Gemini with structured output.
 */
export class AIInterviewerService {
  private model: ChatGoogleGenerativeAI;

  constructor(apiKey: string) {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash",
      apiKey,
      temperature: 0.3,
    });
  }

  async evaluate(
    ctx: InterviewContext,
    transcript: InterviewTurn[],
  ): Promise<InterviewEvaluation> {
    const formattedTranscript = transcript
      .map(t => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
      .join("\n");

    const structured = this.model.withStructuredOutput(InterviewEvaluationSchema);

    const result = await structured.invoke([
      {
        role: "system" as const,
        content: `You are an expert hiring evaluator. Analyze the interview transcript and produce a detailed evaluation.

Job Title: ${ctx.jobTitle}
Job Description: ${ctx.jobDescription}
Required Skills: ${ctx.requiredSkills.join(", ")}

Evaluation criteria:
- Technical knowledge and skill depth relevant to the required skills
- Communication clarity and articulation
- Problem-solving approach and thought process
- Cultural fit and professionalism
- Ability to provide concrete examples and depth of experience`,
      },
      {
        role: "human" as const,
        content: `Evaluate this interview transcript:\n\n${formattedTranscript}`,
      },
    ]);

    return result;
  }
}
