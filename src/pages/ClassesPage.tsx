import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit2,
  BookOpen,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { Classroom } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

interface ClassesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const teacherId = userProfile?.uid || 'demo_teacher_42';
  const teacherName = userProfile?.displayName || 'Educator';

  useEffect(() => {
    loadClasses();
  }, [teacherId]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const list = await classesService.getTeacherClasses(teacherId);
      setClasses(list || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingClass(null);
    setName('');
    setSubject('');
    setGrade('');
    setSection('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (c: Classroom) => {
    setEditingClass(c);
    setName(c.name);
    setSubject(c.subject);
    setGrade(c.grade);
    setSection(c.section || '');
    setDescription(c.description || '');
    setModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !grade.trim()) return;

    setSubmitting(true);
    try {
      if (editingClass) {
        await classesService.updateClass(editingClass.id, {
          name,
          subject,
          grade,
          section,
          description,
        });
      } else {
        await classesService.createClass({
          teacherId,
          teacherName,
          name,
          subject,
          grade,
          section,
          description,
        });
      }
      setModalOpen(false);
      await loadClasses();
    } catch (err) {
      console.error('Failed to save class:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await classesService.deleteClass(id);
      setDeleteConfirmId(null);
      await loadClasses();
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  const handleResetJoinCode = async (id: string) => {
    try {
      await classesService.resetJoinCode(id);
      await loadClasses();
    } catch (err) {
      console.error('Failed to reset join code:', err);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            My Classrooms
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Create classes, generate student join codes, and assign quizzes.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-300" />
          <span>Create New Class</span>
        </button>
      </div>

      {/* Class List */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md">
                      {cls.subject}
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-1.5 leading-snug">
                      {cls.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-stone-400">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Edit class"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(cls.id)}
                      className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete class"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-500 mb-3">
                  <span>Grade {cls.grade}</span>
                  {cls.section && (
                    <>
                      <span>•</span>
                      <span>Section {cls.section}</span>
                    </>
                  )}
                </div>

                {cls.description && (
                  <p className="text-xs text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                    {cls.description}
                  </p>
                )}
              </div>

              <div>
                {/* Join Code Box */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/70 mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      Student Join Code
                    </p>
                    <p className="font-mono text-base font-extrabold text-stone-800 tracking-wider">
                      {cls.joinCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyToClipboard(cls.joinCode)}
                      className="p-2 text-stone-500 hover:text-stone-900 hover:bg-white rounded-lg border border-transparent hover:border-stone-200 transition-all text-xs flex items-center gap-1"
                      title="Copy join code"
                    >
                      {copiedCode === cls.joinCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-semibold">Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleResetJoinCode(cls.id)}
                      className="p-2 text-stone-400 hover:text-stone-700 hover:bg-white rounded-lg transition-all"
                      title="Generate new join code"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold text-stone-700">
                      {cls.studentIds?.length || 0}
                    </span>
                    <span>students enrolled</span>
                  </div>
                  <button
                    onClick={() => onNavigate('quiz-generator')}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    Assign Quiz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No classrooms created yet"
          description="Create your first class to generate a unique join code and enroll students."
          actionText="Create Classroom"
          onAction={openCreateModal}
        />
      )}

      {/* Create / Edit Class Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'Edit Classroom' : 'Create New Classroom'}
        subtitle="Students can use the generated 6-character code to enroll."
      >
        <form onSubmit={handleSaveClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Classroom Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AP Biology, World History 101"
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Mathematics, Literature"
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Grade / Year *
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="e.g. 10th Grade, College Year 1"
                className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Section / Room (Optional)
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Section B, Room 304"
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief course overview, schedule, or syllabus notes..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Classroom"
        subtitle="This action cannot be undone."
      >
        <p className="text-xs sm:text-sm text-stone-600 mb-6">
          Are you sure you want to remove this classroom? Students enrolled will lose access to
          class-specific quizzes and announcements.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setDeleteConfirmId(null)}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteConfirmId && handleDeleteClass(deleteConfirmId)}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            Confirm Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};
