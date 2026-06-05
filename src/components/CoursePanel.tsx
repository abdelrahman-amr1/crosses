"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Send,
  HelpCircle,
  FileText,
  Video,
  Award,
  ArrowRight,
  Shield,
  Sparkles,
  Upload,
  Lock
} from "lucide-react";
import { db, Course, Flashcard, QuizQuestion, SelfEvaluation } from "@/lib/db";
import FlashcardGame from "./FlashcardGame";
import CopyProtection from "./CopyProtection";

interface CoursePanelProps {
  course: Course;
  tenant: string;
  studentName: string;
  onBack: () => void;
}

export default function CoursePanel({ course, tenant, studentName, onBack }: CoursePanelProps) {
  const [selectedLecture, setSelectedLecture] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("attendance");
  
  // Data state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, boolean>>({});

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCountdown, setQuizCountdown] = useState<number | null>(null);

  // Evaluation state
  const [understandingRating, setUnderstandingRating] = useState(5);
  const [effortRating, setEffortRating] = useState(5);
  const [evalNotes, setEvalNotes] = useState("");
  const [evalHistory, setEvalHistory] = useState<SelfEvaluation[]>([]);
  const [evalSuccessMsg, setEvalSuccessMsg] = useState("");

  // Tasks state
  const [taskUploaded, setTaskUploaded] = useState(false);
  const [taskUploading, setTaskUploading] = useState(false);

  // Load data for the selected lecture
  useEffect(() => {
    async function loadData() {
      try {
        const cards = await db.getFlashcards(tenant, course.id, selectedLecture);
        const quiz = await db.getQuizzes(tenant, course.id, selectedLecture);
        setFlashcards(cards);
        setQuizQuestions(quiz);

        // Fetch previous quiz scores
        const pastScores = await db.getQuizScores(tenant, studentName);
        const pastScoreKey = `${course.id}_${selectedLecture}`;

        if (pastScores[pastScoreKey] !== undefined) {
          setQuizScore(pastScores[pastScoreKey]);
          setQuizSubmitted(true);
          setQuizStarted(true);
        } else {
          setQuizSubmitted(false);
          setQuizStarted(false);
          setQuizScore(0);
        }
        setQuizCountdown(null);

        // Reset eval form
        setUnderstandingRating(5);
        setEffortRating(5);
        setEvalNotes("");
        setEvalSuccessMsg("");

        // Load evaluation history
        const allEvals = await db.getEvaluations(tenant, studentName);
        const history = allEvals.filter(
          ev => ev.lectureNumber === selectedLecture
        );
        setEvalHistory(history);

        // Load tasks
        const tasks = await db.getStudentTasks(course.id, selectedLecture);
        setTaskUploaded(tasks.some(t => t.studentPhone === studentName));
      } catch (err) {
        console.error("Failed to load lecture data:", err);
      }
    }
    loadData();
  }, [selectedLecture, course.id, tenant, studentName]);

  const defaultControls = { isAttendanceOpen: true, isFlashcardsOpen: true, isQuizOpen: true, isEvaluationOpen: true, isTasksOpen: false, taskDescription: "", taskFileUrl: "" };
  const currentControls = course.lectureControls?.[selectedLecture] || defaultControls;

  useEffect(() => {
    // If current active tab is locked, try to switch to the first available open tab
    const isLocked = 
      (activeTab === "attendance" && !currentControls.isAttendanceOpen) ||
      (activeTab === "flashcards" && !currentControls.isFlashcardsOpen) ||
      (activeTab === "quiz" && !currentControls.isQuizOpen) ||
      (activeTab === "evaluation" && !currentControls.isEvaluationOpen) ||
      (activeTab === "tasks" && !currentControls.isTasksOpen);

    if (isLocked) {
      if (currentControls.isAttendanceOpen) setActiveTab("attendance");
      else if (currentControls.isFlashcardsOpen) setActiveTab("flashcards");
      else if (currentControls.isQuizOpen) setActiveTab("quiz");
      else if (currentControls.isEvaluationOpen) setActiveTab("evaluation");
      else if (currentControls.isTasksOpen) setActiveTab("tasks");
    }
  }, [currentControls, activeTab]);

  // Handle Attendance via DB
  const handleAttend = async () => {
    setIsAttending(true);
    try {
      await db.saveAttendance(tenant, studentName, course.id, selectedLecture);
      setAttendanceStatus(prev => ({ ...prev, [selectedLecture]: true }));
      alert(`✅ تم تسجيل حضورك بنجاح في قاعدة بيانات المنصة! سيتم تحويلك الآن إلى البث المباشر/رابط الدرس.`);
      window.open(course.lectureUrl || "https://zoom.us/test", "_blank");
    } catch (error) {
      alert("حدث خطأ في الاتصال بالخادم لتسجيل الحضور.");
    } finally {
      setIsAttending(false);
    }
  };

  // Handle Quiz Submission
  const handleQuizSubmit = async () => {
    let score = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctOption) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    try {
      await db.saveQuizScore(tenant, studentName, course.id, selectedLecture, score);
    } catch (err) {
      console.error("Failed to save quiz score:", err);
    }
  };

  // Handle Self Evaluation Submit
  const handleEvalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.saveEvaluation(tenant, studentName, {
        username: studentName,
        lectureNumber: selectedLecture,
        understandingRating,
        effortRating,
        notes: evalNotes
      });
      
      // Reload evaluation history
      const allEvals = await db.getEvaluations(tenant, studentName);
      const history = allEvals.filter(
        ev => ev.lectureNumber === selectedLecture
      );
      setEvalHistory(history);
      setEvalSuccessMsg("🎉 تم حفظ تقييمك لمستواك بنجاح! استمر في التقدم.");
      setEvalNotes("");
    } catch (err) {
      console.error("Failed to save evaluation:", err);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 text-right" dir="rtl">
      {/* Back Button and Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 dark:bg-slate-800 dark:text-blue-400 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowRight size={18} /> العودة للدورات
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={28} /> {course.title}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{course.description}</p>
        </div>
      </div>

      {/* Grid: Lecture Selector and Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Lecture Selector Sidebar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm h-fit">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-500" /> محاضرات الدورة
          </h3>
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {Array.from({ length: course.lecturesCount }).map((_, i) => {
              const num = i + 1;
              const isSelected = selectedLecture === num;
              const isAttended = attendanceStatus[num];
              return (
                <button
                  key={num}
                  onClick={() => setSelectedLecture(num)}
                  className={`flex-shrink-0 flex items-center justify-between w-full px-4 py-3 rounded-2xl font-bold transition-all text-sm ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>المحاضرة رقم {num}</span>
                  {isAttended && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-white text-blue-600" : "bg-green-100 text-green-700"}`}>
                      حاضر
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Custom Navigation Tabs */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex justify-start gap-1 w-full overflow-x-auto">
            {[
              { id: "attendance", label: "الحضور والمحاضرة", icon: <Video size={18} />, isOpen: currentControls.isAttendanceOpen },
              { id: "flashcards", label: "البطاقات التعليمية", icon: <BookOpen size={18} />, isOpen: currentControls.isFlashcardsOpen },
              { id: "quiz", label: "كويز المحاضرة", icon: <HelpCircle size={18} />, isOpen: currentControls.isQuizOpen },
              { id: "evaluation", label: "مستواي وتقييمي لنفسي", icon: <FileText size={18} />, isOpen: currentControls.isEvaluationOpen },
              { id: "tasks", label: "تاسك المحاضرة", icon: <Award size={18} />, isOpen: currentControls.isTasksOpen }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const isDisabled = !tab.isOpen;
              return (
                <button
                  key={tab.id}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setActiveTab(tab.id as string)}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                    isDisabled 
                      ? "opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500" 
                      : isActive
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {isDisabled && <Lock size={14} className="ml-1 opacity-70" />}
                </button>
              );
            })}
          </div>

          {/* Tab Content rendering */}
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[400px] flex flex-col justify-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + "_" + selectedLecture}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full flex-grow flex flex-col"
              >
                {/* Check if Locked */}
                {((activeTab === "attendance" && !currentControls.isAttendanceOpen) ||
                  (activeTab === "flashcards" && !currentControls.isFlashcardsOpen) ||
                  (activeTab === "quiz" && !currentControls.isQuizOpen) ||
                  (activeTab === "evaluation" && !currentControls.isEvaluationOpen) ||
                  (activeTab === "tasks" && !currentControls.isTasksOpen)) ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
                      <Lock size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">القسم مغلق حالياً</h3>
                    <p className="text-slate-500 mt-2 font-medium">لم يقم المعلم بتفعيل هذا القسم للمحاضرة الحالية حتى الآن.</p>
                  </div>
                ) : (
                  <>
                    {/* 1. ATTENDANCE & ZOOM */}
                    {activeTab === "attendance" && (
                  <div className="flex flex-col items-center justify-center text-center py-10 flex-grow">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                      <Video size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
                      بث المحاضرة رقم {selectedLecture}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                      قم بتسجيل حضورك أولاً ليقوم النظام بنقلك لغرفة الدرس وحفظ بيانات حضورك في السجل الخاص بالمشرفين.
                    </p>
                    
                    {attendanceStatus[selectedLecture] ? (
                      <div className="flex flex-col items-center gap-4">
                        <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                          <CheckCircle2 size={16} /> تم تسجيل حضورك في هذه المحاضرة
                        </span>
                        <div className="flex flex-wrap gap-4 justify-center">
                          <button
                            onClick={() => window.open(course.lectureUrl || "https://zoom.us/test", "_blank")}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
                          >
                            الدخول لرابط البث المباشر (المحاضرة) 🎥
                          </button>
                          {course.whatsappGroupUrl && (
                            <button
                              onClick={() => window.open(course.whatsappGroupUrl, "_blank")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                            >
                              <span>انضمام لجروب الواتساب 💬</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleAttend}
                        disabled={isAttending}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-500/30 flex items-center gap-3"
                      >
                        {isAttending ? "جاري تسجيل الحضور..." : "حضور المحاضرة الآن وتسجيل حضورك 🎥"}
                      </button>
                    )}
                  </div>
                )}

                {/* 2. FLASHCARDS WITH COPY PROTECTION */}
                {activeTab === "flashcards" && (
                  <CopyProtection active={true}>
                    <div className="py-4">
                      <FlashcardGame key={`fc-game-${selectedLecture}`} initialCards={flashcards} />
                    </div>
                  </CopyProtection>
                  )
                }

                {/* 3. INTERACTIVE QUIZ WITH COPY PROTECTION */}
                {activeTab === "quiz" && (
                  <CopyProtection active={true}>
                    <div className="py-2">
                      <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">امتحان المحاضرة رقم {selectedLecture}</h3>
                          <p className="text-xs text-slate-400 mt-1">⚠️ يمنع نسخ الأسئلة أو تصوير الشاشة</p>
                        </div>
                        <div className="bg-red-50 dark:bg-slate-900 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold">
                          <Shield size={14} />
                          <span>وضع الحماية مفعل</span>
                        </div>
                      </div>

                      {quizQuestions.length > 0 ? (
                        !quizStarted ? (
                          <div className="bg-slate-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-3xl p-8 text-center mt-6">
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <HelpCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">هل أنت جاهز للاختبار؟</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed font-medium">
                              الاختبار متاح لمرة واحدة فقط وسيتم تثبيت النتيجة بمجرد الانتهاء ولن تتمكن من إعادته. عند الضغط على "بدء الاختبار"، سيبدأ العد التنازلي.
                            </p>
                            {quizCountdown === null ? (
                              <button
                                onClick={() => setQuizCountdown(3)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all flex items-center justify-center gap-3 mx-auto"
                              >
                                بدء الاختبار الآن 🚀
                              </button>
                            ) : (
                              <div className="text-5xl font-extrabold text-blue-600 animate-pulse">
                                {quizCountdown}
                              </div>
                            )}
                          </div>
                        ) : !quizSubmitted ? (
                          <div className="space-y-6">
                            {quizQuestions.map((question, qIdx) => (
                              <div key={question?.id || qIdx} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                                  {qIdx + 1}. {question?.question || "سؤال مفقود"}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {question?.options?.map((option, oIdx) => {
                                    const qId = question?.id || String(qIdx);
                                    const isSelected = quizAnswers[qId] === oIdx;
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => setQuizAnswers({ ...quizAnswers, [qId]: oIdx })}
                                        className={`px-4 py-3 rounded-xl border text-right font-bold transition-all ${
                                          isSelected
                                            ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300"
                                            : "bg-white border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                                        }`}
                                      >
                                        <span className="inline-block w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 text-center leading-6 text-xs text-slate-500 font-bold ml-2">
                                          {String.fromCharCode(65 + oIdx)}
                                        </span>
                                        {option}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={handleQuizSubmit}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Award size={22} /> تقديم إجابات الكويز
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-10">
                            <div className="w-24 h-24 bg-blue-50 dark:bg-slate-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                              <Award size={48} />
                            </div>
                            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">أحسنت صنعاً!</h3>
                            <p className="text-xl text-slate-500 dark:text-slate-400 mb-2">
                              لقد أجبت بشكل صحيح على <span className="font-bold text-blue-600 dark:text-blue-400">{quizScore}</span> من أصل <span className="font-bold">{quizQuestions.length}</span> أسئلة.
                            </p>
                            {Object.keys(quizAnswers).length === 0 && (
                              <p className="text-md text-emerald-600 dark:text-emerald-400 mb-6 font-bold">
                                تم إجراء هذا الاختبار مسبقاً وتم تثبيت نتيجتك بنجاح.
                              </p>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="text-center py-16">
                          <HelpCircle size={48} className="mx-auto text-slate-300 mb-4" />
                          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">لا توجد أسئلة كويز لهذه المحاضرة</h3>
                          <p className="text-slate-400">لم يقم أدمن المركز برفع أسئلة اختيار من متعدد لهذه المحاضرة بعد.</p>
                        </div>
                      )}
                    </div>
                  </CopyProtection>
                )}

                {/* 4. STUDENT SELF EVALUATION ("مستواي وتقييمي لنفسي") */}
                {activeTab === "evaluation" && (
                  <div className="py-2">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">تقييمي الذاتي لمستواي</h3>
                    <p className="text-sm text-slate-500 mb-6">
                      كن صادقاً مع نفسك في تقييم مدى استيعابك للمحاضرة ومجهودك المبذول لمساعدة المحاضر في تتبع تطورك.
                    </p>

                    <form onSubmit={handleEvalSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Understanding Rating */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            مدى استيعاب وفهم الدرس: {understandingRating}/5
                          </label>
                          <div className="flex gap-2 justify-start">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setUnderstandingRating(star)}
                                className={`text-2xl transition-all ${
                                  star <= understandingRating ? "text-amber-500 scale-110" : "text-slate-300 hover:text-slate-400"
                                }`}
                              >
                                <Star fill={star <= understandingRating ? "currentColor" : "none"} size={28} />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Effort Rating */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            المجهود والمذاكرة بعد الدرس: {effortRating}/5
                          </label>
                          <div className="flex gap-2 justify-start">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEffortRating(star)}
                                className={`text-2xl transition-all ${
                                  star <= effortRating ? "text-amber-500 scale-110" : "text-slate-300 hover:text-slate-400"
                                }`}
                              >
                                <Star fill={star <= effortRating ? "currentColor" : "none"} size={28} />
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظاتي عن هذه المحاضرة ومشاكلي (تظهر للأستاذ):</label>
                        <textarea
                          value={evalNotes}
                          onChange={(e) => setEvalNotes(e.target.value)}
                          placeholder="مثال: واجهت صعوبة في فهم الـ Event Listeners وأحتاج لتطبيق عملي أكثر عليها..."
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] font-medium"
                        />
                      </div>

                      {evalSuccessMsg && (
                        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-sm font-bold">
                          {evalSuccessMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                      >
                        <Send size={18} /> حفظ تقييم المستوى والملاحظات
                      </button>
                    </form>

                    {/* History Section */}
                    {evalHistory.length > 0 && (
                      <div className="mt-8 border-t border-slate-100 dark:border-slate-700 pt-6">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">سجل تقييماتي السابقة لهذه المحاضرة:</h4>
                        <div className="space-y-3">
                          {evalHistory.map((item) => (
                            <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-right">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex gap-4">
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold">
                                    الفهم: {item.understandingRating}/5 ★
                                  </span>
                                  <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-bold dark:bg-slate-800 dark:text-slate-300">
                                    المذاكرة: {item.effortRating}/5 ★
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(item.createdAt).toLocaleString("ar-EG")}
                                </span>
                              </div>
                              {item.notes && <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">ملاحظات: {item.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TASKS */}
                {activeTab === "tasks" && (
                  <div className="flex flex-col h-full items-start">
                     <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">التاسك المطلوب:</h3>
                     <p className="text-slate-600 dark:text-slate-400 mb-6 font-bold leading-relaxed">{currentControls.taskDescription}</p>
                     
                     {currentControls.taskFileUrl && (
                       <a href={currentControls.taskFileUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-3 rounded-xl font-bold flex gap-2 items-center mb-8 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                         <FileText size={20} /> تحميل ملف التاسك
                       </a>
                     )}

                     <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 mt-auto">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">تسليم التاسك الخاص بك:</h4>
                        {taskUploaded ? (
                           <div className="flex items-center gap-3 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-100 dark:border-green-800">
                              <CheckCircle2 size={24} /> تم تسليم التاسك بنجاح! شكراً لالتزامك.
                           </div>
                        ) : (
                           <div className="flex flex-col gap-4">
                              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                 <Upload size={32} className="text-slate-400 group-hover:text-blue-500 mb-3 transition-colors" />
                                 <span className="font-bold text-slate-600 dark:text-slate-400">اضغط لرفع ملف التاسك (PDF أو صورة)</span>
                                 <input type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if(file) {
                                       setTaskUploading(true);
                                       const reader = new FileReader();
                                       reader.onload = async (event) => {
                                          const base64 = event.target?.result as string;
                                          try {
                                             await db.saveStudentTask(course.id, selectedLecture, studentName, base64);
                                             setTaskUploaded(true);
                                             alert("✅ تم تسليم التاسك بنجاح!");
                                          } catch(err) { alert("حدث خطأ أثناء التسليم"); }
                                          setTaskUploading(false);
                                       };
                                       reader.readAsDataURL(file);
                                    }
                                 }} />
                              </label>
                              {taskUploading && <span className="text-blue-600 dark:text-blue-400 font-bold text-sm text-center">جاري الرفع... الرجاء الانتظار</span>}
                           </div>
                        )}
                     </div>
                  </div>
                )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
