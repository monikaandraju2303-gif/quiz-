import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Check,
  Send,
  RotateCcw,
  BookOpen,
  Award,
  ChevronRight,
  Sparkles,
  XCircle,
  Paperclip,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quizzesService } from '../services/quizzesService';
import { attemptsService } from '../services/attemptsService';
import { api } from '../services/api';
import { Quiz, QuizAttempt, QuizQuestion, StudentAnswer, AttachmentItem } from '../types';
import { Modal } from '../components/common/Modal';

interface QuizAttemptPageProps {
  quizId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const QuizAttemptPage: React.FC<QuizAttemptPageProps> = ({ quizId, onNavigate }) => {
  const { userProfile, role } = useAuth();
  const studentId = userProfile?.uid || 'demo_student_88';
  const studentName = userProfile?.displayName || 'Student';
  const studentEmail = userProfile?.email || 'student@school.edu';

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Attempt States: 'briefing' | 'active' | 'result'
  const [attemptState, setAttemptState] = useState<'briefing' | 'active' | 'result'>('briefing');
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Quiz Navigation & Answers
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> answer text
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);

  // Submission & Scoring
  const [submitting, setSubmitting] = useState(false);
  const [gradedResult, setGradedResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
    gradedAnswers: Record<string, any>;
  } | null>(null);

