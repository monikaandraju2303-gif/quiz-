import { useState, useCallback } from 'react';
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
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../services/firebase';
import {
  Classroom,
  StudyMaterial,
  AttachmentItem,
  Quiz,
  QuizStatus,
  QuizAttempt,
} from '../types';
import { classesService } from '../services/classesService';
import { materialsService } from '../services/materialsService';
import { quizzesService } from '../services/quizzesService';
import { attemptsService } from '../services/attemptsService';
import { useAuth } from '../context/AuthContext';

export interface UseFirestoreReturn {
  // State
  loading: boolean;
  error: string | null;
  clearError: () => void;

  // Classrooms CRUD
  getTeacherClasses: (teacherId?: string) => Promise<Classroom[]>;
  getStudentClasses: (studentId?: string) => Promise<Classroom[]>;
  getClassById: (classId: string) => Promise<Classroom | null>;
  getClassByJoinCode: (joinCode: string) => Promise<Classroom | null>;
  createClass: (
    data: Omit<Classroom, 'id' | 'createdAt' | 'studentIds'>
  ) => Promise<Classroom>;
  updateClass: (classId: string, updates: Partial<Classroom>) => Promise<void>;
  deleteClass: (classId: string) => Promise<void>;
  joinClass: (classId: string, studentId?: string) => Promise<void>;
  subscribeTeacherClasses: (
    teacherId: string,
    callback: (classes: Classroom[]) => void,
    onError?: (err: unknown) => void
  ) => Unsubscribe;

