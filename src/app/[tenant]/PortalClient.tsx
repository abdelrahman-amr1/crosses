"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Course, Student, Institution, Application } from "@/lib/db";
import { compressBase64 } from "@/lib/imageCompressor";
import CoursePanel from "@/components/CoursePanel";
import Leaderboard from "@/components/Leaderboard";
import { LogOut, BookOpen, User, Camera, ShieldCheck, ClipboardList, Send, Phone, Sparkles, Upload } from "lucide-react";

export default function TenantStudentPortal({
  params,
}: {
  params: { tenant: string };
}) {
  const router = useRouter();
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [studentRecords, setStudentRecords] = useState<Student[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loginError, setLoginError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [submittingCourseId, setSubmittingCourseId] = useState<string | null>(null);

  // Profile Completion Modal states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [pendingCourseToSubscribe, setPendingCourseToSubscribe] = useState<Course | null>(null);
  const [courseToEnterAfterCompletion, setCourseToEnterAfterCompletion] = useState<Course | null>(null);
  const [modalDocType, setModalDocType] = useState<"egypt" | "passport" | "other">("egypt");
  const [modalNationalId, setModalNationalId] = useState("");
  const [modalAvatarBase64, setModalAvatarBase64] = useState("");
  const [modalAvatarFileName, setModalAvatarFileName] = useState("");
  const [modalFullName, setModalFullName] = useState("");
  const [modalError, setModalError] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  // Load configuration and courses on mount, and poll courses every 4 seconds
  useEffect(() => {
    db.getInstitutions().then(insts => {
      const current = insts.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());
      if (current) {
        setInstitution(current);
      }
    }).catch(console.error);

    // Initial load
    db.getCourses(params.tenant).then(setCourses).catch(console.error);

    // Poll courses every 4 seconds
    const interval = setInterval(() => {
      db.getCourses(params.tenant).then(setCourses).catch(console.error);
    }, 4000);

    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem(`loggedin_student_${params.tenant}`);
      if (savedUser) {
        const studentInfo: Student = JSON.parse(savedUser);
        setPhoneInput(studentInfo.phone);
        setStudent(studentInfo);
        setIsLoggedIn(true);
        setAvatarPreview(studentInfo.avatarUrl || "");
      }
    }

    return () => clearInterval(interval);
  }, [params.tenant]);

  // Load and poll student records and applications when logged in
  useEffect(() => {
    if (!isLoggedIn || !student?.phone) return;

    const fetchData = () => {
      Promise.all([
        db.getStudentsByPhone(params.tenant, student.phone),
        db.getApplicationsByPhone(params.tenant, student.phone),
        db.getCourses(params.tenant)
      ]).then(([records, apps, syncedCourses]) => {
        setStudentRecords(records);
        setMyApplications(apps);
        setCourses(syncedCourses);
        
        // Find matching record for currently active course if any, or default to the first one
        const activeRecord = records.find(r => r.courseId === student.courseId) || records[0];
        if (activeRecord) {
          setStudent(activeRecord);
          setAvatarPreview(activeRecord.avatarUrl || "");
          localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(activeRecord));
        }
      }).catch(console.error);
    };

    fetchData(); // initial fetch

    const interval = setInterval(fetchData, 4000); // poll every 4 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn, student?.phone, params.tenant]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!phoneInput.trim()) {
      setLoginError("يرجى إدخال رقم الموبايل لتسجيل الدخول.");
      return;
    }

    try {
      // Find student by phone (1 quick row query)
      const record = await db.getStudentByPhone(params.tenant, phoneInput.trim());

      if (record) {
        setIsLoggedIn(true);
        setStudent(record);
        setAvatarPreview(record.avatarUrl || "");
        localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(record));
      } else {
        setLoginError("⚠️ رقم الموبايل غير مسجل أو لم تتم الموافقة على طلبك بعد.");
      }
    } catch (err: any) {
      setLoginError(`⚠️ حدث خطأ أثناء تسجيل الدخول: ${err.message || err}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`loggedin_student_${params.tenant}`);
    setIsLoggedIn(false);
    setStudent(null);
    setStudentRecords([]);
    setMyApplications([]);
    setSelectedCourse(null);
    setPhoneInput("");
  };

  // Simulating Profile Avatar Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && student) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressBase64(rawBase64);
        setAvatarPreview(compressed);

        try {
          // Update only this single student's avatar
          await db.updateStudent(student.id, { avatarUrl: compressed });

          // Update current student state
          const updatedStudent = { ...student, avatarUrl: compressed };
          setStudent(updatedStudent);
          localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(updatedStudent));

          // Also update avatar in all matching studentRecords locally to avoid mismatch
          setStudentRecords(prev => prev.map(r => r.phone === student.phone ? { ...r, avatarUrl: compressed } : r));
        } catch (err) {
          console.error("Failed to update avatar:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubscribeToCourse = async (course: Course) => {
    if (!student) return;

    // Check if profile is incomplete for paid courses
    const isPaid = Number(course.price) > 0;
    const isIdIncomplete = !student.nationalId || student.nationalId === "00000000000000" || /^0+$/.test(student.nationalId) || student.nationalId.length < 5;
    const isPhotoIncomplete = !student.avatarUrl;

    if (isPaid && (isIdIncomplete || isPhotoIncomplete)) {
      setPendingCourseToSubscribe(course);
      setModalFullName(student.name);
      setModalNationalId(isIdIncomplete ? "" : student.nationalId);
      setModalAvatarBase64(student.avatarUrl || "");
      setModalDocType(student.nationalId?.length === 14 ? "egypt" : "passport");
      setModalError("");
      setShowCompletionModal(true);
      return;
    }

    setSubmittingCourseId(course.id);
    try {
      // Add application for the student for this new course
      await db.addApplication(params.tenant, {
        fullName: student.name,
        nationalId: student.nationalId,
        phone: student.phone,
        courseId: course.id,
        photoUrl: student.avatarUrl || ""
      });

      // Refresh applications list
      const apps = await db.getApplicationsByPhone(params.tenant, student.phone);
      setMyApplications(apps);
      alert(`🎉 تم إرسال طلب الاشتراك في دورة "${course.title}" بنجاح وهو قيد المراجعة حالياً!`);
    } catch (err: any) {
      alert(`⚠️ فشل تقديم الطلب: ${err.message || err}`);
    } finally {
      setSubmittingCourseId(null);
    }
  };

  const handleSaveAndSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (!student) return;
    if (!pendingCourseToSubscribe && !courseToEnterAfterCompletion) return;

    const nameWords = modalFullName.trim().split(/\s+/);
    if (nameWords.length < 4) {
      setModalError("⚠️ يرجى إدخال اسمك رباعياً بالكامل.");
      return;
    }

    if (/^0+$/.test(modalNationalId) || modalNationalId.length < 5) {
      setModalError("⚠️ يرجى إدخال رقم إثبات شخصية صحيح (لا يمكن أن يكون كله أصفار).");
      return;
    }

    if (modalDocType === "egypt") {
      if (modalNationalId.length !== 14 || !/^\d+$/.test(modalNationalId)) {
        setModalError("⚠️ الرقم القومي المصري يجب أن يتكون من 14 رقماً صحيحاً.");
        return;
      }
    } else if (modalDocType === "passport") {
      if (modalNationalId.length < 5 || modalNationalId.length > 20) {
        setModalError("⚠️ رقم جواز السفر يجب أن يكون بين 5 إلى 20 خانة.");
        return;
      }
    } else {
      if (modalNationalId.length < 6 || modalNationalId.length > 20) {
        setModalError("⚠️ رقم الهوية الوطنية يجب أن يكون بين 6 إلى 20 خانة.");
        return;
      }
    }

    if (!modalAvatarBase64) {
      setModalError("⚠️ يرجى رفع صورتك الشخصية لإتمام العملية.");
      return;
    }

    setModalSaving(true);
    try {
      // Check duplicate nationalId in the database (excluding current student)
      const existingStudents = await db.getStudents(params.tenant);
      const isDuplicateId = existingStudents.some(s => s.id !== student.id && s.nationalId === modalNationalId);
      if (isDuplicateId) {
        setModalError("⚠️ رقم إثبات الشخصية هذا مسجل بالفعل لطالب آخر. يرجى إدخال رقمك الصحيح.");
        setModalSaving(false);
        return;
      }

      // 1. Update student profile in database
      await db.updateStudent(student.id, {
        name: modalFullName,
        nationalId: modalNationalId,
        avatarUrl: modalAvatarBase64
      });

      // 2. Update local state
      const updatedStudent = {
        ...student,
        name: modalFullName,
        nationalId: modalNationalId,
        avatarUrl: modalAvatarBase64
      };
      setStudent(updatedStudent);
      setAvatarPreview(modalAvatarBase64);
      localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(updatedStudent));

      // Update studentRecords locally
      setStudentRecords(prev => prev.map(r => r.phone === student.phone ? {
        ...r,
        name: modalFullName,
        nationalId: modalNationalId,
        avatarUrl: modalAvatarBase64
      } : r));

      if (pendingCourseToSubscribe) {
        // 3. Submit the application for the pending course
        await db.addApplication(params.tenant, {
          fullName: modalFullName,
          nationalId: modalNationalId,
          phone: student.phone,
          courseId: pendingCourseToSubscribe.id,
          photoUrl: modalAvatarBase64
        });

        // Refresh applications list
        const apps = await db.getApplicationsByPhone(params.tenant, student.phone);
        setMyApplications(apps);

        alert(`🎉 تم تحديث بياناتك بنجاح، وتم إرسال طلب الاشتراك في دورة "${pendingCourseToSubscribe.title}" وهو قيد المراجعة!`);
      } else if (courseToEnterAfterCompletion) {
        // If they were trying to enter a course, enter it now
        try {
          const latestCourses = await db.getCourses(params.tenant);
          const syncedCourse = latestCourses.find(c => c.id === courseToEnterAfterCompletion.id) || courseToEnterAfterCompletion;
          setSelectedCourse(syncedCourse);
        } catch (e) {
          setSelectedCourse(courseToEnterAfterCompletion);
        }
        alert(`🎉 تم تحديث بياناتك بنجاح، ودخول الكورس مفعل الآن!`);
      }

      setShowCompletionModal(false);
      setPendingCourseToSubscribe(null);
      setCourseToEnterAfterCompletion(null);
    } catch (err: any) {
      setModalError(`⚠️ فشل التحديث: ${err.message || err}`);
    } finally {
      setModalSaving(false);
    }
  };

  const handleSelectCourse = async (course: Course) => {
    if (!student) return;

    // Check if profile is incomplete (missing national ID or photo)
    const isIdIncomplete = !student.nationalId || student.nationalId === "00000000000000" || /^0+$/.test(student.nationalId) || student.nationalId.length < 5;
    const isPhotoIncomplete = !student.avatarUrl;

    if (isIdIncomplete || isPhotoIncomplete) {
      setPendingCourseToSubscribe(null);
      setCourseToEnterAfterCompletion(course);
      
      setModalFullName(student.name);
      setModalNationalId(isIdIncomplete ? "" : student.nationalId);
      setModalAvatarBase64(student.avatarUrl || "");
      setModalDocType(student.nationalId?.length === 14 ? "egypt" : "passport");
      setModalError("");
      setShowCompletionModal(true);
      return;
    }

    try {
      const latestCourses = await db.getCourses(params.tenant);
      const syncedCourse = latestCourses.find(c => c.id === course.id) || course;
      setSelectedCourse(syncedCourse);
    } catch (e) {
      setSelectedCourse(course);
    }
  };

  if (isLoggedIn && student) {
    if (selectedCourse) {
      return (
        <CoursePanel
          course={selectedCourse}
          tenant={params.tenant}
          studentName={student.name}
          onBack={() => setSelectedCourse(null)}
        />
      );
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-right" dir="rtl">
        {/* Header Profile Section */}
        <div className="bg-gradient-to-l from-blue-700 to-indigo-900 text-white rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 z-10">
            {/* Avatar Uploader */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white/20 bg-slate-800/50 flex items-center justify-center overflow-hidden shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white/60" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 p-2 rounded-full cursor-pointer border-2 border-white shadow-md transition-all">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
                <h2 className="text-2xl sm:text-3xl font-extrabold">{student.name}</h2>
                <ShieldCheck size={20} className="text-emerald-400" />
              </div>
              <p className="text-blue-100 font-medium text-center md:text-right">{student.email}</p>
              <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start text-xs font-bold">
                <span className="bg-white/10 px-3 py-1 rounded-full">طالب مقبول ونشط</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/20">رقم الكشف: #{student.rollNumber}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all z-10 text-sm shadow-md"
          >
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>

        {/* Dashboard Columns with smooth fade-in animation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-[fadeIn_0.5s_ease-out]">
          
          {/* Active & Other Courses (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Active Courses */}
            <div className="space-y-6">
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen size={24} className="text-blue-600" /> دوراتك التدريبية المشترك بها
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {courses.filter(c => studentRecords.some(r => r.courseId === c.id)).map((c) => {
                  const matchingRecord = studentRecords.find(r => r.courseId === c.id);
                  const rollNumber = matchingRecord?.rollNumber || student.rollNumber;
                  return (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
                    >
                      <div className="h-44 relative bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white overflow-hidden bg-slate-950">
                        {c.coverImage ? (
                          <img 
                            src={c.coverImage} 
                            alt={c.title} 
                            className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                              c.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                            }`} 
                          />
                        ) : (
                          <div className="text-center p-6">
                            <BookOpen size={44} className="mx-auto mb-2 opacity-80" />
                            <span className="text-xs font-bold uppercase tracking-wider">Academy Course</span>
                          </div>
                        )}
                        <span className="absolute top-4 left-4 bg-emerald-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                          مقبول ونشط
                        </span>
                      </div>

                      <div className="p-6 flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{c.title}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium">
                            {c.description}
                          </p>
                          <div className="flex gap-4 mb-4 text-xs font-bold text-slate-400 border-t border-slate-50 dark:border-slate-700 pt-4">
                            <span>📚 المحاضرات: {c.lecturesCount}</span>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400">👥 رقم كشفك: #{rollNumber}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectCourse(c)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-95 duration-200"
                        >
                          <span>دخول الكورس والتعلم 🚀</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Available Courses */}
            {(() => {
              const otherCourses = courses.filter(c => !studentRecords.some(r => r.courseId === c.id) && c.isRegistrationOpen !== false);
              if (otherCourses.length === 0) return null;
              return (
                <div className="space-y-6 pt-8 border-t border-slate-200/80 dark:border-slate-700/80">
                  <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                    <Sparkles size={24} className="text-yellow-500 animate-pulse" /> دورات متاحة للاشتراك
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {otherCourses.map((c) => {
                      const hasPendingApp = myApplications.some(a => a.courseId === c.id && a.status === "pending");
                      return (
                        <div
                          key={c.id}
                          className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col group"
                        >
                          <div className="h-44 relative bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white overflow-hidden bg-slate-950">
                            {c.coverImage ? (
                              <img 
                                src={c.coverImage} 
                                alt={c.title} 
                                className={`w-full h-full group-hover:scale-105 transition-transform duration-500 filter grayscale-[15%] group-hover:grayscale-0 ${
                                  c.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                                }`} 
                              />
                            ) : (
                              <div className="text-center p-6">
                                <BookOpen size={44} className="mx-auto mb-2 opacity-80" />
                                <span className="text-xs font-bold uppercase tracking-wider">Academy Course</span>
                              </div>
                            )}
                            {hasPendingApp ? (
                              <span className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md animate-pulse">
                                ⏳ قيد المراجعة
                              </span>
                            ) : (
                              <span className="absolute top-4 left-4 bg-indigo-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                                متاح للتسجيل
                              </span>
                            )}
                          </div>

                          <div className="p-6 flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{c.title}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 font-medium">
                                {c.description}
                              </p>
                              <div className="flex gap-4 mb-4 text-xs font-bold text-slate-400 border-t border-slate-50 dark:border-slate-700 pt-4">
                                <span>📚 المحاضرات: {c.lecturesCount}</span>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{c.price} {c.currency || 'ج.م'}</span>
                              </div>
                            </div>

                            {hasPendingApp ? (
                              <button
                                disabled
                                className="w-full bg-slate-100 dark:bg-slate-750 text-slate-400 dark:text-slate-400 font-bold py-3.5 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200/40 dark:border-slate-700"
                              >
                                <span>طلبك قيد المراجعة حالياً...</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSubscribeToCourse(c)}
                                disabled={submittingCourseId === c.id}
                                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-750 hover:to-blue-750 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 duration-200"
                              >
                                {submittingCourseId === c.id ? (
                                  <span>جاري التقديم...</span>
                                ) : (
                                  <>
                                    <span>طلب اشتراك فوري 🚀</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Leaderboard Rankings (1/3 width) */}
          <div className="lg:col-span-1">
            <Leaderboard tenant={params.tenant} currentStudentName={student.name} />
          </div>

        </div>

        {/* Profile Completion Modal */}
        {showCompletionModal && (pendingCourseToSubscribe || courseToEnterAfterCompletion) && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">
                {pendingCourseToSubscribe ? "إكمال البيانات المطلوبة للاشتراك" : "🔒 إكمال البيانات المطلوبة لدخول المحاضرات"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
                {pendingCourseToSubscribe ? (
                  <>
                    الدورة التي اخترتها <strong>({pendingCourseToSubscribe.title})</strong> هي دورة مدفوعة، ويتطلب تفعيل الاشتراك فيها مراجعة هويتك وصورتك الشخصية للشهادة. يرجى كتابة البيانات بشكل صحيح وصادق:
                  </>
                ) : (
                  <>
                    يتطلب دخول كورس <strong>({courseToEnterAfterCompletion?.title})</strong> وتسجيل حضور محاضراته توثيق هويتك وصورتك الشخصية للشهادة والمتابعة. يرجى إدخال البيانات التالية بدقة:
                  </>
                )}
              </p>

              <form onSubmit={handleSaveAndSubscribe} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الاسم رباعياً بالكامل (لشهادة الكورس):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="محمد احمد محمود علي"
                    value={modalFullName}
                    onChange={(e) => setModalFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Doc Type selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    نوع وثيقة إثبات الشخصية:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalDocType("egypt");
                        setModalNationalId("");
                      }}
                      className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                        modalDocType === "egypt"
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      رقم قومي (مصر)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalDocType("passport");
                        setModalNationalId("");
                      }}
                      className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                        modalDocType === "passport"
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      جواز سفر (دولي)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalDocType("other");
                        setModalNationalId("");
                      }}
                      className={`py-2 px-1 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                        modalDocType === "other"
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      هوية وطنية أخرى
                    </button>
                  </div>
                </div>

                {/* Doc Number Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {modalDocType === "egypt"
                      ? "الرقم القومي (14 رقم):"
                      : modalDocType === "passport"
                      ? "رقم جواز السفر:"
                      : "رقم الهوية الوطنية / الإقامة:"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={modalDocType === "egypt" ? 14 : 20}
                    placeholder={
                      modalDocType === "egypt"
                        ? "29910203040506"
                        : modalDocType === "passport"
                        ? "A12345678"
                        : "1020304050"
                    }
                    value={modalNationalId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (modalDocType === "egypt") {
                        setModalNationalId(val.replace(/\D/g, ""));
                      } else {
                        setModalNationalId(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase());
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left"
                    dir="ltr"
                  />
                </div>

                {/* Photo Uploader */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    الصورة الشخصية (مطلوبة للشهادة):
                  </label>
                  <div className="flex items-center gap-3">
                    {modalAvatarBase64 && (
                      <img src={modalAvatarBase64} alt="Avatar Preview" className="w-12 h-12 rounded-xl object-cover border bg-white dark:bg-slate-900 p-0.5" />
                    )}
                    <label className="flex-1 cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-755 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-2 transition-all">
                      <Upload size={16} />
                      <span>{modalAvatarBase64 ? "تغيير صورتك" : "اختر صورتك الشخصية"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setModalAvatarFileName(file.name);
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const rawBase64 = reader.result as string;
                              const compressed = await compressBase64(rawBase64);
                              setModalAvatarBase64(compressed);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                {modalError && (
                  <p className="text-red-500 text-xs font-bold leading-relaxed">{modalError}</p>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 text-sm"
                  >
                    {modalSaving ? "جاري الحفظ والتفعيل..." : pendingCourseToSubscribe ? "تأكيد البيانات والاشتراك 🚀" : "تأكيد البيانات ودخول الكورس 🚀"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompletionModal(false);
                      setPendingCourseToSubscribe(null);
                      setCourseToEnterAfterCompletion(null);
                    }}
                    className="px-5 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-bold transition-all text-sm"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12" dir="rtl">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {institution?.logoUrl ? (
          <img src={institution.logoUrl} alt="Logo" className="w-20 h-20 rounded-2xl object-contain bg-white border p-1 shadow-md mb-6" />
        ) : (
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-extrabold text-2xl shadow-inner mb-6">
            {(institution?.name || params.tenant).charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
          بوابة الطلاب - {institution?.name || params.tenant}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          سجل دخولك للوصول إلى محاضراتك، كويزاتك، والبطاقات التفاعلية.
        </p>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 w-full text-right mb-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                رقم الموبايل (المسجل به):
              </label>
              <input
                type="text"
                required
                placeholder="01012345678"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                dir="ltr"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-xs font-bold leading-relaxed">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20"
            >
              تسجيل دخول الطالب
            </button>
          </form>
        </div>

        {/* Public Trainees Registration CTA */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-6 rounded-3xl flex items-center justify-between gap-4 text-right">
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">هل أنت متدرب جديد؟</h4>
            <p className="text-xs text-slate-500">قدم طلب التحاق بالدورة، وادخل الرقم القومي والاسم رباعياً لتسجيل حسابك.</p>
          </div>
          <button
            onClick={() => router.push(`/${params.tenant}/register`)}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-blue-200/50 flex items-center gap-1 flex-shrink-0"
          >
            <ClipboardList size={14} /> التقديم والتسجيل
          </button>
        </div>

      </div>
    </div>
  );
}
