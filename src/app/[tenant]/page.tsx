"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Course, Student } from "@/lib/db";
import { compressBase64 } from "@/lib/imageCompressor";
import CoursePanel from "@/components/CoursePanel";
import Leaderboard from "@/components/Leaderboard";
import { LogOut, BookOpen, User, Camera, ShieldCheck, ClipboardList, Send, Phone } from "lucide-react";

export default function TenantStudentPortal({
  params,
}: {
  params: { tenant: string };
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loginError, setLoginError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Load configuration on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem(`loggedin_student_${params.tenant}`);
      if (savedUser) {
        const studentInfo: Student = JSON.parse(savedUser);
        setUsername(studentInfo.name);
        setStudent(studentInfo);
        setIsLoggedIn(true);
        setAvatarPreview(studentInfo.avatarUrl || "");
      }
    }
  }, [params.tenant]);

  // Load courses when logged in
  useEffect(() => {
    if (isLoggedIn && student) {
      // Fetch latest courses from DB (synced with admin edits)
      const courses = db.getCourses(params.tenant);
      const studentCourses = courses.filter(c => c.id === student.courseId);
      setAvailableCourses(studentCourses.length > 0 ? studentCourses : courses);
    }
  }, [isLoggedIn, student, params.tenant]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim()) {
      setLoginError("يرجى إدخال اسم الطالب أو البريد الإلكتروني.");
      return;
    }

    // Find student in local storage DB
    const allStudents = db.getStudents(params.tenant);
    const found = allStudents.find(
      (s) =>
        s.name.trim().toLowerCase() === username.trim().toLowerCase() ||
        s.email.trim().toLowerCase() === username.trim().toLowerCase()
    );

    if (found) {
      // Check password (mobile number check)
      if (password && found.phone !== password) {
        setLoginError("⚠️ كلمة المرور (رقم الموبايل) غير صحيحة.");
        return;
      }

      setIsLoggedIn(true);
      setStudent(found);
      setAvatarPreview(found.avatarUrl || "");
      localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(found));
    } else {
      setLoginError("⚠️ الطالب غير مسجل أو لم تتم الموافقة على طلبه بعد. يمكنك تقديم طلب التحاق بالأسفل.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`loggedin_student_${params.tenant}`);
    setIsLoggedIn(false);
    setStudent(null);
    setSelectedCourse(null);
    setUsername("");
    setPassword("");
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

        // Update student in database
        const allStudents = db.getStudents(params.tenant);
        const updated = allStudents.map((s) =>
          s.id === student.id ? { ...s, avatarUrl: compressed } : s
        );
        db.saveStudents(params.tenant, updated);

        // Update current student state
        const updatedStudent = { ...student, avatarUrl: compressed };
        setStudent(updatedStudent);
        localStorage.setItem(`loggedin_student_${params.tenant}`, JSON.stringify(updatedStudent));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoggedIn && student) {
    if (selectedCourse) {
      // Sync selected course with newest link from Admin before entering
      const latestCourses = db.getCourses(params.tenant);
      const syncedCourse = latestCourses.find(c => c.id === selectedCourse.id) || selectedCourse;
      
      return (
        <CoursePanel
          course={syncedCourse}
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

        {/* Dashboard Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Courses (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" /> دوراتك التدريبية المشترك بها
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableCourses.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="h-44 bg-gradient-to-br from-blue-400 to-indigo-600 relative flex items-center justify-center text-white overflow-hidden">
                    <div className="text-center p-6">
                      <BookOpen size={44} className="mx-auto mb-2 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-wider">Academy Course</span>
                    </div>
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
                        <span>👥 رقم كشفك: #{student.rollNumber}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCourse(c)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>دخول الكورس والتعلم 🚀</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Rankings (1/3 width) */}
          <div className="lg:col-span-1">
            <Leaderboard tenant={params.tenant} currentStudentName={student.name} />
          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12" dir="rtl">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
          بوابة الطلاب - مركز {params.tenant}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
          سجل دخولك للوصول إلى محاضراتك، كويزاتك، والبطاقات التفاعلية.
        </p>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 w-full text-right mb-6">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                البريد الإلكتروني الجامعي / اسم الطالب:
              </label>
              <input
                type="text"
                required
                placeholder="ahmed_01020304050@center.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                كلمة المرور (رقم الموبايل الافتراضي):
              </label>
              <input
                type="password"
                required
                placeholder="01020304050"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
