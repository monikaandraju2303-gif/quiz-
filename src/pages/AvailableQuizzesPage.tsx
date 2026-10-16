import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Search,
  Play,
  RotateCcw,
  Clock,
  Award,
  BookOpen,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { attemptsService } from '../services/attemptsService';
import { Quiz, QuizAttempt } from '../types';
import { EmptyState } from '../components/common/EmptyState';

interface AvailableQuizzesPageProps {
  onNavigate: (page: string, params?: any) => void;
  practiceModeOnly?: boolean;
}

export const AvailableQuizzesPage: React.FC<AvailableQuizzesPageProps> = ({
  onNavigate,
  practiceModeOnly = false,
}) => {
  const { userProfile } = useAuth();
  const studentId = userProfile?.uid || 'demo_student_88';

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentClasses = await classesService.getStudentClasses(studentId).catch(() => []);
      let classQuizzes: Quiz[] = [];

      for (const cls of studentClasses) {
        const qList = await quizzesService.getClassQuizzes(cls.id).catch(() => []);
        classQuizzes = [...classQuizzes, ...qList];
      }

      // Also fetch attempts to determine status
      const myAttempts = await attemptsService.getStudentAttempts(studentId).catch(() => []);
      setAttempts(myAttempts || []);
      setQuizzes(classQuizzes);
    } catch (err) {
      console.error('Failed to load available quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedQuizIds = new Set(
    attempts.filter((a) => a.status === 'submitted').map((a) => a.quizId)
  );

  const subjects = Array.from(new Set(quizzes.map((q) => q.subject).filter(Boolean)));

  const filtered = quizzes.filter((q) => {
    if (practiceModeOnly && !completedQuizIds.has(q.id)) {
      // In practice mode only show quizzes that can be repeated
    }
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.subject.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          {practiceModeOnly ? 'Practice Mode' : 'Assigned Quizzes'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          {practiceModeOnly
            ? 'Retake quizzes to reinforce your understanding and achieve academic mastery.'
            : 'Explore scheduled class tests and knowledge assessments.'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or subject..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
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
        </div>
      </div>

      {/* Quizzes List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((quiz) => {
            const hasCompleted = completedQuizIds.has(quiz.id);
            const pastAttempt = attempts.find((a) => a.quizId === quiz.id && a.status === 'submitted');

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {quiz.subject}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/50">
                      {quiz.difficulty}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 leading-snug mt-1">
                    {quiz.title}
                  </h3>
                  {quiz.className && (
                    <p className="text-xs text-stone-500 mt-1">Class: {quiz.className}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-3 pt-3 border-t border-stone-100">
                    <span>{quiz.questionCount} Questions</span>
                    <span>•</span>
                    <span>{quiz.totalMarks} Marks</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{quiz.timeLimit ? `${quiz.timeLimit}m` : 'Untimed'}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                  {hasCompleted && pastAttempt ? (
                    <span className="text-xs font-bold text-emerald-700">
                      Past Score: {pastAttempt.percentage}%
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">Ready to start</span>
                  )}

                  <button
                    onClick={() => onNavigate('quiz-attempt', { quizId: quiz.id })}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 ${
                      hasCompleted
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                        : 'bg-[#1B2A4A] hover:bg-[#15223c] text-white shadow-xs'
                    }`}
                  >
                    {hasCompleted ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Practice Again</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Assessment</span>
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
          icon={CheckSquare}
          title="No quizzes found"
          description="Make sure you are enrolled in a classroom with published quizzes."
          actionText="My Classrooms"
          onAction={() => onNavigate('student-classes')}
        />
      )}
    </div>
  );
};
