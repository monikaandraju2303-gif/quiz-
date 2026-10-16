import { Quiz, QuizQuestion } from '../types';

export interface ExtractedFileResult {
  fileName: string;
  mimeType: string;
  text: string;
  wordCount: number;
  pageCount: number;
  warning?: string;
}

export interface FolderImportResponse {
  success: boolean;
  totalFiles: number;
  totalQuestions: number;
  fileResults: {
    fileName: string;
    filePath?: string;
    questionCount: number;
    questions: QuizQuestion[];
    errors: string[];
  }[];
  questions: QuizQuestion[];
  summary: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
    totalMarks: number;
  };
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

export interface SampleQuestionFile {
  fileName: string;
  format: string;
  description: string;
  content: string;
}

export interface SampleFolderResponse {
  folderName: string;
  files: SampleQuestionFile[];
}

export interface TestDataStatusResponse {
  status: string;
  mode: string;
  aiEnabled: boolean;
  database: {
    connected: boolean;
    type: string;
    projectId: string;
    firestoreDatabaseId: string;
  };
  supportedImportFormats: {
    format: string;
    extension: string;
    description: string;
  }[];
  timestamp: string;
}

export interface TestQuizSimulationResponse {
  testSuite: string;
  status: string;
  totalScenarios: number;
  testResults: {
    scenario: string;
    studentName: string;
    score: number;
    maxMarks: number;
    percentage: number;
    passed: boolean;
    breakdown: Record<string, { marks: number; max: number; status: string }>;
  }[];
  questionsTested: number;
  timestamp: string;
}

export const api = {
  // Extract text from uploaded document (PDF, DOCX, TXT)
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

  // Import folder of question files (JSON, CSV, Aiken, Markdown)
  async importQuestionsFolder(files: File[]): Promise<FolderImportResponse> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    const res = await fetch('/api/import-questions-folder', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Folder import failed' }));
      throw new Error(errData.error || `Folder import failed with status ${res.status}`);
    }

    return res.json();
  },

  // Parse raw text question bank (paste Aiken, CSV, JSON, Markdown)
  async parseRawQuestions(text: string, format: string = 'auto', defaultMarks: number = 1): Promise<{
    success: boolean;
    count: number;
    questions: QuizQuestion[];
    totalMarks: number;
  }> {
    const res = await fetch('/api/parse-raw-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, format, defaultMarks }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Parsing failed' }));
      throw new Error(errData.error || `Failed to parse questions (${res.status})`);
    }

    return res.json();
  },

  // Fetch sample question folder templates for instant testing
  async getSampleQuestionFolder(): Promise<SampleFolderResponse> {
    const res = await fetch('/api/sample-question-folder');
    if (!res.ok) {
      throw new Error('Failed to load sample question folder');
    }
    return res.json();
  },

  // Grade student attempt server-side (deterministic, accurate)
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

  // Full-Stack Test Data: Run automated test quiz simulation
  async runTestDataQuizSimulation(): Promise<TestQuizSimulationResponse> {
    const res = await fetch('/api/test-data/run-test-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Failed to run test quiz simulation');
    }

    return res.json();
  },

  // Full-Stack Test Data: Status and capabilities
  async getTestDataStatus(): Promise<TestDataStatusResponse> {
    const res = await fetch('/api/test-data/status');
    if (!res.ok) {
      throw new Error('Failed to fetch test data status');
    }
    return res.json();
  },

  // Export printable exam worksheet HTML
  async exportExamPaper(quiz: Quiz, schoolName?: string, includeAnswerKey: boolean = true): Promise<string> {
    const res = await fetch('/api/export-exam-paper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz, schoolName, includeAnswerKey }),
    });

    if (!res.ok) {
      throw new Error('Failed to generate printable exam worksheet');
    }

    return res.text();
  },

  // Export Results / Gradebook to CSV
  async exportResultsCsv(attempts: any[], quizTitle?: string): Promise<string> {
    const res = await fetch('/api/export-results-csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempts, quizTitle }),
    });

    if (!res.ok) {
      throw new Error('Failed to export CSV');
    }

    return res.text();
  },

  // Check database and backend health status
  async checkDatabaseStatus(): Promise<any> {
    const res = await fetch('/api/database/status');
    if (!res.ok) throw new Error('Failed to fetch database status');
    return res.json();
  },
};
