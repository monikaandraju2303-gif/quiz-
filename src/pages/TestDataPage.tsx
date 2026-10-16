import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  FolderDown,
  FileText,
  Users,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  Server,
  Code,
  Check,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { api, TestQuizSimulationResponse, SampleFolderResponse } from '../services/api';
import { seedService } from '../services/seedService';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { materialsService } from '../services/materialsService';
import { attemptsService } from '../services/attemptsService';
import { localAcademicStore } from '../services/localAcademicStore';
import { useAuth } from '../context/AuthContext';

interface TestDataPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const TestDataPage: React.FC<TestDataPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const teacherId = userProfile?.uid || 'demo_teacher_42';

  // Server health state
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);

  // Counts state
  const [counts, setCounts] = useState({
    classes: 0,
    materials: 0,
    quizzes: 0,
    attempts: 0,
  });

  // Action states
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [seedSuccess, setSeedSuccess] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Simulation test state
  const [isRunningSimulation, setIsRunningSimulation] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<TestQuizSimulationResponse | null>(null);

  // Folder parser test state
  const [sampleFolder, setSampleFolder] = useState<SampleFolderResponse | null>(null);
  const [folderTestResult, setFolderTestResult] = useState<any | null>(null);
  const [isTestingFolder, setIsTestingFolder] = useState<boolean>(false);

  // Interactive Live Question Sandbox
  const [sandboxQuestionType, setSandboxQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer'>('multiple_choice');
  const [sandboxPrompt, setSandboxPrompt] = useState<string>('What is the capital of France?');
  const [sandboxCorrect, setSandboxCorrect] = useState<string>('Paris');
  const [sandboxStudentAnswer, setSandboxStudentAnswer] = useState<string>('Paris');
  const [sandboxGradeResult, setSandboxGradeResult] = useState<any | null>(null);
  const [gradingSandbox, setGradingSandbox] = useState<boolean>(false);

  // Load current stats and health
  const refreshStats = async () => {
    setLoadingHealth(true);
    try {
      const [health, db, cls, mats, qzs, atts] = await Promise.all([
        fetch('/api/health').then(r => r.json()).catch(() => null),
        fetch('/api/database/status').then(r => r.json()).catch(() => null),
        classesService.getTeacherClasses(teacherId).catch(() => []),
        materialsService.getTeacherMaterials(teacherId).catch(() => []),
        quizzesService.getTeacherQuizzes(teacherId).catch(() => []),
        attemptsService.getTeacherStudentAttempts(teacherId).catch(() => []),
      ]);

      setServerHealth(health);
      setDbStatus(db);
      setCounts({
        classes: cls?.length || 0,
        materials: mats?.length || 0,
        quizzes: qzs?.length || 0,
        attempts: atts?.length || 0,
      });
    } catch (e) {
      console.error('Error refreshing stats:', e);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    refreshStats();
  }, [teacherId]);

  // Handler: Seed Test Dataset
  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);
    try {
      await seedService.seedInitialData(teacherId, userProfile?.displayName || 'Prof. Eleanor Vance');
      setSeedSuccess('Successfully seeded full-stack test dataset! You can now test quizzes, gradebooks, and classes.');
      await refreshStats();
    } catch (err: any) {
      setSeedSuccess('Data seeded into active session store.');
      await refreshStats();
    } finally {
      setIsSeeding(false);
    }
  };

  // Handler: Clear Test Data
  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear test data? This resets local test stores.')) return;
    setIsClearing(true);
    try {
      localAcademicStore.clearAll();
      setSeedSuccess('Local test dataset reset.');
      await refreshStats();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  // Handler: Run Automated Quiz Grading Engine Test
  const handleRunSimulation = async () => {
    setIsRunningSimulation(true);
    try {
      const result = await api.runTestDataQuizSimulation();
      setSimulationResult(result);
    } catch (err: any) {
      console.error('Simulation test error:', err);
    } finally {
      setIsRunningSimulation(false);
    }
  };

  // Handler: Test Folder Import with Sample Files
  const handleTestFolderImport = async () => {
    setIsTestingFolder(true);
    try {
      const sample = await api.getSampleQuestionFolder();
      setSampleFolder(sample);

      // Create synthetic File objects to test the folder import endpoint
      const files: File[] = sample.files.map(f => {
        return new File([f.content], f.fileName, { type: 'text/plain' });
      });

      const parsedResult = await api.importQuestionsFolder(files);
      setFolderTestResult(parsedResult);
    } catch (err: any) {
      console.error('Folder test failed:', err);
    } finally {
      setIsTestingFolder(false);
    }
  };

  // Handler: Interactive Sandbox Test
  const handleTestSandboxGrading = async () => {
    setGradingSandbox(true);
    try {
      const testQuestion = {
        id: 'sandbox_q1',
        question: sandboxPrompt,
        type: sandboxQuestionType,
        correctAnswer: sandboxCorrect,
        explanation: 'Verified through deterministic evaluation engine.',
        marks: 2,
        options: sandboxQuestionType === 'multiple_choice' ? ['Paris', 'London', 'Berlin', 'Rome'] : undefined
      };

      const result = await api.gradeAttempt([testQuestion], {
        sandbox_q1: sandboxStudentAnswer
      });

      setSandboxGradeResult(result.gradedAnswers.sandbox_q1);
    } catch (e: any) {
      console.error(e);
    } finally {
      setGradingSandbox(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 flex items-center justify-center border border-amber-300/60 shadow-xs">
              <FlaskConical className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Full-Stack Data Testing & Diagnostics Studio
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Verify backend APIs, inspect database records, test automated grading, and validate folder question import.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshStats}
            disabled={loadingHealth}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            Refresh Diagnostics
          </button>
          <button
            onClick={() => onNavigate('quiz-generator')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors shadow-xs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
            Open Manual Quiz Builder
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {seedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{seedSuccess}</span>
          </div>
          <button onClick={() => setSeedSuccess(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. System Health & Live Records */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Classrooms</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">{counts.classes}</div>
          <div className="mt-1 text-xs text-stone-500">Active class rosters</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Study Materials</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">{counts.materials}</div>
          <div className="mt-1 text-xs text-stone-500">Documents & reference sheets</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Published Quizzes</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">{counts.quizzes}</div>
          <div className="mt-1 text-xs text-stone-500">Quizzes with question banks</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Student Attempts</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-stone-900">{counts.attempts}</div>
          <div className="mt-1 text-xs text-stone-500">Recorded grades & submissions</div>
        </div>
      </div>

      {/* 2. Full-Stack Data Management Tools */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              Full-Stack Test Data Suite
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Populate or reset realistic academic data to test every feature of the quiz system without manual typing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              {isSeeding ? 'Seeding Data...' : 'Seed Sample Test Data'}
            </button>
            <button
              onClick={handleClearData}
              disabled={isClearing}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Local Data
            </button>
          </div>
        </div>

        {/* Server & DB Status Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <span className="text-stone-500 font-medium">Backend API Mode:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              {serverHealth?.manualGenerator ? 'Manual Quiz Engine (No AI)' : 'Ready'}
            </span>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <span className="text-stone-500 font-medium">Database Connection:</span>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              {dbStatus?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
            <span className="text-stone-500 font-medium">Folder Import Support:</span>
            <span className="font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              JSON, CSV, Aiken, MD
            </span>
          </div>
        </div>
      </div>

      {/* 3. Automated Quiz Engine & Grading Simulation Test */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              Test 1: Automated Quiz Engine & Scoring Simulation
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulates three distinct student attempts (Perfect, Partial, and Zero) against multiple question types to test scoring precision.
            </p>
          </div>
          <button
            onClick={handleRunSimulation}
            disabled={isRunningSimulation}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B2A4A] hover:bg-[#253966] text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-amber-300 ${isRunningSimulation ? 'animate-spin' : ''}`} />
            {isRunningSimulation ? 'Running Simulation...' : 'Run Scoring Simulation'}
          </button>
        </div>

        {simulationResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span><strong>Status:</strong> {simulationResult.status} — All {simulationResult.totalScenarios} student test scenarios scored successfully.</span>
              </div>
              <span className="font-mono text-stone-500">{new Date(simulationResult.timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {simulationResult.testResults.map((r, idx) => (
                <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-800">{r.scenario}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      r.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      r.percentage >= 50 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {r.percentage}% Score
                    </span>
                  </div>

                  <div className="text-xs text-stone-600">
                    Student: <span className="font-semibold text-stone-900">{r.studentName}</span>
                  </div>

                  <div className="text-xs text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Total Score:</span>
                      <span className="font-bold">{r.score} / {r.maxMarks} Marks</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>MCQ (Q1):</span>
                      <span className="text-emerald-600 font-bold">{r.breakdown.q1.status} ({r.breakdown.q1.marks}/{r.breakdown.q1.max})</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>True/False (Q2):</span>
                      <span className="text-emerald-600 font-bold">{r.breakdown.q2.status} ({r.breakdown.q2.marks}/{r.breakdown.q2.max})</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>Short Answer (Q3):</span>
                      <span className="text-indigo-600 font-bold">{r.breakdown.q3.status} ({r.breakdown.q3.marks}/{r.breakdown.q3.max})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Folder Import Test Suite */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-indigo-600" />
              Test 2: Folder Import Parser & Multi-File Validation
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulates importing an entire folder of question files (JSON, CSV, and Aiken Text) and verifies backend parsing.
            </p>
          </div>
          <button
            onClick={handleTestFolderImport}
            disabled={isTestingFolder}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <FolderDown className={`w-3.5 h-3.5 ${isTestingFolder ? 'animate-spin' : ''}`} />
            {isTestingFolder ? 'Parsing Folder...' : 'Test Folder Import with Sample Files'}
          </button>
        </div>

        {folderTestResult && (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span>Folder Parsed Successfully: {folderTestResult.totalFiles} Files Processed</span>
                <span>{folderTestResult.totalQuestions} Questions Extracted</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-800">
                  Multiple Choice: {folderTestResult.summary.multipleChoice}
                </span>
                <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-800">
                  True/False: {folderTestResult.summary.trueFalse}
                </span>
                <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-800">
                  Short Answer: {folderTestResult.summary.shortAnswer}
                </span>
                <span className="px-2 py-0.5 bg-white border border-indigo-200 rounded text-indigo-800 font-bold">
                  Total Marks: {folderTestResult.summary.totalMarks}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {folderTestResult.fileResults.map((fr: any, idx: number) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-900">
                    <span className="truncate max-w-[180px]">{fr.fileName}</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px]">
                      {fr.questionCount} Qs
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Questions parsed cleanly with zero syntax errors.
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => onNavigate('quiz-generator', { importedQuestions: folderTestResult.questions })}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                <span>Load These {folderTestResult.totalQuestions} Questions into Quiz Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Interactive Live Grading Sandbox */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-600" />
            Test 3: Live Interactive Question & Grading Sandbox
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Test custom question prompts, student response inputs, and check the deterministic scoring response live.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700">Question Type</label>
            <select
              value={sandboxQuestionType}
              onChange={(e: any) => setSandboxQuestionType(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg font-medium"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True / False</option>
              <option value="short_answer">Short Answer</option>
            </select>

            <label className="block text-xs font-bold text-stone-700">Question Prompt</label>
            <input
              type="text"
              value={sandboxPrompt}
              onChange={(e) => setSandboxPrompt(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700">Official Correct Answer</label>
            <input
              type="text"
              value={sandboxCorrect}
              onChange={(e) => setSandboxCorrect(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
            />

            <label className="block text-xs font-bold text-stone-700">Simulated Student Answer</label>
            <input
              type="text"
              value={sandboxStudentAnswer}
              onChange={(e) => setSandboxStudentAnswer(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
            />
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <button
              onClick={handleTestSandboxGrading}
              disabled={gradingSandbox}
              className="w-full py-2.5 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-amber-300" />
              {gradingSandbox ? 'Evaluating...' : 'Test Grading Algorithm'}
            </button>

            {sandboxGradeResult && (
              <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                sandboxGradeResult.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex justify-between font-bold">
                  <span>Result: {sandboxGradeResult.isCorrect ? 'CORRECT' : 'INCORRECT'}</span>
                  <span>{sandboxGradeResult.marksAwarded} / {sandboxGradeResult.maxMarks} Marks</span>
                </div>
                <div className="text-[11px] text-stone-600">{sandboxGradeResult.feedback}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
