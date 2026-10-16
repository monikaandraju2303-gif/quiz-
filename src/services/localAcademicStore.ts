import { Classroom, Quiz, StudyMaterial, QuizAttempt } from '../types';

const CLASSES_KEY = 'eduquiz_local_classes';
const MATERIALS_KEY = 'eduquiz_local_materials';
const QUIZZES_KEY = 'eduquiz_local_quizzes';
const ATTEMPTS_KEY = 'eduquiz_local_attempts';

const DEFAULT_CLASSES: Classroom[] = [
  {
    id: 'cls_ap_biology_11',
    teacherId: 'demo_teacher_42',
    teacherName: 'Prof. Eleanor Vance',
    name: 'AP Biology — Cellular Processes',
    subject: 'Biology',
    grade: '11',
    section: 'Period 3',
    description: 'Comprehensive study of cellular bioenergetics, photosynthesis, and enzymatic catalysts.',
    joinCode: 'BIO704',
    studentIds: ['demo_student_88', 'student_sarah_12', 'student_liam_99'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'cls_world_history_10',
    teacherId: 'demo_teacher_42',
    teacherName: 'Prof. Eleanor Vance',
    name: 'Modern World History',
    subject: 'History',
    grade: '10',
    section: 'Section B',
    description: 'Exploration of 19th and 20th century global developments, revolutions, and political philosophies.',
    joinCode: 'HIS202',
    studentIds: ['demo_student_88'],
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'cls_cs_principles_12',
    teacherId: 'demo_teacher_42',
    teacherName: 'Prof. Eleanor Vance',
    name: 'Computer Science Principles',
    subject: 'Computer Science',
    grade: '12',
    section: 'Room 208',
    description: 'Algorithms, data structures, cloud architectures, and computational problem solving.',
    joinCode: 'CSP990',
    studentIds: ['demo_student_88'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const DEFAULT_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat_cell_bio_notes',
    ownerId: 'demo_teacher_42',
    classId: 'cls_ap_biology_11',
    title: 'Cellular Respiration & Krebs Cycle Notes',
    subject: 'Biology',
    fileName: 'Cellular_Respiration_Unit4.pdf',
    mimeType: 'application/pdf',
    extractedText: `Cellular respiration is the set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The catabolic reactions involved in respiration include glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation. Glycolysis takes place in the cytosol and does not require oxygen (anaerobic). The Krebs cycle takes place within the mitochondrial matrix, producing NADH and FADH2 which transfer high-energy electrons to the electron transport chain on the inner mitochondrial membrane. The final electron acceptor in aerobic respiration is molecular oxygen, which combines with protons to form water. The proton gradient established across the inner membrane powers ATP synthase via chemiosmosis, generating approximately 30 to 32 ATP molecules per glucose molecule.`,
    wordCount: 142,
    attachments: [
      {
        id: 'att_bio_formula',
        name: 'Bioenergetics Formula Sheet & Pathway',
        type: 'formula_sheet',
        content: `Chemical Equation for Aerobic Cellular Respiration:
C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + ~30-32 ATP

Key Stages:
1. Glycolysis: Glucose (6C) -> 2 Pyruvate (3C) + 2 Net ATP + 2 NADH (Location: Cytosol)
2. Pyruvate Oxidation: 2 Pyruvate -> 2 Acetyl-CoA + 2 CO2 + 2 NADH (Location: Mitochondrial Matrix)
3. Krebs Cycle: 2 Acetyl-CoA -> 4 CO2 + 2 ATP + 6 NADH + 2 FADH2
4. Oxidative Phosphorylation: Electron transport chain & Chemiosmosis across inner mitochondrial membrane`,
        size: '1.2 KB',
        dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    processingStatus: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'mat_world_war_notes',
    ownerId: 'demo_teacher_42',
    classId: 'cls_world_history_10',
    title: 'Industrial Revolution & Social Transformation',
    subject: 'History',
    fileName: 'Industrial_Revolution_Overview.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extractedText: `The Industrial Revolution was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States, in the period from about 1760 to about 1840. It marked a major turning point in history; almost every aspect of daily life was influenced in some way. In particular, average income and population began to exhibit unprecedented sustained growth. Technological advancements included the mechanized cotton spinning powered by steam or water, the steam engine developed by James Watt, and the iron smelting process using coke instead of charcoal. The shift from agrarian societies to urban factory centers resulted in rapid urbanization, the emergence of the industrial middle class, and early labor movements advocating for workplace regulations and child labor laws.`,
    wordCount: 125,
    attachments: [
      {
        id: 'att_hist_timeline',
        name: 'Industrial Revolution Chronological Timeline',
        type: 'guide',
        content: `Key Milestones of the Industrial Era:
- 1712: Thomas Newcomen builds first commercial steam-powered pump
- 1764: James Hargreaves invents the Spinning Jenny
- 1769: James Watt patents improved condenser steam engine
- 1784: Henry Cort develops the puddling process for wrought iron
- 1807: Robert Fulton operates commercial steamboat
- 1825: George Stephenson opens Stockton & Darlington Railway
- 1833: British Factory Act establishes workplace regulations for youth`,
        size: '1.8 KB',
        dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    processingStatus: 'completed',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const DEFAULT_QUIZZES: Quiz[] = [
  {
    id: 'quiz_cellular_bio_mastery',
    teacherId: 'demo_teacher_42',
    teacherName: 'Prof. Eleanor Vance',
    classId: 'cls_ap_biology_11',
    className: 'AP Biology — Cellular Processes',
    title: 'Cellular Respiration & Bioenergetics Assessment',
    subject: 'Biology',
    topic: 'Cellular Respiration',
    difficulty: 'medium',
    questionCount: 4,
    totalMarks: 6,
    timeLimit: 15,
    maxAttempts: 2,
    status: 'published',
    allowReferenceSheet: true,
    attachments: [
      {
        id: 'att_sheet_1',
        name: 'Cellular Respiration Formula & Pathway Sheet',
        type: 'formula_sheet',
        content: `Reference Formulae:
- Aerobic Equation: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + Energy
- Net Glycolysis ATP: 2 ATP per glucose
- Oxidative Phosphorylation: Complex I to IV proton translocation
- ATP Synthase: H+ influx down electrochemical gradient drives ADP + Pi phosphorylation.`,
        size: '1.5 KB',
      },
    ],
    reviewSettings: {
      showScoreImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
    },
    questions: [
      {
        id: 'q1',
        question: 'What is the final electron acceptor in the aerobic electron transport chain?',
        type: 'multiple_choice',
        options: ['Molecular Oxygen (O2)', 'Carbon Dioxide (CO2)', 'Water (H2O)', 'NAD+'],
        correctAnswer: 'Molecular Oxygen (O2)',
        explanation: 'Oxygen acts as the terminal electron acceptor, binding electrons and protons to form metabolic water.',
        marks: 1,
        pageRef: 'Mitochondrial Membrane Pathways',
      },
      {
        id: 'q2',
        question: 'Glycolysis takes place in the mitochondrial matrix and requires oxygen.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Glycolysis occurs in the cytosol (cytoplasm) and is an anaerobic process that does not require oxygen.',
        marks: 1,
        pageRef: 'Cytosolic Glycolysis',
      },
      {
        id: 'q3',
        question: 'Which enzyme utilizes the electrochemical proton gradient across the inner mitochondrial membrane to synthesize ATP?',
        type: 'multiple_choice',
        options: ['ATP Synthase', 'Hexokinase', 'Pyruvate Dehydrogenase', 'Cytochrome c Oxidase'],
        correctAnswer: 'ATP Synthase',
        explanation: 'ATP Synthase acts as a molecular turbine, utilizing the proton-motive force (chemiosmosis) to phosphorylate ADP into ATP.',
        marks: 2,
        pageRef: 'Chemiosmotic Phosphorylation',
      },
      {
        id: 'q4',
        question: 'Explain why the inner mitochondrial membrane is heavily folded into cristae.',
        type: 'short_answer',
        correctAnswer: 'To increase the surface area for electron transport chains and ATP synthase complexes.',
        explanation: 'The folds (cristae) provide extensive surface area, maximizing the capacity of the cell to synthesize ATP through oxidative phosphorylation.',
        marks: 2,
        pageRef: 'Mitochondrial Morphology',
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'quiz_industrial_rev_assessment',
    teacherId: 'demo_teacher_42',
    teacherName: 'Prof. Eleanor Vance',
    classId: 'cls_world_history_10',
    className: 'Modern World History',
    title: 'Industrial Revolution & Societal Impact Quiz',
    subject: 'History',
    topic: 'Technological & Social Changes',
    difficulty: 'medium',
    questionCount: 3,
    totalMarks: 4,
    timeLimit: 10,
    maxAttempts: 3,
    status: 'published',
    allowReferenceSheet: true,
    attachments: [
      {
        id: 'att_hist_ref',
        name: 'Historical Timeline & Primary Source Excerpts',
        type: 'reading_excerpt',
        content: `Excerpt from Sadler Committee Report (1832):
"The hours of labor at that mill were from 5 a.m. to 9 p.m. with only one break for dinner. The children were severely fatigued, and accidents with unshielded gears were frequent."
Result: Prompted the landmark 1833 Factory Act.`,
        size: '2.1 KB',
      },
    ],
    reviewSettings: {
      showScoreImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
    },
    questions: [
      {
        id: 'q1',
        question: 'Which inventor developed the separate condenser steam engine that powered 18th-century factories?',
        type: 'multiple_choice',
        options: ['James Watt', 'Eli Whitney', 'Henry Bessemer', 'Thomas Edison'],
        correctAnswer: 'James Watt',
        explanation: 'James Watt patented the separate condenser in 1769, dramatically improving steam engine thermal efficiency.',
        marks: 1,
        pageRef: 'Steam Power Developments',
      },
      {
        id: 'q2',
        question: 'The Industrial Revolution initially originated in Great Britain during the mid-18th century.',
        type: 'true_false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Britain possessed abundant coal and iron reserves, political stability, colonial trade networks, and capital accumulation.',
        marks: 1,
        pageRef: 'Geographic Origins',
      },
      {
        id: 'q3',
        question: 'Describe one major social change resulting from the rapid transition from agrarian farming to urban factory labor.',
        type: 'short_answer',
        correctAnswer: 'Rapid urbanization and the emergence of industrial labor working classes.',
        explanation: 'Populations migrated into industrial cities, prompting changes in family structures, workplace safety legislation, and union movements.',
        marks: 2,
        pageRef: 'Social Stratification',
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const DEFAULT_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att_marcus_bio_1',
    quizId: 'quiz_cellular_bio_mastery',
    quizTitle: 'Cellular Respiration & Bioenergetics Assessment',
    studentId: 'demo_student_88',
    studentName: 'Marcus Chen',
    studentEmail: 'marcus.chen@student.edu',
    classId: 'cls_ap_biology_11',
    className: 'AP Biology — Cellular Processes',
    score: 5,
    totalMarks: 6,
    percentage: 83,
    answers: {
      q1: {
        questionId: 'q1',
        studentAnswer: 'Molecular Oxygen (O2)',
        correctAnswer: 'Molecular Oxygen (O2)',
        isCorrect: true,
        marksAwarded: 1,
        maxMarks: 1,
        feedback: 'Correct.',
        explanation: 'Oxygen acts as the terminal electron acceptor.',
      },
      q2: {
        questionId: 'q2',
        studentAnswer: 'False',
        correctAnswer: 'False',
        isCorrect: true,
        marksAwarded: 1,
        maxMarks: 1,
        feedback: 'Correct.',
        explanation: 'Glycolysis is anaerobic and takes place in cytosol.',
      },
      q3: {
        questionId: 'q3',
        studentAnswer: 'ATP Synthase',
        correctAnswer: 'ATP Synthase',
        isCorrect: true,
        marksAwarded: 2,
        maxMarks: 2,
        feedback: 'Correct.',
        explanation: 'ATP Synthase uses the proton gradient.',
      },
      q4: {
        questionId: 'q4',
        studentAnswer: 'To increase surface area inside the cell.',
        correctAnswer: 'To increase the surface area for electron transport chains and ATP synthase complexes.',
        isCorrect: true,
        marksAwarded: 1,
        maxMarks: 2,
        feedback: 'Good conceptual grasp; be specific about electron transport complexes.',
        explanation: 'Cristae provide surface area for ATP synthase complexes.',
      },
    },
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    submittedAt: new Date(Date.now() - 3000000).toISOString(),
    status: 'submitted',
    timeTaken: 580,
  },
  {
    id: 'att_sarah_bio_2',
    quizId: 'quiz_cellular_bio_mastery',
    quizTitle: 'Cellular Respiration & Bioenergetics Assessment',
    studentId: 'student_sarah_12',
    studentName: 'Sarah Jenkins',
    studentEmail: 's.jenkins@academy.edu',
    classId: 'cls_ap_biology_11',
    className: 'AP Biology — Cellular Processes',
    score: 6,
    totalMarks: 6,
    percentage: 100,
    answers: {},
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    submittedAt: new Date(Date.now() - 6500000).toISOString(),
    status: 'submitted',
    timeTaken: 450,
  },
];

function getStored<T>(key: string, defaultValue: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

export const localAcademicStore = {
  // Classes
  getClasses(teacherId?: string, studentId?: string): Classroom[] {
    let list = getStored<Classroom>(CLASSES_KEY, DEFAULT_CLASSES);
    if (teacherId) {
      list = list.filter((c) => c.teacherId === teacherId);
    }
    if (studentId) {
      list = list.filter((c) => c.studentIds?.includes(studentId));
    }
    return list;
  },
  saveClass(c: Classroom) {
    const list = getStored<Classroom>(CLASSES_KEY, DEFAULT_CLASSES);
    list.unshift(c);
    setStored(CLASSES_KEY, list);
  },
  updateClass(id: string, updates: Partial<Classroom>) {
    const list = getStored<Classroom>(CLASSES_KEY, DEFAULT_CLASSES).map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    setStored(CLASSES_KEY, list);
  },
  deleteClass(id: string) {
    const list = getStored<Classroom>(CLASSES_KEY, DEFAULT_CLASSES).filter((c) => c.id !== id);
    setStored(CLASSES_KEY, list);
  },

  // Materials
  getMaterials(ownerId?: string): StudyMaterial[] {
    let list = getStored<StudyMaterial>(MATERIALS_KEY, DEFAULT_MATERIALS);
    if (ownerId) {
      list = list.filter((m) => m.ownerId === ownerId);
    }
    return list;
  },
  saveMaterial(m: StudyMaterial) {
    const list = getStored<StudyMaterial>(MATERIALS_KEY, DEFAULT_MATERIALS);
    list.unshift(m);
    setStored(MATERIALS_KEY, list);
  },
  updateMaterial(id: string, updates: Partial<StudyMaterial>) {
    const list = getStored<StudyMaterial>(MATERIALS_KEY, DEFAULT_MATERIALS).map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    setStored(MATERIALS_KEY, list);
  },
  deleteMaterial(id: string) {
    const list = getStored<StudyMaterial>(MATERIALS_KEY, DEFAULT_MATERIALS).filter((m) => m.id !== id);
    setStored(MATERIALS_KEY, list);
  },

  // Quizzes
  getQuizzes(teacherId?: string, classId?: string): Quiz[] {
    let list = getStored<Quiz>(QUIZZES_KEY, DEFAULT_QUIZZES);
    if (teacherId) {
      list = list.filter((q) => q.teacherId === teacherId);
    }
    if (classId) {
      list = list.filter((q) => q.classId === classId && q.status === 'published');
    }
    return list;
  },
  getQuizById(id: string): Quiz | null {
    const list = getStored<Quiz>(QUIZZES_KEY, DEFAULT_QUIZZES);
    return list.find((q) => q.id === id) || null;
  },
  saveQuiz(q: Quiz) {
    const list = getStored<Quiz>(QUIZZES_KEY, DEFAULT_QUIZZES);
    list.unshift(q);
    setStored(QUIZZES_KEY, list);
  },
  updateQuiz(id: string, updates: Partial<Quiz>) {
    const list = getStored<Quiz>(QUIZZES_KEY, DEFAULT_QUIZZES).map((q) =>
      q.id === id ? { ...q, ...updates } : q
    );
    setStored(QUIZZES_KEY, list);
  },
  deleteQuiz(id: string) {
    const list = getStored<Quiz>(QUIZZES_KEY, DEFAULT_QUIZZES).filter((q) => q.id !== id);
    setStored(QUIZZES_KEY, list);
  },

  // Attempts
  getAttempts(studentId?: string, quizId?: string, classIds?: string[]): QuizAttempt[] {
    let list = getStored<QuizAttempt>(ATTEMPTS_KEY, DEFAULT_ATTEMPTS);
    if (studentId) {
      list = list.filter((a) => a.studentId === studentId);
    }
    if (quizId) {
      list = list.filter((a) => a.quizId === quizId);
    }
    if (classIds && classIds.length > 0) {
      list = list.filter((a) => a.classId && classIds.includes(a.classId));
    }
    return list;
  },
  saveAttempt(a: QuizAttempt) {
    const list = getStored<QuizAttempt>(ATTEMPTS_KEY, DEFAULT_ATTEMPTS);
    list.unshift(a);
    setStored(ATTEMPTS_KEY, list);
  },
  updateAttempt(id: string, updates: Partial<QuizAttempt>) {
    const list = getStored<QuizAttempt>(ATTEMPTS_KEY, DEFAULT_ATTEMPTS).map((a) =>
      a.id === id ? { ...a, ...updates } : a
    );
    setStored(ATTEMPTS_KEY, list);
  },

  resetDefaults() {
    setStored(CLASSES_KEY, DEFAULT_CLASSES);
    setStored(MATERIALS_KEY, DEFAULT_MATERIALS);
    setStored(QUIZZES_KEY, DEFAULT_QUIZZES);
    setStored(ATTEMPTS_KEY, DEFAULT_ATTEMPTS);
  },
  clearAll() {
    try {
      localStorage.removeItem(CLASSES_KEY);
      localStorage.removeItem(MATERIALS_KEY);
      localStorage.removeItem(QUIZZES_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
    } catch (e) {
      // ignore
    }
  },
};
