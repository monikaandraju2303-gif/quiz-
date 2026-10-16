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
import { StudyMaterial, AttachmentItem } from '../types';
import { localAcademicStore } from './localAcademicStore';

export const materialsService = {
  // Get all materials owned by user
  async getTeacherMaterials(teacherId: string): Promise<StudyMaterial[]> {
    if (!auth.currentUser) {
      return localAcademicStore.getMaterials(teacherId);
    }
    const path = 'materials';
    try {
      const q = query(collection(db, path), where('ownerId', '==', teacherId));
      const snap = await getDocs(q);
      const list: StudyMaterial[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as StudyMaterial);
      });
      if (list.length === 0) {
        return localAcademicStore.getMaterials(teacherId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      console.warn('Firestore getTeacherMaterials fallback:', err);
      return localAcademicStore.getMaterials(teacherId);
    }
  },

  // Get material by ID
  async getMaterialById(materialId: string): Promise<StudyMaterial | null> {
    if (!auth.currentUser) {
      const all = localAcademicStore.getMaterials();
      return all.find((m) => m.id === materialId) || null;
    }
    const path = `materials/${materialId}`;
    try {
      const snap = await getDoc(doc(db, 'materials', materialId));
      if (!snap.exists()) {
        const all = localAcademicStore.getMaterials();
        return all.find((m) => m.id === materialId) || null;
      }
      return { id: snap.id, ...snap.data() } as StudyMaterial;
    } catch (err) {
      console.warn('Firestore getMaterialById fallback:', err);
      const all = localAcademicStore.getMaterials();
      return all.find((m) => m.id === materialId) || null;
    }
  },

  // Save new study material with attachments
  async saveMaterial(
    data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudyMaterial> {
    const id = `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newMaterial: StudyMaterial = {
      ...data,
      id,
      attachments: data.attachments || [],
      createdAt: now,
      updatedAt: now,
    };

    localAcademicStore.saveMaterial(newMaterial);

    if (!auth.currentUser) {
      return newMaterial;
    }

    const path = 'materials';
    try {
      await setDoc(doc(db, 'materials', id), newMaterial);
      return newMaterial;
    } catch (err) {
      console.warn('Firestore saveMaterial fallback:', err);
      return newMaterial;
    }
  },

  // Add attachment to study material
  async addAttachment(materialId: string, attachment: AttachmentItem): Promise<void> {
    const material = await this.getMaterialById(materialId);
    if (!material) return;

    const currentAttachments = material.attachments || [];
    const updatedAttachments = [...currentAttachments, attachment];

    await this.updateMaterial(materialId, {
      attachments: updatedAttachments,
    });
  },

  // Remove attachment from study material
  async removeAttachment(materialId: string, attachmentId: string): Promise<void> {
    const material = await this.getMaterialById(materialId);
    if (!material) return;

    const currentAttachments = material.attachments || [];
    const updatedAttachments = currentAttachments.filter((att) => att.id !== attachmentId);

    await this.updateMaterial(materialId, {
      attachments: updatedAttachments,
    });
  },

  // Update material metadata
  async updateMaterial(materialId: string, updates: Partial<StudyMaterial>): Promise<void> {
    localAcademicStore.updateMaterial(materialId, updates);
    if (!auth.currentUser) return;
    const path = `materials/${materialId}`;
    try {
      await updateDoc(doc(db, 'materials', materialId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore updateMaterial fallback:', err);
    }
  },

  // Delete material
  async deleteMaterial(materialId: string): Promise<void> {
    localAcademicStore.deleteMaterial(materialId);
    if (!auth.currentUser) return;
    const path = `materials/${materialId}`;
    try {
      await deleteDoc(doc(db, 'materials', materialId));
    } catch (err) {
      console.warn('Firestore deleteMaterial fallback:', err);
    }
  },
};
