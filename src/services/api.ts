import { Quiz, QuizGeneratorConfig, QuizQuestion } from '../types';

export interface ExtractedFileResult {
  fileName: string;
  mimeType: string;
  text: string;
  wordCount: number;
  pageCount: number;
  warning?: string;
}

export interface GeneratedQuizResponse {
  title: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  questionCount: number;
  totalMarks: number;
}

export interface GradedAttemptResponse {
  score: number;
  totalMarks: number;
  percentage: number;
  gradedAnswers: Record<string, {
    questionId: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    marksAwarded: number;
    maxMarks: number;
    feedback: string;
    explanation: string;
  }>;
}

export const api = {
  // Extract text from uploaded document (PDF, DOCX, TXT, or Image)
  async extractText(file: File): Promise<ExtractedFileResult> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/extract-text', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errData.error || `Failed to extract text (${res.status})`);
    }

    return res.json();
  },

  // Generate quiz using Gemini AI on the backend
  async generateQuiz(config: QuizGeneratorConfig): Promise<GeneratedQuizResponse> {
    const res = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'AI generation failed' }));
      throw new Error(errData.error || `AI Quiz Generation failed (${res.status})`);
    }

    return res.json();
  },

  // Regenerate a single question with optional teacher prompt
  async regenerateQuestion(
    currentQuestion: QuizQuestion,
    sourceText: string,
    context: { subject?: string; topic?: string; difficulty?: string; instruction?: string }
  ): Promise<QuizQuestion> {
    const res = await fetch('/api/regenerate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentQuestion,
        sourceText,
        ...context,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Regeneration failed' }));
      throw new Error(errData.error || `Question regeneration failed (${res.status})`);
    }

    return res.json();
  },

  // Grade student attempt server-side
  async gradeAttempt(
    questions: QuizQuestion[],
    answers: Record<string, { studentAnswer: string } | string>
  ): Promise<GradedAttemptResponse> {
    const res = await fetch('/api/grade-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Grading failed' }));
      throw new Error(errData.error || `Attempt scoring failed (${res.status})`);
    }

    return res.json();
  },
};
