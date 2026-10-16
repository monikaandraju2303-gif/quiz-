import React from 'react';
import {
  GraduationCap,
  FolderUp,
  FileText,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  FlaskConical,
  Clock,
  Layers,
  Award,
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { signInWithGoogle, useDemoTeacher, useDemoStudent } = useAuth();

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-800 flex flex-col selection:bg-amber-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-stone-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] flex items-center justify-center text-amber-300 shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-stone-900 tracking-tight text-lg">
                EduQuiz AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs text-stone-500 font-medium border-l border-stone-300 pl-2">
                Turn Notes into Knowledge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={useDemoTeacher}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-2xs"
            >
              Demo Teacher View
            </button>
            <button
              onClick={useDemoStudent}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors shadow-2xs"
            >
              Demo Student View
            </button>
            <button
              onClick={signInWithGoogle}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <span>Sign In with Google</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden academic-grid">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold uppercase tracking-wider mb-6">
            <FolderUp className="w-3.5 h-3.5 text-amber-600" />
            Full-Stack Manual Quiz Generator & Folder Import Studio
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15] mb-6">
            Turn Question Folders Into <br />
            <span className="text-[#1B2A4A] underline decoration-amber-400 decoration-wavy decoration-2">
              Interactive Quizzes
            </span>
          </h1>

          <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Author customized assessments manually or import full question bank folders (JSON, CSV, Aiken, Markdown) with immediate server-side scoring, printable exam worksheets, and full test data diagnostics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12">
            <button
              onClick={signInWithGoogle}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#1B2A4A] text-white font-bold text-sm rounded-xl hover:bg-[#15223c] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
            <button
              onClick={useDemoTeacher}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-stone-800 font-bold text-sm border border-stone-300 rounded-xl hover:bg-stone-50 transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <span>Explore Teacher Workspace</span>
            </button>
          </div>

          {/* Quick Credibility Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Role-Based Access Control
            </span>
            <span className="flex items-center gap-1.5">
              <FolderUp className="w-4 h-4 text-blue-600" />
              Folder Question Banks (JSON, CSV, Aiken)
            </span>
            <span className="flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-amber-600" />
              Integrated Test Data Studio
            </span>
          </div>
        </div>

        {/* Classroom Dashboard Mockup Preview */}
        <div className="max-w-5xl mx-auto mt-12 bg-white rounded-2xl border border-stone-200/90 shadow-xl overflow-hidden p-3 sm:p-6">
          <div className="bg-stone-50 rounded-xl border border-stone-200/70 p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-semibold text-stone-500 ml-2">
                  EduQuiz AI Studio — AP Biology Unit 4 Quiz
                </span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                AI Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Input Material</span>
                <p className="text-sm font-bold text-stone-800 mt-1">Cellular Respiration.pdf</p>
                <p className="text-xs text-stone-500 mt-0.5">3,420 words extracted • 4 chapters</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Quiz Configuration</span>
                <p className="text-sm font-bold text-stone-800 mt-1">10 Questions • Medium Difficulty</p>
                <p className="text-xs text-stone-500 mt-0.5">MCQ + True/False + Short Answer</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-stone-200">
                <span className="text-[10px] font-bold text-stone-400 uppercase">Target Classroom</span>
                <p className="text-sm font-bold text-stone-800 mt-1">Grade 11 — Section A</p>
                <p className="text-xs text-stone-500 mt-0.5">28 Students Enrolled • Code: BIO-704</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section className="py-16 px-6 bg-white border-y border-stone-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              From Lecture Notes to Graded Assessment in 3 Steps
            </h2>
            <p className="text-stone-500 text-sm mt-2">
              Simple, teacher-controlled workflow engineered to respect academic rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] text-amber-300 font-extrabold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Upload or Paste Notes</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Drop your syllabus, slides, lecture transcripts, or textbook chapters in PDF,
                DOCX, or TXT format.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] text-amber-300 font-extrabold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Import Folder or Craft Manually</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Select an entire folder of question banks (JSON, CSV, Aiken text) or craft customized questions with rich options, answers, and explanations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200/80 relative">
              <div className="w-8 h-8 rounded-lg bg-[#1B2A4A] text-amber-300 font-extrabold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-stone-900 mb-2">Test & Publish to Class</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Run automated diagnostics or test-drive questions. Assign directly to your enrolled students or export print-ready worksheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold mb-4">
              <FileText className="w-3.5 h-3.5" />
              Intelligent Document Processing
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mb-4">
              Multiformat Text & OCR Extraction
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed mb-4">
              EduQuiz AI seamlessly reads academic documents, handles complex multi-page PDFs, and
              preserves the core context needed to generate meaningful questions.
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Extracts text from PDF, DOCX, TXT, and scanned whiteboard notes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live text preview with word and page counts before generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Preserves source material references on generated questions</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="chalkboard-card rounded-xl p-5 text-stone-100 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-700/60 pb-2">
                <span className="text-amber-300 font-bold">Classroom Chalkboard</span>
                <span className="text-[10px] text-stone-400">Preview</span>
              </div>
              <p className="text-stone-300 font-sans text-xs">
                &ldquo;What is the primary function of ATP synthase during the light-dependent reactions of photosynthesis?&rdquo;
              </p>
              <div className="space-y-1.5 font-sans text-xs text-stone-200 pl-2 border-l-2 border-emerald-500">
                <p className="text-emerald-300 font-semibold">✓ Correct Answer: Synthesizes ATP from ADP and inorganic phosphate using a proton gradient.</p>
                <p className="text-stone-400 text-[11px]">Explanation: Protons flowing down their electrochemical gradient drive ATP phosphorylation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Teachers & Students */}
      <section className="py-16 px-6 bg-stone-100/60 border-t border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* For Teachers */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">For Teachers & Instructors</h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
                Reclaim your weekends. Build assessments in seconds, organize classes with unique
                join codes, and review class performance with visual score distributions.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Class Codes</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Custom Marks</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">CSV Grade Export</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Question Regeneration</span>
              </div>
            </div>

            {/* For Students */}
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">For Students & Learners</h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-4 leading-relaxed">
                Take scheduled class exams or study in Practice Mode with instant explanations,
                mark questions for review, and monitor your personal learning trajectory.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Exam Timer</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Question Navigator</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Instant Explanations</span>
                <span className="px-2.5 py-1 bg-stone-100 rounded-lg">Study Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-6 bg-white border-t border-stone-200 text-stone-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#1B2A4A]" />
            <span className="font-bold text-stone-800">EduQuiz AI</span>
            <span>— Turn Notes into Knowledge</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Powered by Full-Stack Engine & Firestore</span>
            <span>•</span>
            <button onClick={useDemoTeacher} className="hover:text-stone-900">
              Teacher Demo
            </button>
            <button onClick={useDemoStudent} className="hover:text-stone-900">
              Student Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
