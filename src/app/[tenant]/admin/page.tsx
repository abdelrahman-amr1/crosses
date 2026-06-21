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
  Building,
  Video,
  Award,
  Edit2,
  XCircle,
  User,
  Activity
} from "lucide-react";
import { db, Course, Application, Flashcard, QuizQuestion, AttendanceRecord, Institution, LectureControl, Student, StudentTask } from "@/lib/db";
import { compressBase64 } from "@/lib/imageCompressor";

function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function TenantAdminDashboard({
  params,
}: {
  params: { tenant: string };
}) {
  const [activeTab, setActiveTab] = useState<"applications" | "students" | "courses" | "flashcards" | "quizzes" | "attendance">("applications");

  // Admin login states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState("");

  const [currentInstitution, setCurrentInstitution] = useState<Institution | null>(null);



  // Storage synced states
  const [applications, setApplications] = useState<Application[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceEvals, setAttendanceEvals] = useState<Record<string, any>>({});
  const [attendanceScores, setAttendanceScores] = useState<Record<string, number>>({});
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [tenantProgress, setTenantProgress] = useState<Record<string, { attendance: number, quiz: number, task: number }>>({});
  const [attendanceCourseId, setAttendanceCourseId] = useState<string>("");
  const [attendanceLectureNum, setAttendanceLectureNum] = useState<number>(1);

  // Filtering states
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedLectureNum, setSelectedLectureNum] = useState<number>(1);

  // Form states
  const [newStudent, setNewStudent] = useState({ name: "", email: "", courseId: "" });
  
  // Student edit & view forms
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentData, setEditingStudentData] = useState({ name: "", email: "", phone: "", rollNumber: 1 });
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  
  // Course edit & addition forms
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 500, currency: "ج.م", imageFit: "cover", lecturesCount: 12, coverImage: "", isRegistrationOpen: true });
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingCourseData, setEditingCourseData] = useState({ 
    title: "", description: "", price: 0, currency: "ج.م", imageFit: "cover", lecturesCount: 1, 
    coverImage: "", lectureUrl: "", whatsappGroupUrl: "",
    isAttendanceOpen: true, isFlashcardsOpen: true, isQuizOpen: true, isEvaluationOpen: true,
    isRegistrationOpen: true,
    lectureControls: {} as Record<number, LectureControl>
  });
  const [editingLectureNum, setEditingLectureNum] = useState<number>(1);

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
    async function loadData() {
      try {
        let [apps, stds, crs, fcs, qzs, insts, prog] = await Promise.all([
          db.getApplications(params.tenant),
          db.getStudents(params.tenant),
          db.getCourses(params.tenant),
          db.getFlashcards(params.tenant),
          db.getQuizzes(params.tenant),
          db.getInstitutions(),
          db.getTenantProgress(params.tenant)
        ]);
        
        // Check if client-side localStorage migration is needed
        if (typeof window !== "undefined") {
          const isMigratedKey = `supabase_migrated_${params.tenant}`;
          const alreadyMigrated = localStorage.getItem(isMigratedKey);
          
          if (!alreadyMigrated) {
            console.log("Checking for local storage data to migrate to Supabase...");
            
            // Check courses
            const localCoursesStr = localStorage.getItem(`courses_${params.tenant}`);
            if (localCoursesStr) {
              const localCrs = JSON.parse(localCoursesStr) as Course[];
              if (localCrs.length > 0 && crs.length <= 2) {
                console.log("Migrating courses from localStorage to Supabase...");
                await db.saveCourses(params.tenant, localCrs);
                crs = await db.getCourses(params.tenant);
              }
            }
            
            // Check students
            const localStudentsStr = localStorage.getItem(`students_${params.tenant}`);
            if (localStudentsStr) {
              const localStds = JSON.parse(localStudentsStr) as Student[];
              if (localStds.length > 0 && stds.length <= 1) {
                console.log("Migrating students from localStorage to Supabase...");
                await db.saveStudents(params.tenant, localStds);
                stds = await db.getStudents(params.tenant);
              }
            }
            
            // Check applications
            const localAppsStr = localStorage.getItem(`applications_${params.tenant}`);
            if (localAppsStr) {
              const localApps = JSON.parse(localAppsStr) as Application[];
              if (localApps.length > 0 && apps.length === 0) {
                console.log("Migrating applications from localStorage to Supabase...");
                await db.saveApplications(params.tenant, localApps);
                apps = await db.getApplications(params.tenant);
              }
            }
            
            // Check flashcards
            const localFlashcardsStr = localStorage.getItem(`flashcards_${params.tenant}`);
            if (localFlashcardsStr) {
              const localFcs = JSON.parse(localFlashcardsStr) as Flashcard[];
              if (localFcs.length > 0 && fcs.length <= 44) {
                console.log("Migrating flashcards from localStorage to Supabase...");
                await db.saveFlashcards(params.tenant, localFcs);
                fcs = await db.getFlashcards(params.tenant);
              }
            }
            
            // Check quizzes
            const localQuizzesStr = localStorage.getItem(`quizzes_${params.tenant}`);
            if (localQuizzesStr) {
              const localQzs = JSON.parse(localQuizzesStr) as QuizQuestion[];
              if (localQzs.length > 0 && qzs.length <= 3) {
                console.log("Migrating quizzes from localStorage to Supabase...");
                await db.saveQuizzes(params.tenant, localQzs);
                qzs = await db.getQuizzes(params.tenant);
              }
            }

            // Check institution logo and credentials in localStorage
            const localInstListStr = localStorage.getItem("institutions_list");
            if (localInstListStr) {
              const list = JSON.parse(localInstListStr) as Institution[];
              const matched = list.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());
              if (matched) {
                const fetchedInsts = await db.getInstitutions();
                const updatedInsts = fetchedInsts.map(inst => {
                  if (inst.subdomain.toLowerCase() === params.tenant.toLowerCase()) {
                    return { 
                      ...inst, 
                      logoUrl: matched.logoUrl || inst.logoUrl,
                      adminEmail: matched.adminEmail || inst.adminEmail,
                      adminPassword: matched.adminPassword || inst.adminPassword
                    };
                  }
                  return inst;
                });
                await db.saveInstitutions(updatedInsts);
              }
            }
            
            // Mark as migrated
            localStorage.setItem(isMigratedKey, "true");
            console.log("🎉 Local storage data migrated to Supabase database successfully!");
          }
        }

        setApplications(apps);
        setStudents(stds);
        setCourses(crs);
        if (crs.length > 0) {
          setSelectedCourseId(crs[0].id);
          setNewStudent(prev => ({ ...prev, courseId: crs[0].id }));
          setAttendanceCourseId(crs[0].id);
        }
        setFlashcards(fcs);
        setQuizzes(qzs);
        
        const inst = insts.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());
        if (inst) {
          setCurrentInstitution(inst);
        }
        
        setTenantProgress(prog);
      } catch (err) {
        console.error("Error loading admin data:", err);
      }
    }
    loadData();

    if (typeof window !== "undefined") {
      const logged = sessionStorage.getItem(`admin_logged_${params.tenant}`);
      if (logged === "true") {
        setIsAdminLoggedIn(true);
      }
    }
  }, [params.tenant]);

  // Poll dynamic admin data (applications, students, courses, progress) when logged in
  useEffect(() => {
    if (!isAdminLoggedIn) return;

    const fetchData = async () => {
      try {
        const [apps, stds, crs, prog] = await Promise.all([
          db.getApplications(params.tenant),
          db.getStudents(params.tenant),
          db.getCourses(params.tenant),
          db.getTenantProgress(params.tenant)
        ]);

        setApplications(apps);
        setStudents(stds);
        setCourses(crs);
        setTenantProgress(prog);
      } catch (err) {
        console.error("Error polling admin data:", err);
      }
    };

    const interval = setInterval(fetchData, 4000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, [isAdminLoggedIn, params.tenant]);

  // Load and poll attendance, evaluations, scores, and tasks when tab or filters change
  useEffect(() => {
    if (activeTab !== "attendance" || !attendanceCourseId) return;

    const fetchData = () => {
      Promise.all([
        db.getAttendances(params.tenant, attendanceCourseId, attendanceLectureNum),
        db.getAllEvaluationsForLecture(params.tenant, attendanceLectureNum),
        db.getAllQuizScoresForLecture(params.tenant, attendanceCourseId, attendanceLectureNum),
        db.getStudentTasks(attendanceCourseId, attendanceLectureNum)
      ]).then(([records, evals, scores, tasks]) => {
        setAttendanceRecords(records);
        setAttendanceEvals(evals);
        setAttendanceScores(scores);
        setStudentTasks(tasks);
      }).catch(console.error);
    };

    fetchData(); // initial fetch

    const interval = setInterval(fetchData, 4000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, [activeTab, attendanceCourseId, attendanceLectureNum, params.tenant]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");

    try {
      const institutions = await db.getInstitutions();
      const currentCenter = institutions.find(inst => inst.subdomain.toLowerCase() === params.tenant.toLowerCase());
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
    } catch (err) {
      setAdminLoginError("⚠️ حدث خطأ أثناء الاتصال بقاعدة البيانات.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(`admin_logged_${params.tenant}`);
    setIsAdminLoggedIn(false);
    setAdminEmailInput("");
    setAdminPasswordInput("");
  };



  // Flash alert helper
  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(""), 6000);
  };

  // Student Applications Approval Workflow
  const handleApproveApp = async (app: Application) => {
    const matchedCourse = courses.find(c => c.id === app.courseId);
    if (!matchedCourse) return;

    // 1. Generate unique roll number within this course
    const courseStudentsCount = students.filter(s => s.courseId === app.courseId).length;
    const nextRollNumber = courseStudentsCount + 1;

    // 2. Generate clean login email (using last 4 digits of mobile, e.g. 7078@samarsamerlawyer.com)
    let autoEmail = `${app.phone.slice(-4)}@${params.tenant}.com`;
    const emailExists = (email: string) => students.some(s => s.email.toLowerCase() === email.toLowerCase());
    if (emailExists(autoEmail)) {
      let counter = 2;
      while (emailExists(`${app.phone.slice(-4)}_${counter}@${params.tenant}.com`)) {
        counter++;
      }
      autoEmail = `${app.phone.slice(-4)}_${counter}@${params.tenant}.com`;
    }
    const autoPassword = app.phone; // default password is mobile number

    // 3. Create approved Student record directly on DB (1 query)
    const studentRecord = await db.addStudent(params.tenant, {
      name: app.fullName,
      email: autoEmail,
      courseId: app.courseId,
      avatarUrl: app.photoUrl,
      nationalId: app.nationalId,
      phone: app.phone,
      rollNumber: nextRollNumber,
      whatsappGroupUrl: matchedCourse.whatsappGroupUrl,
      lectureUrl: matchedCourse.lectureUrl
    });

    // 4. Update lists locally and save single application status on DB (1 query)
    setStudents([...students, studentRecord]);

    const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: "approved" as const } : a);
    setApplications(updatedApps);
    await db.updateApplicationStatus(app.id, "approved");

    // 5. Construct official WhatsApp Message with dynamic entry URL based on hosting
    const rootUrl = typeof window !== "undefined" && !window.location.origin.includes("localhost")
      ? window.location.origin
      : "https://crosses-one.vercel.app";
    const entryUrl = `${rootUrl}/${params.tenant}`;

    const whatsAppMessage = `السلام عليكم يا متدرب(ة) ${app.fullName}،
يسعدنا إعلامك بأنه تم قبولك رسمياً في دورة "${matchedCourse.title}" بمركزنا!

تفاصيل حسابك على المنصة لتسجيل الدخول:
رابط الدخول: ${entryUrl}
رقم الموبايل المسجل: ${app.phone}

بيانات الدورة:
رقم كشفك في الكورس: #${nextRollNumber}
رابط جروب الواتساب المخصص للمتدربين: ${matchedCourse.whatsappGroupUrl}

تمنياتنا لك بالتوفيق والنجاح!`;

    // Format phone to international format for WhatsApp API (Egypt +20)
    let whatsAppPhone = app.phone;
    if (whatsAppPhone.startsWith("01")) {
      whatsAppPhone = `2${whatsAppPhone}`;
    }

    const waLink = `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(waLink, "_blank");

    showAlert(`✅ تم قبول الطالب بنجاح!
📱 رقم الموبايل المسجل للدخول: ${app.phone}
📈 رقم الكشف: #${nextRollNumber}
🔗 تم فتح الواتساب لإشعار الطالب بالرسالة الرسمية.`);
  };

  const handleRejectApp = async (app: Application) => {
    if (confirm(`هل تريد رفض طلب التحاق الطالب "${app.fullName}"؟`)) {
      const updatedApps = applications.map(a => a.id === app.id ? { ...a, status: "rejected" as const } : a);
      setApplications(updatedApps);
      await db.updateApplicationStatus(app.id, "rejected");
      showAlert("🗑️ تم رفض طلب الالتحاق وحفظ الحالة.");
    }
  };

  // Student management (Manual creation)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.courseId) {
      alert("الرجاء إضافة دورة أولاً لتعيين الطالب لها.");
      return;
    }
    if (newStudent.name && newStudent.email) {
      const matchedCourse = courses.find(c => c.id === newStudent.courseId);
      if (!matchedCourse) return;

      const courseStudents = students.filter(s => s.courseId === newStudent.courseId);
      const maxRoll = courseStudents.length > 0 ? Math.max(...courseStudents.map(s => s.rollNumber || 1)) : 0;
      const nextRollNumber = maxRoll + 1;

      // Add to database directly (1 query)
      const studentObj = await db.addStudent(params.tenant, {
        name: newStudent.name,
        email: newStudent.email,
        courseId: newStudent.courseId,
        nationalId: "29912040102030", // mock ID
        phone: "01000000000", // mock phone
        rollNumber: nextRollNumber,
        whatsappGroupUrl: matchedCourse.whatsappGroupUrl,
        lectureUrl: matchedCourse.lectureUrl
      });
      
      setStudents([...students, studentObj]);
      setNewStudent({ name: "", email: "", courseId: "web-dev" });
      
      showAlert(`✅ تم إنشاء حساب الطالب بنجاح! رقم كشفه: #${nextRollNumber}`);
    }
  };
  const handleSaveStudentEdit = async () => {
    if (!editingStudentId) return;
    const s = students.find(x => x.id === editingStudentId);
    if (!s) return;
    
    // Update only the edited student (1 query)
    await db.updateStudent(editingStudentId, editingStudentData);
    
    const updatedStudent = { ...s, ...editingStudentData };
    const updatedList = students.map(st => st.id === editingStudentId ? updatedStudent : st);
    
    setStudents(updatedList);
    setEditingStudentId(null);
    showAlert("✅ تم تعديل بيانات الطالب بنجاح!");
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm("هل تريد حذف هذا الطالب وحجزه؟")) {
      // Delete from database (1 query)
      await db.deleteStudent(id);
      
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      showAlert("🗑️ تم حذف الطالب بنجاح.");
    }
  };

  // Course management & Editing Links
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourse.title) {
      const courseObj: Course = {
        id: generateUUID(),
        title: newCourse.title,
        description: newCourse.description,
        price: Number(newCourse.price),
        currency: newCourse.currency || "ج.م",
        imageFit: (newCourse.imageFit as 'cover' | 'contain') || "cover",
        lecturesCount: Number(newCourse.lecturesCount),
        lectureUrl: "https://meet.google.com/abc-defg-hij",
        whatsappGroupUrl: "https://chat.whatsapp.com/G1x2y3z4",
        coverImage: newCourse.coverImage || undefined,
        isAttendanceOpen: true,
        isFlashcardsOpen: true,
        isQuizOpen: true,
        isEvaluationOpen: true,
        isRegistrationOpen: newCourse.isRegistrationOpen !== false,
        lectureControls: {}
      };

      const updated = [...courses, courseObj];
      setCourses(updated);
      await db.saveCourses(params.tenant, updated);
      setNewCourse({ title: "", description: "", price: 500, currency: "ج.م", imageFit: "cover", lecturesCount: 12, coverImage: "", isRegistrationOpen: true });
      showAlert(`✅ تم إضافة الدورة التعليمية "${courseObj.title}" بنجاح.`);
    }
  };

  const handleEditCourseLinks = (course: Course) => {
    setEditingCourseId(course.id);
    setEditingCourseData({
      title: course.title,
      description: course.description,
      price: course.price,
      currency: course.currency || "ج.م",
      imageFit: course.imageFit || "cover",
      lecturesCount: course.lecturesCount,
      lectureUrl: course.lectureUrl,
      whatsappGroupUrl: course.whatsappGroupUrl,
      coverImage: course.coverImage || "",
      isAttendanceOpen: course.isAttendanceOpen !== false,
      isFlashcardsOpen: course.isFlashcardsOpen !== false,
      isQuizOpen: course.isQuizOpen !== false,
      isEvaluationOpen: course.isEvaluationOpen !== false,
      isRegistrationOpen: course.isRegistrationOpen !== false,
      lectureControls: course.lectureControls || {}
    });
    setEditingLectureNum(1);
  };

  const handleSaveCourseLinks = async () => {
    if (editingCourseId) {
      const updated = courses.map(c => 
        c.id === editingCourseId 
          ? { 
              ...c, 
              title: editingCourseData.title,
              description: editingCourseData.description,
              price: Number(editingCourseData.price),
              currency: editingCourseData.currency || "ج.م",
              imageFit: (editingCourseData.imageFit as 'cover' | 'contain') || "cover",
              lecturesCount: Number(editingCourseData.lecturesCount),
              lectureUrl: editingCourseData.lectureUrl, 
              whatsappGroupUrl: editingCourseData.whatsappGroupUrl,
              coverImage: editingCourseData.coverImage || undefined,
              isAttendanceOpen: editingCourseData.isAttendanceOpen,
              isFlashcardsOpen: editingCourseData.isFlashcardsOpen,
              isQuizOpen: editingCourseData.isQuizOpen,
              isEvaluationOpen: editingCourseData.isEvaluationOpen,
              isRegistrationOpen: editingCourseData.isRegistrationOpen,
              lectureControls: editingCourseData.lectureControls
            } 
          : c
      );
      setCourses(updated);
      await db.saveCourses(params.tenant, updated);
      setEditingCourseId(null);
      showAlert("✅ تم تحديث بيانات الدورة التدريبية بنجاح! (انعكس لدى جميع المتدربين حالاً)");
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirm("⚠️ هل أنت متأكد من رغبتك في حذف هذه الدورة التدريبية بالكامل؟ سيؤدي ذلك لحذفها لدى جميع المتدربين.")) {
      const updated = courses.filter(c => c.id !== id);
      setCourses(updated);
      await db.saveCourses(params.tenant, updated);
      showAlert("🗑️ تم حذف الدورة التدريبية بنجاح.");
    }
  };

  const handleToggleRegistration = async (course: Course) => {
    const updated = courses.map(c => 
      c.id === course.id 
        ? { ...c, isRegistrationOpen: c.isRegistrationOpen === false } 
        : c
    );
    setCourses(updated);
    await db.saveCourses(params.tenant, updated);
    showAlert(`✅ تم ${course.isRegistrationOpen === false ? "فتح" : "غلق"} التسجيل لدورة "${course.title}" بنجاح.`);
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
  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert("الرجاء إضافة دورة أولاً");
      return;
    }
    if (newFlashcard.question && newFlashcard.answer) {
      const cardObj: Flashcard = {
        id: editingFlashcardId || generateUUID(),
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
      await db.saveFlashcards(params.tenant, updated);
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

  const handleDeleteFlashcard = async (id: string) => {
    if (confirm("هل تريد حذف هذه البطاقة؟")) {
      const updated = flashcards.filter(c => c.id !== id);
      setFlashcards(updated);
      await db.saveFlashcards(params.tenant, updated);
      showAlert("🗑️ تم حذف البطاقة.");
    }
  };

  const handleDeleteAllFlashcards = async () => {
    if (confirm("⚠️ هل أنت متأكد من رغبتك في حذف جميع الكروت لهذه المحاضرة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) {
      const updated = flashcards.filter(c => !(c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum));
      setFlashcards(updated);
      await db.saveFlashcards(params.tenant, updated);
      showAlert("🗑️ تم حذف جميع الكروت لهذه المحاضرة بنجاح.");
    }
  };

  // CSV Import for Flashcards
  const handleFlashcardCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourseId) {
      alert("الرجاء إضافة واختيار دورة أولاً قبل رفع الكروت.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
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
            const lectureNumber = selectedLectureNum;
            
            return {
              id: generateUUID(),
              courseId: selectedCourseId,
              lectureNumber,
              question,
              answer,
              difficulty: "medium" as const
            };
          }).filter(c => c.question && c.answer);

          const updated = [...flashcards, ...newCards];
          setFlashcards(updated);
          await db.saveFlashcards(params.tenant, updated);
          showAlert(`✅ تم استيراد ${newCards.length} بطاقة تعليمية من ملف CSV بنجاح!`);
        } catch (err) {
          alert("حدث خطأ أثناء قراءة ملف الـ CSV. تأكد من مطابقة التنسيق.");
        }
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  // Quizzes management
  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      alert("الرجاء إضافة دورة أولاً");
      return;
    }
    if (newQuiz.optionA && newQuiz.optionB && newQuiz.question) {
      const quizObj: QuizQuestion = {
        id: editingQuizId || generateUUID(),
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
      await db.saveQuizzes(params.tenant, updated);
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

  const handleDeleteQuiz = async (id: string) => {
    if (confirm("هل تريد حذف هذا السؤال؟")) {
      const updated = quizzes.filter(q => q.id !== id);
      setQuizzes(updated);
      await db.saveQuizzes(params.tenant, updated);
      showAlert("🗑️ تم حذف السؤال.");
    }
  };

  const handleDeleteAllQuizzes = async () => {
    if (confirm("⚠️ هل أنت متأكد من رغبتك في حذف جميع الأسئلة لهذه المحاضرة بالكامل؟ لا يمكن التراجع عن هذا الإجراء.")) {
      const updated = quizzes.filter(q => !(q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum));
      setQuizzes(updated);
      await db.saveQuizzes(params.tenant, updated);
      showAlert("🗑️ تم حذف جميع الأسئلة لهذه المحاضرة بنجاح.");
    }
  };

  // CSV Import for Quizzes
  const handleQuizCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCourseId) {
      alert("الرجاء إضافة واختيار دورة أولاً قبل رفع الأسئلة.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
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
            const lectureNumber = selectedLectureNum;
            
            return {
              id: generateUUID(),
              courseId: selectedCourseId,
              lectureNumber,
              question,
              options: [optionA, optionB, optionC, optionD].filter(Boolean),
              correctOption
            };
          }).filter(q => q.question && q.options.length >= 2);

          const updated = [...quizzes, ...newQuizzesList];
          setQuizzes(updated);
          await db.saveQuizzes(params.tenant, updated);
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
        <div className="flex items-center gap-4">
          {currentInstitution?.logoUrl ? (
            <img src={currentInstitution.logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-contain bg-white dark:bg-slate-900 border p-1 shadow-md" />
          ) : (
            <div className="w-14 h-14 bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-extrabold text-2xl border dark:border-slate-800 shadow-inner">
              {(currentInstitution?.name || params.tenant).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              لوحة تحكم أدمن: {currentInstitution?.name || params.tenant}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">إدارة الطلاب المقبولين، طلبات الالتحاق، استيراد الكروت والكويزات عبر الـ CSV.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all text-slate-700 dark:text-slate-300">
            <Upload size={14} />
            <span>تعديل الشعار</span>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const base64 = event.target?.result as string;
                    const compressed = await compressBase64(base64, 250, 250, 0.75);
                    
                    const insts = await db.getInstitutions();
                    const updated = insts.map(inst => {
                      if (inst.subdomain.toLowerCase() === params.tenant.toLowerCase()) {
                        return { ...inst, logoUrl: compressed };
                      }
                      return inst;
                    });
                    await db.saveInstitutions(updated);
                    const target = updated.find(inst => inst.subdomain.toLowerCase() === params.tenant.toLowerCase());
                    if (target) {
                      setCurrentInstitution(target);
                    }
                    showAlert("✅ تم تحديث شعار المركز بنجاح!");
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </label>
          <button
            onClick={handleAdminLogout}
            className="bg-red-550/10 hover:bg-red-500 hover:text-white border border-red-500/25 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all text-red-500"
          >
            <LogOut size={14} /> خروج
          </button>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold dark:bg-slate-805 dark:text-blue-400 border dark:border-slate-700">
            لوحة الإدارة
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
          { id: "attendance", label: "سجل الحضور", icon: <Video size={16} /> },
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
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {applications.filter(a => a.status === "pending").map((item) => {
                const course = courses.find(c => c.id === item.courseId);
                return (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center flex-shrink-0">
                        {item.photoUrl ? (
                          <img src={item.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Users size={18} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-850 dark:text-white text-sm">{item.fullName}</h4>
                        <p className="text-xs text-slate-500 font-bold">{course?.title || "دورة برمجة"}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-slate-655 dark:text-slate-400 font-medium">
                      <p className="flex justify-between">
                        <span>الرقم القومي:</span>
                        <span className="font-bold text-slate-800 dark:text-white select-all">{item.nationalId}</span>
                      </p>
                      <p className="flex justify-between">
                        <span>رقم الواتساب:</span>
                        <span className="font-bold text-slate-800 dark:text-white select-all" dir="ltr">{item.phone}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                      <button
                        onClick={() => handleApproveApp(item)}
                        className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1"
                      >
                        <UserCheck size={14} /> قبول
                      </button>
                      <button
                        onClick={() => handleRejectApp(item)}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1"
                      >
                        <UserX size={14} /> رفض
                      </button>
                    </div>
                  </div>
                );
              })}
              {applications.filter(a => a.status === "pending").length === 0 && (
                <div className="py-12 text-center text-slate-400 font-bold bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
                  🎉 لا توجد طلبات معلقة بانتظار الموافقة حالياً.
                </div>
              )}
            </div>

            <div className="mt-8 bg-blue-50 dark:bg-blue-950/40 p-5 rounded-2xl border border-blue-100/50">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-bold flex items-center gap-2">
                🔗 <strong>رابط بوابة تسجيل الطلاب العامة للمشاركة:</strong>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                اعطِ هذا الرابط للطلاب ليسجلوا بياناتهم وصورهم بأنفسهم: 
                <a href={`/${params.tenant}/register`} target="_blank" className="text-blue-600 font-bold hover:underline block mt-1">
                  {typeof window !== "undefined" && !window.location.origin.includes("localhost") 
                    ? `${window.location.origin}/${params.tenant}/register` 
                    : `https://crosses-one.vercel.app/${params.tenant}/register`}
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
              
              {/* Unified Students Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((item) => {
                  const studentCourse = courses.find(c => c.id === item.courseId);
                  
                  return (
                    <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                          رقم الكشف: #{item.rollNumber || 1}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const courseTitle = studentCourse?.title || "دورة عامة";
                              window.open(`/${params.tenant}/certificate?name=${encodeURIComponent(item.name)}&course=${encodeURIComponent(courseTitle)}`, '_blank');
                            }}
                            title="عرض الشهادة"
                            className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-1.5 rounded-lg transition-all"
                          >
                            <Award size={18} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudentId(item.id);
                              setEditingStudentData({ name: item.name, email: item.email, phone: item.phone || "", rollNumber: item.rollNumber || 1 });
                            }}
                            title="تعديل بيانات الطالب"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(item.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
                          {item.avatarUrl ? (
                            <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={24} className="text-slate-400" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight mb-1 truncate">{item.name}</h4>
                          <p className="text-xs text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded inline-block truncate max-w-full">{studentCourse?.title || "دورة غير معروفة"}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setViewingStudentId(item.id)}
                        className="w-full bg-slate-50 hover:bg-blue-50 text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-blue-400 font-bold py-3 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex justify-center items-center gap-2 group-hover:border-blue-200 dark:group-hover:border-blue-800"
                      >
                        <Activity size={18} /> عرض تفاصيل وإنجاز الطالب
                      </button>
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                    <Users size={48} className="text-slate-300" />
                    <p className="text-slate-500 font-bold text-lg">لم يتم قبول أو إضافة أي متدرب بعد.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Student Dashboard Modal */}
            {viewingStudentId && (() => {
              const student = students.find(s => s.id === viewingStudentId);
              if (!student) return null;
              const studentCourse = courses.find(c => c.id === student.courseId);
              const expected = (studentCourse?.lecturesCount || 1) * 3;
              const progByName = tenantProgress[student.name] || { attendance: 0, quiz: 0, task: 0 };
              const progByPhone = tenantProgress[student.phone] || { attendance: 0, quiz: 0, task: 0 };
              const prog = {
                attendance: progByName.attendance + progByPhone.attendance,
                quiz: progByName.quiz + progByPhone.quiz,
                task: progByName.task + progByPhone.task
              };
              const totalActual = prog.attendance + prog.quiz + prog.task;
              const percentage = Math.round((totalActual / expected) * 100) || 0;

              return (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-gradient-to-l from-blue-600 to-indigo-800 dark:from-blue-800 dark:to-indigo-950 text-white p-6 sm:p-8 relative shrink-0">
                      <button onClick={() => setViewingStudentId(null)} className="absolute top-6 left-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <XCircle size={24} />
                      </button>
                      
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-xl shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} className="text-white/80" />
                          )}
                        </div>
                        <div className="text-center sm:text-right pt-2 flex-1">
                          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 text-white">{student.name}</h2>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-blue-100 font-medium text-sm">
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"><Phone size={14} /> {student.phone}</span>
                            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm"><Building size={14} /> {studentCourse?.title || "دورة عامة"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Activity className="text-blue-500" /> إنجازات وتفاعل الطالب
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/50 p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg shadow-sm">
                          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-3">
                            <Video size={26} />
                          </div>
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{prog.attendance}</span>
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">محاضرات</span>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/50 p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg shadow-sm">
                          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-3">
                            <CheckCircle2 size={26} />
                          </div>
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{prog.quiz}</span>
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">كويزات</span>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-amber-100 dark:border-amber-900/50 p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1 hover:shadow-lg shadow-sm">
                          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-3">
                            <Upload size={26} />
                          </div>
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{prog.task}</span>
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">تاسكات</span>
                        </div>
                      </div>

                      {/* Big Progress Bar */}
                      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex justify-between items-end mb-5 relative z-10">
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-lg">معدل التقدم الإجمالي (نهاية الدورة)</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">يُحسب بناءً على إجمالي عدد محاضرات الدورة</p>
                          </div>
                          <div className={`text-4xl sm:text-5xl font-black ${percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {Math.min(percentage, 100)}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-5 overflow-hidden shadow-inner relative z-10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage, 100)}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full relative overflow-hidden ${percentage >= 80 ? 'bg-gradient-to-l from-emerald-400 to-emerald-600' : percentage >= 50 ? 'bg-gradient-to-l from-amber-400 to-amber-600' : 'bg-gradient-to-l from-red-400 to-red-600'}`}
                          >
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Edit Student Modal */}
            {editingStudentId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">تعديل بيانات الطالب</h3>
                    <button onClick={() => setEditingStudentId(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <XCircle size={24} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">اسم المتدرب</label>
                      <input
                        type="text"
                        value={editingStudentData.name}
                        onChange={(e) => setEditingStudentData({ ...editingStudentData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={editingStudentData.email}
                        onChange={(e) => setEditingStudentData({ ...editingStudentData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الهاتف</label>
                      <input
                        type="text"
                        value={editingStudentData.phone}
                        onChange={(e) => setEditingStudentData({ ...editingStudentData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">رقم الكشف</label>
                      <input
                        type="number"
                        value={editingStudentData.rollNumber}
                        onChange={(e) => setEditingStudentData({ ...editingStudentData, rollNumber: Number(e.target.value) })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        onClick={handleSaveStudentEdit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                      >
                        حفظ التعديلات
                      </button>
                      <button
                        onClick={() => setEditingStudentId(null)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-bold py-3 rounded-xl transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


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
                    <div key={c.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-2xl overflow-hidden relative flex flex-col justify-between">
                      {/* Course Cover Image */}
                      <div className="h-36 w-full relative bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white overflow-hidden bg-slate-950">
                        {c.coverImage ? (
                          <img 
                            src={c.coverImage} 
                            alt={c.title} 
                            className={`w-full h-full ${
                              c.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                            }`} 
                          />
                        ) : (
                          <BookOpen size={36} className="opacity-85" />
                        )}
                        {/* Registration Status Badge */}
                        {c.isRegistrationOpen === false ? (
                          <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                            🚫 التسجيل مغلق
                          </span>
                        ) : (
                          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                            ✅ التسجيل مفتوح
                          </span>
                        )}
                      </div>
                      
                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-extrabold text-lg text-slate-800 dark:text-white leading-snug">{c.title}</h4>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleRegistration(c)}
                                className={`text-xs font-bold hover:underline flex items-center gap-1 ${
                                  c.isRegistrationOpen === false ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {c.isRegistrationOpen === false ? "🔓 فتح" : "🔒 غلق"}
                              </button>
                              <button
                                onClick={() => handleEditCourseLinks(c)}
                                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <Edit size={12} /> تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(c.id)}
                                className="text-xs text-red-600 font-bold hover:underline flex items-center gap-1"
                              >
                                <Trash2 size={12} /> حذف
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mb-4">{c.description}</p>
                          
                          {/* Links display / Edit forms */}
                          {isEditingThis ? (
                            <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم الدورة:</label>
                                <input
                                  type="text"
                                  value={editingCourseData.title}
                                  onChange={(e) => setEditingCourseData({ ...editingCourseData, title: e.target.value })}
                                  className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">الوصف:</label>
                                <textarea
                                  value={editingCourseData.description}
                                  onChange={(e) => setEditingCourseData({ ...editingCourseData, description: e.target.value })}
                                  className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none min-h-[60px]"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">عدد المحاضرات:</label>
                                  <input
                                    type="number"
                                    value={editingCourseData.lecturesCount}
                                    onChange={(e) => setEditingCourseData({ ...editingCourseData, lecturesCount: Number(e.target.value) })}
                                    className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">سعر الاشتراك:</label>
                                  <input
                                    type="number"
                                    value={editingCourseData.price}
                                    onChange={(e) => setEditingCourseData({ ...editingCourseData, price: Number(e.target.value) })}
                                    className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1">العملة:</label>
                                  <select
                                    value={editingCourseData.currency || "ج.م"}
                                    onChange={(e) => setEditingCourseData({ ...editingCourseData, currency: e.target.value })}
                                    className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none cursor-pointer"
                                  >
                                    <option value="ج.م">ج.م (جنيه مصري)</option>
                                    <option value="ر.س">ر.س (ريال سعودي)</option>
                                    <option value="د.إ">د.إ (درهم إماراتي)</option>
                                    <option value="د.ك">د.ك (دينار كويتي)</option>
                                    <option value="د.أ">د.أ (دينار أردني)</option>
                                    <option value="$">$ (دولار أمريكي)</option>
                                    <option value="€">€ (يورو)</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">صورة غلاف الدورة:</label>
                                <div className="flex items-center gap-2">
                                  {editingCourseData.coverImage && (
                                    <img 
                                      src={editingCourseData.coverImage} 
                                      alt="Preview" 
                                      className={`w-10 h-10 rounded border ${
                                        editingCourseData.imageFit === 'contain' ? 'object-contain bg-slate-950 p-0.5' : 'object-cover'
                                      }`} 
                                    />
                                  )}
                                  <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 text-center py-1.5 rounded text-[10px] font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <span>رفع صورة جديدة</span>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = async (event) => {
                                            const base64 = event.target?.result as string;
                                            const compressed = await compressBase64(base64, 800, 500, 0.85);
                                            setEditingCourseData(prev => ({ ...prev, coverImage: compressed }));
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="hidden" 
                                    />
                                  </label>
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">طريقة عرض الصورة (الاطار):</label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingCourseData(prev => ({ ...prev, imageFit: 'cover' }))}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                      (editingCourseData.imageFit || 'cover') === 'cover'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    ملء الإطار (Cover)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCourseData(prev => ({ ...prev, imageFit: 'contain' }))}
                                    className={`flex-1 py-1.5 rounded text-[10px] font-bold border transition-all ${
                                      editingCourseData.imageFit === 'contain'
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-880 text-slate-600 dark:text-slate-400'
                                    }`}
                                  >
                                    احتواء كامل (Contain)
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-slate-250 dark:border-slate-750">
                                <span className="text-[10px] font-bold text-slate-500">حالة التسجيل والاشتراك (مفتوح):</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={editingCourseData.isRegistrationOpen} 
                                    onChange={(e) => setEditingCourseData({ ...editingCourseData, isRegistrationOpen: e.target.checked })} 
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-650 peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط بث المحاضرة الحالي (Zoom/Meet/etc):</label>
                                <input
                                  type="text"
                                  value={editingCourseData.lectureUrl}
                                  onChange={(e) => setEditingCourseData({ ...editingCourseData, lectureUrl: e.target.value })}
                                  className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-left"
                                  dir="ltr"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 mb-1">رابط جروب الواتس للمتدربين:</label>
                                <input
                                  type="text"
                                  value={editingCourseData.whatsappGroupUrl}
                                  onChange={(e) => setEditingCourseData({ ...editingCourseData, whatsappGroupUrl: e.target.value })}
                                  className="w-full text-xs px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 focus:outline-none text-left"
                                  dir="ltr"
                                />
                              </div>
                              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                  إعدادات المحاضرات والتاسكات
                                </h4>
                                <select
                                  value={editingLectureNum}
                                  onChange={(e) => setEditingLectureNum(Number(e.target.value))}
                                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold text-sm mb-4"
                                >
                                  {Array.from({ length: editingCourseData.lecturesCount || 1 }).map((_, idx) => (
                                    <option key={idx + 1} value={idx + 1}>المحاضرة رقم {idx + 1}</option>
                                  ))}
                                </select>

                                {(() => {
                                  const defaultControls = { isAttendanceOpen: true, isFlashcardsOpen: true, isQuizOpen: true, isEvaluationOpen: true, isTasksOpen: false, taskDescription: "", taskFileUrl: "" };
                                  const currentControls = editingCourseData.lectureControls[editingLectureNum] || defaultControls;
                                  const updateControls = (updates: any) => {
                                    setEditingCourseData(prev => ({
                                      ...prev,
                                      lectureControls: {
                                        ...prev.lectureControls,
                                        [editingLectureNum]: { ...currentControls, ...updates }
                                      }
                                    }));
                                  };

                                  return (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                          <input type="checkbox" checked={currentControls.isAttendanceOpen} onChange={e => updateControls({ isAttendanceOpen: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> الحضور
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                          <input type="checkbox" checked={currentControls.isFlashcardsOpen} onChange={e => updateControls({ isFlashcardsOpen: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> الكروت
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                          <input type="checkbox" checked={currentControls.isQuizOpen} onChange={e => updateControls({ isQuizOpen: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> الكويز
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                          <input type="checkbox" checked={currentControls.isEvaluationOpen} onChange={e => updateControls({ isEvaluationOpen: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> التقييم
                                        </label>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                          <input type="checkbox" checked={currentControls.isTasksOpen} onChange={e => updateControls({ isTasksOpen: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" /> التاسكات
                                        </label>
                                      </div>
                                      
                                      {currentControls.isTasksOpen && (
                                        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                          <div>
                                            <label className="block text-xs font-bold mb-1">وصف التاسك</label>
                                            <textarea 
                                              value={currentControls.taskDescription} 
                                              onChange={e => updateControls({ taskDescription: e.target.value })} 
                                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm min-h-[60px]"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs font-bold mb-1">ملف التاسك (PDF أو صورة)</label>
                                            <div className="flex items-center gap-2">
                                              {currentControls.taskFileUrl && <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded">يوجد ملف مرفق</span>}
                                              <input 
                                                type="file" 
                                                accept="image/*,application/pdf"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                      updateControls({ taskFileUrl: event.target?.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                  }
                                                }}
                                                className="text-xs"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
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
                                  className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg font-bold"
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
                          <span className="text-green-600">{c.price} {c.currency || 'ج.م'}</span>
                        </div>
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

                <div className="grid grid-cols-3 gap-4">
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
                    <label className="block text-xs font-bold mb-2">سعر الاشتراك</label>
                    <input
                      type="number"
                      value={newCourse.price}
                      onChange={(e) => setNewCourse({ ...newCourse, price: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-2">العملة</label>
                    <select
                      value={newCourse.currency || "ج.م"}
                      onChange={(e) => setNewCourse({ ...newCourse, currency: e.target.value })}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="ج.م">ج.م (جنيه مصري)</option>
                      <option value="ر.س">ر.س (ريال سعودي)</option>
                      <option value="د.إ">د.إ (درهم إماراتي)</option>
                      <option value="د.ك">د.ك (دينار كويتي)</option>
                      <option value="د.أ">د.أ (دينار أردني)</option>
                      <option value="$">$ (دولار أمريكي)</option>
                      <option value="€">€ (يورو)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">صورة غلاف الدورة</label>
                  <div className="flex items-center gap-3">
                    {newCourse.coverImage && (
                      <img 
                        src={newCourse.coverImage} 
                        alt="Cover Preview" 
                        className={`w-12 h-12 rounded-xl border bg-white dark:bg-slate-900 p-0.5 ${
                          newCourse.imageFit === 'contain' ? 'object-contain bg-slate-950' : 'object-cover'
                        }`} 
                      />
                    )}
                    <label className="flex-1 cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-2 transition-all">
                      <Upload size={16} />
                      <span>{newCourse.coverImage ? "تغيير الغلاف" : "رفع صورة غلاف"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const base64 = event.target?.result as string;
                              const compressed = await compressBase64(base64, 800, 500, 0.85);
                              setNewCourse(prev => ({ ...prev, coverImage: compressed }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-2">طريقة عرض الصورة (الاطار)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCourse(prev => ({ ...prev, imageFit: 'cover' }))}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all ${
                        (newCourse.imageFit || 'cover') === 'cover'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      ملء الإطار (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCourse(prev => ({ ...prev, imageFit: 'contain' }))}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all ${
                        newCourse.imageFit === 'contain'
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      احتواء كامل (Contain)
                    </button>
                  </div>
                </div>

                 <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500">إتاحة التسجيل في الدورة حالياً</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newCourse.isRegistrationOpen} 
                      onChange={(e) => setNewCourse({ ...newCourse, isRegistrationOpen: e.target.checked })} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-650 peer-checked:bg-blue-600"></div>
                  </label>
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

        {/* TAB 3: ATTENDANCE */}
        {activeTab === "attendance" && (
          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر الكورس:</span>
                  <select
                    value={attendanceCourseId}
                    onChange={(e) => setAttendanceCourseId(e.target.value)}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 mb-1">اختر المحاضرة:</span>
                  <select
                    value={attendanceLectureNum}
                    onChange={(e) => setAttendanceLectureNum(Number(e.target.value))}
                    className="px-4 py-2 border rounded-xl bg-white dark:bg-slate-800 font-bold"
                  >
                    {Array.from({ length: courses.find(c => c.id === attendanceCourseId)?.lecturesCount || 12 }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>المحاضرة رقم {idx + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Video size={20} className="text-blue-500" />
                سجل الحضور والتقييمات ({attendanceRecords.length} طالب)
              </h3>
              {attendanceRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">اسم الطالب</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">الدورة</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">الكويز</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">تقييم المتدرب</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400 max-w-xs">الملاحظات</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">وقت التسجيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => {
                        const studentScore = attendanceScores[record.studentName];
                        const studentEval = attendanceEvals[record.studentName];
                        
                        return (
                          <tr key={record.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{record.studentName}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400">{courses.find(c => c.id === record.courseId)?.title || "غير معروف"}</td>
                            <td className="p-4 text-slate-600 dark:text-slate-400">
                              {studentScore !== undefined ? (
                                <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">
                                  {studentScore} إجابات صحيحة
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">لم يحل</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">
                              {studentEval ? (
                                <div className="space-y-1">
                                  <div>فهم: <span className="font-bold">{studentEval.understandingRating}/5</span></div>
                                  <div>مجهود: <span className="font-bold">{studentEval.effortRating}/5</span></div>
                                </div>
                              ) : (
                                <span className="text-slate-400">لم يقيّم</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs max-w-xs truncate" title={studentEval?.notes || ""}>
                              {studentEval?.notes || "-"}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs" dir="ltr">{new Date(record.createdAt).toLocaleString("ar-EG")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Video size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold">لم يقم أي طالب بتسجيل حضوره في هذه المحاضرة حتى الآن.</p>
                </div>
              )}
            </div>

            {/* Student Tasks section */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-sm mt-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award size={20} className="text-blue-500" />
                تاسكات المتدربين ({studentTasks.length} تاسك)
              </h3>
              {studentTasks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">رقم المتدرب</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">الملف المرفوع</th>
                        <th className="p-4 font-bold text-slate-500 dark:text-slate-400">وقت الرفع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentTasks.map((task) => (
                        <tr key={task.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-200" dir="ltr">{task.studentPhone}</td>
                          <td className="p-4">
                            <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 font-bold underline hover:text-blue-700">
                              عرض الملف
                            </a>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400 text-xs" dir="ltr">{new Date(task.createdAt).toLocaleString("ar-EG")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Award size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                  <p className="text-slate-500 font-bold">لم يقم أي متدرب برفع التاسك لهذه المحاضرة حتى الآن.</p>
                </div>
              )}
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
                <span className="text-[10px] text-slate-400 mt-1">تنسيق الـ CSV المقبول: السؤال, الإجابة</span>
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
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-extrabold text-lg text-slate-800 dark:text-white">البطاقات المضافة لهذه المحاضرة ({flashcards.filter(c => c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum).length})</h4>
                  {flashcards.filter(c => c.courseId === selectedCourseId && c.lectureNumber === selectedLectureNum).length > 0 && (
                    <button
                      onClick={handleDeleteAllFlashcards}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-650 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Trash2 size={12} /> حذف جميع الكروت
                    </button>
                  )}
                </div>
                
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
                <span className="text-[10px] text-slate-400 mt-1">التنسيق المقبول: السؤال, الخيار أ, الخيار ب, الخيار ج, الخيار د, رقم الخيار الصحيح (0-3)</span>
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
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-extrabold text-lg text-slate-800 dark:text-white">أسئلة الكويز المضافة لهذه المحاضرة ({quizzes.filter(q => q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum).length})</h4>
                  {quizzes.filter(q => q.courseId === selectedCourseId && q.lectureNumber === selectedLectureNum).length > 0 && (
                    <button
                      onClick={handleDeleteAllQuizzes}
                      className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-650 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Trash2 size={12} /> حذف جميع الأسئلة
                    </button>
                  )}
                </div>
                
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
    </div>
  );
}