  // Study Materials CRUD
  getTeacherMaterials: (teacherId?: string) => Promise<StudyMaterial[]>;
  getMaterialById: (materialId: string) => Promise<StudyMaterial | null>;
  createMaterial: (
    data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<StudyMaterial>;
  updateMaterial: (
    materialId: string,
    updates: Partial<StudyMaterial>
  ) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;
  addMaterialAttachment: (
    materialId: string,
    attachment: AttachmentItem
  ) => Promise<void>;
  deleteMaterialAttachment: (
    materialId: string,
    attachmentId: string
  ) => Promise<void>;

  // Quizzes CRUD
  getTeacherQuizzes: (teacherId?: string) => Promise<Quiz[]>;
  getClassQuizzes: (classId: string) => Promise<Quiz[]>;
  getQuizById: (quizId: string) => Promise<Quiz | null>;
  createQuiz: (
    data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Quiz>;
  updateQuiz: (quizId: string, updates: Partial<Quiz>) => Promise<void>;
  updateQuizStatus: (quizId: string, status: QuizStatus) => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  addQuizAttachment: (
    quizId: string,
    attachment: AttachmentItem
  ) => Promise<void>;
  subscribeClassQuizzes: (
    classId: string,
    callback: (quizzes: Quiz[]) => void,
    onError?: (err: unknown) => void
  ) => Unsubscribe;

  // Quiz Attempts Helpers
  getQuizAttempts: (quizId: string) => Promise<QuizAttempt[]>;
  getStudentAttempts: (studentId?: string) => Promise<QuizAttempt[]>;
  submitQuizAttempt: (
    attempt: Omit<QuizAttempt, 'id' | 'submittedAt'>
  ) => Promise<QuizAttempt>;
}

/**
 * Custom React hook for comprehensive Firestore CRUD operations
 * covering classes, study materials, quizzes, and student quiz attempts
 * with integrated loading state, robust error handling, and demo-mode fallbacks.
 */
export function useFirestore(): UseFirestoreReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  let currentAuthUid: string | undefined;
  try {
    const authCtx = useAuth();
    currentAuthUid = authCtx.userProfile?.uid || authCtx.currentUser?.uid;
  } catch {
    // If used outside of AuthProvider, fallback to auth.currentUser?.uid
    currentAuthUid = auth.currentUser?.uid;
  }

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formatErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && typeof parsed.error === 'string') {
          return parsed.error;
        }
      } catch {
        // Not a JSON string
      }
      return err.message;
    }
    return String(err);
  };

  // ==========================================
  // CLASSROOM CRUD OPERATIONS
  // ==========================================

  const getTeacherClasses = useCallback(
    async (teacherId?: string): Promise<Classroom[]> => {
      const targetId = teacherId || currentAuthUid;
      if (!targetId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await classesService.getTeacherClasses(targetId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'classes');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const getStudentClasses = useCallback(
    async (studentId?: string): Promise<Classroom[]> => {
      const targetId = studentId || currentAuthUid;
      if (!targetId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await classesService.getStudentClasses(targetId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'classes');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const getClassById = useCallback(
    async (classId: string): Promise<Classroom | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await classesService.getClassById(classId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.GET, `classes/${classId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getClassByJoinCode = useCallback(
    async (joinCode: string): Promise<Classroom | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await classesService.getClassByJoinCode(joinCode);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'classes');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createClass = useCallback(
    async (
      data: Omit<Classroom, 'id' | 'createdAt' | 'studentIds'>
    ): Promise<Classroom> => {
      setLoading(true);
      setError(null);
      try {
        const targetTeacherId = data.teacherId || currentAuthUid || 'teacher_unknown';
        const payload = {
          ...data,
          teacherId: targetTeacherId,
        };
        const created = await classesService.createClass(payload);
        return created;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.CREATE, 'classes');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const updateClass = useCallback(
    async (classId: string, updates: Partial<Classroom>): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await classesService.updateClass(classId, updates);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteClass = useCallback(
    async (classId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await classesService.deleteClass(classId);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.DELETE, `classes/${classId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const joinClass = useCallback(
    async (classId: string, studentId?: string): Promise<void> => {
      const targetStudentId = studentId || currentAuthUid;
      if (!targetStudentId) {
        throw new Error('Student ID is required to join a class');
      }

      setLoading(true);
      setError(null);
      try {
        await classesService.joinClass(classId, targetStudentId);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `classes/${classId}`);
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const subscribeTeacherClasses = useCallback(
    (
      teacherId: string,
      callback: (classes: Classroom[]) => void,
      onError?: (err: unknown) => void
    ): Unsubscribe => {
      const path = 'classes';
      if (!auth.currentUser) {
        // If unauthenticated or demo user, retrieve from service immediately
        classesService.getTeacherClasses(teacherId).then(callback);
        return () => {};
      }

      const q = query(collection(db, path), where('teacherId', '==', teacherId));
      return onSnapshot(
        q,
        (snapshot) => {
          const list: Classroom[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as Classroom);
          });
          callback(
            list.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        },
        (error) => {
          if (onError) onError(error);
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    },
    []
  );

  // ==========================================
  // STUDY MATERIALS CRUD OPERATIONS
  // ==========================================

  const getTeacherMaterials = useCallback(
    async (teacherId?: string): Promise<StudyMaterial[]> => {
      const targetId = teacherId || currentAuthUid;
      if (!targetId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await materialsService.getTeacherMaterials(targetId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'materials');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const getMaterialById = useCallback(
    async (materialId: string): Promise<StudyMaterial | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await materialsService.getMaterialById(materialId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.GET, `materials/${materialId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createMaterial = useCallback(
    async (
      data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<StudyMaterial> => {
      setLoading(true);
      setError(null);
      try {
        const targetOwnerId = data.ownerId || currentAuthUid || 'teacher_unknown';
        const payload = {
          ...data,
          ownerId: targetOwnerId,
        };
        const created = await materialsService.saveMaterial(payload);
        return created;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.CREATE, 'materials');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const updateMaterial = useCallback(
    async (
      materialId: string,
      updates: Partial<StudyMaterial>
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await materialsService.updateMaterial(materialId, updates);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `materials/${materialId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteMaterial = useCallback(
    async (materialId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await materialsService.deleteMaterial(materialId);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.DELETE, `materials/${materialId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addMaterialAttachment = useCallback(
    async (
      materialId: string,
      attachment: AttachmentItem
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await materialsService.addAttachment(materialId, attachment);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `materials/${materialId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteMaterialAttachment = useCallback(
    async (
      materialId: string,
      attachmentId: string
    ): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await materialsService.removeAttachment(materialId, attachmentId);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `materials/${materialId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ==========================================
  // QUIZZES CRUD OPERATIONS
  // ==========================================

  const getTeacherQuizzes = useCallback(
    async (teacherId?: string): Promise<Quiz[]> => {
      const targetId = teacherId || currentAuthUid;
      if (!targetId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await quizzesService.getTeacherQuizzes(targetId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'quizzes');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const getClassQuizzes = useCallback(
    async (classId: string): Promise<Quiz[]> => {
      setLoading(true);
      setError(null);
      try {
        const result = await quizzesService.getClassQuizzes(classId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'quizzes');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getQuizById = useCallback(
    async (quizId: string): Promise<Quiz | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await quizzesService.getQuizById(quizId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.GET, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createQuiz = useCallback(
    async (
      data: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<Quiz> => {
      setLoading(true);
      setError(null);
      try {
        const targetTeacherId = data.teacherId || currentAuthUid || 'teacher_unknown';
        const payload = {
          ...data,
          teacherId: targetTeacherId,
        };
        const created = await quizzesService.saveQuiz(payload);
        return created;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.CREATE, 'quizzes');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const updateQuiz = useCallback(
    async (quizId: string, updates: Partial<Quiz>): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await quizzesService.updateQuiz(quizId, updates);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateQuizStatus = useCallback(
    async (quizId: string, status: QuizStatus): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await quizzesService.updateQuizStatus(quizId, status);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteQuiz = useCallback(
    async (quizId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await quizzesService.deleteQuiz(quizId);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.DELETE, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const addQuizAttachment = useCallback(
    async (quizId: string, attachment: AttachmentItem): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await quizzesService.addAttachment(quizId, attachment);
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.UPDATE, `quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const subscribeClassQuizzes = useCallback(
    (
      classId: string,
      callback: (quizzes: Quiz[]) => void,
      onError?: (err: unknown) => void
    ): Unsubscribe => {
      const path = 'quizzes';
      if (!auth.currentUser) {
        quizzesService.getClassQuizzes(classId).then(callback);
        return () => {};
      }

      const q = query(
        collection(db, path),
        where('classId', '==', classId),
        where('status', '==', 'published')
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const list: Quiz[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as Quiz);
          });
          callback(
            list.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          );
        },
        (error) => {
          if (onError) onError(error);
          handleFirestoreError(error, OperationType.GET, path);
        }
      );
    },
    []
  );

  // ==========================================
  // QUIZ ATTEMPTS HELPERS
  // ==========================================

  const getQuizAttempts = useCallback(
    async (quizId: string): Promise<QuizAttempt[]> => {
      setLoading(true);
      setError(null);
      try {
        const result = await attemptsService.getQuizAttempts(quizId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'attempts');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getStudentAttempts = useCallback(
    async (studentId?: string): Promise<QuizAttempt[]> => {
      const targetId = studentId || currentAuthUid;
      if (!targetId) return [];

      setLoading(true);
      setError(null);
      try {
        const result = await attemptsService.getStudentAttempts(targetId);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.LIST, 'attempts');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  const submitQuizAttempt = useCallback(
    async (
      attempt: Omit<QuizAttempt, 'id' | 'submittedAt'>
    ): Promise<QuizAttempt> => {
      setLoading(true);
      setError(null);
      try {
        const targetStudentId = attempt.studentId || currentAuthUid || 'student_unknown';
        const payload = {
          ...attempt,
          studentId: targetStudentId,
        };
        const result = await attemptsService.recordCompletedAttempt(payload);
        return result;
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        handleFirestoreError(err, OperationType.CREATE, 'attempts');
      } finally {
        setLoading(false);
      }
    },
    [currentAuthUid]
  );

  return {
    loading,
    error,
    clearError,

    // Classes
    getTeacherClasses,
    getStudentClasses,
    getClassById,
    getClassByJoinCode,
    createClass,
    updateClass,
    deleteClass,
    joinClass,
    subscribeTeacherClasses,

    // Materials
    getTeacherMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    addMaterialAttachment,
    deleteMaterialAttachment,

    // Quizzes
    getTeacherQuizzes,
    getClassQuizzes,
    getQuizById,
    createQuiz,
    updateQuiz,
    updateQuizStatus,
    deleteQuiz,
    addQuizAttachment,
    subscribeClassQuizzes,

    // Attempts
    getQuizAttempts,
    getStudentAttempts,
    submitQuizAttempt,
  };
}
