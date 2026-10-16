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
  arrayUnion,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Classroom } from '../types';
import { localAcademicStore } from './localAcademicStore';

export const classesService = {
  // Get all classes created by teacher
  async getTeacherClasses(teacherId: string): Promise<Classroom[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getClasses(teacherId);
    }
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('teacherId', '==', teacherId));
      const snap = await getDocs(q);
      const list: Classroom[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Classroom);
      });
      if (list.length === 0) {
        return localAcademicStore.getClasses(teacherId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Firestore getTeacherClasses fallback to local store:', err);
      return localAcademicStore.getClasses(teacherId);
    }
  },

  // Get all classes a student is enrolled in
  async getStudentClasses(studentId: string): Promise<Classroom[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getClasses(undefined, studentId);
    }
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('studentIds', 'array-contains', studentId));
      const snap = await getDocs(q);
      const list: Classroom[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Classroom);
      });
      if (list.length === 0) {
        return localAcademicStore.getClasses(undefined, studentId);
      }
      return list;
    } catch (err) {
      console.warn('Firestore getStudentClasses fallback to local store:', err);
      return localAcademicStore.getClasses(undefined, studentId);
    }
  },

  // Get single class by ID
  async getClassById(classId: string): Promise<Classroom | null> {
    if (!auth.currentUser) {
      const all = localAcademicStore.getClasses();
      return all.find((c) => c.id === classId) || null;
    }
    const path = `classes/${classId}`;
    try {
      const snap = await getDoc(doc(db, 'classes', classId));
      if (!snap.exists()) {
        const all = localAcademicStore.getClasses();
        return all.find((c) => c.id === classId) || null;
      }
      return { id: snap.id, ...snap.data() } as Classroom;
    } catch (err) {
      console.warn('Firestore getClassById fallback:', err);
      const all = localAcademicStore.getClasses();
      return all.find((c) => c.id === classId) || null;
    }
  },

  // Create new class with unique join code
  async createClass(
    data: Omit<Classroom, 'id' | 'joinCode' | 'studentIds' | 'createdAt'>
  ): Promise<Classroom> {
    const classId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

    if (!auth.currentUser) {
      localAcademicStore.saveClass(newClass);
      return newClass;
    }

    const path = 'classes';
    try {
      await setDoc(doc(db, 'classes', classId), newClass);
      localAcademicStore.saveClass(newClass);
      return newClass;
    } catch (err) {
      console.warn('Firestore createClass write failed, saving locally:', err);
      localAcademicStore.saveClass(newClass);
      return newClass;
    }
  },

  // Update class details
  async updateClass(classId: string, updates: Partial<Classroom>): Promise<void> {
    localAcademicStore.updateClass(classId, updates);
    if (!auth.currentUser) return;
    const path = `classes/${classId}`;
    try {
      await updateDoc(doc(db, 'classes', classId), updates);
    } catch (err) {
      console.warn('Firestore updateClass fallback:', err);
    }
  },

  // Delete class
  async deleteClass(classId: string): Promise<void> {
    localAcademicStore.deleteClass(classId);
    if (!auth.currentUser) return;
    const path = `classes/${classId}`;
    try {
      await deleteDoc(doc(db, 'classes', classId));
    } catch (err) {
      console.warn('Firestore deleteClass fallback:', err);
    }
  },

  // Join class using join code
  async joinClassWithCode(joinCode: string, studentId: string): Promise<Classroom> {
    const cleanCode = joinCode.trim().toUpperCase();

    if (!auth.currentUser) {
      const all = localAcademicStore.getClasses();
      const match = all.find((c) => c.joinCode?.toUpperCase() === cleanCode);
      if (!match) {
        throw new Error('Invalid class code. Please check with your teacher.');
      }
      if (!match.studentIds.includes(studentId)) {
        match.studentIds.push(studentId);
        localAcademicStore.updateClass(match.id, { studentIds: match.studentIds });
      }
      return match;
    }

    const path = 'classes';
    try {
      const q = query(collection(db, path), where('joinCode', '==', cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        const all = localAcademicStore.getClasses();
        const match = all.find((c) => c.joinCode?.toUpperCase() === cleanCode);
        if (match) {
          if (!match.studentIds.includes(studentId)) {
            match.studentIds.push(studentId);
            localAcademicStore.updateClass(match.id, { studentIds: match.studentIds });
          }
          return match;
        }
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
      const all = localAcademicStore.getClasses();
      const match = all.find((c) => c.joinCode?.toUpperCase() === cleanCode);
      if (match) {
        if (!match.studentIds.includes(studentId)) {
          match.studentIds.push(studentId);
          localAcademicStore.updateClass(match.id, { studentIds: match.studentIds });
        }
        return match;
      }
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Get class by join code
  async getClassByJoinCode(joinCode: string): Promise<Classroom | null> {
    const cleanCode = joinCode.trim().toUpperCase();
    if (!auth.currentUser) {
      const all = localAcademicStore.getClasses();
      return all.find((c) => c.joinCode?.toUpperCase() === cleanCode) || null;
    }
    const path = 'classes';
    try {
      const q = query(collection(db, path), where('joinCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) {
        const all = localAcademicStore.getClasses();
        return all.find((c) => c.joinCode?.toUpperCase() === cleanCode) || null;
      }
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Classroom;
    } catch (err) {
      console.warn('Firestore getClassByJoinCode fallback:', err);
      const all = localAcademicStore.getClasses();
      return all.find((c) => c.joinCode?.toUpperCase() === cleanCode) || null;
    }
  },

  // Join class by ID directly
  async joinClass(classId: string, studentId: string): Promise<void> {
    const currentClass = await this.getClassById(classId);
    if (!currentClass) {
      throw new Error('Class not found');
    }
    if (currentClass.studentIds.includes(studentId)) {
      return;
    }
    const updatedStudentIds = [...currentClass.studentIds, studentId];
    localAcademicStore.updateClass(classId, { studentIds: updatedStudentIds });

    if (!auth.currentUser) return;
    const path = `classes/${classId}`;
    try {
      await updateDoc(doc(db, 'classes', classId), {
        studentIds: arrayUnion(studentId),
      });
    } catch (err) {
      console.warn('Firestore joinClass fallback:', err);
    }
  },

  // Reset join code
  async resetJoinCode(classId: string): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let joinCode = '';
    for (let i = 0; i < 6; i++) {
      joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    localAcademicStore.updateClass(classId, { joinCode });

    if (!auth.currentUser) return joinCode;
    const path = `classes/${classId}`;
    try {
      await updateDoc(doc(db, 'classes', classId), { joinCode });
      return joinCode;
    } catch (err) {
      return joinCode;
    }
  },
};

