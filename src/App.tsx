import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { LandingPage } from './pages/LandingPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { ClassesPage } from './pages/ClassesPage';
import { StudyMaterialsPage } from './pages/StudyMaterialsPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { MyQuizzesPage } from './pages/MyQuizzesPage';
import { QuizAttemptPage } from './pages/QuizAttemptPage';
import { ResultsPage } from './pages/ResultsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentClassesPage } from './pages/StudentClassesPage';
import { AvailableQuizzesPage } from './pages/AvailableQuizzesPage';
import { SettingsPage } from './pages/SettingsPage';
import { GraduationCap } from 'lucide-react';

function MainApp() {
  const { userProfile, role, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active page & parameter routing
  const isTeacher = role === 'teacher';
  const defaultPage = isTeacher ? 'overview' : 'student-dashboard';
  const [currentPage, setCurrentPage] = useState<string>(defaultPage);
  const [pageParams, setPageParams] = useState<any>(null);

  // When role changes, ensure current page is in the appropriate view
  React.useEffect(() => {
    if (role === 'teacher' && currentPage.startsWith('student-')) {
      setCurrentPage('overview');
    } else if (role === 'student' && !currentPage.startsWith('student-') && currentPage !== 'settings' && currentPage !== 'quiz-attempt') {
      setCurrentPage('student-dashboard');
    }
  }, [role]);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-amber-300 flex items-center justify-center shadow-md animate-pulse mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-stone-800 tracking-tight">Initializing EduQuiz AI</h2>
        <p className="text-xs text-stone-500 mt-1">Connecting to classroom cloud services...</p>
      </div>
    );
  }

  // If user not authenticated, render public landing page
  if (!userProfile) {
    return <LandingPage onStart={() => setCurrentPage('overview')} />;
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col md:flex-row text-stone-800 selection:bg-amber-200">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={handleNavigate}
          currentPage={currentPage}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TEACHER ROUTES */}
          {currentPage === 'overview' && <TeacherDashboard onNavigate={handleNavigate} />}
          {currentPage === 'classes' && <ClassesPage onNavigate={handleNavigate} />}
          {currentPage === 'materials' && <StudyMaterialsPage onNavigate={handleNavigate} />}
          {currentPage === 'quiz-generator' && (
            <QuizGeneratorPage onNavigate={handleNavigate} initialParams={pageParams} />
          )}
          {currentPage === 'quizzes' && <MyQuizzesPage onNavigate={handleNavigate} />}
          {currentPage === 'results' && <ResultsPage onNavigate={handleNavigate} />}
          {currentPage === 'analytics' && <AnalyticsPage />}

          {/* STUDENT ROUTES */}
          {currentPage === 'student-dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
          {currentPage === 'student-classes' && <StudentClassesPage onNavigate={handleNavigate} />}
          {currentPage === 'student-available' && (
            <AvailableQuizzesPage onNavigate={handleNavigate} practiceModeOnly={false} />
          )}
          {currentPage === 'student-practice' && (
            <AvailableQuizzesPage onNavigate={handleNavigate} practiceModeOnly={true} />
          )}
          {currentPage === 'student-results' && <ResultsPage onNavigate={handleNavigate} />}
          {currentPage === 'student-progress' && <AnalyticsPage />}

          {/* SHARED ROUTES */}
          {currentPage === 'settings' && <SettingsPage />}
          {currentPage === 'quiz-attempt' && (
            <QuizAttemptPage quizId={pageParams?.quizId || ''} onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
