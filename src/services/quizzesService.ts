import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Quiz, QuizStatus } from '../types';

export const quizzesService = {
  // Get all quizzes created by teacher
  async getTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
    const path = 'quizzes';
    try {
      const q = query(collection(db, path), where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      const list: Quiz[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Quiz);
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get published quizzes for a class (for students)
  async getClassQuizzes(classId: string): Promise<Quiz[]> {
    const path = 'quizzes';
    try {
      const q = query(
        collection(db, path),
        where('classId', '==', classId),
        where('status', '==', 'published')
      );
      const snap = await getDocs(q);
      const list: Quiz[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Quiz);
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get single quiz by ID
  async getQuizById(quizId: string): Promise<Quiz | null> {
    const path = `quizzes/${quizId}`;
    try {
      const snap = await getDoc(doc(db, 'quizzes', quizId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Quiz;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // Save new quiz (as draft or published)
  async saveQuiz(
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Quiz> {
    const path = 'quizzes';
    try {
      const id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newQuiz: Quiz = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'quizzes', id), newQuiz);
      return newQuiz;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // Update quiz
  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void> {
    const path = `quizzes/${quizId}`;
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Set quiz status (draft, published, archived)
  async setQuizStatus(quizId: string, status: QuizStatus): Promise<void> {
    const path = `quizzes/${quizId}`;
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Duplicate quiz
  async duplicateQuiz(quiz: Quiz, newTitle?: string): Promise<Quiz> {
    const path = 'quizzes';
    try {
      const id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const duplicated: Quiz = {
        ...quiz,
        id,
        title: newTitle || `${quiz.title} (Copy)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'quizzes', id), duplicated);
      return duplicated;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // Delete quiz
  async deleteQuiz(quizId: string): Promise<void> {
    const path = `quizzes/${quizId}`;
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};
