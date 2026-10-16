import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  Award,
  Clock,
  Sparkles,
  Users,
  Plus,
  Play,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { attemptsService } from '../services/attemptsService';
import { Classroom, Quiz, QuizAttempt } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

interface StudentDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const studentId = userProfile?.uid || 'demo_student_88';
  const studentName = userProfile?.displayName || 'Student';

  const [classes, setClasses] = useState<Classroom[]>([]);
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Class Modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const studentClasses = await classesService.getStudentClasses(studentId).catch(() => []);
      setClasses(studentClasses || []);

      // Fetch published quizzes for student's classes
      let allQuizzes: Quiz[] = [];
      for (const cls of studentClasses) {
        const classQs = await quizzesService.getClassQuizzes(cls.id).catch(() => []);
        allQuizzes = [...allQuizzes, ...classQs];
      }
      setAssignedQuizzes(allQuizzes);

      // Student past attempts
      const myAttempts = await attemptsService.getStudentAttempts(studentId).catch(() => []);
      setAttempts(myAttempts || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setJoinError(null);
    try {
      await classesService.joinClassWithCode(joinCode, studentId);
      setJoinCode('');
      setJoinModalOpen(false);
      await loadStudentData();
    } catch (err: any) {
      setJoinError(err.message || 'Invalid class join code');
    } finally {
      setJoining(false);
    }
  };

  // Metrics
  const completedAttempts = attempts.filter((a) => a.status === 'submitted');
  const completedQuizIds = new Set(completedAttempts.map((a) => a.quizId));

  const pendingQuizzes = assignedQuizzes.filter((q) => !completedQuizIds.has(q.id));
  const averageScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : 0;

  return (
    <div className="space-y-8">
      {/* Motivational Banner */}
      <div className="bg-[#1B2A4A] text-white rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Active Learning Session
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Ready to test your knowledge today?
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
            &ldquo;Consistent retrieval practice turns complex lecture concepts into permanent
            understanding.&rdquo;
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('student-available')}
              className="px-4 py-2 bg-amber-400 text-stone-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-amber-300 transition-colors shadow-xs flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-stone-900" />
              <span>Take Assigned Quiz</span>
            </button>
            <button
              onClick={() => setJoinModalOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors border border-white/20 flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Join a Classroom</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Quizzes"
          value={assignedQuizzes.length}
          subtitle={`Across ${classes.length} enrolled class${classes.length === 1 ? '' : 'es'}`}
          icon={CheckSquare}
          colorScheme="navy"
        />
        <StatsCard
          title="Completed Quizzes"
          value={completedAttempts.length}
          subtitle="Submitted for scoring"
          icon={Award}
          colorScheme="emerald"
        />
        <StatsCard
          title="Average Score"
          value={completedAttempts.length > 0 ? `${averageScore}%` : 'N/A'}
          subtitle={completedAttempts.length > 0 ? 'Across all submissions' : 'No quizzes completed'}
          icon={TrendingUp}
          colorScheme="blue"
        />
        <StatsCard
          title="Pending Quizzes"
          value={pendingQuizzes.length}
          subtitle="Ready to attempt"
          icon={Clock}
          colorScheme="amber"
        />
      </div>

      {/* Two Columns: Available Quizzes & Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Quizzes */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Available Assessments
              </h3>
              <p className="text-xs text-stone-500">Quizzes published for your classes</p>
            </div>
            <button
              onClick={() => onNavigate('student-available')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              View All
            </button>
          </div>

          {assignedQuizzes.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {assignedQuizzes.slice(0, 5).map((q) => {
                const hasCompleted = completedQuizIds.has(q.id);
                return (
                  <div
                    key={q.id}
                    className="py-3.5 flex items-center justify-between hover:bg-stone-50/70 px-2 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                          {q.subject}
                        </span>
                        <span className="text-xs text-stone-400 capitalize">{q.difficulty}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate mt-1">
                        {q.title}
                      </p>
                      <p className="text-[11px] text-stone-500">
                        {q.questionCount} Questions • {q.timeLimit ? `${q.timeLimit} mins` : 'Untimed'}
                      </p>
                    </div>

                    <div>
                      <button
                        onClick={() => onNavigate('quiz-attempt', { quizId: q.id })}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                          hasCompleted
                            ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                            : 'bg-[#1B2A4A] text-white hover:bg-[#15223c]'
                        }`}
                      >
                        {hasCompleted ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Retake</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No quizzes available"
              description="Join a classroom using the code provided by your teacher to see assigned quizzes."
              actionText="Enter Join Code"
              onAction={() => setJoinModalOpen(true)}
            />
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Recent Results & Feedback
              </h3>
              <p className="text-xs text-stone-500">Your graded quiz attempts</p>
            </div>
            <button
              onClick={() => onNavigate('student-results')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              All Results
            </button>
          </div>

          {completedAttempts.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {completedAttempts.slice(0, 5).map((att) => (
                <div
                  key={att.id}
                  className="py-3 flex items-center justify-between hover:bg-stone-50/70 px-2 rounded-xl transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {att.quizTitle}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Score: {att.score}/{att.totalMarks} marks •{' '}
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        att.percentage >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : att.percentage >= 60
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {att.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Award}
              title="No quiz attempts recorded"
              description="Complete your first quiz to review your score and detailed pedagogical feedback."
              actionText="Browse Quizzes"
              onAction={() => onNavigate('student-available')}
            />
          )}
        </div>
      </div>

      {/* Join Class Modal */}
      <Modal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        title="Join a Classroom"
        subtitle="Ask your teacher for the 6-character class code."
      >
        <form onSubmit={handleJoinClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Class Join Code *
            </label>
            <input
              type="text"
              required
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7X8K2M"
              className="w-full px-4 py-2.5 text-base font-mono font-bold tracking-widest text-center bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 uppercase"
            />
          </div>

          {joinError && (
            <p className="text-xs text-rose-600 font-semibold">{joinError}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setJoinModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={joining || !joinCode.trim()}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Classroom'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
