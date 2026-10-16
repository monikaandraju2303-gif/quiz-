import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  selectRole: (role: UserRole, schoolOrOrg?: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  useDemoTeacher: () => void;
  useDemoStudent: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_TEACHER: UserProfile = {
  uid: 'demo_teacher_42',
  displayName: 'Prof. Eleanor Vance',
  email: 'e.vance@academy.edu',
  role: 'teacher',
  schoolOrOrg: 'Oakridge Science & Arts Academy',
  createdAt: '2026-09-01T08:00:00.000Z',
};

const DEMO_STUDENT: UserProfile = {
  uid: 'demo_student_88',
  displayName: 'Marcus Chen',
  email: 'marcus.chen@student.edu',
  role: 'student',
  schoolOrOrg: 'Oakridge Science & Arts Academy',
  createdAt: '2026-09-05T09:30:00.000Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync auth state
  useEffect(() => {
    // Check if demo user was saved in sessionStorage
    const savedDemo = sessionStorage.getItem('eduquiz_demo_user');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setUserProfile(parsed);
        setLoading(false);
        return;
      } catch (e) {
        sessionStorage.removeItem('eduquiz_demo_user');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setCurrentUser(fbUser);
      if (fbUser) {
        const path = `users/${fbUser.uid}`;
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // New user without role selected yet
            const initialProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'EduQuiz User',
              email: fbUser.email || '',
              role: 'teacher', // default candidate, prompted on first login
              photoURL: fbUser.photoURL || undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.error('Failed to load user profile from Firestore:', err);
          // If error occurs, create fallback profile for the signed in Google user
          setUserProfile({
            uid: fbUser.uid,
            displayName: fbUser.displayName || 'EduQuiz User',
            email: fbUser.email || '',
            role: 'teacher',
            photoURL: fbUser.photoURL || undefined,
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    sessionStorage.removeItem('eduquiz_demo_user');
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('eduquiz_demo_user');
    setUserProfile(null);
    setCurrentUser(null);
    await firebaseSignOut(auth).catch(() => {});
  };

  const selectRole = async (role: UserRole, schoolOrOrg?: string) => {
    if (!userProfile) return;
    const path = `users/${userProfile.uid}`;
    const updated: UserProfile = {
      ...userProfile,
      role,
      schoolOrOrg: schoolOrOrg || userProfile.schoolOrOrg,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (currentUser) {
        await updateDoc(doc(db, 'users', userProfile.uid), {
          role,
          schoolOrOrg: schoolOrOrg || '',
          updatedAt: new Date().toISOString(),
        });
      } else {
        sessionStorage.setItem('eduquiz_demo_user', JSON.stringify(updated));
      }
      setUserProfile(updated);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated = { ...userProfile, ...updates, updatedAt: new Date().toISOString() };
    if (currentUser) {
      try {
        await updateDoc(doc(db, 'users', userProfile.uid), updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
      }
    } else {
      sessionStorage.setItem('eduquiz_demo_user', JSON.stringify(updated));
    }
    setUserProfile(updated);
  };

  const useDemoTeacher = () => {
    sessionStorage.setItem('eduquiz_demo_user', JSON.stringify(DEMO_TEACHER));
    setUserProfile(DEMO_TEACHER);
    setCurrentUser(null);
  };

  const useDemoStudent = () => {
    sessionStorage.setItem('eduquiz_demo_user', JSON.stringify(DEMO_STUDENT));
    setUserProfile(DEMO_STUDENT);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: userProfile?.role || null,
        loading,
        signInWithGoogle,
        signOut,
        selectRole,
        updateUserProfile,
        useDemoTeacher,
        useDemoStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
