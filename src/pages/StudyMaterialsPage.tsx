import React, { useEffect, useState, useRef } from 'react';
import {
  FileText,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Sparkles,
  Trash2,
  Eye,
  BookOpen,
  Check,
  Plus,
  Loader2,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { materialsService } from '../services/materialsService';
import { classesService } from '../services/classesService';
import { api, ExtractedFileResult } from '../services/api';
import { Classroom, StudyMaterial } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';

interface StudyMaterialsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const StudyMaterialsPage: React.FC<StudyMaterialsPageProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload & Extraction states
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedFileResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [saving, setSaving] = useState(false);

  // Preview Modal
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teacherId = userProfile?.uid || 'demo_teacher_42';

  useEffect(() => {
    loadData();
  }, [teacherId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mats, cls] = await Promise.all([
        materialsService.getTeacherMaterials(teacherId).catch(() => []),
        classesService.getTeacherClasses(teacherId).catch(() => []),
      ]);
      setMaterials(mats || []);
      setClasses(cls || []);
    } catch (err) {
      console.error('Failed to load study materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    // Validate size (max 20MB)
    if (selectedFile.size > 20 * 1024 * 1024) {
      setExtractionError('File size exceeds 20MB limit. Please upload a smaller document.');
      return;
    }

    setFile(selectedFile);
    setExtractionError(null);
    setExtracting(true);

    // Auto-suggest title & subject from filename
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
    if (!title) {
      setTitle(cleanName.replace(/[-_]/g, ' '));
    }

    try {
      const result = await api.extractText(selectedFile);
      setExtractedData(result);
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to extract text from file.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSaveMaterial = async () => {
    const textToSave =
      activeTab === 'upload' ? extractedData?.text : pastedText.trim();

    if (!title.trim()) {
      setExtractionError('Please provide a title for the study material.');
      return;
    }
    if (!textToSave || textToSave.length < 20) {
      setExtractionError('Material must contain at least 20 characters of study notes.');
      return;
    }

    setSaving(true);
    setExtractionError(null);

    try {
      const words = textToSave.split(/\s+/).filter(Boolean).length;
      await materialsService.saveMaterial({
        ownerId: teacherId,
        classId: selectedClassId || undefined,
        title: title.trim(),
        subject: subject.trim() || 'General',
        fileName: file?.name || 'Pasted Notes.txt',
        mimeType: file?.type || 'text/plain',
        extractedText: textToSave,
        wordCount: words,
        processingStatus: 'completed',
      });

      // Reset form
      setFile(null);
      setExtractedData(null);
      setTitle('');
      setSubject('');
      setPastedText('');
      await loadData();
    } catch (err: any) {
      setExtractionError('Failed to save material: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await materialsService.deleteMaterial(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  const handleLaunchQuiz = (material: StudyMaterial) => {
    onNavigate('quiz-generator', {
      sourceText: material.extractedText,
      title: `${material.title} Quiz`,
      subject: material.subject,
      classId: material.classId,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-stone-200">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
          Study Materials & Notes
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
          Upload PDF lecture slides, DOCX syllabi, or classroom photos to extract notes for quiz generation.
        </p>
      </div>

      {/* Upload & Entry Section */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Tab switch */}
        <div className="flex border-b border-stone-200 bg-stone-50/70 p-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Upload Document (PDF, DOCX, Image)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Paste Text or Study Notes
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {activeTab === 'upload' ? (
            <div>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/40 hover:bg-stone-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.docx,.doc,.txt,image/*"
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto mb-3 shadow-2xs text-[#1B2A4A]">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <p className="text-sm font-bold text-stone-800">
                  {file ? file.name : 'Click to browse or drop lecture files here'}
                </p>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Supports PDF files, Microsoft Word (.docx), plain text (.txt), and classroom whiteboard/notebook images (OCR).
                </p>
              </div>

              {/* Extraction Progress Indicator */}
              {extracting && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-700 animate-spin" />
                  <div>
                    <p className="text-xs font-bold text-blue-900">
                      Extracting text and structure...
                    </p>
                    <p className="text-[11px] text-blue-700">
                      Processing document and preparing notes for AI quiz generation.
                    </p>
                  </div>
                </div>
              )}

              {/* Extraction Warning or Note */}
              {extractedData?.warning && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{extractedData.warning}</span>
                </div>
              )}

              {/* Extracted Preview Box */}
              {extractedData && (
                <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Extracted Content Preview ({extractedData.wordCount.toLocaleString()} words)
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {extractedData.pageCount} page{extractedData.pageCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto p-3 bg-white rounded-lg border border-stone-200 text-xs text-stone-700 font-mono whitespace-pre-wrap leading-relaxed">
                    {extractedData.text.slice(0, 1000)}
                    {extractedData.text.length > 1000 && '... [Click View Extracted to see full text]'}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                Paste Classroom Notes, Outline, or Syllabus Text *
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste lecture transcript, chapter notes, key definitions, or study objectives..."
                className="w-full p-3.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              />
              <div className="mt-1 flex justify-between text-[11px] text-stone-400">
                <span>Supports bullet points, formulas, definitions, and headers.</span>
                <span>{pastedText.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {extractionError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{extractionError}</span>
            </div>
          )}

          {/* Material Metadata Fields */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Material Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cellular Respiration Notes"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Chemistry"
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1">
                Assign to Class (Optional)
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              >
                <option value="">General (All Classes)</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.subject})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSaveMaterial}
              disabled={saving || extracting || (!extractedData?.text && !pastedText.trim())}
              className="px-5 py-2.5 bg-[#1B2A4A] text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#15223c] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save to Study Materials'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Saved Study Materials Table / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 tracking-tight">
            Saved Learning Materials ({materials.length})
          </h3>
        </div>

        {materials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-5 flex flex-col justify-between hover:shadow-xs transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-md">
                      {item.subject}
                    </span>
                    <button
                      onClick={() => handleDeleteMaterial(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete material"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {item.fileName || 'Notes'} • {item.wordCount ? `${item.wordCount} words` : 'Text'}
                  </p>

                  <p className="text-xs text-stone-600 line-clamp-3 mt-3 leading-relaxed font-mono text-[11px] bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    {item.extractedText.slice(0, 150)}...
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setPreviewMaterial(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Text</span>
                  </button>

                  <button
                    onClick={() => handleLaunchQuiz(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Generate Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No study materials saved"
            description="Upload notes or paste a course syllabus above to build your study library."
          />
        )}
      </div>

      {/* Extracted Text Full View Modal */}
      <Modal
        isOpen={previewMaterial !== null}
        onClose={() => setPreviewMaterial(null)}
        title={previewMaterial?.title || 'Extracted Study Notes'}
        subtitle={`${previewMaterial?.fileName || ''} • ${previewMaterial?.wordCount || 0} words`}
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-mono whitespace-pre-wrap leading-relaxed">
            {previewMaterial?.extractedText}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-stone-400">Subject: {previewMaterial?.subject}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100"
              >
                Close
              </button>
              {previewMaterial && (
                <button
                  onClick={() => {
                    handleLaunchQuiz(previewMaterial);
                    setPreviewMaterial(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#1B2A4A] rounded-xl hover:bg-[#15223c] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Quiz from this Material</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
