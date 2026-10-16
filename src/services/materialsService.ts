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
import { StudyMaterial } from '../types';

export const materialsService = {
  // Get all materials owned by user
  async getTeacherMaterials(teacherId: string): Promise<StudyMaterial[]> {
    const path = 'materials';
    try {
      const q = query(collection(db, path), where('ownerId', '==', teacherId));
      const snap = await getDocs(q);
      const list: StudyMaterial[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as StudyMaterial);
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  // Get material by ID
  async getMaterialById(materialId: string): Promise<StudyMaterial | null> {
    const path = `materials/${materialId}`;
    try {
      const snap = await getDoc(doc(db, 'materials', materialId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as StudyMaterial;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  // Save new study material
  async saveMaterial(
    data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyMaterial> {
    const path = 'materials';
    try {
      const id = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const newMaterial: StudyMaterial = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'materials', id), newMaterial);
      return newMaterial;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // Update material metadata
  async updateMaterial(materialId: string, updates: Partial<StudyMaterial>): Promise<void> {
    const path = `materials/${materialId}`;
    try {
      await updateDoc(doc(db, 'materials', materialId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  // Delete material
  async deleteMaterial(materialId: string): Promise<void> {
    const path = `materials/${materialId}`;
    try {
      await deleteDoc(doc(db, 'materials', materialId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },
};
