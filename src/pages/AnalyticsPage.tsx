import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckSquare,
  BookOpen,
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
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { attemptsService } from '../services/attemptsService';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { Classroom, Quiz, QuizAttempt } from '../types';
import { StatsCard } from '../components/common/StatsCard';

export const AnalyticsPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const isTeacher = role === 'teacher';
  const currentUid = userProfile?.uid || (isTeacher ? 'demo_teacher_42' : 'demo_student_88');

  const [submissions, setSubmissions] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [currentUid, isTeacher]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      if (isTeacher) {
        const cls = await classesService.getTeacherClasses(currentUid).catch(() => []);
        setClasses(cls || []);
        const classIds = (cls || []).map((c) => c.id);

        const [subs, qs] = await Promise.all([
          attemptsService.getTeacherSubmissions(classIds).catch(() => []),
          quizzesService.getTeacherQuizzes(currentUid).catch(() => []),
        ]);
        setSubmissions(subs || []);
        setQuizzes(qs || []);
      } else {
        const subs = await attemptsService.getStudentAttempts(currentUid).catch(() => []);
        setSubmissions(subs || []);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const completed = submissions.filter((s) => s.status === 'submitted');

  // 1. Score Distribution Data
  const scoreBuckets = [
    { range: '0 - 49%', count: 0, color: '#F87171' },
    { range: '50 - 69%', count: 0, color: '#FBBF24' },
    { range: '70 - 84%', count: 0, color: '#60A5FA' },
    { range: '85 - 100%', count: 0, color: '#34D399' },
  ];

  completed.forEach((s) => {
    if (s.percentage < 50) scoreBuckets[0].count++;
    else if (s.percentage < 70) scoreBuckets[1].count++;
    else if (s.percentage < 85) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  });

  // 2. Subject Performance Data
  const subjectMap: Record<string, { totalPct: number; count: number }> = {};
  completed.forEach((s) => {
    const q = quizzes.find((quiz) => quiz.id === s.quizId);
    const subj = q?.subject || 'General';
    if (!subjectMap[subj]) {
      subjectMap[subj] = { totalPct: 0, count: 0 };
    }
    subjectMap[subj].totalPct += s.percentage;
    subjectMap[subj].count += 1;
  });

  const subjectData = Object.entries(subjectMap).map(([subj, data]) => ({
    subject: subj,
    average: Math.round(data.totalPct / data.count),
    submissions: data.count,
  }));

  // 3. Progress Over Time
  const progressData = completed.slice(-8).map((s, idx) => ({
    name: `Attempt ${idx + 1}`,
    score: s.percentage,
    title: s.quizTitle,
  }));

  const overallAverage =
    completed.length > 0
      ? Math.round(completed.reduce((acc, s) => acc + s.percentage, 0) / completed.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Performance Analytics
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          {isTeacher
            ? 'Deep-dive academic insights, score distributions, and subject retention.'
            : 'Track your personal mastery across subjects over time.'}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Overall Average"
          value={completed.length > 0 ? `${overallAverage}%` : 'N/A'}
          subtitle={`${completed.length} total graded attempt${completed.length === 1 ? '' : 's'}`}
          icon={TrendingUp}
          colorScheme="emerald"
        />
        <StatsCard
          title="Top Score"
          value={completed.length > 0 ? `${Math.max(...completed.map((c) => c.percentage))}%` : 'N/A'}
          subtitle="Highest recorded score"
          icon={Award}
          colorScheme="blue"
        />
        <StatsCard
          title="Quizzes Evaluated"
          value={isTeacher ? quizzes.length : completed.length}
          subtitle={isTeacher ? 'Across all class sections' : 'Completed exams'}
          icon={CheckSquare}
          colorScheme="navy"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-1">
            Score Distribution
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            Percentage range breakdown of student submissions
          </p>

          {completed.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [val, 'Submissions']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {scoreBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-xl">
              <BarChart3 className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs text-stone-500">No submissions to plot distribution</p>
            </div>
          )}
        </div>

        {/* Progress Timeline Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-2xs">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-1">
            Performance Progression
          </h3>
          <p className="text-xs text-stone-500 mb-4">Chronological score trajectory</p>

          {progressData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData} margin={{ top: 10, right: 15, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val}%`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1B2A4A"
                    strokeWidth={2.5}
                    dot={{ fill: '#EBB036', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-xl">
              <TrendingUp className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs text-stone-500">No progression history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
