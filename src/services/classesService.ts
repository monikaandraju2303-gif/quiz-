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
  orderBy,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Classroom } from '../types';

export const classesService = {
  // Get all classes created by teacher
  async getTeacherClasses(teacherId: string): Promise<Classroom[]> {
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      const list: Classroom[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Classroom);
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get all classes a student is enrolled in
  async getStudentClasses(studentId: string): Promise<Classroom[]> {
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('studentIds', 'array-contains', studentId));
      const snap = await getDocs(q);
      const list: Classroom[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Classroom);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get single class by ID
  async getClassById(classId: string): Promise<Classroom | null> {
    const path = `classes/${classId}`;
    try {
      const snap = await getDoc(doc(db, 'classes', classId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Classroom;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // Create new class with unique join code
  async createClass(
    data: Omit<Classroom, 'id' | 'joinCode' | 'studentIds' | 'createdAt'>
  ): Promise<Classroom> {
    const path = 'classes';
    try {
      const classId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Generate readable 6-character alphanumeric join code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const newClass: Classroom = {
        ...data,
        id: classId,
        joinCode,
        studentIds: [],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'classes', classId), newClass);
      return newClass;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // Update class details
  async updateClass(classId: string, updates: Partial<Classroom>): Promise<void> {
    const path = `classes/${classId}`;
    try {
      await updateDoc(doc(db, 'classes', classId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Delete class
  async deleteClass(classId: string): Promise<void> {
    const path = `classes/${classId}`;
    try {
      await deleteDoc(doc(db, 'classes', classId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // Join class using join code
  async joinClassWithCode(joinCode: string, studentId: string): Promise<Classroom> {
    const path = 'classes';
    try {
      const cleanCode = joinCode.trim().toUpperCase();
      const q = query(collection(db, path), where('joinCode', '==', cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('Invalid class code. Please check with your teacher.');
      }

      const classDoc = snap.docs[0];
      const classData = classDoc.data() as Classroom;

      if (classData.studentIds && classData.studentIds.includes(studentId)) {
        return { ...classData, id: classDoc.id };
      }

      await updateDoc(doc(db, 'classes', classDoc.id), {
        studentIds: arrayUnion(studentId),
      });

      return {
        ...classData,
        id: classDoc.id,
        studentIds: [...(classData.studentIds || []), studentId],
      };
    } catch (err: any) {
      if (err.message.includes('Invalid class code')) {
        throw err;
      }
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Reset join code
  async resetJoinCode(classId: string): Promise<string> {
    const path = `classes/${classId}`;
    try {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let joinCode = '';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await updateDoc(doc(db, 'classes', classId), { joinCode });
      return joinCode;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },
};
