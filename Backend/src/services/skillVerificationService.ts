export interface SkillInput {
  skills: string[];
  technologies?: string[];
  numQuestionsPerSkill?: number;
}

export interface VerificationQuestion {
  id: string;
  skill: string;
  question: string;
  options: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface VerificationResult {
  candidateName?: string;
  date: string;
  skills: {
    skill: string;
    questions: VerificationQuestion[];
    totalQuestions: number;
  }[];
  totalQuestionsGenerated: number;
  answerKey: {
    questionId: string;
    skill: string;
    correctAnswer: string;
    explanation: string;
  }[];
}

export class SkillVerificationService {
  static generateVerificationQuestions(
    input: SkillInput,
    questions: { id: string; skill: string; question: string; options: string[]; difficulty: string }[],
    candidateName?: string
  ): VerificationResult {
    // Shuffle options for each question
    const questionsWithShuffledOptions = questions.map(q => ({
      ...q,
      options: this.shuffleArray([...q.options])
    }));

    // Group by skill
    const skillGroups: Record<string, typeof questionsWithShuffledOptions> = {};
    questionsWithShuffledOptions.forEach(q => {
      if (!skillGroups[q.skill]) {
        skillGroups[q.skill] = [];
      }
      skillGroups[q.skill].push(q);
    });

    // Create verification questions and answer key
    const verificationQuestions = questionsWithShuffledOptions.map(q => ({
      id: q.id,
      skill: q.skill,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty as "beginner" | "intermediate" | "advanced",
    }));

    const answerKey: { questionId: string; skill: string; correctAnswer: string; explanation: string }[] = [];
    const letterToIndex: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };
    questions.forEach(q => {
      const raw: string = (q as any).correctAnswer ?? '';
      // Gemini returns a letter ("A"/"B"/"C"/"D") — resolve it to the full
      // option text from the ORIGINAL (pre-shuffle) options array so the
      // stored answer matches exactly what the user selects.
      const idx = letterToIndex[raw.trim().toUpperCase()];
      const correctAnswerText =
        idx !== undefined ? q.options[idx] : (raw || q.options[0]);
      answerKey.push({
        questionId: q.id,
        skill: q.skill,
        correctAnswer: correctAnswerText,
        explanation: (q as any).explanation || 'Answer validation complete.',
      });
    });

    const skillResults = Object.entries(skillGroups).map(([skill, skillQuestions]) => ({
      skill,
      questions: skillQuestions.map(q => ({
        id: q.id,
        skill: q.skill,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty as "beginner" | "intermediate" | "advanced",
      })),
      totalQuestions: skillQuestions.length,
    }));

    const totalQuestions = verificationQuestions.length;

    return {
      candidateName,
      date: new Date().toISOString(),
      skills: skillResults,
      totalQuestionsGenerated: totalQuestions,
      answerKey,
    };
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  static validateAnswers(
    answers: { questionId: string; selectedAnswer: string }[],
    answerKey: {
      questionId: string;
      skill: string;
      correctAnswer: string;
      explanation: string;
    }[]
  ): {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    score: number;
    results: {
      questionId: string;
      skill: string;
      isCorrect: boolean;
      correctAnswer: string;
      selectedAnswer: string;
      explanation: string;
    }[];
  } {
    let correctCount = 0;
    const results = answers.map((answer) => {
      const keyEntry = answerKey.find((k) => k.questionId === answer.questionId);

      if (!keyEntry) {
        return {
          questionId: answer.questionId,
          skill: "Unknown",
          isCorrect: false,
          correctAnswer: "Unknown",
          selectedAnswer: answer.selectedAnswer,
          explanation: "Question not found in answer key",
        };
      }

      const isCorrect =
        answer.selectedAnswer.toLowerCase() ===
        keyEntry.correctAnswer.toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: answer.questionId,
        skill: keyEntry.skill,
        isCorrect,
        correctAnswer: keyEntry.correctAnswer,
        selectedAnswer: answer.selectedAnswer,
        explanation: keyEntry.explanation,
      };
    });

    const score = Math.round((correctCount / answers.length) * 100);

    return {
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      wrongAnswers: answers.length - correctCount,
      score,
      results,
    };
  }
}
