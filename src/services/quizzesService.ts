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
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Quiz, QuizStatus, AttachmentItem } from '../types';
import { localAcademicStore } from './localAcademicStore';

export const quizzesService = {
  // Get all quizzes created by teacher
  async getTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getQuizzes(teacherId);
    }
    const path = 'quizzes';
    try {
      const q = query(collection(db, path), where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      const list: Quiz[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Quiz);
      });
      if (list.length === 0) {
        return localAcademicStore.getQuizzes(teacherId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Firestore getTeacherQuizzes fallback:', err);
      return localAcademicStore.getQuizzes(teacherId);
    }
  },

  // Get published quizzes for a class (for students)
  async getClassQuizzes(classId: string): Promise<Quiz[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getQuizzes(undefined, classId);
    }
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
      if (list.length === 0) {
        return localAcademicStore.getQuizzes(undefined, classId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Firestore getClassQuizzes fallback:', err);
      return localAcademicStore.getQuizzes(undefined, classId);
    }
  },

  // Get single quiz by ID
  async getQuizById(quizId: string): Promise<Quiz | null> {
    if (!auth.currentUser) {
      return localAcademicStore.getQuizById(quizId);
    }
    const path = `quizzes/${quizId}`;
    try {
      const snap = await getDoc(doc(db, 'quizzes', quizId));
      if (!snap.exists()) {
        return localAcademicStore.getQuizById(quizId);
      }
      return { id: snap.id, ...snap.data() } as Quiz;
    } catch (err) {
      console.warn('Firestore getQuizById fallback:', err);
      return localAcademicStore.getQuizById(quizId);
    }
  },

  // Save new quiz (as draft or published)
  async saveQuiz(
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Quiz> {
    const id = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newQuiz: Quiz = {
      ...data,
      id,
      attachments: data.attachments || [],
      allowReferenceSheet: data.allowReferenceSheet ?? true,
      createdAt: now,
      updatedAt: now,
    };

    localAcademicStore.saveQuiz(newQuiz);

    if (!auth.currentUser) {
      return newQuiz;
    }

    const path = 'quizzes';
    try {
      await setDoc(doc(db, 'quizzes', id), newQuiz);
      return newQuiz;
    } catch (err) {
      console.warn('Firestore saveQuiz fallback:', err);
      return newQuiz;
    }
  },

  // Alias for creating a quiz
  async createQuiz(
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Quiz> {
    return this.saveQuiz(data);
  },

  // Update quiz
  async updateQuiz(quizId: string, updates: Partial<Quiz>): Promise<void> {
    localAcademicStore.updateQuiz(quizId, updates);
    if (!auth.currentUser) return;
    const path = `quizzes/${quizId}`;
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore updateQuiz fallback:', err);
    }
  },

  // Attach reference sheet / notes to quiz
  async addQuizAttachment(quizId: string, attachment: AttachmentItem): Promise<void> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) return;
    const current = quiz.attachments || [];
    await this.updateQuiz(quizId, {
      attachments: [...current, attachment],
      allowReferenceSheet: true,
    });
  },

  async addAttachment(quizId: string, attachment: AttachmentItem): Promise<void> {
    return this.addQuizAttachment(quizId, attachment);
  },

  // Remove attachment from quiz
  async removeAttachment(quizId: string, attachmentId: string): Promise<void> {
    const quiz = await this.getQuizById(quizId);
    if (!quiz) return;
    const current = quiz.attachments || [];
    await this.updateQuiz(quizId, {
      attachments: current.filter((att) => att.id !== attachmentId),
    });
  },

  // Set quiz status (draft, published, archived)
  async setQuizStatus(quizId: string, status: QuizStatus): Promise<void> {
    localAcademicStore.updateQuiz(quizId, { status });
    if (!auth.currentUser) return;
    const path = `quizzes/${quizId}`;
    try {
      await updateDoc(doc(db, 'quizzes', quizId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore setQuizStatus fallback:', err);
    }
  },

  async updateQuizStatus(quizId: string, status: QuizStatus): Promise<void> {
    return this.setQuizStatus(quizId, status);
  },

  // Duplicate quiz
  async duplicateQuiz(quiz: Quiz, newTitle?: string): Promise<Quiz> {
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

    localAcademicStore.saveQuiz(duplicated);
    if (!auth.currentUser) return duplicated;

    const path = 'quizzes';
    try {
      await setDoc(doc(db, 'quizzes', id), duplicated);
      return duplicated;
    } catch (err) {
      console.warn('Firestore duplicateQuiz fallback:', err);
      return duplicated;
    }
  },

  // Delete quiz
  async deleteQuiz(quizId: string): Promise<void> {
    localAcademicStore.deleteQuiz(quizId);
    if (!auth.currentUser) return;
    const path = `quizzes/${quizId}`;
    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
    } catch (err) {
      console.warn('Firestore deleteQuiz fallback:', err);
    }
  },
};
