import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Manages a Gemini-powered AI interviewer conversation.
 * Rate-limited: tracks the last call timestamp and enforces a minimum gap.
 */
export class AIInterviewerService {
  private model: any;
  private static MIN_CALL_GAP_MS = 3000; // 3-second minimum between API calls
  private lastCallTime = 0;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  }

  /** Enforce rate limiting. Throws if called too fast. */
  private enforceRateLimit(): void {
    const now = Date.now();
    if (now - this.lastCallTime < AIInterviewerService.MIN_CALL_GAP_MS) {
      throw new Error("Rate limited – please wait a moment before sending another message.");
    }
    this.lastCallTime = now;
  }

  /** Build the system prompt for the interviewer persona. */
  private buildSystemPrompt(ctx: InterviewContext): string {
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
7. Keep your responses concise (2-4 sentences max) since they will be spoken aloud via TTS.
8. After about 8-10 questions total, wrap up the interview naturally.
9. Do NOT reveal scores, evaluations, or that you are an AI during the interview.
10. Respond ONLY with what the interviewer would say — no stage directions, no parenthetical notes.

The candidate's name is ${ctx.candidateName}.`;
  }

  /** Generate the opening question for the interview. */
  async startInterview(ctx: InterviewContext): Promise<string> {
    this.enforceRateLimit();

    const systemPrompt = this.buildSystemPrompt(ctx);
    const contents = [
      { role: "user" as const, parts: [{ text: systemPrompt }] },
      { role: "model" as const, parts: [{ text: "Understood. I will conduct this interview professionally." }] },
      { role: "user" as const, parts: [{ text: "The candidate has just joined the call. Begin the interview with a greeting." }] },
    ];

    const result = await this.model.generateContent({ contents });
    return result.response.text().trim();
  }

  /** Send the candidate's answer and get the next interviewer response. */
  async chat(
    ctx: InterviewContext,
    history: InterviewTurn[],
    candidateMessage: string,
  ): Promise<string> {
    this.enforceRateLimit();

    const systemPrompt = this.buildSystemPrompt(ctx);

    // Build Gemini contents array from conversation history
    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I will conduct this interview professionally." }] },
    ];

    for (const turn of history) {
      contents.push({
        role: turn.role === "candidate" ? "user" : "model",
        parts: [{ text: turn.text }],
      });
    }

    // Add the new candidate message
    contents.push({ role: "user", parts: [{ text: candidateMessage }] });

    const result = await this.model.generateContent({ contents });
    return result.response.text().trim();
  }

  /** After the interview ends, ask Gemini to evaluate the full transcript. */
  async evaluate(
    ctx: InterviewContext,
    transcript: InterviewTurn[],
  ): Promise<InterviewEvaluation> {
    this.enforceRateLimit();

    const formattedTranscript = transcript
      .map(t => `${t.role === "interviewer" ? "Interviewer" : "Candidate"}: ${t.text}`)
      .join("\n");

    const prompt = `You are an expert hiring evaluator. Evaluate the following job interview transcript.

Job Title: ${ctx.jobTitle}
Job Description: ${ctx.jobDescription}
Required Skills: ${ctx.requiredSkills.join(", ")}

Transcript:
${formattedTranscript}

Return ONLY a valid JSON object (no markdown, no code fences) with this structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence summary of the candidate's performance>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<area 1>", "<area 2>", ...]
}`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse evaluation from Gemini");

    return JSON.parse(jsonMatch[0]) as InterviewEvaluation;
  }
}
