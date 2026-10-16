import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configure body parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Multer memory storage for uploaded documents
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx|doc|txt|png|jpe?g|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, DOCX, TXT, or Image files.'));
    }
  }
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Resilient Gemini caller with automatic retry and model fallback
async function callGeminiWithRetry(params: {
  contents: any;
  config?: any;
  preferredModel?: string;
}) {
  const models = [
    params.preferredModel || 'gemini-3.8-flash',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite'
  ];
  let lastError: any = null;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * i));
      }
      return await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
    } catch (err: any) {
      console.warn(`Gemini call with ${model} (attempt ${i + 1}) encountered:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError;
}

// Helper for dynamic pdf-parse import
async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  try {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const data = await pdfParse(buffer);
    return {
      text: data.text || '',
      pages: data.numpages || 1
    };
  } catch (err) {
    console.warn('pdf-parse encountered issue, fallback may be needed:', err);
    throw err;
  }
}

// 1. Text Extraction API
app.post('/api/extract-text', upload.single('file'), async (req: express.Request, res: express.Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let extractedText = '';
    let pageCount = 1;
    let warning = '';
    const originalName = file.originalname;
    const mimeType = file.mimetype;

    // A. PDF Files
    if (mimeType === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf')) {
      try {
        const result = await extractTextFromPdf(file.buffer);
        extractedText = result.text.trim();
        pageCount = result.pages;
      } catch (pdfErr) {
        console.warn('Direct PDF extraction failed, trying multimodal OCR fallback:', pdfErr);
      }

      // If text is virtually empty (scanned PDF), use Gemini Vision OCR
      if (!extractedText || extractedText.length < 50) {
        try {
          const geminiRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: file.buffer.toString('base64')
                  }
                },
                {
                  text: 'Extract and transcribe all educational text, lecture notes, diagrams descriptions, and formulas from this PDF file verbatim. Return only the extracted study notes.'
                }
              ]
            }
          });
          extractedText = geminiRes.text?.trim() || '';
          warning = 'Extracted via intelligent OCR from scanned pages.';
        } catch (ocrErr: any) {
          console.error('OCR fallback failed:', ocrErr);
          if (!extractedText) {
            return res.status(422).json({
              error: 'Could not extract readable text from this PDF. Please ensure it is not password-protected.'
            });
          }
        }
      }
    }
    // B. DOCX Files
    else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalName.toLowerCase().endsWith('.docx')
    ) {
      const docxResult = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = docxResult.value.trim();
    }
    // C. TXT Files
    else if (mimeType === 'text/plain' || originalName.toLowerCase().endsWith('.txt')) {
      extractedText = file.buffer.toString('utf-8').trim();
    }
    // D. Images (Handwritten/Printed Notes, Whiteboard/Blackboard Photos)
    else if (mimeType.startsWith('image/')) {
      try {
        const geminiRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: file.buffer.toString('base64')
                }
              },
              {
                text: 'You are an educational assistant transcribing classroom notes. Transcribe all text, formulas, diagrams, questions, and notes from this image accurately and clearly. Organize into coherent study notes.'
              }
            ]
          }
        });
        extractedText = geminiRes.text?.trim() || '';
        warning = 'Extracted from image notes using classroom OCR.';
      } catch (imgErr: any) {
        return res.status(422).json({ error: 'Failed to extract text from image: ' + (imgErr.message || 'Unknown error') });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported file type.' });
    }

    if (!extractedText || extractedText.length < 10) {
      return res.status(422).json({
        error: 'The uploaded file appears to be empty or unreadable. Please check the document content.'
      });
    }

    const words = extractedText.split(/\s+/).filter(Boolean).length;

    return res.json({
      fileName: originalName,
      mimeType,
      text: extractedText,
      wordCount: words,
      pageCount,
      warning: warning || undefined
    });
  } catch (err: any) {
    console.error('Extraction error:', err);
    return res.status(500).json({ error: err.message || 'An error occurred during file extraction' });
  }
});

// 2. AI Quiz Generation API
app.post('/api/generate-quiz', async (req: express.Request, res: express.Response) => {
  try {
    const {
      sourceText,
      title,
      subject,
      topic,
      targetClass,
      difficulty = 'medium',
      questionCount = 5,
      questionTypes = ['multiple_choice'],
      marksPerQuestion = 1,
      language = 'English',
      includeExplanations = true
    } = req.body;

    if (!sourceText || typeof sourceText !== 'string' || sourceText.trim().length < 20) {
      return res.status(400).json({
        error: 'Insufficient source text. Please provide at least a few paragraphs of study material.'
      });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 30);
    const marks = Number(marksPerQuestion) || 1;

    const allowedTypes = (Array.isArray(questionTypes) && questionTypes.length > 0)
      ? questionTypes
      : ['multiple_choice'];

    const systemInstruction = `You are a master educator and pedagogical assessment expert.
Your mission is to generate an educational quiz strictly based on the provided classroom notes and study material.
Strict Guidelines:
1. Preserve absolute factual accuracy from the source notes. Never contradict the text.
2. Avoid information absent from the material unless strictly necessary for common sense context.
3. Eliminate duplicate or overlapping questions.
4. Language must be ${language}, suited for ${targetClass || 'students'} at ${difficulty} difficulty level.
5. Allowed question types: ${allowedTypes.join(', ')}.
   - If 'multiple_choice': provide exactly 4 options. One clearly correct answer, and 3 realistic, plausible distractors.
   - If 'true_false': provide exactly 2 options: ["True", "False"]. The correct answer must be either "True" or "False".
   - If 'short_answer': do not provide options. The correctAnswer should be a concise, standard 1-2 sentence response.
6. Provide a clear, educational explanation for each question explaining why the correct answer is right and correcting common misconceptions.
7. Include a pageRef or source reference if identifiable from headers, sections, or topics in the text.
8. Output MUST strictly conform to the JSON schema.`;

    const userPrompt = `Generate a ${count}-question quiz for subject: "${subject || 'General'}", topic: "${topic || title || 'Study Notes'}", difficulty: "${difficulty}".
Marks per question: ${marks}.
Include explanations: ${includeExplanations}.
Question types to distribute: ${allowedTypes.join(', ')}.

Source Material:
---
${sourceText.slice(0, 30000)}
---`;

    const response = await callGeminiWithRetry({
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique question id e.g. q1' },
              question: { type: Type.STRING, description: 'The question text' },
              type: {
                type: Type.STRING,
                enum: ['multiple_choice', 'true_false', 'short_answer'],
                description: 'The type of question'
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Array of option choices for MCQ (4 choices) or T/F (2 choices: ["True", "False"])'
              },
              correctAnswer: { type: Type.STRING, description: 'The exact correct answer text' },
              explanation: { type: Type.STRING, description: 'Pedagogical explanation of the solution' },
              marks: { type: Type.NUMBER, description: 'Marks awarded for this question' },
              pageRef: { type: Type.STRING, description: 'Optional section or page reference from source' }
            },
            required: ['id', 'question', 'type', 'correctAnswer', 'explanation']
          }
        }
      }
    });

    const rawText = response.text?.trim() || '[]';
    let questions: any[];
    try {
      questions = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', rawText);
      return res.status(502).json({ error: 'Failed to generate structured questions from AI. Please try again.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(422).json({ error: 'No questions could be generated from the given study material.' });
    }

    // Format & sanitize questions
    const formattedQuestions = questions.map((q, idx) => {
      const qType = (q.type === 'true_false' || q.type === 'short_answer') ? q.type : 'multiple_choice';
      let options = q.options;

      if (qType === 'true_false') {
        options = ['True', 'False'];
      } else if (qType === 'multiple_choice') {
        if (!Array.isArray(options) || options.length < 2) {
          options = ['Option A', 'Option B', 'Option C', 'Option D'];
        }
        // Ensure correct answer is one of the options
        if (!options.includes(q.correctAnswer)) {
          options[0] = q.correctAnswer;
        }
      } else {
        options = undefined;
      }

      return {
        id: q.id || `q_${Date.now()}_${idx + 1}`,
        question: q.question || `Question ${idx + 1}`,
        type: qType,
        options,
        correctAnswer: String(q.correctAnswer || '').trim(),
        explanation: q.explanation || 'Refer to the study material for further review.',
        marks: Number(q.marks) || marks,
        pageRef: q.pageRef || undefined
      };
    });

    const totalMarks = formattedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0);

    return res.json({
      title: title || `${subject || 'Study'} Quiz - ${topic || 'General'}`,
      subject: subject || 'General',
      topic: topic || 'Notes Review',
      difficulty,
      questions: formattedQuestions,
      questionCount: formattedQuestions.length,
      totalMarks
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate quiz questions' });
  }
});

// 3. Regenerate Single Question API
app.post('/api/regenerate-question', async (req: express.Request, res: express.Response) => {
  try {
    const {
      currentQuestion,
      sourceText,
      subject,
      topic,
      difficulty = 'medium',
      instruction = 'Provide an alternative question covering this topic'
    } = req.body;

    const prompt = `Current question: ${JSON.stringify(currentQuestion)}
Topic: ${topic || 'General'}, Subject: ${subject || 'General'}, Difficulty: ${difficulty}.
Teacher instruction: ${instruction}

Source Notes:
${(sourceText || '').slice(0, 15000)}

Generate a replacement question strictly conforming to the requested type and format.`;

    const response = await callGeminiWithRetry({
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['multiple_choice', 'true_false', 'short_answer'] },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            marks: { type: Type.NUMBER },
            pageRef: { type: Type.STRING }
          },
          required: ['id', 'question', 'type', 'correctAnswer', 'explanation']
        }
      }
    });

    const newQuestion = JSON.parse(response.text?.trim() || '{}');
    newQuestion.id = currentQuestion.id || `q_${Date.now()}`;
    return res.json(newQuestion);
  } catch (err: any) {
    console.error('Regenerate question error:', err);
    return res.status(500).json({ error: err.message || 'Failed to regenerate question' });
  }
});

// 4. Server-Side Scoring & Grading API
app.post('/api/grade-attempt', async (req: express.Request, res: express.Response) => {
  try {
    const { questions, answers } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid questions payload' });
    }

    const studentAnswers = answers || {};
    let totalScore = 0;
    let maxMarks = 0;
    const gradedAnswers: Record<string, any> = {};

    for (const q of questions) {
      const qId = q.id;
      const qMarks = Number(q.marks) || 1;
      maxMarks += qMarks;

      const rawAns = studentAnswers[qId]?.studentAnswer ?? studentAnswers[qId] ?? '';
      const studentAnsStr = String(rawAns).trim();
      const correctAnsStr = String(q.correctAnswer).trim();

      let isCorrect = false;
      let marksAwarded = 0;
      let feedback = q.explanation || '';

      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        // Strict case-insensitive match for multiple choice and True/False
        if (studentAnsStr.toLowerCase() === correctAnsStr.toLowerCase()) {
          isCorrect = true;
          marksAwarded = qMarks;
        }
      } else if (q.type === 'short_answer') {
        // Evaluate short answers
        if (studentAnsStr.toLowerCase() === correctAnsStr.toLowerCase()) {
          isCorrect = true;
          marksAwarded = qMarks;
        } else if (studentAnsStr.length > 0) {
          // Check semantic similarity with Gemini for short answers
          try {
            const gradePrompt = `Question: "${q.question}"
Expected Answer: "${correctAnsStr}"
Student Answer: "${studentAnsStr}"
Max Marks: ${qMarks}

Evaluate if the student answer demonstrates understanding of the core concept.
Return JSON with:
{
  "isCorrect": boolean,
  "marksAwarded": number (between 0 and ${qMarks}),
  "feedback": "brief 1-sentence comment on student answer"
}`;
            const evalRes = await callGeminiWithRetry({
              contents: gradePrompt,
              config: {
                temperature: 0.1,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    isCorrect: { type: Type.BOOLEAN },
                    marksAwarded: { type: Type.NUMBER },
                    feedback: { type: Type.STRING }
                  },
                  required: ['isCorrect', 'marksAwarded', 'feedback']
                }
              }
            });
            const evalJson = JSON.parse(evalRes.text?.trim() || '{}');
            isCorrect = Boolean(evalJson.isCorrect);
            marksAwarded = Math.min(Math.max(Number(evalJson.marksAwarded) || 0, 0), qMarks);
            if (evalJson.feedback) {
              feedback = evalJson.feedback;
            }
          } catch (evalErr) {
            // Simple keyword overlap fallback if AI evaluation fails
            const correctWords = correctAnsStr.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const studentWords = studentAnsStr.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const matches = correctWords.filter(w => studentWords.includes(w));
            if (correctWords.length > 0 && matches.length / correctWords.length >= 0.5) {
              isCorrect = true;
              marksAwarded = qMarks;
            }
          }
        }
      }

      totalScore += marksAwarded;
      gradedAnswers[qId] = {
        questionId: qId,
        studentAnswer: studentAnsStr,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksAwarded,
        maxMarks: qMarks,
        feedback,
        explanation: q.explanation
      };
    }

    const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

    return res.json({
      score: totalScore,
      totalMarks: maxMarks,
      percentage,
      gradedAnswers
    });
  } catch (err: any) {
    console.error('Grading error:', err);
    return res.status(500).json({ error: err.message || 'Failed to grade attempt' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'EduQuiz AI API', timestamp: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduQuiz AI server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
