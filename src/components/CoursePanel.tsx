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
  Sparkles
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
  const [activeTab, setActiveTab] = useState<"attendance" | "flashcards" | "quiz" | "evaluation">("attendance");
  
  // Data state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isAttending, setIsAttending] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<Record<number, boolean>>({});

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Evaluation state
  const [understandingRating, setUnderstandingRating] = useState(5);
  const [effortRating, setEffortRating] = useState(5);
  const [evalNotes, setEvalNotes] = useState("");
  const [evalHistory, setEvalHistory] = useState<SelfEvaluation[]>([]);
  const [evalSuccessMsg, setEvalSuccessMsg] = useState("");

  // Load data for the selected lecture
  useEffect(() => {
    async function loadData() {
      try {
        const cards = await db.getFlashcards(tenant, course.id, selectedLecture);
        const quiz = await db.getQuizzes(tenant, course.id, selectedLecture);
        setFlashcards(cards);
        setQuizQuestions(quiz);

        // Reset quiz state for the new lecture
        setQuizAnswers({});
        setQuizSubmitted(false);
        setQuizScore(0);

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
      } catch (err) {
        console.error("Failed to load lecture data:", err);
      }
    }
    loadData();
  }, [selectedLecture, course.id, tenant, studentName]);

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
          <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex justify-between gap-1 w-full overflow-x-auto">
            {[
              { id: "attendance", label: "الحضور والمحاضرة", icon: <Video size={18} /> },
              { id: "flashcards", label: "البطاقات التعليمية", icon: <BookOpen size={18} /> },
              { id: "quiz", label: "كويز المحاضرة", icon: <HelpCircle size={18} /> },
              { id: "evaluation", label: "مستواي وتقييمي لنفسي", icon: <FileText size={18} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
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
                {/* 1. ATTENDANCE & ZOOM */}
                {activeTab === "attendance" && (
                  course.isAttendanceOpen === false ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                       <Shield size={48} className="text-slate-300 mb-4" />
                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">غير متاح الآن</h3>
                       <p className="text-slate-500 mt-2 font-bold">سيتم التشغيل في الوقت المحدد من قبل الإدارة.</p>
                    </div>
                  ) : (
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
                  )

                )}

                {/* 2. FLASHCARDS WITH COPY PROTECTION */}
                {activeTab === "flashcards" && (
                  course.isFlashcardsOpen === false ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                       <Shield size={48} className="text-slate-300 mb-4" />
                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">غير متاح الآن</h3>
                       <p className="text-slate-500 mt-2 font-bold">سيتم التشغيل في الوقت المحدد من قبل الإدارة.</p>
                    </div>
                  ) : (
                  <CopyProtection active={true}>
                    <div className="py-4">
                      {flashcards.length > 0 ? (
                        <FlashcardGame key={`fc-game-${selectedLecture}`} initialCards={flashcards} />
                      ) : (
                        <div className="text-center py-16">
                          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">لا توجد كروت لهذه المحاضرة</h3>
                          <p className="text-slate-400">لم يقم أدمن المركز بإضافة أو رفع أسئلة فلاش لهذه المحاضرة بعد.</p>
                        </div>
                      )}
                    </div>
                  </CopyProtection>
                  )
                )}

                {/* 3. INTERACTIVE QUIZ WITH COPY PROTECTION */}
                {activeTab === "quiz" && (
                  course.isQuizOpen === false ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                       <Shield size={48} className="text-slate-300 mb-4" />
                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">غير متاح الآن</h3>
                       <p className="text-slate-500 mt-2 font-bold">سيتم التشغيل في الوقت المحدد من قبل الإدارة.</p>
                    </div>
                  ) : (
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
                        !quizSubmitted ? (
                          <div className="space-y-6">
                            {quizQuestions.map((question, qIdx) => (
                              <div key={question.id} className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                                  {qIdx + 1}. {question.question}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {question.options.map((option, oIdx) => {
                                    const isSelected = quizAnswers[question.id] === oIdx;
                                    return (
                                      <button
                                        key={oIdx}
                                        type="button"
                                        onClick={() => setQuizAnswers({ ...quizAnswers, [question.id]: oIdx })}
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
                            <p className="text-xl text-slate-500 dark:text-slate-400 mb-6">
                              لقد أجبت بشكل صحيح على <span className="font-bold text-blue-600 dark:text-blue-400">{quizScore}</span> من أصل <span className="font-bold">{quizQuestions.length}</span> أسئلة.
                            </p>
                            
                            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-800 text-right">
                              <h4 className="font-bold mb-4">تفاصيل الإجابات:</h4>
                              <div className="space-y-3">
                                {quizQuestions.map((q, idx) => {
                                  const isCorrect = quizAnswers[q.id] === q.correctOption;
                                  return (
                                    <div key={q.id} className="flex justify-between items-center text-sm font-bold">
                                      <span>سؤال {idx + 1}: {q.question.substring(0, 30)}...</span>
                                      <span className={isCorrect ? "text-green-600" : "text-red-500"}>
                                        {isCorrect ? "✓ إجابة صحيحة" : `✗ خطأ (الصح: ${q.options[q.correctOption]})`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setQuizAnswers({});
                                setQuizSubmitted(false);
                                setQuizScore(0);
                              }}
                              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:text-white rounded-xl font-bold transition-all inline-flex items-center gap-2"
                            >
                              <RefreshCw size={18} /> إعادة الامتحان
                            </button>
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
                  )
                )}

                {/* 4. STUDENT SELF EVALUATION ("مستواي وتقييمي لنفسي") */}
                {activeTab === "evaluation" && (
                  course.isEvaluationOpen === false ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center h-full">
                       <Shield size={48} className="text-slate-300 mb-4" />
                       <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">غير متاح الآن</h3>
                       <p className="text-slate-500 mt-2 font-bold">سيتم التشغيل في الوقت المحدد من قبل الإدارة.</p>
                    </div>
                  ) : (
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
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
}
