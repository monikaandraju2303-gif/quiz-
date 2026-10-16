import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckSquare,
  Award,
  Sparkles,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { attemptsService } from '../services/attemptsService';
import { Classroom, Quiz, QuizAttempt } from '../types';
import { StatsCard } from '../components/common/StatsCard';
import { EmptyState } from '../components/common/EmptyState';

interface TeacherDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const teacherId = userProfile?.uid || 'demo_teacher_42';

  useEffect(() => {
    loadDashboardData();
  }, [teacherId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const teacherClasses = await classesService.getTeacherClasses(teacherId).catch(() => []);
      const teacherQuizzes = await quizzesService.getTeacherQuizzes(teacherId).catch(() => []);

      setClasses(teacherClasses || []);
      setQuizzes(teacherQuizzes || []);

      const classIds = (teacherClasses || []).map((c) => c.id);
      if (classIds.length > 0) {
        const subs = await attemptsService.getTeacherSubmissions(classIds).catch(() => []);
        setSubmissions(subs || []);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics computation from real Firestore data
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.studentIds?.length || 0), 0);
  const totalQuizzes = quizzes.length;

  const validSubmissions = submissions.filter((s) => s.status === 'submitted');
  const averageScore =
    validSubmissions.length > 0
      ? Math.round(
          validSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) /
            validSubmissions.length
        )
      : 0;

  // Recent data
  const recentQuizzes = quizzes.slice(0, 5);
  const recentSubmissions = validSubmissions.slice(0, 5);

  // Chart: Performance per Quiz
  const performanceData = quizzes.slice(0, 6).map((q) => {
    const quizSubs = validSubmissions.filter((s) => s.quizId === q.id);
    const avg =
      quizSubs.length > 0
        ? Math.round(quizSubs.reduce((acc, s) => acc + s.percentage, 0) / quizSubs.length)
        : 0;
    return {
      title: q.title.length > 15 ? q.title.substring(0, 15) + '...' : q.title,
      average: avg,
      submissions: quizSubs.length,
    };
  });

  // Chart: Quiz Status breakdown
  const draftCount = quizzes.filter((q) => q.status === 'draft').length;
  const publishedCount = quizzes.filter((q) => q.status === 'published').length;
  const archivedCount = quizzes.filter((q) => q.status === 'archived').length;

  const statusData = [
    { name: 'Published', value: publishedCount, color: '#1B2A4A' },
    { name: 'Drafts', value: draftCount, color: '#EBB036' },
    { name: 'Archived', value: archivedCount, color: '#94A3B8' },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Classroom Chalkboard Banner */}
      <div className="chalkboard-card rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Classroom AI Assistant Active
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Turn Classroom Notes into Evaluated Quizzes
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
            Upload course slides, syllabus, or lecture PDFs. EduQuiz AI will extract key concepts,
            formulate curriculum-aligned questions, and provide immediate grading.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('quiz-generator')}
              className="px-4 py-2 bg-amber-400 text-stone-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-stone-900" />
              <span>Launch Quiz Generator</span>
            </button>
            <button
              onClick={() => onNavigate('materials')}
              className="px-4 py-2 bg-stone-800/80 text-stone-200 font-semibold text-xs sm:text-sm rounded-xl hover:bg-stone-700/80 transition-colors border border-stone-600/60"
            >
              Upload Notes
            </button>
          </div>
        </div>

        {/* Subtle decorative chalkboard corner icon */}
        <div className="absolute -bottom-6 -right-6 text-emerald-900/30 select-none pointer-events-none hidden sm:block">
          <BookOpen className="w-48 h-48" />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Classes"
          value={totalClasses}
          subtitle={`${totalStudents} total students enrolled`}
          icon={Users}
          colorScheme="navy"
        />
        <StatsCard
          title="Total Students"
          value={totalStudents}
          subtitle={totalClasses > 0 ? `Across ${totalClasses} active classrooms` : 'No classes yet'}
          icon={BookOpen}
          colorScheme="blue"
        />
        <StatsCard
          title="Quizzes Created"
          value={totalQuizzes}
          subtitle={`${publishedCount} published • ${draftCount} drafts`}
          icon={CheckSquare}
          colorScheme="amber"
        />
        <StatsCard
          title="Average Student Score"
          value={validSubmissions.length > 0 ? `${averageScore}%` : 'N/A'}
          subtitle={
            validSubmissions.length > 0
              ? `${validSubmissions.length} graded submission${validSubmissions.length > 1 ? 's' : ''}`
              : 'Awaiting submissions'
          }
          icon={Award}
          colorScheme="emerald"
        />
      </div>

      {/* Quick Actions Row */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('classes')}
            className="p-3.5 rounded-xl border border-stone-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">Manage Classes</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Codes & rosters</p>
          </button>

          <button
            onClick={() => onNavigate('materials')}
            className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">Study Materials</p>
            <p className="text-[11px] text-stone-500 mt-0.5">PDFs, DOCX & Notes</p>
          </button>

          <button
            onClick={() => onNavigate('quiz-generator')}
            className="p-3.5 rounded-xl border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">AI Quiz Generator</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Build from notes</p>
          </button>

          <button
            onClick={() => onNavigate('results')}
            className="p-3.5 rounded-xl border border-stone-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-stone-900">Student Results</p>
            <p className="text-[11px] text-stone-500 mt-0.5">Grades & CSV</p>
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Average Class Performance per Quiz
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Calculated from verified student submissions
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">Score %</span>
          </div>

          {performanceData.length > 0 && performanceData.some((d) => d.submissions > 0) ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Class Average']}
                  />
                  <Bar dataKey="average" fill="#1B2A4A" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-xl">
              <BookOpen className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs font-semibold text-stone-600">No submission data yet</p>
              <p className="text-[11px] text-stone-400 max-w-xs mt-1">
                Once students take your published quizzes, average score trends will render here.
              </p>
            </div>
          )}
        </div>

        {/* Quiz Status Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-1">
            Quiz Library Status
          </h3>
          <p className="text-xs text-stone-500 mb-4">Draft, published & archived</p>

          {statusData.length > 0 ? (
            <div>
              <div className="h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-stone-600">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></span>
                      <span>{item.name}</span>
                    </div>
                    <span className="font-bold text-stone-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-stone-200 rounded-xl">
              <CheckSquare className="w-7 h-7 text-stone-300 mb-1" />
              <p className="text-xs text-stone-500">No quizzes generated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Two Columns: Recent Quizzes & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Recent Quizzes
              </h3>
              <p className="text-xs text-stone-500">Latest created assessments</p>
            </div>
            <button
              onClick={() => onNavigate('quizzes')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentQuizzes.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="py-3 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                  onClick={() => onNavigate('quizzes')}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {quiz.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                      <span className="font-medium text-stone-600">{quiz.subject}</span>
                      <span>•</span>
                      <span>{quiz.questionCount} Qs</span>
                      <span>•</span>
                      <span className="capitalize">{quiz.difficulty}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
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
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No quizzes yet"
              description="Upload your classroom notes or syllabus to generate your first AI quiz."
              actionText="Generate First Quiz"
              onAction={() => onNavigate('quiz-generator')}
            />
          )}
        </div>

        {/* Recent Student Submissions */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Recent Submissions
              </h3>
              <p className="text-xs text-stone-500">Live student exam attempts</p>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSubmissions.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="py-3 flex items-center justify-between hover:bg-stone-50/80 px-2 rounded-xl transition-colors cursor-pointer"
                  onClick={() => onNavigate('results')}
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {sub.studentName}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">{sub.quizTitle}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        sub.percentage >= 80
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sub.percentage >= 60
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {sub.score}/{sub.totalMarks} marks
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Award}
              title="No student submissions"
              description="When students join your class and submit quizzes, their scores and time will appear here."
              actionText="View My Classes"
              onAction={() => onNavigate('classes')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
