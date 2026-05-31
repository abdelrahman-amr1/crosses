"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  PlusCircle,
  Upload,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  FileText,
  UserCheck,
  UserX,
  Phone,
  Link,
  MessageSquare,
  BookMarked,
  ClipboardList,
  Lock,
  LogOut,
  Globe,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  Building
} from "lucide-react";
import { db, Course, Flashcard, QuizQuestion, Student, Application, Institution } from "@/lib/db";

export default function TenantAdminDashboard({
  params,
}: {
  params: { tenant: string };
}) {
  const [activeTab, setActiveTab] = useState<"applications" | "students" | "courses" | "flashcards" | "quizzes">("applications");

  // Admin login states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  // Create Center Modal states
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [newCenterName, setNewCenterName] = useState("");
  const [newCenterSubdomain, setNewCenterSubdomain] = useState("");
  const [newCenterLogoUrl, setNewCenterLogoUrl] = useState("");
  const [newCenterAdminEmail, setNewCenterAdminEmail] = useState("");
  const [newCenterAdminPassword, setNewCenterAdminPassword] = useState("");
  const [newCenterError, setNewCenterError] = useState("");
  const [newCenterSuccess, setNewCenterSuccess] = useState("");
  const [newCenterCreatedLinks, setNewCenterCreatedLinks] = useState<{
    admin: string;
    student: string;
    register: string;
    name: string;
    adminEmail: string;
    adminPassword: string;
  } | null>(null);

  // List of active institutions for switching centers / list view
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);

  // Storage synced states
  const [applications, setApplications] = useState<Application[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);

  // Filtering states
  const [selectedCourseId, setSelectedCourseId] = useState<string>("web-dev");
  const [selectedLectureNum, setSelectedLectureNum] = useState<number>(1);

  // Form states
  const [newStudent, setNewStudent] = useState({ name: "", email: "", courseId: "web-dev" });
  
  // Course edit & addition forms
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 500, lecturesCount: 12 });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseData, setEditingCourseData] = useState({ lectureUrl: "", whatsappGroupUrl: "" });

  // Flashcard manual form
  const [newFlashcard, setNewFlashcard] = useState<{ question: string; answer: string; difficulty: "easy" | "medium" | "hard" }>({ question: "", answer: "", difficulty: "medium" });
  const [editingFlashcardId, setEditingFlashcardId] = useState<string | null>(null);

  // Quiz manual form
  const [newQuiz, setNewQuiz] = useState({
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: 0
  });
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);

  // Alert/Feedback messages
  const [alertMsg, setAlertMsg] = useState("");

  // Load database on mount
  useEffect(() => {
    setApplications(db.getApplications(params.tenant));
    setStudents(db.getStudents(params.tenant));
    setCourses(db.getCourses(params.tenant));
    setFlashcards(db.getFlashcards(params.tenant));
    setQuizzes(db.getQuizzes(params.tenant));
    setAllInstitutions(db.getInstitutions());

    if (typeof window !== "undefined") {
      const logged = sessionStorage.getItem(`admin_logged_${params.tenant}`);
      if (logged === "true") {
        setIsAdminLoggedIn(true);
      }
    }
  }, [params.tenant]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");

    const currentCenter = allInstitutions.find(inst => inst.subdomain.toLowerCase() === params.tenant.toLowerCase());
    const correctEmail = currentCenter?.adminEmail || `admin@${params.tenant}.com`;
    const correctPassword = currentCenter?.adminPassword || `admin_${params.tenant}`;

    if (
      adminEmailInput.trim().toLowerCase() === correctEmail.toLowerCase() &&
      adminPasswordInput === correctPassword
    ) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem(`admin_logged_${params.tenant}`, "true");
    } else {
      setAdminLoginError("⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(`admin_logged_${params.tenant}`);
    setIsAdminLoggedIn(false);
    setAdminEmailInput("");
    setAdminPasswordInput("");
  };

  const handleCreateNewCenterFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    setNewCenterError("");
    setNewCenterSuccess("");
    setNewCenterCreatedLinks(null);

    if (!newCenterName.trim() || !newCenterSubdomain.trim()) {
      setNewCenterError("⚠️ يرجى إدخال اسم المركز والرابط الفرعي.");
      return;
    }

    const cleanSubdomain = newCenterSubdomain.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSubdomain)) {
      setNewCenterError("⚠️ الرابط الفرعي يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وعلامة - فقط.");
      return;
    }

    const all = db.getInstitutions();
    const exists = all.find(inst => inst.subdomain === cleanSubdomain);
    if (exists) {
      setNewCenterError("⚠️ هذا الرابط الفرعي مستخدم بالفعل لمركز آخر.");
      return;
    }

    const finalEmail = newCenterAdminEmail.trim() || `admin@${cleanSubdomain}.com`;
    const finalPass = newCenterAdminPassword.trim() || `admin_${cleanSubdomain}`;
    const newInst = db.addInstitution(newCenterName, cleanSubdomain, newCenterLogoUrl, finalEmail, finalPass);
    
    // Seed default courses
    db.getCourses(cleanSubdomain);

    setAllInstitutions([...all, newInst]);

    setNewCenterName("");
    setNewCenterSubdomain("");
    setNewCenterLogoUrl("");
    setNewCenterAdminEmail("");
    setNewCenterAdminPassword("");

    const rootUrl = typeof window !== "undefined" ? window.location.origin : "https://crosses-one.vercel.app";
    const links = {
      admin: `${rootUrl}/${cleanSubdomain}/admin`,
      student: `${rootUrl}/${cleanSubdomain}`,
      register: `${rootUrl}/${cleanSubdomain}/register`,
      name: newInst.name,
      adminEmail: finalEmail,
      adminPassword: finalPass
    };

    setNewCenterCreatedLinks(links);
    setNewCenterSuccess(`🎉 تم إنشاء وتأسيس مركز "${newInst.name}" بنجاح!`);
  };

  // Flash alert helper
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 6000);
  };

  // Student Applications Approval Workflow
  const handleApproveApp = (app: Application) => {
    const matchedCourse = courses.find(c => c.id === app.courseId);
    if (!matchedCourse) return;

    // 1. Generate unique roll number within this course
    const courseStudentsCount = students.filter(s => s.courseId === app.courseId).length;
    const nextRollNumber = courseStudentsCount + 1;

    // 2. Generate clean login email (using name and last digits of mobile)
    const englishNameSegment = app.fullName.replace(/\s+/g, "_");
    const autoEmail = `${englishNameSegment.substring(0, 12)}_${app.phone.slice(-4)}@${params.tenant}.com`;
    const autoPassword = app.phone; // default password is mobile number

    // 3. Create approved Student record
    const studentRecord: Student = {
      id: `std-${Date.now()}`,
      name: app.fullName,
      email: autoEmail,
      courseId: app.courseId,
      avatarUrl: app.photoUrl,
      nationalId: app.nationalId,
      phone: app.phone,
      rollNumber: nextRollNumber,
      whatsappGroupUrl: matchedCourse.whatsappGroupUrl,
      lectureUrl: matchedCourse.lectureUrl
    };

    // 4. Save to lists
    const updatedStudents = [...students, studentRecord];
    setStudents(updatedStudents);
    db.saveStudents(params.tenant, updatedStudents);

    // Update application status
    const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: "approved" as const } : a);
    setApplications(updatedApps);
    db.saveApplications(params.tenant, updatedApps);

    // 5. Construct official WhatsApp Message
    const whatsAppMessage = `السلام عليكم يا متدرب(ة) ${app.fullName}،
🎉 يسعدنا إعلامك بأنه تم قبولك رسمياً في دورة "${matchedCourse.title}" بمركزنا!

🔑 تفاصيل حسابك على المنصة لتسجيل الدخول:
رابط الدخول: http://${params.tenant}.localhost:3000
البريد الإلكتروني: ${autoEmail}
كلمة المرور: ${autoPassword} (رقم موبايلك)

📌 بيانات الدورة:
رقم كشفك في الكورس: #${nextRollNumber}
رابط جروب الواتساب المخصص للمتدربين: ${matchedCourse.whatsappGroupUrl}

تمنياتنا لك بالتوفيق والنجاح! 🎓`;

    // Format phone to international format for WhatsApp API (Egypt +20)
    let whatsAppPhone = app.phone;
    if (whatsAppPhone.startsWith("01")) {
      whatsAppPhone = `2${whatsAppPhone}`;
    }

    const waLink = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(waLink, "_blank");

    showAlert(`✅ تم قبول الطالب بنجاح!
📧 الحساب الجديد: ${autoEmail}
🔑 كلمة المرور: ${autoPassword}
📈 رقم الكشف: #${nextRollNumber}
🔗 تم فتح الواتساب لإشعار الطالب بالرسالة الرسمية.`);
  };

  const handleRejectApp = (app: Application) => {
    if (confirm(`هل تريد رفض طلب التحاق الطالب "${app.fullName}"؟`)) {
      const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: "rejected" as const } : a);
      setApplications(updatedApps);
      db.saveApplications(params.tenant, updatedApps);
      showAlert("🗑️ تم رفض طلب الالتحاق وحفظ الحالة.");
    }
  };

  // Student management (Manual creation)
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudent.name && newStudent.email) {
      const matchedCourse = courses.find(c => c.id === newStudent.courseId);
      if (!matchedCourse) return;

      const courseStudentsCount = students.filter(s => s.courseId === newStudent.courseId).length;
      const nextRollNumber = courseStudentsCount + 1;

      const studentObj: Student = {
        id: `std-${Date.now()}`,
        name: newStudent.name,
        email: newStudent.email,
        courseId: newStudent.courseId,
        nationalId: "29912040102030", // mock ID
        phone: "01000000000", // mock phone
        rollNumber: nextRollNumber,
        whatsappGroupUrl: matchedCourse.whatsappGroupUrl,
        lectureUrl: matchedCourse.lectureUrl
      };
      
      const updated = [...students, studentObj];
      setStudents(updated);
      db.saveStudents(params.tenant, updated);
      setNewStudent({ name: "", email: "", courseId: "web-dev" });
      
      showAlert(`✅ تم إنشاء حساب الطالب بنجاح! رقم كشفه: #${nextRollNumber}`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    if (confirm("هل تريد حذف هذا الطالب وحجزه؟")) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      db.saveStudents(params.tenant, updated);
      showAlert("🗑️ تم حذف الطالب بنجاح.");
    }
  };

  // Course management & Editing Links
  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourse.title) {
      const courseObj: Course = {
        id: `course-${Date.now()}`,
        title: newCourse.title,
        description: newCourse.description,
        price: Number(newCourse.price),
        lecturesCount: Number(newCourse.lecturesCount),
        lectureUrl: "https://meet.google.com/abc-defg-hij",
        whatsappGroupUrl: "https://chat.whatsapp.com/G1x2y3z4"
      };

      const updated = [...courses, courseObj];
      setCourses(updated);
      db.saveCourses(params.tenant, updated);
      setNewCourse({ title: "", description: "", price: 500, lecturesCount: 12 });
      showAlert(`✅ تم إضافة الدورة التعليمية "${courseObj.title}" بنجاح.`);
    }
  };

  const handleEditCourseLinks = (course: Course) => {
    setEditingCourseId(course.id);
    setEditingCourseData({
      lectureUrl: course.lectureUrl,
      whatsappGroupUrl: course.whatsappGroupUrl
    });
  };

  const handleSaveCourseLinks = () => {
    if (editingCourseId) {
      const updated = courses.map(c => 
        c.id === editingCourseId 
          ? { ...c, lectureUrl: editingCourseData.lectureUrl, whatsappGroupUrl: editingCourseData.whatsappGroupUrl } 
          : c
      );
      setCourses(updated);
      db.saveCourses(params.tenant, updated);
      setEditingCourseId(null);
      showAlert("✅ تم تحديث روابط الدورة التدريبية بنجاح! (انعكس لدى جميع المتدربين حالاً)");
    }
  };

  // Custom Inline CSV Parser helper
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];
    
    const results: string[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = [];
      let currentCell = "";
      let inQuotes = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cells.push(currentCell.trim().replace(/^["']|["']$/g, ""));
          currentCell = "";
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim().replace(/^["']|["']$/g, ""));
      results.push(cells);
    }
    return results;
  };

  // Flashcards management
  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFlashcard.question && newFlashcard.answer) {
      const cardObj: Flashcard = {
        id: editingFlashcardId || `fc-${Date.now()}`,
        courseId: selectedCourseId,
        lectureNumber: selectedLectureNum,
        question: newFlashcard.question,
        answer: newFlashcard.answer,
        difficulty: newFlashcard.difficulty
      };

      let updated: Flashcard[];
      if (editingFlashcardId) {
        updated = flashcards.map(c => c.id === editingFlashcardId ? cardObj : c);
        setEditingFlashcardId(null);
      } else {
        updated = [...flashcards, cardObj];
      }

      setFlashcards(updated);
      db.saveFlashcards(params.tenant, updated);
      setNewFlashcard({ question: "", answer: "", difficulty: "medium" });
      showAlert("✅ تم حفظ البطاقة التعليمية.");
    }
  };

  const handleEditFlashcard = (card: Flashcard) => {
    setEditingFlashcardId(card.id);
    setNewFlashcard({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty
    });
  };

  const handleDeleteFlashcard = (id: string) => {
    if (confirm("هل تريد حذف هذه البطاقة؟")) {
      const updated = flashcards.filter(c => c.id !== id);
      setFlashcards(updated);
      db.saveFlashcards(params.tenant, updated);
      showAlert("🗑️ تم حذف البطاقة.");
    }
  };

  // CSV Import for Flashcards
  const handleFlashcardCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            alert("الملف فارغ أو صيغته غير صحيحة.");
            return;
          }

          const newCards: Flashcard[] = parsed.map((row, idx) => {
            const question = row[0] || "";
            const answer = row[1] || "";
            const lectureNumber = Number(row[2]) || selectedLectureNum;
            
            return {
              id: `fc-csv-${Date.now()}-${idx}`,
              courseId: selectedCourseId,
              lectureNumber,
              question,
              answer,
              difficulty: "medium" as const
            };
          }).filter(c => c.question && c.answer);

          const updated = [...flashcards, ...newCards];
          setFlashcards(updated);
          db.saveFlashcards(params.tenant, updated);
          showAlert(`✅ تم استيراد ${newCards.length} بطاقة تعليمية من ملف CSV بنجاح!`);
        } catch (err) {
          alert("حدث خطأ أثناء قراءة ملف الـ CSV. تأكد من مطابقة التنسيق.");
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  // Quizzes management
  const handleAddQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuiz.optionA && newQuiz.optionB && newQuiz.question) {
      const quizObj: QuizQuestion = {
        id: editingQuizId || `q-${Date.now()}`,
        courseId: selectedCourseId,
        lectureNumber: selectedLectureNum,
        question: newQuiz.question,
        options: [newQuiz.optionA, newQuiz.optionB, newQuiz.optionC, newQuiz.optionD].filter(Boolean),
        correctOption: Number(newQuiz.correctOption)
      };

      let updated: QuizQuestion[];
      if (editingQuizId) {
        updated = quizzes.map(q => q.id === editingQuizId ? quizObj : q);
        setEditingQuizId(null);
      } else {
        updated = [...quizzes, quizObj];
      }

      setQuizzes(updated);
      db.saveQuizzes(params.tenant, updated);
      setNewQuiz({
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: 0
      });
      showAlert("✅ تم حفظ السؤال في الكويز.");
    }
  };

  const handleEditQuiz = (quiz: QuizQuestion) => {
    setEditingQuizId(quiz.id);
    setNewQuiz({
      question: quiz.question,
      optionA: quiz.options[0] || "",
      optionB: quiz.options[1] || "",
      optionC: quiz.options[2] || "",
      optionD: quiz.options[3] || "",
      correctOption: quiz.correctOption
    });
  };

  const handleDeleteQuiz = (id: string) => {
    if (confirm("هل تريد حذف هذا السؤال؟")) {
      const updated = quizzes.filter(q => q.id !== id);
      setQuizzes(updated);
      db.saveQuizzes(params.tenant, updated);
      showAlert("🗑️ تم حذف السؤال.");
    }
  };

  // CSV Import for Quizzes
  const handleQuizCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            alert("الملف فارغ أو صيغته غير صحيحة.");
            return;
          }

          const newQuizzesList: QuizQuestion[] = parsed.map((row, idx) => {
            const question = row[0] || "";
            const optionA = row[1] || "";
            const optionB = row[2] || "";
            const optionC = row[3] || "";
            const optionD = row[4] || "";
            const correctOption = Number(row[5]) || 0;
            const lectureNumber = Number(row[6]) || selectedLectureNum;
            
            return {
              id: `q-csv-${Date.now()}-${idx}`,
              courseId: selectedCourseId,
              lectureNumber,
              question,
              options: [optionA, optionB, optionC, optionD].filter(Boolean),
              correctOption
            };
          }).filter(q => q.question && q.options.length >= 2);

          const updated = [...quizzes, ...newQuizzesList];
          setQuizzes(updated);
          db.saveQuizzes(params.tenant, updated);
          showAlert(`✅ تم استيراد ${newQuizzesList.length} سؤال كويز من ملف CSV بنجاح!`);
        } catch (err) {
          alert("حدث خطأ أثناء قراءة ملف الـ CSV. تأكد من مطابقة التنسيق.");
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-right animate-fadeIn" dir="rtl">
        <div className="bg-slate-800 border border-slate-700/60 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient-glow pointer-events-none opacity-20" />
          
          <div className="text-center z-10 relative">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-inner">
              <Lock size={38} />
            </div>
            <h1 className="text-2xl font-extrabold text-white">لوحة تحكم أدمن المركز</h1>
            <p className="text-xs text-slate-400 mt-2 font-bold">تسجيل الدخول لمركز: <span className="text-blue-400 font-mono">/{params.tenant}</span></p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 z-10 relative">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">البريد الإلكتروني للأدمن:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={`admin@${params.tenant}.com`}
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-semibold text-sm"
                  dir="ltr"
                />
                <Users className="absolute right-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-semibold text-sm"
                  dir="ltr"
                />
                <Lock className="absolute right-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            {adminLoginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-bold">
                {adminLoginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 mt-2 text-sm"
            >
              تسجيل الدخول كأدمن للمركز
            </button>
          </form>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 text-[10px] text-slate-400 space-y-1 font-semibold leading-relaxed" dir="rtl">
            <p className="text-center font-bold text-blue-400 mb-1 text-xs">⚠️ بيانات الدخول الافتراضية لهذا المركز:</p>
            <p className="flex justify-between font-mono" dir="ltr">
              <span>{`admin@${params.tenant}.com`}</span>
              <span className="text-slate-500 font-bold">Email:</span>
            </p>
            <p className="flex justify-between font-mono" dir="ltr">
              <span>{`admin_${params.tenant}`}</span>
              <span className="text-slate-500 font-bold">Password:</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-right" dir="rtl">
      
      {/* Alert Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-6 right-6 md:left-auto md:max-w-lg bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-700 z-50 whitespace-pre-line text-sm font-bold leading-relaxed"
          >
            {alertMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header and Tenant Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={28} /> لوحة تحكم أدمن: {params.tenant}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">إدارة الطلاب المقبولين، طلبات الالتحاق، استيراد الكروت والكويزات عبر الـ CSV.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCenterModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
          >
            <PlusCircle size={14} /> إنشاء مركز جديد
          </button>
          <button
            onClick={handleAdminLogout}
            className="bg-red-50 text-red-600 border border-red-100 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-red-100 transition-all"
          >
            <LogOut size={14} /> خروج
          </button>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold dark:bg-slate-800 dark:text-blue-400">
            لوحة الإدارة المتقدمة
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { title: "طلبات الالتحاق المعلقة", value: applications.filter(a => a.status === "pending").length, icon: <ClipboardList size={24} /> },
          { title: "الطلاب المقبولين", value: students.length, icon: <Users size={24} /> },
          { title: "كروت الحفظ", value: flashcards.length, icon: <BookMarked size={24} /> },
          { title: "الدورات النشطة", value: courses.length, icon: <BookOpen size={24} /> },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8">
        {[
          { id: "applications", label: "طلبات التسجيل المعلقة", icon: <ClipboardList size={16} /> },
          { id: "students", label: "الطلاب المقبولين", icon: <Users size={16} /> },
          { id: "courses", label: "الدورات والروابط ديناميكياً", icon: <BookOpen size={16} /> },
          { id: "flashcards", label: "صانع الكروت (Flashcards)", icon: <BookMarked size={16} /> },
          { id: "quizzes", label: "الكويزات والامتحانات", icon: <FileText size={16} /> }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[400px]">
        
        {/* TAB 0: APPLICATIONS */}
        {activeTab === "applications" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">طلبات التحاق الطلاب الجدد للقبول والمراجعة</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                    <th className="pb-3 text-right">الصورة الشخصية</th>
                    <th className="pb-3 text-right">الاسم رباعي</th>
                    <th className="pb-3 text-right">الرقم القومي</th>
                    <th className="pb-3 text-right">رقم الواتساب</th>
                    <th className="pb-3 text-right">الكورس المطلوب</th>
                    <th className="pb-3 text-center">العمليات</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.filter(a => a.status === "pending").map((item) => {
                    const course = courses.find(c => c.id === item.courseId);
                    return (
                      <tr key={item.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Users size={18} className="text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 font-bold text-slate-800 dark:text-white">{item.fullName}</td>
                        <td className="py-4 text-slate-500 font-bold">{item.nationalId}</td>
                        <td className="py-4 text-slate-500 font-bold text-left select-text" dir="ltr">{item.phone}</td>
                        <td className="py-4 text-slate-600 font-bold dark:text-slate-300">
                          {course?.title || "دورة برمجة"}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleApproveApp(item)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1"
                            >
                              <UserCheck size={14} /> قبول
                            </button>
                            <button
                              onClick={() => handleRejectApp(item)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1"
                            >
                              <UserX size={14} /> رفض
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {applications.filter(a => a.status === "pending").length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                        🎉 لا توجد طلبات معلقة بانتظار الموافقة حالياً. يمكنك تجربة التسجيل كطالب جديد من رابط بوابة التسجيل العامة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-100/50">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2">
                🔗 <strong>رابط بوابة تسجيل الطلاب العامة للمشاركة:</strong>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                اعطِ هذا الرابط للطلاب ليسجلوا بياناتهم وصورهم بأنفسهم: 
                <a href={`/${params.tenant}/register`} target="_blank" className="text-blue-600 font-bold hover:underline block mt-1">
                  http://{params.tenant}.localhost:3000/register
                </a>
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: STUDENTS */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">قائمة المتدربين المقبولين بالمركز</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold">
                      <th className="pb-3 text-right">رقم الكشف</th>
                      <th className="pb-3 text-right">الاسم</th>
                      <th className="pb-3 text-right">البريد الإلكتروني</th>
                      <th className="pb-3 text-right">هاتف الواتساب</th>
                      <th className="pb-3 text-right">الدورة المسجل بها</th>
                      <th className="pb-3 text-center">العمليات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((item) => {
                      const studentCourse = courses.find(c => c.id === item.courseId);
                      return (
                        <tr key={item.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="py-4 font-bold text-blue-600">#{item.rollNumber || 1}</td>
                          <td className="py-4 font-bold text-slate-800 dark:text-white">{item.name}</td>
                          <td className="py-4 text-slate-500 font-medium">{item.email}</td>
                          <td className="py-4 text-slate-500 font-bold text-left" dir="ltr">{item.phone}</td>
                          <td className="py-4 text-slate-600 font-bold dark:text-slate-300">
                            {studentCourse?.title || "دورة غير معروفة"}
                          </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleDeleteStudent(item.id)}
                              className="text-red-500 hover:text-red-700 p-2 transition-colors inline-block"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          لم يتم قبول أو إضافة أي متدرب بعد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Add Student manually */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
              <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-white">إضافة متدرب يدوياً (سريع)</h3>
              
              <form onSubmit={handleAddStudent} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2">اسم المتدرب</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمود"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">البريد الإلكتروني للوجين</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">الدورة التعليمية</label>
                  <select
                    value={newStudent.courseId}
                    onChange={(e) => setNewStudent({ ...newStudent, courseId: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-2"
                >
                  <PlusCircle size={16} /> إضافة متدرب
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: COURSES & DYNAMIC LINKS */}
        {activeTab === "courses" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">الدورات وإدارة روابط المحاضرات وجروب الواتس</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.map((c) => {
                  const isEditingThis = editingCourseId === c.id;
                  return (
                    <div key={c.id} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-extrabold text-lg text-slate-800 dark:text-white">{c.title}</h4>
                          <button
                            onClick={() => handleEditCourseLinks(c)}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Edit size={12} /> تعديل الروابط
                          </button>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">{c.description}</p>
                        
                        {/* Links display / Edit forms */}
                        {isEditingThis ? (
                          <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 mt-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط بث المحاضرة الحالي (Zoom/Meet/etc):</label>
                              <input
                                type="text"
                                value={editingCourseData.lectureUrl}
                                onChange={(e) => setEditingCourseData({ ...editingCourseData, lectureUrl: e.target.value })}
                                className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 focus:outline-none text-left"
                                dir="ltr"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط جروب الواتس للمتدربين:</label>
                              <input
                                type="text"
                                value={editingCourseData.whatsappGroupUrl}
                                onChange={(e) => setEditingCourseData({ ...editingCourseData, whatsappGroupUrl: e.target.value })}
                                className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 focus:outline-none text-left"
                                dir="ltr"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleSaveCourseLinks}
                                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1"
                              >
                                <Save size={12} /> حفظ
                              </button>
                              <button
                                onClick={() => setEditingCourseId(null)}
                                className="bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5 text-xs font-medium text-slate-500 bg-slate-100/70 p-3 rounded-xl dark:bg-slate-800/40">
                            <p className="flex items-center gap-1.5 truncate">
                              <Link size={12} className="text-blue-500" />
                              <span>رابط المحاضرة:</span>
                              <a href={c.lectureUrl} target="_blank" className="text-blue-600 hover:underline select-text truncate font-bold" dir="ltr">
                                {c.lectureUrl}
                              </a>
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                              <MessageSquare size={12} className="text-emerald-500" />
                              <span>جروب الواتساب:</span>
                              <a href={c.whatsappGroupUrl} target="_blank" className="text-blue-600 hover:underline select-text truncate font-bold" dir="ltr">
                                {c.whatsappGroupUrl}
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800 pt-4 mt-4 text-xs font-bold">
                        <span className="text-slate-400">محاضرات الدورة: {c.lecturesCount} محاضرات</span>
                        <span className="text-green-600">{c.price} ج.م</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Add Course */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">إضافة دورة جديدة</h3>
              
              <form onSubmit={handleAddCourse} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold mb-2">اسم الدورة</label>
                  <input
                    type="text"
                    required
                    placeholder="دورة تطوير الويب الشامل"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">الوصف</label>
                  <textarea
                    placeholder="نبذة عن محتوى الكورس..."
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2">عدد المحاضرات</label>
                    <input
                      type="number"
                      value={newCourse.lecturesCount}
                      onChange={(e) => setNewCourse({ ...newCourse, lecturesCount: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2">سعر الاشتراك (ج.م)</label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-2"
                >
                  <PlusCircle size={16} /> إضافة دورة جديدة
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: FLASHCARDS */}
        {activeTab === "flashcards" && (
          <div className="space-y-8">
            {/* Filter & Upload CSV row */}
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر الكورس:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر المحاضرة:</span>
                  <select
                    value={selectedLectureNum}
                    onChange={(e) => setSelectedLectureNum(Number(e.target.value))}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {Array.from({ length: courses.find(c => c.id === selectedCourseId)?.lecturesCount || 12 }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>المحاضرة رقم {idx + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 mb-1">استيراد البطاقات دفعة واحدة عبر CSV:</span>
                <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 text-sm shadow-md">
                  <Upload size={16} /> رفع ملف CSV للاستيراد
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFlashcardCsvUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-1">تنسيق الـ CSV المقبول: السؤال, الإجابة, رقم المحاضرة</span>
              </div>
            </div>

            {/* Manual Form & Cards list Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Manual Add */}
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
                  {editingFlashcardId ? "تعديل بطاقة تعليمية" : "إضافة بطاقة يدوياً"}
                </h3>
                <form onSubmit={handleAddFlashcard} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2">السؤال</label>
                    <textarea
                      required
                      placeholder="ما هو الـ DOM؟"
                      value={newFlashcard.question}
                      onChange={(e) => setNewFlashcard({ ...newFlashcard, question: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2">الإجابة النموذجية</label>
                    <textarea
                      required
                      placeholder="تمثيل لهيكلية صفحة الويب يتيح لـ JavaScript التفاعل معها..."
                      value={newFlashcard.answer}
                      onChange={(e) => setNewFlashcard({ ...newFlashcard, answer: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md"
                    >
                      <Save size={16} className="inline ml-1" />
                      {editingFlashcardId ? "تحديث البطاقة" : "حفظ البطاقة"}
                    </button>
                    {editingFlashcardId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFlashcardId(null);
                          setNewFlashcard({ question: "", answer: "", difficulty: "medium" });
                        }}
                        className="px-4 py-3 bg-slate-300 rounded-xl font-bold"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Cards List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-extrabold text-lg text-slate-800 dark:text-white mb-2">البطاقات المضافة لهذه المحاضرة ({flashcards.filter(c => c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum).length})</h4>
                
                {flashcards
                  .filter(c => c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum)
                  .map((card) => (
                    <div key={card.id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 dark:text-white mb-1"><span className="text-blue-600">س:</span> {card.question}</p>
                        <p className="text-sm text-slate-500 font-medium"><span className="text-green-600 font-bold">ج:</span> {card.answer}</p>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditFlashcard(card)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteFlashcard(card.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                {flashcards.filter(c => c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum).length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
                    لا توجد بطاقات تعليمية مضافة لهذه المحاضرة. ارفع ملف CSV أو أضف يدوياً.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: QUIZZES */}
        {activeTab === "quizzes" && (
          <div className="space-y-8">
            {/* Filter & Upload CSV row */}
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر الكورس:</span>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر المحاضرة:</span>
                  <select
                    value={selectedLectureNum}
                    onChange={(e) => setSelectedLectureNum(Number(e.target.value))}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {Array.from({ length: courses.find(c => c.id === selectedCourseId)?.lecturesCount || 12 }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>المحاضرة رقم {idx + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSV Upload */}
              <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 mb-1">استيراد كويز كامل عبر ملف CSV:</span>
                <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 text-sm shadow-md">
                  <Upload size={16} /> رفع ملف كويز CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleQuizCsvUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-1">التنسيق المقبول: السؤال, الخيار أ, الخيار ب, الخيار ج, الخيار د, رقم الخيار الصحيح (0-3), رقم المحاضرة</span>
              </div>
            </div>

            {/* Manual Form & Quiz questions list Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Manual Add */}
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 h-fit">
                <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">
                  {editingQuizId ? "تعديل سؤال كويز" : "إضافة سؤال يدوياً"}
                </h3>
                <form onSubmit={handleAddQuiz} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-2">السؤال</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أي مما يلي هو وسم سطر جديد؟"
                      value={newQuiz.question}
                      onChange={(e) => setNewQuiz({ ...newQuiz, question: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold">الخيارات الأربعة:</label>
                    <input
                      type="text"
                      required
                      placeholder="الخيار الأول (A)"
                      value={newQuiz.optionA}
                      onChange={(e) => setNewQuiz({ ...newQuiz, optionA: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="الخيار الثاني (B)"
                      value={newQuiz.optionB}
                      onChange={(e) => setNewQuiz({ ...newQuiz, optionB: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="الخيار الثالث (C) - اختياري"
                      value={newQuiz.optionC}
                      onChange={(e) => setNewQuiz({ ...newQuiz, optionC: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="الخيار الرابع (D) - اختياري"
                      value={newQuiz.optionD}
                      onChange={(e) => setNewQuiz({ ...newQuiz, optionD: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-2">رقم الخيار الصحيح (رقم 0 للـ A، رقم 1 للـ B، وهكذا):</label>
                    <select
                      value={newQuiz.correctOption}
                      onChange={(e) => setNewQuiz({ ...newQuiz, correctOption: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <option value={0}>الخيار الأول (A)</option>
                      <option value={1}>الخيار الثاني (B)</option>
                      <option value={2}>الخيار الثالث (C)</option>
                      <option value={3}>الخيار الرابع (D)</option>
                    </select>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-grow bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md"
                    >
                      <Save size={16} className="inline ml-1" />
                      {editingQuizId ? "تحديث السؤال" : "حفظ السؤال"}
                    </button>
                    {editingQuizId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuizId(null);
                          setNewQuiz({
                            question: "",
                            optionA: "",
                            optionB: "",
                            optionC: "",
                            optionD: "",
                            correctOption: 0
                          });
                        }}
                        className="px-4 py-3 bg-slate-300 rounded-xl font-bold"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Quizzes List */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-extrabold text-lg text-slate-800 dark:text-white mb-2">أسئلة الكويز المضافة لهذه المحاضرة ({quizzes.filter(q => q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum).length})</h4>
                
                {quizzes
                  .filter(q => q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum)
                  .map((quiz) => (
                    <div key={quiz.id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between md:flex-row md:items-start gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800 dark:text-white mb-3">س: {quiz.question}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 mb-2">
                          {quiz.options.map((opt, oIdx) => (
                            <span key={oIdx} className={oIdx === quiz.correctOption ? "text-green-600 font-bold bg-green-50 dark:bg-green-950/40 px-2 py-1 rounded" : "px-2 py-1"}>
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEditQuiz(quiz)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-2.5 rounded-xl transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                {quizzes.filter(q => q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum).length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
                    لا توجد أسئلة كويز مضافة لهذه المحاضرة. ارفع ملف كويز CSV أو أضف يدوياً.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Create New Center Modal */}
      <AnimatePresence>
        {isCenterModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-slate-700 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsCenterModalOpen(false);
                  setNewCenterError("");
                  setNewCenterSuccess("");
                  setNewCenterCreatedLinks(null);
                }}
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>

              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Building className="text-blue-600" size={24} /> إنشاء مركز تعليمي جديد (SaaS Center Creation)
              </h3>
              <p className="text-xs text-slate-400 font-bold mb-6">قم بتأسيس مركز تعليمي جديد بنطاق فرعي وحساب أدمن مستقل تماماً.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form Column */}
                <form onSubmit={handleCreateNewCenterFromModal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المركز التعليمي:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أكاديمية الإبداع"
                      value={newCenterName}
                      onChange={(e) => setNewCenterName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرابط الفرعي (Subdomain):</label>
                    <span className="text-[9px] text-slate-400 block mb-1.5 font-semibold">سيكون رابط الدخول للمركز بناءً على هذه الكلمة.</span>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="creative-academy"
                        value={newCenterSubdomain}
                        onChange={(e) => setNewCenterSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                        className="w-full pl-24 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-bold text-sm"
                        dir="ltr"
                      />
                      <div className="absolute left-3 top-3 text-[10px] text-slate-400 font-bold" dir="ltr">
                        .localhost:3000
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-3">
                    <span className="block text-xs font-extrabold text-blue-600 dark:text-blue-400">⚙️ تخصيص حساب الأدمن للمركز (اختياري):</span>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">البريد الإلكتروني للأدمن:</label>
                      <input
                        type="email"
                        placeholder="مثال: admin@creative.com"
                        value={newCenterAdminEmail}
                        onChange={(e) => setNewCenterAdminEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-left font-bold text-xs"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">كلمة المرور للأدمن:</label>
                      <input
                        type="text"
                        placeholder="كلمة المرور المطلوبة للدخول"
                        value={newCenterAdminPassword}
                        onChange={(e) => setNewCenterAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-left font-bold text-xs"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {newCenterError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold border border-red-100">
                      {newCenterError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    <PlusCircle size={14} /> تأسيس المركز وتفعيل الكورسات
                  </button>
                </form>

                {/* Info / Institutions List Column */}
                <div className="space-y-4">
                  
                  {/* Creation Success links display */}
                  {newCenterCreatedLinks ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-5 rounded-2xl text-emerald-800 dark:text-emerald-300 space-y-3">
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span>{newCenterSuccess}</span>
                      </div>
                      
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-slate-800 text-[11px] font-mono space-y-1 text-slate-800 dark:text-slate-200">
                        <p className="flex justify-between">
                          <span>{newCenterCreatedLinks.adminEmail}</span>
                          <span className="text-slate-400 font-bold">Email:</span>
                        </p>
                        <p className="flex justify-between">
                          <span>{newCenterCreatedLinks.adminPassword}</span>
                          <span className="text-slate-400 font-bold">Password:</span>
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        <p className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-slate-800 flex justify-between items-center">
                          <span>لوحة أدمن المركز:</span>
                          <a href={newCenterCreatedLinks.admin} target="_blank" className="text-blue-600 hover:underline flex items-center gap-0.5">
                            دخول للأدمن <ExternalLink size={8} />
                          </a>
                        </p>
                        <p className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-slate-800 flex justify-between items-center">
                          <span>بوابة الطلاب:</span>
                          <a href={newCenterCreatedLinks.student} target="_blank" className="text-blue-600 hover:underline flex items-center gap-0.5">
                            بوابة الطلاب <ExternalLink size={8} />
                          </a>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                      <h4 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 mb-3">المراكز الحالية بالمنصة ({allInstitutions.length}):</h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {allInstitutions.map((inst) => (
                          <div key={inst.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">{inst.name}</p>
                              <p className="text-[10px] text-slate-400" dir="ltr">/{inst.subdomain}</p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`/${inst.subdomain}`}
                                target="_blank"
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                              >
                                الطلاب <ExternalLink size={8} />
                              </a>
                              <a
                                href={`/${inst.subdomain}/admin`}
                                target="_blank"
                                className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                              >
                                الأدمن <ExternalLink size={8} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
