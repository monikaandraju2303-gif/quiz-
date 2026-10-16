import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { QuizAttempt } from '../types';

export const attemptsService = {
  // Get all attempts for a student
  async getStudentAttempts(studentId: string): Promise<QuizAttempt[]> {
    const path = 'attempts';
    try {
      const q = query(collection(db, path), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      const list: QuizAttempt[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QuizAttempt);
      });
      return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get attempts for a quiz (for teachers)
  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    const path = 'attempts';
    try {
      const q = query(collection(db, path), where('quizId', '==', quizId));
      const snap = await getDocs(q);
      const list: QuizAttempt[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QuizAttempt);
      });
      return list.sort((a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get all attempts for classes taught by a teacher (or filtered by teacherId)
  async getTeacherSubmissions(classIds: string[]): Promise<QuizAttempt[]> {
    if (!classIds || classIds.length === 0) return [];
    const path = 'attempts';
    try {
      // Chunk into batches of 10 if necessary (Firestore `in` limit is 10)
      const batches: string[][] = [];
      for (let i = 0; i < classIds.length; i += 10) {
        batches.push(classIds.slice(i, i + 10));
      }

      let allAttempts: QuizAttempt[] = [];
      for (const batch of batches) {
        const q = query(collection(db, path), where('classId', 'in', batch));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          allAttempts.push({ id: d.id, ...d.data() } as QuizAttempt);
        });
      }

      return allAttempts.sort(
        (a, b) => new Date(b.submittedAt || b.startedAt).getTime() - new Date(a.submittedAt || a.startedAt).getTime()
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get single attempt by ID
  async getAttemptById(attemptId: string): Promise<QuizAttempt | null> {
    const path = `attempts/${attemptId}`;
    try {
      const snap = await getDoc(doc(db, 'attempts', attemptId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as QuizAttempt;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // Start new attempt
  async startAttempt(
    data: Omit<QuizAttempt, 'id' | 'startedAt' | 'status' | 'score' | 'totalMarks' | 'percentage'>
  ): Promise<QuizAttempt> {
    const path = 'attempts';
    try {
      const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const attempt: QuizAttempt = {
        ...data,
        id,
        score: 0,
        totalMarks: 0,
        percentage: 0,
        startedAt: now,
        status: 'in-progress',
      };
      await setDoc(doc(db, 'attempts', id), attempt);
      return attempt;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // Save in-progress answers
  async saveProgress(attemptId: string, answers: Record<string, any>): Promise<void> {
    const path = `attempts/${attemptId}`;
    try {
      await updateDoc(doc(db, 'attempts', attemptId), { answers });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Submit and finalize attempt
  async submitAttempt(
    attemptId: string,
    result: {
      score: number;
      totalMarks: number;
      percentage: number;
      answers: Record<string, any>;
      timeTaken: number;
    }
  ): Promise<void> {
    const path = `attempts/${attemptId}`;
    try {
      await updateDoc(doc(db, 'attempts', attemptId), {
        ...result,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },
};
