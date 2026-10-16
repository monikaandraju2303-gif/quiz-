import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Bell,
  Shield,
  LogOut,
  Check,
  Building,
  Mail,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { userProfile, role, selectRole, updateUserProfile, signOut } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [schoolOrOrg, setSchoolOrOrg] = useState(userProfile?.schoolOrOrg || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [submissionNotifs, setSubmissionNotifs] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        schoolOrOrg: schoolOrOrg.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    try {
      await selectRole(newRole, schoolOrOrg);
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Settings & Profile
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Manage your account credentials, classroom preferences, and role permissions.
        </p>
      </div>

      {/* Role Selection Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Workspace Mode
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Select your account type to access specific teacher or student features.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleRoleChange('teacher')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === 'teacher'
                ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              {role === 'teacher' && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-blue-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-stone-900">Teacher Workspace</h4>
            <p className="text-xs text-stone-500 mt-1">
              Create classrooms, upload notes, generate AI quizzes, and inspect student grades.
            </p>
          </div>

          <div
            onClick={() => handleRoleChange('student')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              role === 'student'
                ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              {role === 'student' && (
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-emerald-600 text-white rounded">
                  Active
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-stone-900">Student Portal</h4>
            <p className="text-xs text-stone-500 mt-1">
              Join classes with join codes, take timed quizzes, and review personalized feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Personal Information
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Your name is displayed on class rosters and generated assessments.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                School or Institution
              </label>
              <input
                type="text"
                value={schoolOrOrg}
                onChange={(e) => setSchoolOrOrg(e.target.value)}
                placeholder="e.g. Oakridge Academy"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Address (Google Account)
            </label>
            <input
              type="email"
              disabled
              value={userProfile?.email || 'user@example.com'}
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-stone-100/70 border border-stone-200 rounded-xl text-stone-500 cursor-not-allowed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Profile updated successfully!</span>
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Preferences */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Notification Preferences
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure how you receive updates on quiz submissions and grading.
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-stone-50/60 cursor-pointer transition-colors">
            <div>
              <p className="text-xs font-bold text-stone-800">Quiz Submission Alerts</p>
              <p className="text-[11px] text-stone-500">
                Receive notifications when students submit completed quizzes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={submissionNotifs}
              onChange={() => setSubmissionNotifs(!submissionNotifs)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:bg-stone-50/60 cursor-pointer transition-colors">
            <div>
              <p className="text-xs font-bold text-stone-800">New Quiz Announcements</p>
              <p className="text-[11px] text-stone-500">
                Alert students when new quizzes are published to enrolled classes.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={() => setEmailAlerts(!emailAlerts)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </label>
        </div>
      </div>

      {/* Account Danger / Logout Zone */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Sign Out of EduQuiz AI
          </h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Safely end your current session across all classroom devices.
          </p>
        </div>
        <button
          onClick={signOut}
          className="px-4 py-2 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 rounded-xl transition-colors flex items-center gap-2 border border-rose-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
