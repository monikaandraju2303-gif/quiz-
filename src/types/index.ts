export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  schoolOrOrg?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Classroom {
  id: string;
  teacherId: string;
  teacherName?: string;
  name: string;
  subject: string;
  grade: string;
  section?: string;
  description?: string;
  joinCode: string;
  studentIds: string[];
  createdAt: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'formula_sheet' | 'reading_excerpt' | 'diagram' | 'guide';
  content: string;
  size?: string;
  dateAdded?: string;
}

export interface StudyMaterial {
  id: string;
  ownerId: string;
  classId?: string;
  title: string;
  subject: string;
  fileName?: string;
  mimeType?: string;
  storagePath?: string;
  extractedText: string;
  wordCount?: number;
  attachments?: AttachmentItem[];
  processingStatus: 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // for multiple_choice (4 items) or true_false (['True', 'False'])
  correctAnswer: string; // The correct option text or expected short answer
  explanation: string;
  marks: number;
  pageRef?: string; // Optional reference to source page or paragraph
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuizStatus = 'draft' | 'published' | 'archived';

export interface QuizReviewSettings {
  showScoreImmediately: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
}

export interface Quiz {
  id: string;
  teacherId: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  materialIds?: string[];
  attachments?: AttachmentItem[];
  allowReferenceSheet?: boolean;
  title: string;
  subject: string;
  topic: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  totalMarks: number;
  timeLimit?: number; // In minutes, optional (0 or undefined = unlimited)
  maxAttempts?: number; // 1, 2, 3 or undefined = unlimited
  status: QuizStatus;
  scheduledStart?: string;
  scheduledEnd?: string;
  reviewSettings: QuizReviewSettings;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  questionId: string;
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  maxMarks?: number;
  explanation?: string;
  feedback?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  classId?: string;
  className?: string;
  answers: Record<string, StudentAnswer>; // questionId -> answer
  score: number;
  totalMarks: number;
  percentage: number;
  startedAt: string;
  submittedAt?: string;
  status: 'in-progress' | 'submitted';
  timeTaken?: number; // seconds
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quiz_assigned' | 'quiz_graded' | 'announcement';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface QuizGeneratorConfig {
  sourceText: string;
  title: string;
  subject: string;
  topic: string;
  targetClass?: string;
  difficulty: QuizDifficulty;
  questionCount: number;
  questionTypes: QuestionType[];
  marksPerQuestion: number;
  timeLimit?: number;
  language: string;
  includeExplanations: boolean;
}