  // Submit confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const q = await quizzesService.getQuizById(quizId);
      if (q) {
        setQuiz(q);
        if (q.timeLimit && q.timeLimit > 0) {
          setSecondsRemaining(q.timeLimit * 60);
        }
      }
    } catch (err) {
      console.error('Failed to load quiz for attempt:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown hook
  useEffect(() => {
    if (attemptState !== 'active' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptState, secondsRemaining]);

  const handleStartAttempt = async () => {
    if (!quiz) return;
    setStartTime(Date.now());
    try {
      const newAttempt = await attemptsService.startAttempt({
        quizId: quiz.id,
        quizTitle: quiz.title,
        studentId,
        studentName,
        studentEmail,
        classId: quiz.classId,
        className: quiz.className,
        answers: {},
      });
      setAttemptId(newAttempt.id);
      setAttemptState('active');
    } catch (err) {
      console.error('Failed to initialize attempt:', err);
      // Fallback local attempt id
      setAttemptId(`att_local_${Date.now()}`);
      setAttemptState('active');
    }
  };

  const handleAnswerSelect = (questionId: string, answerText: string) => {
    const updated = { ...answers, [questionId]: answerText };
    setAnswers(updated);

    // Autosave progress to Firestore
    if (attemptId) {
      attemptsService.saveProgress(attemptId, updated).catch(() => {});
    }
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview({
      ...markedForReview,
      [questionId]: !markedForReview[questionId],
    });
  };

  const handleAutoSubmit = () => {
    submitQuizAttempt();
  };

  const submitQuizAttempt = async () => {
    if (!quiz) return;
    setSubmitting(true);
    setConfirmModalOpen(false);

    try {
      const timeTakenSec = Math.round((Date.now() - startTime) / 1000);

      // Server-side scoring and grading verification!
      const result = await api.gradeAttempt(quiz.questions, answers);
      setGradedResult(result);

      // Save to Firestore
      if (attemptId) {
        await attemptsService.submitAttempt(attemptId, {
          score: result.score,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          answers: result.gradedAnswers,
          timeTaken: timeTakenSec,
        });
      }

      setAttemptState('result');

      // Celebration effect for scores >= 80%
      if (result.percentage >= 80) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      alert('Error during submission grading: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold text-stone-500">Loading assessment...</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-800">Quiz Not Found</h3>
        <p className="text-xs text-stone-500 mt-1 mb-4">
          The requested quiz may have been deleted or unpublished.
        </p>
        <button
          onClick={() => onNavigate(role === 'teacher' ? 'quizzes' : 'student-available')}
          className="px-4 py-2 bg-[#1B2A4A] text-white text-xs font-semibold rounded-xl"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  // Formatting timer seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. BRIEFING SCREEN */}
      {attemptState === 'briefing' && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="border-b border-stone-100 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                {quiz.subject}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50">
                {quiz.difficulty}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">{quiz.title}</h2>
            {quiz.className && (
              <p className="text-xs text-stone-500 mt-1">Classroom: {quiz.className}</p>
            )}
          </div>

          {/* Key assessment rules & stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase">Questions</span>
              <p className="text-xl font-extrabold text-stone-900 mt-1">
                {quiz.questionCount || quiz.questions.length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase">Total Marks</span>
              <p className="text-xl font-extrabold text-stone-900 mt-1">{quiz.totalMarks}</p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase">Time Allowed</span>
              <p className="text-xl font-extrabold text-stone-900 mt-1">
                {quiz.timeLimit ? `${quiz.timeLimit} Mins` : 'Untimed'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
              <span className="text-[11px] font-bold text-stone-400 uppercase">Grading</span>
              <p className="text-xl font-extrabold text-emerald-700 mt-1">Automated</p>
            </div>
          </div>

          {/* Academic Instructions */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-blue-900 space-y-1.5">
            <p className="font-bold">Instructions before you begin:</p>
            <ul className="list-disc pl-4 space-y-1 text-blue-800">
              <li>Each question carries the designated marks indicated on screen.</li>
              <li>You may navigate freely between questions and mark items for review.</li>
              <li>Answers are automatically backed up as you make selections.</li>
              {quiz.timeLimit && (
                <li>The quiz will automatically submit when the countdown reaches 00:00.</li>
              )}
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => onNavigate(role === 'teacher' ? 'quizzes' : 'student-available')}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Back
            </button>
            <button
              onClick={handleStartAttempt}
              className="px-6 py-3 bg-[#1B2A4A] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#15223c] shadow-md transition-all flex items-center gap-2"
            >
              <span>Begin Assessment</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE QUIZ TAKING INTERFACE */}
      {attemptState === 'active' && (
        <div className="space-y-6">
          {/* Top Status Bar: Timer, Progress, and Submit Trigger */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-stone-900 truncate">{quiz.title}</p>
              <p className="text-[11px] text-stone-500">
                Answered {answeredCount} of {totalQuestions}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Reference Sheet / Attachments toggle */}
              {((quiz.attachments && quiz.attachments.length > 0) || quiz.allowReferenceSheet) && (
                <button
                  type="button"
                  onClick={() => setShowAttachmentsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-colors shadow-2xs"
                  title="View Attached Reference Sheet & Formulas"
                >
                  <Paperclip className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reference Sheet</span>
                </button>
              )}

              {/* Timer countdown if time limit active */}
              {quiz.timeLimit && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold ${
                    secondsRemaining < 120
                      ? 'bg-rose-100 text-rose-800 animate-pulse'
                      : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(secondsRemaining)}</span>
                </div>
              )}

              <button
                onClick={() => setConfirmModalOpen(true)}
                className="px-4 py-1.5 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl hover:bg-[#15223c] transition-colors shadow-2xs"
              >
                Submit Quiz
              </button>
            </div>
          </div>

          {/* Question Navigator Dots */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
              Question Navigator:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quiz.questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isMarked = Boolean(markedForReview[q.id]);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#1B2A4A] text-white ring-2 ring-blue-500 ring-offset-1'
                        : isMarked
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Question Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#1B2A4A] text-amber-300 text-xs font-extrabold flex items-center justify-center">
                  {currentQIndex + 1}
                </span>
                <span className="text-xs font-bold text-stone-500">
                  Question {currentQIndex + 1} of {totalQuestions}
                </span>
                <span className="text-xs text-stone-400">• {currentQuestion.marks} Mark(s)</span>
              </div>

              <button
                onClick={() => toggleMarkForReview(currentQuestion.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  markedForReview[currentQuestion.id]
                    ? 'bg-amber-100 text-amber-900 font-bold'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {markedForReview[currentQuestion.id] ? 'Marked for Review' : 'Mark for Review'}
                </span>
              </button>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options */}
            {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'true_false') &&
              currentQuestion.options && (
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, optIndex) => {
                    const selected = answers[currentQuestion.id] === opt;
                    return (
                      <label
                        key={optIndex}
                        onClick={() => handleAnswerSelect(currentQuestion.id, opt)}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selected
                            ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 text-blue-950 font-semibold'
                            : 'bg-white border-stone-200 hover:border-stone-300 text-stone-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`ans_${currentQuestion.id}`}
                          checked={selected}
                          onChange={() => handleAnswerSelect(currentQuestion.id, opt)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs sm:text-sm">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}

            {/* Short Answer Text Input */}
            {currentQuestion.type === 'short_answer' && (
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                  Your Answer:
                </label>
                <textarea
                  rows={4}
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  placeholder="Type your explanation or concise solution here..."
                  className="w-full p-3.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed font-sans"
                />
              </div>
            )}

            {/* Navigation Bottom Controls */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentQIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentQIndex === 0}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 disabled:opacity-40 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {currentQIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
                  className="px-5 py-2 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl hover:bg-[#15223c] transition-colors flex items-center gap-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors shadow-xs"
                >
                  Review & Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBMISSION RESULTS & DETAILED FEEDBACK */}
      {attemptState === 'result' && gradedResult && (
        <div className="space-y-6">
          {/* Score Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 font-extrabold text-2xl shadow-xs ${
                gradedResult.percentage >= 80
                  ? 'bg-emerald-100 text-emerald-800 ring-4 ring-emerald-50'
                  : gradedResult.percentage >= 60
                  ? 'bg-blue-100 text-blue-800 ring-4 ring-blue-50'
                  : 'bg-amber-100 text-amber-800 ring-4 ring-amber-50'
              }`}
            >
              {gradedResult.percentage}%
            </div>

            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
              {gradedResult.percentage >= 80
                ? 'Excellent Mastery!'
                : gradedResult.percentage >= 60
                ? 'Good Understanding!'
                : 'Keep Reviewing Notes!'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-md mx-auto">
              You scored {gradedResult.score} out of {gradedResult.totalMarks} total marks on{' '}
              <span className="font-semibold text-stone-800">{quiz.title}</span>.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setAnswers({});
                  setMarkedForReview({});
                  setCurrentQIndex(0);
                  setAttemptState('briefing');
                }}
                className="px-4 py-2 bg-white border border-stone-300 text-stone-700 font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Again</span>
              </button>
              <button
                onClick={() => onNavigate(role === 'teacher' ? 'quizzes' : 'student-dashboard')}
                className="px-5 py-2 bg-[#1B2A4A] text-white font-bold text-xs rounded-xl hover:bg-[#15223c] transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* Question-by-Question Solution Explanations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              Detailed Solution Review & Explanations
            </h3>

            {quiz.questions.map((q, idx) => {
              const graded = gradedResult.gradedAnswers[q.id];
              const isCorrect = graded?.isCorrect;
              const studentAns = graded?.studentAnswer || '(No answer provided)';

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isCorrect
                      ? 'bg-emerald-50/30 border-emerald-200'
                      : 'bg-rose-50/30 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-800">Question {idx + 1}</span>
                      <span className="text-stone-400">•</span>
                      <span className="capitalize text-stone-500">{q.type.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>+{graded.marksAwarded} Marks</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>0 / {q.marks} Marks</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-stone-900">{q.question}</p>

                  <div className="p-3 bg-white rounded-xl border border-stone-200/80 text-xs space-y-1.5">
                    <p className="text-stone-700">
                      <span className="font-bold text-stone-500">Your Answer: </span>
                      <span className={isCorrect ? 'text-emerald-800 font-semibold' : 'text-rose-800 font-semibold'}>
                        {studentAns}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-stone-700">
                        <span className="font-bold text-stone-500">Correct Answer: </span>
                        <span className="text-emerald-800 font-bold">{q.correctAnswer}</span>
                      </p>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-xs text-stone-600 leading-relaxed">
                      <p className="font-bold text-stone-700 mb-0.5">Pedagogical Explanation:</p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal before Submit */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Ready to Submit Quiz?"
        subtitle={`You have answered ${answeredCount} of ${totalQuestions} questions.`}
      >
        <div className="space-y-4">
          {answeredCount < totalQuestions && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                You have {totalQuestions - answeredCount} unanswered questions remaining.
              </span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-stone-600">
            Once submitted, your answers will be graded server-side and recorded to your academic
            history.
          </p>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
            >
              Continue Working
            </button>
            <button
              onClick={submitQuizAttempt}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
            >
              {submitting ? 'Grading...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reference Sheet & Formula Attachments Modal */}
      <Modal
        isOpen={showAttachmentsModal}
        onClose={() => setShowAttachmentsModal(false)}
        title="Attached Reference Sheet & Formulas"
        subtitle={quiz.title}
        maxWidth="3xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {quiz.attachments && quiz.attachments.length > 0 ? (
            quiz.attachments.map((att, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-700" />
                    <span>{att.name}</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                    {att.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-stone-200 font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {att.content}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-stone-500">No reference sheets attached to this assessment.</p>
          )}
        </div>
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => setShowAttachmentsModal(false)}
            className="px-4 py-2 bg-[#1B2A4A] text-white text-xs font-bold rounded-xl"
          >
            Return to Questions
          </button>
        </div>
      </Modal>
    </div>
  );
};
