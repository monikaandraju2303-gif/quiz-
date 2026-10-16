import React, { useEffect, useState, useRef } from 'react';
import {
  FolderUp,
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  BookOpen,
  Award,
  FileText,
  Sliders,
  Check,
  Eye,
  Save,
  Send,
  Upload,
  Code,
  Sparkles,
  ArrowRight,
  Download,
  RotateCcw,
  ListOrdered
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { materialsService } from '../services/materialsService';
import { api, FolderImportResponse } from '../services/api';
import {
  Classroom,
  QuestionType,
  QuizDifficulty,
  QuizQuestion,
  StudyMaterial,
  Quiz
} from '../types';
import { Modal } from '../components/common/Modal';

interface QuizGeneratorPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: {
    importedQuestions?: QuizQuestion[];
    title?: string;
    subject?: string;
    classId?: string;
  };
}

export const QuizGeneratorPage: React.FC<QuizGeneratorPageProps> = ({
  onNavigate,
  initialParams,
}) => {
  const { userProfile } = useAuth();
  const teacherId = userProfile?.uid || 'demo_teacher_42';
  const teacherName = userProfile?.displayName || 'Educator';

  // Active Creation Tab: 'manual' | 'import-folder' | 'paste'
  const [activeTab, setActiveTab] = useState<'manual' | 'import-folder' | 'paste'>('manual');

  // Metadata & Quiz Config
  const [title, setTitle] = useState<string>(initialParams?.title || 'General Assessment Quiz');
  const [subject, setSubject] = useState<string>(initialParams?.subject || 'Biology');
  const [topic, setTopic] = useState<string>('Core Concepts');
  const [targetClassId, setTargetClassId] = useState<string>(initialParams?.classId || '');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [timeLimit, setTimeLimit] = useState<number>(15);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [showScoreImmediately, setShowScoreImmediately] = useState<boolean>(true);

  // Available classes & materials
  const [classes, setClasses] = useState<Classroom[]>([]);

  // Questions in this quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialParams?.importedQuestions || []);

  // Saving state
  const [savingQuiz, setSavingQuiz] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // MANUAL QUESTION FORM STATE
  // ----------------------------------------------------------------
  const [manualType, setManualType] = useState<QuestionType>('multiple_choice');
  const [manualPrompt, setManualPrompt] = useState<string>('');
  const [manualOptions, setManualOptions] = useState<string[]>([
    'Option A',
    'Option B',
    'Option C',
    'Option D',
  ]);
  const [manualCorrectIndex, setManualCorrectIndex] = useState<number>(0);
  const [manualCorrectText, setManualCorrectText] = useState<string>('');
  const [manualExplanation, setManualExplanation] = useState<string>('');
  const [manualMarks, setManualMarks] = useState<number>(1);
  const [manualPageRef, setManualPageRef] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // FOLDER & FILE IMPORT STATE
  // ----------------------------------------------------------------
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<FolderImportResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // ----------------------------------------------------------------
  // RAW TEXT PASTE STATE
  // ----------------------------------------------------------------
  const [pasteText, setPasteText] = useState<string>(`What is the powerhouse organelle of the cell?
A. Mitochondrion
B. Nucleus
C. Endoplasmic Reticulum
D. Golgi Apparatus
ANSWER: A
Explanation: Mitochondria generate the cellular ATP.

Glycolysis is an aerobic process that requires oxygen.
A. True
B. False
ANSWER: B
Explanation: Glycolysis takes place anaerobically in the cytosol.`);
  const [pasteFormat, setPasteFormat] = useState<string>('auto');
  const [parsingPaste, setParsingPaste] = useState<boolean>(false);

  // Load teacher classrooms
  useEffect(() => {
    async function loadResources() {
      try {
        const cls = await classesService.getTeacherClasses(teacherId).catch(() => []);
        setClasses(cls || []);
        if (cls && cls.length > 0 && !targetClassId) {
          setTargetClassId(cls[0].id);
        }
      } catch (err) {
        console.error('Failed to load classrooms:', err);
      }
    }
    loadResources();
  }, [teacherId]);

  // Load sample initial questions if empty
  useEffect(() => {
    if (questions.length === 0 && !initialParams?.importedQuestions) {
      setQuestions([
        {
          id: 'q_demo_1',
          question: 'What is the primary currency of energy transfer in cellular metabolism?',
          type: 'multiple_choice',
          options: ['Adenosine Triphosphate (ATP)', 'Glucose-6-Phosphate', 'NADH', 'Pyruvate'],
          correctAnswer: 'Adenosine Triphosphate (ATP)',
          explanation: 'ATP hydrolyzes into ADP and inorganic phosphate, releasing energy for cellular work.',
          marks: 1,
          pageRef: 'Bioenergetics Chapter 2'
        },
        {
          id: 'q_demo_2',
          question: 'Aerobic cellular respiration yields significantly more ATP per glucose molecule than glycolysis alone.',
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: 'Aerobic respiration yields approximately 30-32 ATP, while glycolysis yields only 2 net ATP.',
          marks: 1,
          pageRef: 'Respiration Pathways'
        }
      ]);
    }
  }, []);

  // ----------------------------------------------------------------
  // MANUAL QUESTION HANDLERS
  // ----------------------------------------------------------------
  const handleAddManualQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!manualPrompt.trim()) {
      setFormError('Please enter a question prompt.');
      return;
    }

    let correctAnswer = '';
    let finalOptions: string[] | undefined = undefined;

    if (manualType === 'multiple_choice') {
      const validOptions = manualOptions.map(o => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setFormError('Multiple choice questions require at least 2 options.');
        return;
      }
      finalOptions = validOptions;
      correctAnswer = validOptions[manualCorrectIndex] || validOptions[0];
    } else if (manualType === 'true_false') {
      finalOptions = ['True', 'False'];
      correctAnswer = manualCorrectIndex === 0 ? 'True' : 'False';
    } else {
      // Short answer
      if (!manualCorrectText.trim()) {
        setFormError('Please provide the expected correct answer.');
        return;
      }
      correctAnswer = manualCorrectText.trim();
      finalOptions = undefined;
    }

    const newQ: QuizQuestion = {
      id: `q_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: manualPrompt.trim(),
      type: manualType,
      options: finalOptions,
      correctAnswer,
      explanation: manualExplanation.trim() || 'No explanation provided.',
      marks: Math.max(1, Number(manualMarks) || 1),
      pageRef: manualPageRef.trim() || undefined,
    };

    setQuestions([...questions, newQ]);

    // Reset Form
    setManualPrompt('');
    setManualExplanation('');
    setManualPageRef('');
    setManualCorrectText('');
    setManualOptions(['Option A', 'Option B', 'Option C', 'Option D']);
    setManualCorrectIndex(0);
  };

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...manualOptions];
    updated[index] = val;
    setManualOptions(updated);
  };

  const handleAddOptionField = () => {
    if (manualOptions.length >= 6) return;
    setManualOptions([...manualOptions, `Option ${String.fromCharCode(65 + manualOptions.length)}`]);
  };

  const handleRemoveOptionField = (index: number) => {
    if (manualOptions.length <= 2) return;
    const updated = manualOptions.filter((_, i) => i !== index);
    setManualOptions(updated);
    if (manualCorrectIndex >= updated.length) {
      setManualCorrectIndex(0);
    }
  };

  // ----------------------------------------------------------------
  // REORDERING & MANAGING QUESTIONS
  // ----------------------------------------------------------------
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDuplicateQuestion = (q: QuizQuestion) => {
    const duplicate: QuizQuestion = {
      ...q,
      id: `q_copy_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      question: `${q.question} (Copy)`,
    };
    setQuestions([...questions, duplicate]);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...questions];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIdx, 0, moved);
    setQuestions(copy);
  };

  // ----------------------------------------------------------------
  // FOLDER & MULTI-FILE IMPORT
  // ----------------------------------------------------------------
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportLoading(true);
    setImportError(null);
    try {
      const fileList = Array.from(files);
      const res = await api.importQuestionsFolder(fileList);
      setImportResult(res);
    } catch (err: any) {
      setImportError(err.message || 'Failed to import folder');
    } finally {
      setImportLoading(false);
    }
  };

  // Load Bundled Sample Question Folder
  const handleLoadSampleFolder = async () => {
    setImportLoading(true);
    setImportError(null);
    try {
      const sample = await api.getSampleQuestionFolder();
      const files: File[] = sample.files.map(f => new File([f.content], f.fileName, { type: 'text/plain' }));
      const res = await api.importQuestionsFolder(files);
      setImportResult(res);
    } catch (err: any) {
      setImportError(err.message || 'Failed to load sample folder');
    } finally {
      setImportLoading(false);
    }
  };

  // Merge Imported Questions to Quiz
  const handleAddImportedQuestions = (replace: boolean = false) => {
    if (!importResult || importResult.questions.length === 0) return;
    if (replace) {
      setQuestions(importResult.questions);
    } else {
      setQuestions([...questions, ...importResult.questions]);
    }
    setActiveTab('manual');
    setImportResult(null);
  };

  // ----------------------------------------------------------------
  // RAW TEXT PARSE
  // ----------------------------------------------------------------
  const handleParsePaste = async () => {
    if (!pasteText.trim()) return;
    setParsingPaste(true);
    try {
      const res = await api.parseRawQuestions(pasteText, pasteFormat);
      if (res.questions.length > 0) {
        setQuestions([...questions, ...res.questions]);
        setActiveTab('manual');
      } else {
        alert('No questions could be identified. Ensure format has questions and answers.');
      }
    } catch (err: any) {
      alert('Parse error: ' + err.message);
    } finally {
      setParsingPaste(false);
    }
  };

  // ----------------------------------------------------------------
  // SAVE / PUBLISH QUIZ
  // ----------------------------------------------------------------
  const handleSaveQuiz = async (status: 'published' | 'draft') => {
    if (questions.length === 0) {
      alert('Please add at least one question before saving.');
      return;
    }

    setSavingQuiz(true);
    setSaveSuccess(null);
    try {
      const selectedClass = classes.find(c => c.id === targetClassId);
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

      const payload: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'> = {
        teacherId,
        teacherName,
        classId: targetClassId || undefined,
        className: selectedClass?.name || 'General Quiz Library',
        title: title.trim() || 'Untitled Quiz',
        subject: subject.trim() || 'General',
        topic: topic.trim() || 'Assessment',
        difficulty,
        questionCount: questions.length,
        totalMarks,
        timeLimit: timeLimit > 0 ? timeLimit : undefined,
        status,
        reviewSettings: {
          showScoreImmediately,
          showCorrectAnswers: true,
          showExplanations,
        },
        questions,
      };

      const saved = await quizzesService.createQuiz(payload);
      setSaveSuccess(`Quiz "${saved.title}" saved successfully as ${status.toUpperCase()}!`);

      // Optionally navigate to my quizzes or test quiz
      setTimeout(() => {
        onNavigate('quizzes');
      }, 1200);
    } catch (err: any) {
      console.error('Failed to save quiz:', err);
      alert('Failed to save quiz: ' + err.message);
    } finally {
      setSavingQuiz(false);
    }
  };

  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 1), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#1B2A4A] text-amber-300 flex items-center justify-center shadow-xs">
              <FolderUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
                Manual Quiz Generator & Folder Import Studio
              </h1>
              <p className="text-sm text-stone-500 mt-0.5">
                Author custom questions or bulk-import question banks directly from folders (JSON, CSV, Aiken, Markdown).
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('test-data')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Test Data Diagnostics
          </button>
          <button
            onClick={() => handleSaveQuiz('draft')}
            disabled={savingQuiz || questions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save as Draft
          </button>
          <button
            onClick={() => handleSaveQuiz('published')}
            disabled={savingQuiz || questions.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-amber-300" />
            {savingQuiz ? 'Publishing...' : 'Publish to Class'}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Quiz Top Settings Panel */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-600" />
          Quiz Configuration & Class Assignment
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Quiz Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cellular Biology Midterm"
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#1B2A4A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Biology"
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#1B2A4A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Target Classroom</label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#1B2A4A] font-medium"
            >
              <option value="">General (All Students / Practice)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subject})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Time Limit (Minutes)</label>
            <input
              type="number"
              min={0}
              max={180}
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value) || 0)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#1B2A4A]"
            />
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Creator Tools (Tabs: Manual Form, Folder Import, Paste) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Studio Tab Switcher */}
          <div className="flex bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Manual Builder
            </button>
            <button
              onClick={() => setActiveTab('import-folder')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'import-folder'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
              Import Folder
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Text Paste
            </button>
          </div>

          {/* TAB 1: MANUAL QUESTION BUILDER */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Add New Question Manually
                </h3>
                <span className="text-xs text-stone-400 font-mono">100% Manual Crafting</span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddManualQuestion} className="space-y-4">
                {/* Question Type Selector */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">Question Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'multiple_choice', label: 'Multiple Choice' },
                      { id: 'true_false', label: 'True / False' },
                      { id: 'short_answer', label: 'Short Answer' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setManualType(t.id as QuestionType);
                          setManualCorrectIndex(0);
                        }}
                        className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                          manualType === t.id
                            ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Question Prompt</label>
                  <textarea
                    rows={2}
                    value={manualPrompt}
                    onChange={(e) => setManualPrompt(e.target.value)}
                    placeholder="Enter the question clearly for students..."
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-[#1B2A4A]"
                    required
                  />
                </div>

                {/* Multiple Choice Options */}
                {manualType === 'multiple_choice' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-stone-700">
                        Options (Select radio for correct answer)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddOptionField}
                        disabled={manualOptions.length >= 6}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                      >
                        + Add Choice
                      </button>
                    </div>

                    <div className="space-y-2">
                      {manualOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctOptionRadio"
                            checked={manualCorrectIndex === idx}
                            onChange={() => setManualCorrectIndex(idx)}
                            className="w-4 h-4 text-[#1B2A4A] focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-stone-500 w-4">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(idx, e.target.value)}
                            placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
                          />
                          {manualOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionField(idx)}
                              className="p-1 text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False Selector */}
                {manualType === 'true_false' && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-700">Correct Answer</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setManualCorrectIndex(0)}
                        className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                          manualCorrectIndex === 0
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        True
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualCorrectIndex(1)}
                        className={`p-3 rounded-lg border text-xs font-bold text-center transition-all ${
                          manualCorrectIndex === 1
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        False
                      </button>
                    </div>
                  </div>
                )}

                {/* Short Answer Field */}
                {manualType === 'short_answer' && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Expected Correct Answer (Evaluation Key)
                    </label>
                    <input
                      type="text"
                      value={manualCorrectText}
                      onChange={(e) => setManualCorrectText(e.target.value)}
                      placeholder="e.g. Mitochondria, or concise key phrase"
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
                      required
                    />
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pedagogical Explanation / Solution Note
                  </label>
                  <input
                    type="text"
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="Why this answer is correct..."
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
                  />
                </div>

                {/* Marks & Reference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Marks (Points)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={manualMarks}
                      onChange={(e) => setManualMarks(Number(e.target.value) || 1)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Source / Section Ref</label>
                    <input
                      type="text"
                      value={manualPageRef}
                      onChange={(e) => setManualPageRef(e.target.value)}
                      placeholder="e.g. Chapter 3, Slide 14"
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber-300" />
                  Add Question to Quiz
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: IMPORT FOLDER OF QUESTION FILES */}
          {activeTab === 'import-folder' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <FolderUp className="w-4 h-4 text-indigo-600" />
                  Import Question Files from Folder
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                  Folder & Multi-File
                </span>
              </div>

              <p className="text-xs text-stone-500">
                Select an entire directory or multiple question files from your local drive. We automatically detect and parse <strong>JSON</strong>, <strong>CSV</strong>, <strong>Aiken Text</strong>, and <strong>Markdown</strong>.
              </p>

              {/* Hidden Inputs for folder and multiple files */}
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFolderUpload}
                {...({ webkitdirectory: '', directory: '' } as any)}
              />
              <input
                ref={filesInputRef}
                type="file"
                multiple
                accept=".json,.csv,.txt,.md,.aiken,.gift"
                className="hidden"
                onChange={handleFolderUpload}
              />

              {/* Upload Drop Zone Buttons */}
              <div className="p-6 border-2 border-dashed border-stone-300 rounded-xl bg-stone-50/70 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-800">
                    Select a Folder with Question Banks
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Click below to choose a directory containing questions
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={importLoading}
                    className="px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                    Select Entire Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => filesInputRef.current?.click()}
                    disabled={importLoading}
                    className="px-3.5 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-50 transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Select Individual Files
                  </button>
                </div>
              </div>

              {/* Quick Test Option: One-Click Bundled Sample Folder */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">Want to test folder import immediately?</span>
                  <span className="text-[11px] text-amber-700">Load our bundled sample question folder (JSON, CSV, Aiken text).</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleFolder}
                  disabled={importLoading}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-xs"
                >
                  {importLoading ? 'Loading...' : 'Load Sample Folder'}
                </button>
              </div>

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {importError}
                </div>
              )}

              {/* Imported Folder Summary Card */}
              {importResult && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span>Folder Processed: {importResult.totalFiles} Files</span>
                    <span className="text-emerald-700">{importResult.totalQuestions} Questions Found</span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {importResult.fileResults.map((fr, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-stone-200 text-xs">
                        <span className="truncate max-w-[200px] text-stone-800 font-mono text-[11px]">
                          {fr.fileName}
                        </span>
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                          {fr.questionCount} Questions
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAddImportedQuestions(false)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Append to Quiz (+{importResult.totalQuestions})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddImportedQuestions(true)}
                      className="py-2 px-3 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-bold transition-colors"
                    >
                      Replace Quiz Questions
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEXT PASTE (AIKEN / CSV / JSON) */}
          {activeTab === 'paste' && (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-stone-700" />
                  Quick Text Paste Parser
                </h3>
                <span className="text-xs text-stone-400">Aiken / CSV / JSON</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Paste Question Text</label>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Paste question bank..."
                  className="w-full text-xs font-mono p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 font-medium">Format:</span>
                  <select
                    value={pasteFormat}
                    onChange={(e) => setPasteFormat(e.target.value)}
                    className="p-1 bg-stone-50 border border-stone-200 rounded text-xs font-semibold"
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="aiken">Aiken Format</option>
                    <option value="csv">CSV Spreadsheet</option>
                    <option value="json">JSON Array</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleParsePaste}
                  disabled={parsingPaste || !pasteText.trim()}
                  className="px-4 py-2 bg-[#1B2A4A] text-white rounded-lg text-xs font-bold hover:bg-[#253966] transition-colors"
                >
                  {parsingPaste ? 'Parsing...' : 'Parse & Add to Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Quiz Question Review & Live Question List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
            {/* Header with Counters */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-600" />
                  Current Quiz Questions ({questions.length})
                </h3>
                <p className="text-[11px] text-stone-500">
                  Total Marks: <strong className="text-stone-900">{totalMarks}</strong> • Review and reorder questions
                </p>
              </div>

              {questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQuestions([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Questions List */}
            {questions.length === 0 ? (
              <div className="py-12 text-center text-stone-400 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-stone-300" />
                <p className="text-xs font-medium">No questions added yet.</p>
                <p className="text-[11px]">Use the builder on the left or import a questions folder.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 hover:border-stone-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#1B2A4A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-stone-200 text-stone-700">
                          {q.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                          {q.marks || 1} Pt{(q.marks || 1) > 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Reorder and Delete Controls */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(q)}
                          className="p-1 text-stone-400 hover:text-indigo-600"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-stone-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question text */}
                    <p className="text-xs font-bold text-stone-900 leading-snug">
                      {q.question}
                    </p>

                    {/* Choices preview */}
                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = opt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
                          return (
                            <div
                              key={oIdx}
                              className={`text-[11px] px-2 py-1 rounded flex items-center gap-1.5 border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-white border-stone-200 text-stone-600'
                              }`}
                            >
                              <span className="font-bold text-[10px] text-stone-400">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span className="truncate">{opt}</span>
                              {isCorrect && <Check className="w-3 h-3 text-emerald-600 ml-auto shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer Preview */}
                    {q.type === 'short_answer' && (
                      <div className="text-[11px] p-2 bg-emerald-50/70 border border-emerald-200 rounded text-emerald-900">
                        <strong>Expected Answer:</strong> {q.correctAnswer}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <p className="text-[10px] text-stone-500 italic pt-0.5">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
