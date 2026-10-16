import React, { useState } from 'react';
import {
  Bell,
  Search,
  PlusCircle,
  LogOut,
  User,
  Settings,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Menu,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onNavigate }) => {
  const { userProfile, role, signOut, selectRole } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isTeacher = role === 'teacher';
  const displayName = userProfile?.displayName || 'Educator';
  const firstName = displayName.split(' ')[0] || displayName;

  const mockNotifications = [
    {
      id: '1',
      title: 'Class joined',
      desc: '3 new students joined AP Biology via code.',
      time: '15m ago',
      read: false,
    },
    {
      id: '2',
      title: 'New submission',
      desc: 'Marcus Chen submitted Cellular Respiration Quiz (92%).',
      time: '1h ago',
      read: false,
    },
    {
      id: '3',
      title: 'AI Generation ready',
      desc: 'Physics Mechanics notes generated 10 verified questions.',
      time: '2h ago',
      read: true,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile hamburger & Greeting */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                {isTeacher ? (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                    Teacher Workspace
                  </>
                ) : (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    Student Portal
                  </>
                )}
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-stone-300"></span>
              <span className="text-xs text-stone-400 font-medium">Fall Term</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-stone-800 tracking-tight">
              {isTeacher ? `Good day, ${firstName}!` : `Welcome back, ${firstName}!`}
            </h1>
          </div>
        </div>

        {/* Middle: Search bar & Database status */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4 gap-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTeacher ? "Search quizzes, classes, notes..." : "Search available quizzes & classes..."}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-stone-200 rounded-lg placeholder-stone-400 text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-2xs"
            />
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/60 text-[11px] font-semibold shrink-0"
            title="Firestore Database: ai-studio-eduquizai-3d2010d2-5139-47eb-89d9-be3ba0b7ffb2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>DB Online</span>
          </div>
        </div>

        {/* Right: Actions, Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Quiz button for teachers */}
          {isTeacher && (
            <button
              onClick={() => onNavigate('quiz-generator')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1B2A4A] text-white text-sm font-medium rounded-lg hover:bg-[#15223c] active:bg-[#0f172a] shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-sky-300" />
              <span>Create New Quiz</span>
            </button>
          )}

          {/* Role quick toggle (allows testing both Teacher & Student views easily) */}
          <div className="hidden md:flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs font-medium">
            <button
              onClick={() => selectRole('teacher')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                isTeacher
                  ? 'bg-white text-stone-800 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Switch to Teacher view"
            >
              Teacher
            </button>
            <button
              onClick={() => selectRole('student')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                !isTeacher
                  ? 'bg-white text-emerald-800 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Switch to Student view"
            >
              Student
            </button>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-stone-500 tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto">
                  {mockNotifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-2.5 hover:bg-stone-50 transition-colors ${
                        !n.read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold text-stone-800">{n.title}</p>
                        <span className="text-[10px] text-stone-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">{n.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-stone-100 text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-lg hover:bg-stone-100 border border-transparent hover:border-stone-200 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#1B2A4A] text-white flex items-center justify-center font-bold text-xs ring-2 ring-stone-200">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2.5 border-b border-stone-100">
                  <p className="text-xs font-semibold text-stone-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-stone-500 truncate">{userProfile?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                      {isTeacher ? 'Teacher' : 'Student'}
                    </span>
                    {userProfile?.schoolOrOrg && (
                      <span className="text-[10px] text-stone-400 truncate">
                        {userProfile.schoolOrOrg}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-1 text-xs text-stone-700">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-stone-50 flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-stone-400" />
                    <span>Settings & Preferences</span>
                  </button>
                </div>

                <div className="border-t border-stone-100 pt-1 text-xs">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
