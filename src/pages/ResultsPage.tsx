import React, { useEffect, useState } from 'react';
import {
  Award,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { attemptsService } from '../services/attemptsService';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { Classroom, Quiz, QuizAttempt } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

interface ResultsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ onNavigate }) => {
  const { userProfile, role } = useAuth();
  const isTeacher = role === 'teacher';
  const currentUid = userProfile?.uid || (isTeacher ? 'demo_teacher_42' : 'demo_student_88');

  const [submissions, setSubmissions] = useState<QuizAttempt[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedQuizId, setSelectedQuizId] = useState('all');

  // Attempt detail modal
  const [detailAttempt, setDetailAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    loadResults();
  }, [currentUid, isTeacher]);

  const loadResults = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const teacherClasses = await classesService.getTeacherClasses(currentUid).catch(() => []);
        setClasses(teacherClasses || []);
        const classIds = (teacherClasses || []).map((c) => c.id);

        const [subs, qs] = await Promise.all([
          attemptsService.getTeacherSubmissions(classIds).catch(() => []),
          quizzesService.getTeacherQuizzes(currentUid).catch(() => []),
        ]);
        setSubmissions(subs || []);
        setQuizzes(qs || []);
      } else {
        const studentSubs = await attemptsService.getStudentAttempts(currentUid).catch(() => []);
        setSubmissions(studentSubs || []);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  // CSV Export for teachers
  const exportToCSV = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Student Name',
      'Student Email',
      'Quiz Title',
      'Score',
      'Total Marks',
      'Percentage (%)',
      'Time Taken (s)',
      'Submission Date',
    ];

    const rows = filteredSubmissions.map((s) => [
      `"${s.studentName || 'Student'}"`,
      `"${s.studentEmail || ''}"`,
      `"${s.quizTitle || 'Quiz'}"`,
      s.score,
      s.totalMarks,
      `${s.percentage}%`,
      s.timeTaken || 0,
      `"${s.submittedAt ? new Date(s.submittedAt).toLocaleString() : ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduQuiz_Results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (search) {
      const matchName = s.studentName.toLowerCase().includes(search.toLowerCase());
      const matchQuiz = s.quizTitle.toLowerCase().includes(search.toLowerCase());
      if (!matchName && !matchQuiz) return false;
    }
    if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
    if (selectedQuizId !== 'all' && s.quizId !== selectedQuizId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {isTeacher ? 'Student Assessment Results' : 'My Quiz Results'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            {isTeacher
              ? 'Review submissions, grade distributions, and export academic records.'
              : 'Review your completed quiz scores and pedagogical explanations.'}
          </p>
        </div>

        {isTeacher && filteredSubmissions.length > 0 && (
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs sm:text-sm font-semibold rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isTeacher ? "Search student or quiz..." : "Search quiz title..."}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          {/* Filter by Class (for teachers) */}
          {isTeacher && (
            <div>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="all">All Classrooms</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filter by Quiz */}
          <div>
            <select
              value={selectedQuizId}
              onChange={(e) => setSelectedQuizId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="all">All Quizzes</option>
              {quizzes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {filteredSubmissions.length > 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50/80 border-b border-stone-200 uppercase font-bold text-[10px] text-stone-500 tracking-wider">
                <tr>
                  {isTeacher && <th className="px-5 py-3.5">Student</th>}
                  <th className="px-5 py-3.5">Quiz Title</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Percentage</th>
                  <th className="px-5 py-3.5">Time Taken</th>
                  <th className="px-5 py-3.5">Submission Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors">
                    {isTeacher && (
                      <td className="px-5 py-3.5 font-bold text-stone-900">
                        {sub.studentName}
                        {sub.studentEmail && (
                          <span className="block text-[10px] font-normal text-stone-400">
                            {sub.studentEmail}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3.5 font-medium text-stone-800">{sub.quizTitle}</td>
                    <td className="px-5 py-3.5 font-bold text-stone-900">
                      {sub.score} / {sub.totalMarks}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          sub.percentage >= 80
                            ? 'bg-emerald-50 text-emerald-800'
                            : sub.percentage >= 60
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {sub.timeTaken ? `${Math.round(sub.timeTaken / 60)} mins` : '< 1 min'}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setDetailAttempt(sub)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="No submissions recorded"
          description={
            isTeacher
              ? 'When enrolled students take and submit quizzes, their results and answer breakdown will appear here.'
              : 'Complete your first quiz to review your score and feedback.'
          }
        />
      )}

      {/* Attempt Details Modal */}
      <Modal
        isOpen={detailAttempt !== null}
        onClose={() => setDetailAttempt(null)}
        title={`Submission Details: ${detailAttempt?.quizTitle || 'Quiz'}`}
        subtitle={`Student: ${detailAttempt?.studentName} • Score: ${detailAttempt?.percentage}% (${detailAttempt?.score}/${detailAttempt?.totalMarks} marks)`}
        maxWidth="3xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {detailAttempt?.answers &&
            Object.entries(detailAttempt.answers).map(([qId, ans]: [string, any], idx) => (
              <div
                key={qId}
                className={`p-4 rounded-xl border space-y-2 ${
                  ans.isCorrect ? 'bg-emerald-50/30 border-emerald-200' : 'bg-rose-50/30 border-rose-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-800">Item {idx + 1}</span>
                  <span
                    className={`font-bold ${
                      ans.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {ans.isCorrect ? `+${ans.marksAwarded} Marks` : '0 Marks'}
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p>
                    <span className="font-bold text-stone-500">Student Answer: </span>
                    <span className="font-semibold text-stone-900">
                      {ans.studentAnswer || '(No answer provided)'}
                    </span>
                  </p>
                  {!ans.isCorrect && ans.correctAnswer && (
                    <p>
                      <span className="font-bold text-stone-500">Model Answer: </span>
                      <span className="font-bold text-emerald-800">{ans.correctAnswer}</span>
                    </p>
                  )}
                </div>

                {ans.explanation && (
                  <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/50">
                    <span className="font-bold">Explanation:</span> {ans.explanation}
                  </p>
                )}
              </div>
            ))}
        </div>
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => setDetailAttempt(null)}
            className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};
