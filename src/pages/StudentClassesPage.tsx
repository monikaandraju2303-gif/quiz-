import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  BookOpen,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { Classroom } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

interface StudentClassesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const StudentClassesPage: React.FC<StudentClassesPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const studentId = userProfile?.uid || 'demo_student_88';

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Class Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [studentId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const cls = await classesService.getStudentClasses(studentId);
      setClasses(cls || []);
    } catch (err) {
      console.error('Failed to load student classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setErrorMsg(null);
    try {
      await classesService.joinClassWithCode(joinCode, studentId);
      setJoinCode('');
      setModalOpen(false);
      await loadClasses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid join code. Please check with your teacher.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            My Enrolled Classrooms
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Classrooms where you receive teacher-assigned quizzes and exam materials.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Join with Class Code</span>
        </button>
      </div>

      {/* Classrooms Grid */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md">
                    {cls.subject}
                  </span>
                  <span className="text-xs text-stone-400">Grade {cls.grade}</span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug">{cls.name}</h3>
                {cls.teacherName && (
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                    <span>Teacher: {cls.teacherName}</span>
                  </p>
                )}

                {cls.description && (
                  <p className="text-xs text-stone-600 line-clamp-2 mt-3 leading-relaxed">
                    {cls.description}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">
                  Enrolled • {cls.studentIds?.length || 1} Peers
                </span>
                <button
                  onClick={() => onNavigate('student-available')}
                  className="px-3 py-1.5 bg-stone-100 text-stone-800 font-bold rounded-lg hover:bg-stone-200 transition-colors"
                >
                  View Quizzes
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Not enrolled in any classrooms"
          description="Enter the 6-character class code provided by your teacher to access assignments."
          actionText="Join a Class"
          onAction={() => setModalOpen(true)}
        />
      )}

      {/* Join Class Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Enter Class Join Code"
        subtitle="Codes are typically 6 alphanumeric characters (e.g. 7X8K2M)"
      >
        <form onSubmit={handleJoinClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Class Code *
            </label>
            <input
              type="text"
              required
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7X8K2M"
              className="w-full px-4 py-2.5 text-lg font-mono font-bold tracking-widest text-center bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 uppercase"
            />
          </div>

          {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {joining ? 'Enrolling...' : 'Join Classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
