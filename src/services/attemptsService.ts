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
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { QuizAttempt } from '../types';
import { localAcademicStore } from './localAcademicStore';

export const attemptsService = {
  // Get all attempts for a student
  async getStudentAttempts(studentId: string): Promise<QuizAttempt[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getAttempts(studentId);
    }
    const path = 'attempts';
    try {
      const q = query(collection(db, path), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      const list: QuizAttempt[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QuizAttempt);
      });
      if (list.length === 0) {
        return localAcademicStore.getAttempts(studentId);
      }
      return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    } catch (err) {
      console.warn('Firestore getStudentAttempts fallback:', err);
      return localAcademicStore.getAttempts(studentId);
    }
  },

  // Get attempts for a quiz (for teachers)
  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getAttempts(undefined, quizId);
    }
    const path = 'attempts';
    try {
      const q = query(collection(db, path), where('quizId', '==', quizId));
      const snap = await getDocs(q);
      const list: QuizAttempt[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as QuizAttempt);
      });
      if (list.length === 0) {
        return localAcademicStore.getAttempts(undefined, quizId);
      }
      return list.sort(
        (a, b) =>
          new Date(b.submittedAt || b.startedAt).getTime() -
          new Date(a.submittedAt || a.startedAt).getTime()
      );
    } catch (err) {
      console.warn('Firestore getQuizAttempts fallback:', err);
      return localAcademicStore.getAttempts(undefined, quizId);
    }
  },

  // Get all attempts for classes taught by a teacher
  async getTeacherSubmissions(classIds: string[]): Promise<QuizAttempt[]> {
    if (!classIds || classIds.length === 0) {
      return localAcademicStore.getAttempts(undefined, undefined, undefined);
    }

    if (!auth.currentUser) {
      return localAcademicStore.getAttempts(undefined, undefined, classIds);
    }

    const path = 'attempts';
    try {
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

      if (allAttempts.length === 0) {
        return localAcademicStore.getAttempts(undefined, undefined, classIds);
      }

      return allAttempts.sort(
        (a, b) =>
          new Date(b.submittedAt || b.startedAt).getTime() -
          new Date(a.submittedAt || a.startedAt).getTime()
      );
    } catch (err) {
      console.warn('Firestore getTeacherSubmissions fallback:', err);
      return localAcademicStore.getAttempts(undefined, undefined, classIds);
    }
  },

  // Get student attempts for a teacher across all classes
  async getTeacherStudentAttempts(_teacherId?: string): Promise<QuizAttempt[]> {
    return localAcademicStore.getAttempts();
  },

  // Get single attempt by ID
  async getAttemptById(attemptId: string): Promise<QuizAttempt | null> {
    if (!auth.currentUser) {
      const all = localAcademicStore.getAttempts();
      return all.find((a) => a.id === attemptId) || null;
    }
    const path = `attempts/${attemptId}`;
    try {
      const snap = await getDoc(doc(db, 'attempts', attemptId));
      if (!snap.exists()) {
        const all = localAcademicStore.getAttempts();
        return all.find((a) => a.id === attemptId) || null;
      }
      return { id: snap.id, ...snap.data() } as QuizAttempt;
    } catch (err) {
      console.warn('Firestore getAttemptById fallback:', err);
      const all = localAcademicStore.getAttempts();
      return all.find((a) => a.id === attemptId) || null;
    }
  },

  // Start new attempt
  async startAttempt(
    data: Omit<QuizAttempt, 'id' | 'startedAt' | 'status' | 'score' | 'totalMarks' | 'percentage'>
  ): Promise<QuizAttempt> {
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

    localAcademicStore.saveAttempt(attempt);

    if (!auth.currentUser) {
      return attempt;
    }

    const path = 'attempts';
    try {
      await setDoc(doc(db, 'attempts', id), attempt);
      return attempt;
    } catch (err) {
      console.warn('Firestore startAttempt fallback:', err);
      return attempt;
    }
  },

  // Save in-progress answers
  async saveProgress(attemptId: string, answers: Record<string, any>): Promise<void> {
    localAcademicStore.updateAttempt(attemptId, { answers });
    if (!auth.currentUser) return;
    const path = `attempts/${attemptId}`;
    try {
      await updateDoc(doc(db, 'attempts', attemptId), { answers });
    } catch (err) {
      console.warn('Firestore saveProgress fallback:', err);
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
    const finalUpdates = {
      ...result,
      status: 'submitted' as const,
      submittedAt: new Date().toISOString(),
    };

    localAcademicStore.updateAttempt(attemptId, finalUpdates);

    if (!auth.currentUser) return;
    const path = `attempts/${attemptId}`;
    try {
      await updateDoc(doc(db, 'attempts', attemptId), finalUpdates);
    } catch (err) {
      console.warn('Firestore submitAttempt fallback:', err);
    }
  },

  // Record completed attempt in one operation
  async recordCompletedAttempt(
    data: Omit<QuizAttempt, 'id' | 'submittedAt'>
  ): Promise<QuizAttempt> {
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const attempt: QuizAttempt = {
      ...data,
      id,
      status: 'submitted',
      submittedAt: now,
    };

    localAcademicStore.saveAttempt(attempt);

    if (!auth.currentUser) {
      return attempt;
    }

    const path = 'attempts';
    try {
      await setDoc(doc(db, 'attempts', id), attempt);
      return attempt;
    } catch (err) {
      console.warn('Firestore recordCompletedAttempt fallback:', err);
      return attempt;
    }
  },
};
