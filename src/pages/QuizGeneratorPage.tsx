import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  FileText,
  Sliders,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Plus,
  Eye,
  Save,
  Send,
  HelpCircle,
  Clock,
  BookOpen,
  AlertCircle,
  Loader2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { materialsService } from '../services/materialsService';
import { classesService } from '../services/classesService';
import { quizzesService } from '../services/quizzesService';
import { api } from '../services/api';
import {
  Classroom,
  QuestionType,
  QuizDifficulty,
  QuizQuestion,
  StudyMaterial,
} from '../types';
import { Modal } from '../components/common/Modal';

interface QuizGeneratorPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: {
    sourceText?: string;
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

  // Wizard Step (1: Source, 2: Config, 3: Review/Edit)
  const [step, setStep] = useState<1 | 2 | 3>(initialParams?.sourceText ? 2 : 1);

  // Data
  const [savedMaterials, setSavedMaterials] = useState<StudyMaterial[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);

  // Step 1: Source
  const [sourceMode, setSourceMode] = useState<'saved' | 'paste'>('saved');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>(initialParams?.sourceText || '');

  // Step 2: Config
  const [title, setTitle] = useState<string>(initialParams?.title || '');
  const [subject, setSubject] = useState<string>(initialParams?.subject || 'Biology');
  const [topic, setTopic] = useState<string>('');
  const [targetClassId, setTargetClassId] = useState<string>(initialParams?.classId || '');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1);
  const [timeLimit, setTimeLimit] = useState<number>(15); // minutes
  const [language, setLanguage] = useState<string>('English');
  const [includeExplanations, setIncludeExplanations] = useState<boolean>(true);

  // Step 3: Generated questions & editing
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activePreview, setActivePreview] = useState<boolean>(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [savingQuiz, setSavingQuiz] = useState<boolean>(false);

  // Load teacher materials and classes
  useEffect(() => {
    async function loadResources() {
      try {
        const [mats, cls] = await Promise.all([
          materialsService.getTeacherMaterials(teacherId).catch(() => []),
          classesService.getTeacherClasses(teacherId).catch(() => []),
        ]);
        setSavedMaterials(mats || []);
        setClasses(cls || []);

        if (mats && mats.length > 0 && !sourceText) {
          setSelectedMaterialId(mats[0].id);
          setSourceText(mats[0].extractedText);
          if (!title) setTitle(`${mats[0].title} Quiz`);
          if (!subject) setSubject(mats[0].subject);
        }
      } catch (err) {
        console.error('Failed to load teacher resources:', err);
      }
    }
    loadResources();
  }, [teacherId]);

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId(id);
    const found = savedMaterials.find((m) => m.id === id);
    if (found) {
      setSourceText(found.extractedText);
      if (!title) setTitle(`${found.title} Quiz`);
      if (found.subject) setSubject(found.subject);
    }
  };

  const toggleQuestionType = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length === 1) return; // Keep at least one
      setQuestionTypes(questionTypes.filter((t) => t !== type));
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  // Step 3: AI Generation Trigger
  const handleGenerateQuestions = async () => {
    if (!sourceText || sourceText.trim().length < 20) {
      setGenerationError('Please provide study material text before generating questions.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const generated = await api.generateQuiz({
        sourceText,
        title: title || `${subject} Quiz`,
        subject,
        topic: topic || title,
        targetClass: classes.find((c) => c.id === targetClassId)?.name,
        difficulty,
        questionCount,
        questionTypes,
        marksPerQuestion,
        timeLimit,
        language,
        includeExplanations,
      });

      setQuestions(generated.questions);
      setStep(3);
    } catch (err: any) {
      console.error('Generation error:', err);
      setGenerationError(
        err.message || 'Failed to generate questions. Please ensure notes contain sufficient educational details.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Editing individual question
  const updateQuestionText = (index: number, newText: string) => {
    const updated = [...questions];
    updated[index].question = newText;
    setQuestions(updated);
  };

  const updateQuestionOption = (qIndex: number, optIndex: number, newOption: string) => {
    const updated = [...questions];
    if (updated[qIndex].options) {
      const oldVal = updated[qIndex].options![optIndex];
      updated[qIndex].options![optIndex] = newOption;
      if (updated[qIndex].correctAnswer === oldVal) {
        updated[qIndex].correctAnswer = newOption;
      }
      setQuestions(updated);
    }
  };

  const updateCorrectAnswer = (qIndex: number, answer: string) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = answer;
    setQuestions(updated);
  };

  const updateExplanation = (index: number, newExp: string) => {
    const updated = [...questions];
    updated[index].explanation = newExp;
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addManualQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q_custom_${Date.now()}`,
      question: 'New question description...',
      type: 'multiple_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: 'Detailed explanation for why this answer is correct.',
      marks: marksPerQuestion || 1,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRegenerateQuestion = async (index: number) => {
    setRegeneratingIndex(index);
    try {
      const current = questions[index];
      const regenerated = await api.regenerateQuestion(current, sourceText, {
        subject,
        topic,
        difficulty,
      });
      const updated = [...questions];
      updated[index] = regenerated;
      setQuestions(updated);
    } catch (err: any) {
      alert('Could not regenerate this question: ' + err.message);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Save Quiz as Draft or Publish
  const handleSaveQuiz = async (status: 'draft' | 'published') => {
    if (questions.length === 0) return;
    setSavingQuiz(true);

    try {
      const selectedClass = classes.find((c) => c.id === targetClassId);
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

      await quizzesService.saveQuiz({
        teacherId,
        teacherName,
        classId: targetClassId || undefined,
        className: selectedClass?.name,
        materialIds: selectedMaterialId ? [selectedMaterialId] : [],
        title: title || `${subject} Quiz`,
        subject: subject || 'General',
        topic: topic || title,
        difficulty,
        questionCount: questions.length,
        totalMarks,
        timeLimit: timeLimit > 0 ? timeLimit : undefined,
        maxAttempts: 2,
        status,
        reviewSettings: {
          showScoreImmediately: true,
          showCorrectAnswers: true,
          showExplanations: true,
        },
        questions,
      });

      onNavigate('quizzes');
    } catch (err: any) {
      alert('Failed to save quiz: ' + err.message);
    } finally {
      setSavingQuiz(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Header & Progress Steps */}
      <div className="pb-4 border-b border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>AI Quiz Generator</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Generate curriculum-aligned assessments strictly grounded in your study material.
            </p>
          </div>

          {step === 3 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePreview(true)}
                className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-stone-500" />
                <span>Student Preview</span>
              </button>
            </div>
          )}
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-xl">
          <button
            onClick={() => setStep(1)}
            className={`p-2 rounded-xl text-left border transition-all ${
              step === 1
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
              Step 1
            </span>
            <span className="text-xs font-bold truncate block">Select Notes</span>
          </button>

          <button
            onClick={() => {
              if (sourceText.length > 20) setStep(2);
            }}
            disabled={sourceText.length < 20}
            className={`p-2 rounded-xl text-left border transition-all ${
              step === 2
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 disabled:opacity-50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
              Step 2
            </span>
            <span className="text-xs font-bold truncate block">Configure Quiz</span>
          </button>

          <button
            onClick={() => {
              if (questions.length > 0) setStep(3);
            }}
            disabled={questions.length === 0}
            className={`p-2 rounded-xl text-left border transition-all ${
              step === 3
                ? 'bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs'
                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50 disabled:opacity-50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
              Step 3
            </span>
            <span className="text-xs font-bold truncate block">Review & Publish</span>
          </button>
        </div>
      </div>

      {/* Error display */}
      {generationError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Generation Failed</p>
            <p className="mt-0.5">{generationError}</p>
          </div>
        </div>
      )}

      {/* Loading Overlay when Gemini AI is generating */}
      {isGenerating && (
        <div className="chalkboard-card rounded-2xl p-8 sm:p-12 text-center shadow-lg animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center mx-auto mb-4 text-amber-300">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Gemini is Analyzing Classroom Notes...
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto leading-relaxed">
            Extracting core pedagogical principles, formulating plausible distractors, and drafting
            clarifying solution explanations.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Formulating {questionCount} {difficulty} questions...</span>
          </div>
        </div>
      )}

      {/* STEP 1: Select Source Material */}
      {!isGenerating && step === 1 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900">Step 1: Choose Source Material</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Questions will be derived strictly from the content provided below.
              </p>
            </div>
            <div className="flex bg-stone-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setSourceMode('saved')}
                className={`px-3 py-1 rounded-md transition-all ${
                  sourceMode === 'saved' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                }`}
              >
                Saved Notes ({savedMaterials.length})
              </button>
              <button
                onClick={() => setSourceMode('paste')}
                className={`px-3 py-1 rounded-md transition-all ${
                  sourceMode === 'paste' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                }`}
              >
                Paste Direct Text
              </button>
            </div>
          </div>

          {sourceMode === 'saved' ? (
            savedMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {savedMaterials.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMaterial(m.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedMaterialId === m.id
                        ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-white border border-stone-200 rounded text-stone-700">
                        {m.subject}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {m.wordCount || 0} words
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-stone-900 mt-2 truncate">
                      {m.title}
                    </p>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-1 font-mono">
                      {m.extractedText.slice(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-stone-200 rounded-xl">
                <p className="text-xs text-stone-500 mb-3">No saved materials found.</p>
                <button
                  onClick={() => setSourceMode('paste')}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-lg"
                >
                  Switch to Paste Text
                </button>
              </div>
            )
          ) : (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Study Material Text *
              </label>
              <textarea
                rows={8}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste classroom lecture notes, textbook excerpt, study guide..."
                className="w-full p-3.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              />
              <p className="text-[11px] text-stone-400 mt-1 text-right">
                {sourceText.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
          )}

          {/* Action to proceed to Step 2 */}
          <div className="flex justify-end pt-3 border-t border-stone-100">
            <button
              onClick={() => setStep(2)}
              disabled={sourceText.trim().length < 20}
              className="px-5 py-2.5 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              <span>Next: Quiz Settings</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Configure the Quiz */}
      {!isGenerating && step === 2 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="text-base font-bold text-stone-900">Step 2: Quiz Configuration</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize question format, difficulty level, and scoring rules.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Notes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Quiz Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cellular Respiration & Krebs Cycle"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Subject & Topic *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject (e.g. Biology)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic (e.g. Unit 4)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Class */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Target Classroom
              </label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="">All Students / Self Practice</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Grade {c.grade})
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-stone-100 p-1 rounded-xl">
                {(['easy', 'medium', 'hard'] as QuizDifficulty[]).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      difficulty === d
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Number of Questions ({questionCount})
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full accent-[#1B2A4A] cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Question Types checkboxes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Question Types Allowed
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'multiple_choice' as QuestionType, label: 'Multiple Choice (4 options)' },
                { id: 'true_false' as QuestionType, label: 'True / False (2 options)' },
                { id: 'short_answer' as QuestionType, label: 'Short Answer (Semantic check)' },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    questionTypes.includes(t.id)
                      ? 'border-blue-600 bg-blue-50/30'
                      : 'border-stone-200 bg-stone-50/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={questionTypes.includes(t.id)}
                    onChange={() => toggleQuestionType(t.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-stone-800">{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Marks & Time Limit & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Marks per Question
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                placeholder="0 = Untimed"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Include Solution Explanations
              </label>
              <select
                value={includeExplanations ? 'yes' : 'no'}
                onChange={(e) => setIncludeExplanations(e.target.value === 'yes')}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="yes">Yes (Pedagogical explanations)</option>
                <option value="no">No (Answers only)</option>
              </select>
            </div>
          </div>

          {/* Trigger AI Generation */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Back
            </button>
            <button
              onClick={handleGenerateQuestions}
              className="px-6 py-3 bg-[#1B2A4A] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#15223c] transition-all shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Questions with Gemini AI</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Edit Questions */}
      {!isGenerating && step === 3 && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 tracking-tight">
                Review & Edit Generated Questions ({questions.length})
              </h3>
              <p className="text-xs text-stone-500">
                Total Marks:{' '}
                <span className="font-bold text-stone-800">
                  {questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                </span>{' '}
                • Difficulty: <span className="capitalize font-semibold">{difficulty}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={addManualQuestion}
                className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
              <button
                onClick={() => handleSaveQuiz('draft')}
                disabled={savingQuiz}
                className="px-4 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-stone-600" />
                <span>Save Draft</span>
              </button>
              <button
                onClick={() => handleSaveQuiz('published')}
                disabled={savingQuiz}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1B2A4A] hover:bg-[#15223c] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>Publish Quiz</span>
              </button>
            </div>
          </div>

          {/* Question Cards List */}
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-300 transition-all space-y-4"
              >
                {/* Question Header & Controls */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#1B2A4A] text-amber-300 text-xs font-extrabold flex items-center justify-center">
                      {qIndex + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-stone-400 font-medium">
                      {q.marks} Mark{q.marks > 1 ? 's' : ''}
                    </span>
                    {q.pageRef && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                        Ref: {q.pageRef}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRegenerateQuestion(qIndex)}
                      disabled={regeneratingIndex === qIndex}
                      className="p-1.5 text-stone-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Regenerate this question with AI"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          regeneratingIndex === qIndex ? 'animate-spin text-blue-600' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => deleteQuestion(qIndex)}
                      disabled={questions.length <= 1}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editable Question Text */}
                <div>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                    className="w-full p-2.5 text-xs sm:text-sm font-semibold bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>

                {/* Answer Options for MCQ or True/False */}
                {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                      Options (Click radio to set correct answer):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => {
                        const isCorrect = q.correctAnswer === opt;
                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                              isCorrect
                                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400'
                                : 'bg-white border-stone-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={isCorrect}
                              onChange={() => updateCorrectAnswer(qIndex, opt)}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={opt}
                              disabled={q.type === 'true_false'}
                              onChange={(e) =>
                                updateQuestionOption(qIndex, optIndex, e.target.value)
                              }
                              className="flex-1 text-xs bg-transparent border-0 p-0 text-stone-800 focus:outline-none font-medium"
                            />
                            {isCorrect && (
                              <span className="text-[10px] font-extrabold text-emerald-700 uppercase px-1.5 py-0.2 bg-emerald-100 rounded">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Short Answer Expected Text */}
                {q.type === 'short_answer' && (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Expected Model Answer:
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) => updateCorrectAnswer(qIndex, e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}

                {/* Explanation */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Pedagogical Explanation:
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) => updateExplanation(qIndex, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student View Modal Preview */}
      <Modal
        isOpen={activePreview}
        onClose={() => setActivePreview(false)}
        title={`Student View Preview: ${title || 'Quiz'}`}
        subtitle={`${questions.length} questions • ${timeLimit ? `${timeLimit} mins` : 'Untimed'}`}
        maxWidth="3xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {questions.map((q, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold text-stone-700">Question {idx + 1}</span>
                <span>{q.marks} Mark{q.marks > 1 ? 's' : ''}</span>
              </div>
              <p className="text-sm font-semibold text-stone-900">{q.question}</p>

              {q.options && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="p-2.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-800 font-medium"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {q.type === 'short_answer' && (
                <input
                  type="text"
                  disabled
                  placeholder="Student enters written answer here..."
                  className="w-full p-2.5 rounded-lg border border-stone-200 bg-white text-xs text-stone-400 italic"
                />
              )}
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => setActivePreview(false)}
            className="px-4 py-2 bg-stone-800 text-white text-xs font-semibold rounded-xl"
          >
            Close Preview
          </button>
        </div>
      </Modal>
    </div>
  );
};
