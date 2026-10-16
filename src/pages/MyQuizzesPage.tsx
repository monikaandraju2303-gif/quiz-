import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Search,
  Plus,
  Filter,
  Copy,
  Trash2,
  Eye,
  Send,
  Archive,
  Play,
  Users,
  Clock,
  Award,
  Layers,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quizzesService } from '../services/quizzesService';
import { classesService } from '../services/classesService';
import { Classroom, Quiz, QuizDifficulty, QuizStatus } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

interface MyQuizzesPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyQuizzesPage: React.FC<MyQuizzesPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QuizStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | QuizDifficulty>('all');

  // Assign class modal
  const [assigningQuiz, setAssigningQuiz] = useState<Quiz | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Preview modal
  const [previewQuiz, setPreviewQuiz] = useState<Quiz | null>(null);

  const teacherId = userProfile?.uid || 'demo_teacher_42';

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [qs, cls] = await Promise.all([
        quizzesService.getTeacherQuizzes(teacherId).catch(() => []),
        classesService.getTeacherClasses(teacherId).catch(() => []),
      ]);
      setQuizzes(qs || []);
      setClasses(cls || []);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      await quizzesService.duplicateQuiz(quiz);
      await loadData();
    } catch (err) {
      console.error('Failed to duplicate quiz:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await quizzesService.deleteQuiz(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete quiz:', err);
    }
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    const nextStatus: QuizStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await quizzesService.setQuizStatus(quiz.id, nextStatus);
      await loadData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveAssignment = async () => {
    if (!assigningQuiz) return;
    setAssigning(true);
    try {
      const targetClass = classes.find((c) => c.id === selectedClassId);
      await quizzesService.updateQuiz(assigningQuiz.id, {
        classId: selectedClassId || undefined,
        className: targetClass?.name,
      });
      setAssigningQuiz(null);
      await loadData();
    } catch (err) {
      console.error('Failed to assign quiz:', err);
    } finally {
      setAssigning(false);
    }
  };

  // Distinct subjects
  const subjects = Array.from(new Set(quizzes.map((q) => q.subject).filter(Boolean)));

  // Filtered quizzes
  const filtered = quizzes.filter((q) => {
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.subject.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (subjectFilter !== 'all' && q.subject !== subjectFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            My Quizzes
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Manage your assessment library, assign quizzes to classes, and schedule exams.
          </p>
        </div>
        <button
          onClick={() => onNavigate('quiz-generator')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] shadow-xs transition-colors self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>New AI Quiz</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                    {quiz.subject}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      quiz.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : quiz.status === 'draft'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {quiz.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 leading-snug mt-1">
                  {quiz.title}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {quiz.className ? `Assigned to: ${quiz.className}` : 'General / Practice'}
                </p>

                {/* Details Pills */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mt-3 pt-3 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-stone-400" />
                    <span>{quiz.questionCount} Questions</span>
                  </span>
                  <span>•</span>
                  <span>{quiz.totalMarks} Marks</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{quiz.timeLimit ? `${quiz.timeLimit}m` : 'Untimed'}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1 text-stone-500">
                  <button
                    onClick={() => setPreviewQuiz(quiz)}
                    className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Preview Quiz Questions"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(quiz)}
                    className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Duplicate Quiz"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setAssigningQuiz(quiz);
                      setSelectedClassId(quiz.classId || '');
                    }}
                    className="p-1.5 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Assign to Class"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-1.5 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Quiz"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(quiz)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                      quiz.status === 'published'
                        ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                        : 'bg-[#1B2A4A] text-white hover:bg-[#15223c]'
                    }`}
                  >
                    {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => onNavigate('quiz-attempt', { quizId: quiz.id })}
                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                    title="Test Take Quiz"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No quizzes match criteria"
          description="Try adjusting your filters or generate a new quiz from your course notes."
          actionText="Create AI Quiz"
          onAction={() => onNavigate('quiz-generator')}
        />
      )}

      {/* Assign to Class Modal */}
      <Modal
        isOpen={assigningQuiz !== null}
        onClose={() => setAssigningQuiz(null)}
        title="Assign Quiz to Classroom"
        subtitle={assigningQuiz?.title || ''}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Select Target Classroom
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              <option value="">No Class (Public / Self-Practice)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject} • Grade {c.grade})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              onClick={() => setAssigningQuiz(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignment}
              disabled={assigning}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl shadow-xs transition-colors"
            >
              {assigning ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Questions Preview Modal */}
      <Modal
        isOpen={previewQuiz !== null}
        onClose={() => setPreviewQuiz(null)}
        title={previewQuiz?.title || 'Quiz Preview'}
        subtitle={`${previewQuiz?.questionCount || 0} Questions • ${previewQuiz?.subject || ''}`}
        maxWidth="3xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {previewQuiz?.questions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold text-stone-700">Question {idx + 1} ({q.type.replace('_', ' ')})</span>
                <span>{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-stone-900">{q.question}</p>

              {q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctAnswer === opt;
                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg text-xs font-medium border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        {isCorrect && '✓ '}
                        {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'short_answer' && (
                <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                  <span className="font-bold">Model Answer:</span> {q.correctAnswer}
                </p>
              )}

              {q.explanation && (
                <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => setPreviewQuiz(null)}
            className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
