// Simple database client using localStorage for local testing and SaaS demo

export interface Flashcard {
  id: string;
  courseId: string;
  lectureNumber: number;
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface QuizQuestion {
  id: string;
  courseId: string;
  lectureNumber: number;
  question: string;
  options: string[];
  correctOption: number; // 0 to 3
}

export interface Student {
  id: string;
  name: string;
  email: string;
  courseId: string;
  avatarUrl?: string;
  nationalId: string;
  phone: string;
  rollNumber: number; // رقم الكشف في الكورس
  whatsappGroupUrl?: string;
  lectureUrl?: string;
}

export interface Application {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  courseId: string;
  photoUrl: string; // Base64 avatar
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Institution {
  id: string;
  name: string;
  subdomain: string;
  logoUrl?: string;
  createdAt: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface SelfEvaluation {
  id: string;
  username: string;
  lectureNumber: number;
  understandingRating: number; // 1 to 5
  effortRating: number; // 1 to 5
  notes: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lecturesCount: number;
  price: number;
  coverImage?: string;
  lectureUrl: string; // رابط المحاضرة القابل للتعديل
  whatsappGroupUrl: string; // رابط جروب الواتساب للدورة
}

const DEFAULT_COURSES: Course[] = [
  {
    id: "web-dev",
    title: "دورة تطوير الويب الشامل",
    description: "تعلم HTML, CSS, JavaScript, React & Next.js من الصفر للاحتراف.",
    lecturesCount: 12,
    price: 500,
    lectureUrl: "https://meet.google.com/abc-defg-hij",
    whatsappGroupUrl: "https://chat.whatsapp.com/G1x2y3z4"
  },
  {
    id: "digital-marketing",
    title: "دورة التسويق الرقمي",
    description: "إتقان الإعلانات الممولة، السيو، وكتابة المحتوى التسويقي.",
    lecturesCount: 8,
    price: 350,
    lectureUrl: "https://zoom.us/j/9876543210",
    whatsappGroupUrl: "https://chat.whatsapp.com/H5w6x7y8"
  }
];

const DEFAULT_FLASHCARDS: Flashcard[] = [
  { id: "fc-1", courseId: "web-dev", lectureNumber: 1, question: "ما هو الـ HTML؟", answer: "لغة ترميز النص التشعبي المستخدمة في بناء هيكل صفحات الويب الأساسي.", difficulty: "easy" },
  { id: "fc-2", courseId: "web-dev", lectureNumber: 1, question: "ما هو وسم الـ <a> في HTML؟", answer: "يستخدم لإنشاء الروابط التشعبية (Hyperlinks) للانتقال بين الصفحات.", difficulty: "easy" },
  { id: "fc-3", courseId: "web-dev", lectureNumber: 2, question: "ما وظيفة CSS؟", answer: "تُستخدم لتنسيق وتصميم صفحات الويب (الألوان، الخطوط، التخطيط، والأنيميشن).", difficulty: "easy" },
  { id: "fc-4", courseId: "web-dev", lectureNumber: 3, question: "ما هو Next.js؟", answer: "إطار عمل مبني على React يتيح الـ Server-Side Rendering وبناء تطبيقات كاملة.", difficulty: "medium" }
];

const DEFAULT_QUIZZES: QuizQuestion[] = [
  {
    id: "q-1",
    courseId: "web-dev",
    lectureNumber: 1,
    question: "أي من الوسوم التالية يستخدم لعرض عنوان رئيسي كبير في HTML؟",
    options: ["<h6>", "<p>", "<h1>", "<heading>"],
    correctOption: 2
  },
  {
    id: "q-2",
    courseId: "web-dev",
    lectureNumber: 1,
    question: "ما هو الوسم الصحيح لإدراج سطر جديد (Line Break)؟",
    options: ["<break>", "<lb>", "<br>", "<hr>"],
    correctOption: 2
  },
  {
    id: "q-3",
    courseId: "web-dev",
    lectureNumber: 2,
    question: "كيف نقوم بربط ملف CSS خارجي بصفحة HTML؟",
    options: ["بواسطة الوسم <style>", "بواسطة الوسم <link>", "بواسطة الوسم <script>", "بواسطة الوسم <a>"],
    correctOption: 1
  }
];

export const db = {
  // Institutions (المراكز والمدارس)
  getInstitutions: (): Institution[] => {
    if (typeof window === "undefined") return [];
    const key = "institutions_list";
    const stored = localStorage.getItem(key);
    if (!stored) {
      const initial: Institution[] = [
        { 
          id: "inst-1", 
          name: "مركز التعليم الأول", 
          subdomain: "center1", 
          createdAt: new Date().toISOString(),
          adminEmail: "admin@center1.com",
          adminPassword: "admin_center1"
        }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  },
  saveInstitutions: (list: Institution[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("institutions_list", JSON.stringify(list));
  },
  addInstitution: (name: string, subdomain: string, logoUrl?: string, adminEmail?: string, adminPassword?: string): Institution => {
    const list = db.getInstitutions();
    const cleanSubdomain = subdomain.trim().toLowerCase();
    const newInst: Institution = {
      id: `inst-${Date.now()}`,
      name,
      subdomain: cleanSubdomain,
      logoUrl,
      createdAt: new Date().toISOString(),
      adminEmail: adminEmail || `admin@${cleanSubdomain}.com`,
      adminPassword: adminPassword || `admin_${cleanSubdomain}`
    };
    list.push(newInst);
    db.saveInstitutions(list);
    return newInst;
  },

  // Courses
  getCourses: (tenant: string): Course[] => {
    if (typeof window === "undefined") return DEFAULT_COURSES;
    const key = `courses_${tenant}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_COURSES));
      return DEFAULT_COURSES;
    }
    return JSON.parse(stored);
  },
  saveCourses: (tenant: string, courses: Course[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`courses_${tenant}`, JSON.stringify(courses));
  },

  // Flashcards
  getFlashcards: (tenant: string, courseId?: string, lectureNumber?: number): Flashcard[] => {
    if (typeof window === "undefined") return DEFAULT_FLASHCARDS;
    const key = `flashcards_${tenant}`;
    const stored = localStorage.getItem(key);
    let cards: Flashcard[] = stored ? JSON.parse(stored) : DEFAULT_FLASHCARDS;
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_FLASHCARDS));
    }
    if (courseId) {
      cards = cards.filter(c => c.courseId === courseId);
    }
    if (lectureNumber !== undefined && lectureNumber > 0) {
      cards = cards.filter(c => c.lectureNumber === lectureNumber);
    }
    return cards;
  },
  saveFlashcards: (tenant: string, cards: Flashcard[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`flashcards_${tenant}`, JSON.stringify(cards));
  },

  // Quizzes
  getQuizzes: (tenant: string, courseId?: string, lectureNumber?: number): QuizQuestion[] => {
    if (typeof window === "undefined") return DEFAULT_QUIZZES;
    const key = `quizzes_${tenant}`;
    const stored = localStorage.getItem(key);
    let quizzes: QuizQuestion[] = stored ? JSON.parse(stored) : DEFAULT_QUIZZES;
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(DEFAULT_QUIZZES));
    }
    if (courseId) {
      quizzes = quizzes.filter(q => q.courseId === courseId);
    }
    if (lectureNumber !== undefined && lectureNumber > 0) {
      quizzes = quizzes.filter(q => q.lectureNumber === lectureNumber);
    }
    return quizzes;
  },
  saveQuizzes: (tenant: string, quizzes: QuizQuestion[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`quizzes_${tenant}`, JSON.stringify(quizzes));
  },

  // Students
  getStudents: (tenant: string): Student[] => {
    if (typeof window === "undefined") return [];
    const key = `students_${tenant}`;
    const stored = localStorage.getItem(key);
    if (!stored) {
      const initial: Student[] = [
        {
          id: "std-1",
          name: "أحمد محمود علي حسن",
          email: "ahmed_01020304050@center.com",
          courseId: "web-dev",
          nationalId: "29912040102030",
          phone: "01020304050",
          rollNumber: 1,
          whatsappGroupUrl: "https://chat.whatsapp.com/G1x2y3z4",
          lectureUrl: "https://meet.google.com/abc-defg-hij"
        }
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  },
  saveStudents: (tenant: string, students: Student[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`students_${tenant}`, JSON.stringify(students));
  },

  // Applications (طلبات الالتحاق)
  getApplications: (tenant: string): Application[] => {
    if (typeof window === "undefined") return [];
    const key = `applications_${tenant}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  },
  saveApplications: (tenant: string, apps: Application[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`applications_${tenant}`, JSON.stringify(apps));
  },
  addApplication: (tenant: string, app: Omit<Application, "id" | "status" | "createdAt">): Application => {
    const key = `applications_${tenant}`;
    const stored = localStorage.getItem(key);
    const apps: Application[] = stored ? JSON.parse(stored) : [];
    const newApp: Application = {
      ...app,
      id: `app-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    apps.push(newApp);
    localStorage.setItem(key, JSON.stringify(apps));
    return newApp;
  },

  // Self Evaluations
  getEvaluations: (tenant: string, username: string): SelfEvaluation[] => {
    if (typeof window === "undefined") return [];
    const key = `evals_${tenant}_${username}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  },
  saveEvaluation: (tenant: string, username: string, evaluation: Omit<SelfEvaluation, "id" | "createdAt">) => {
    if (typeof window === "undefined") return;
    const key = `evals_${tenant}_${username}`;
    const stored = localStorage.getItem(key);
    const evals: SelfEvaluation[] = stored ? JSON.parse(stored) : [];
    const newEval: SelfEvaluation = {
      ...evaluation,
      id: `eval-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    evals.push(newEval);
    localStorage.setItem(key, JSON.stringify(evals));
    return newEval;
  },

  // Quiz Scores
  saveQuizScore: (tenant: string, username: string, courseId: string, lectureNumber: number, score: number) => {
    if (typeof window === "undefined") return;
    const key = `scores_${tenant}_${username}`;
    const stored = localStorage.getItem(key);
    const scores: Record<string, number> = stored ? JSON.parse(stored) : {};
    scores[`${courseId}_${lectureNumber}`] = score;
    localStorage.setItem(key, JSON.stringify(scores));
  },
  getQuizScores: (tenant: string, username: string): Record<string, number> => {
    if (typeof window === "undefined") return {};
    const key = `scores_${tenant}_${username}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  },
  getStudentTotalScore: (tenant: string, username: string): number => {
    const scores = db.getQuizScores(tenant, username);
    return Object.values(scores).reduce((a, b) => a + b, 0) * 10;
  }
};
