import { GoogleGenerativeAI } from "@google/generative-ai";

export interface GeneratedQuestion {
  id: string;
  skill: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface AIGenerationRequest {
  skills: string[];
  apiKey: string;
  numQuestionsPerSkill?: number;
}

export class AIQuestionGenerator {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });
  }

  async generateQuestions(
    request: AIGenerationRequest
  ): Promise<GeneratedQuestion[]> {
    const { skills, numQuestionsPerSkill = 3 } = request;

    const prompt = `Generate ${numQuestionsPerSkill} multiple-choice questions for EACH of the following skills: ${skills.join(", ")}.

Requirements:
1. Each question tests real-world practical understanding
2. Include a mix of difficulty levels: beginner, intermediate, advanced
3. Each question must have exactly 4 options
4. Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:

{
  "skillName": [
    {
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "...",
      "difficulty": "intermediate"
    }
  ]
}

The keys of the JSON object must exactly match the skill names provided.`;

    try {
      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      const cleaned = responseText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse JSON from Gemini response");
      }

      const parsed: Record<string, any[]> = JSON.parse(jsonMatch[0]);

      const allQuestions: GeneratedQuestion[] = [];
      for (const skill of skills) {
        const key =
          Object.keys(parsed).find((k) => k === skill) ||
          Object.keys(parsed).find(
            (k) => k.toLowerCase() === skill.toLowerCase()
          );
        const skillQuestions = key ? parsed[key] : [];
        if (!Array.isArray(skillQuestions)) continue;

        skillQuestions.forEach((q: any, index: number) => {
          allQuestions.push({
            id: `${skill.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}_${index}`,
            skill,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || "intermediate",
          });
        });
      }

      return allQuestions;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Error generating questions:", msg);
      throw new Error(`Failed to generate questions: ${msg}`);
    }
  }
}
