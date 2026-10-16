import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  CheckSquare,
  BarChart3,
  Award,
  Settings,
  GraduationCap,
  BookOpen,
  X,
  Compass,
  Trophy,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}) => {
  const { role, userProfile } = useAuth();
  const isTeacher = role === 'teacher';

  const teacherNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'classes', label: 'My Classes', icon: Users },
    { id: 'materials', label: 'Study Materials', icon: FileText },
    { id: 'quiz-generator', label: 'AI Quiz Generator', icon: Sparkles, badge: 'AI' },
    { id: 'quizzes', label: 'My Quizzes', icon: CheckSquare },
    { id: 'results', label: 'Student Results', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentNavItems: NavItem[] = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-classes', label: 'My Classes', icon: Users },
    { id: 'student-available', label: 'Available Quizzes', icon: CheckSquare },
    { id: 'student-practice', label: 'Practice Mode', icon: Compass },
    { id: 'student-results', label: 'My Results', icon: Award },
    { id: 'student-progress', label: 'Progress & Stats', icon: BarChart3 },
    { id: 'settings', label: 'Profile & Settings', icon: Settings },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#F8F6F0] border-r border-stone-200/90 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-stone-200/70">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => handleItemClick(isTeacher ? 'overview' : 'student-dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] flex items-center justify-center text-amber-300 shadow-sm ring-1 ring-stone-900/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-900 tracking-tight text-base">
                  EduQuiz
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-amber-500/15 text-amber-800 rounded border border-amber-300/40">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium leading-none mt-0.5">
                Notes into Knowledge
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {isTeacher ? 'Instructional Suite' : 'Learning Workspace'}
            </span>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === 'quizzes' && currentPage === 'quiz-details') ||
              (item.id === 'quiz-generator' && currentPage === 'quiz-generator') ||
              (item.id === 'overview' && currentPage === 'overview');

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1B2A4A] text-white shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-300' : 'text-stone-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-amber-400 text-stone-900'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Classroom Info Footer Card */}
        <div className="p-3 border-t border-stone-200/70">
          <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-stone-700">Classroom Online</span>
            </div>
            <p className="text-xs text-stone-500 truncate">
              {userProfile?.schoolOrOrg || 'Academic Session 2026'}
            </p>
            <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>Mode</span>
              <span className="font-semibold text-stone-700 capitalize">
                {role || 'Standard'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
