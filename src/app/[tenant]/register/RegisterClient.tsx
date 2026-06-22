"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Course } from "@/lib/db";
import { compressBase64 } from "@/lib/imageCompressor";
import { User, ClipboardList, Phone, FileText, Upload, Sparkles, CheckCircle2 } from "lucide-react";

export default function StudentRegistration({
  params,
}: {
  params: { tenant: string };
}) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    db.getCourses(params.tenant).then(list => {
      const openCourses = list.filter(c => c.isRegistrationOpen !== false);
      setCourses(openCourses);
      if (openCourses.length > 0) {
        setSelectedCourseId(openCourses[0].id);
      }
      setLoadingCourses(false);
    }).catch(err => {
      console.error(err);
      setLoadingCourses(false);
    });
  }, [params.tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    const nameWords = fullName.trim().split(/\s+/);
    if (nameWords.length < 4) {
      setErrorMsg("⚠️ يرجى إدخال اسمك رباعياً بالكامل.");
      return;
    }

    if (phone.length < 10 || !/^\d+$/.test(phone)) {
      setErrorMsg("⚠️ رقم هاتف الواتساب غير صحيح.");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all students and applications to verify uniqueness
      const [existingStudents, existingApps] = await Promise.all([
        db.getStudents(params.tenant),
        db.getApplications(params.tenant)
      ]);

      // Check duplicate phone
      const phoneExists = existingStudents.some(s => s.phone === phone) ||
                          existingApps.some(a => a.phone === phone && a.status !== "rejected");
      if (phoneExists) {
        setErrorMsg("⚠️ رقم الهاتف هذا مسجل بالفعل كطالب أو لديه طلب اشتراك. يرجى تسجيل الدخول مباشرة برقم هاتفك من الصفحة الرئيسية.");
        setIsLoading(false);
        return;
      }

      // Add application with empty/null nationalId and photoUrl (to be filled on course entry)
      await db.addApplication(params.tenant, {
        fullName,
        nationalId: "",
        phone,
        courseId: selectedCourseId,
        photoUrl: ""
      });
      setIsLoading(false);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMsg(`⚠️ فشل إرسال الطلب: ${err.message || err}`);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center" dir="rtl">
        <div className="bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl max-w-lg w-full flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-green-50 dark:bg-slate-900 text-green-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle2 size={44} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">🎉 تم تسجيل طلبك بنجاح!</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            أهلاً بك يا <strong>{fullName}</strong>. تم استلام طلب الالتحاق بالدورة التعليمية وهو قيد المراجعة والقبول من قبل إدارة المركز حالياً.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 p-4 rounded-2xl text-sm font-bold w-full text-right leading-relaxed border border-blue-100">
            💡 <strong>ماذا سيحدث بعد الموافقة؟</strong>
            <ul className="list-disc list-inside mt-2 space-y-1.5 font-medium">
              <li>سيتم تحويلك فوراً وإشعارك على رقم الواتساب الخاص بك: {phone}.</li>
              <li>ستتلقى رسالة تفيد بقبولك لتتمكن من تسجيل الدخول برقم موبايلك فقط.</li>
              <li>ستحصل على رقم كشف الدورة ورابط جروب المتدربين للمتابعة اليومية.</li>
            </ul>
          </div>

          <button
            onClick={() => router.push(`/${params.tenant}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg transition-all"
          >
            الانتقال لصفحة دخول الطلاب
          </button>
        </div>
      </div>
    );
  }

  if (loadingCourses) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]" dir="rtl">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" dir="rtl">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-slate-900 text-amber-500 rounded-full flex items-center justify-center shadow-inner">
            <ClipboardList size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">التسجيل مغلق حالياً</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
            عذراً، لا توجد دورات تدريبية متاحة للتسجيل أو الاشتراك في الوقت الحالي. يرجى مراجعة إدارة المركز للمزيد من التفاصيل.
          </p>
          <button
            onClick={() => router.push(`/${params.tenant}`)}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl shadow-md transition-all text-sm"
          >
            العودة للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const isFree = Number(selectedCourse?.price) === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-right" dir="rtl">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 flex justify-center items-center gap-2">
          <Sparkles className="text-blue-600" size={28} /> طلب التحاق بدورة تدريبية
        </h1>
        <p className="text-slate-500 font-medium">املأ بياناتك بدقة للتسجيل في كورس وتفعيل حسابك تلقائياً بعد موافقة الإدارة.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> الاسم رباعياً بالكامل:
            </label>
            <input
              type="text"
              required
              placeholder="مثال: أحمد محمد محمود علي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Course selector */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-500" /> اختر الدورة التي تود دراستها:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedCourseId(nextId);
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} - ({c.price} {c.currency || 'ج.م'})
                </option>
              ))}
            </select>

            {/* Premium Course Preview Display */}
            {selectedCourseId && courses.find(c => c.id === selectedCourseId) && (() => {
              const selectedCourse = courses.find(c => c.id === selectedCourseId)!;
              return (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden relative bg-gradient-to-br from-blue-400 to-indigo-600 flex-shrink-0 flex items-center justify-center text-white bg-slate-950">
                    {selectedCourse.coverImage ? (
                      <img 
                        src={selectedCourse.coverImage} 
                        alt={selectedCourse.title} 
                        className={`w-full h-full ${
                          selectedCourse.imageFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`} 
                      />
                    ) : (
                      <ClipboardList size={28} className="opacity-80" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-right">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">{selectedCourse.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedCourse.description}</p>
                    <div className="mt-2 flex gap-3 text-[10px] font-bold text-slate-400 justify-center sm:justify-start">
                      <span>📚 المحاضرات: {selectedCourse.lecturesCount} محاضرات</span>
                      <span>•</span>
                      <span className="text-green-600 font-extrabold">{selectedCourse.price} {selectedCourse.currency || 'ج.م'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* WhatsApp Mobile */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-blue-500" /> رقم الموبايل (المرتبط بالواتساب):
            </label>
            <input
              type="text"
              required
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-left"
              dir="ltr"
            />
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/10 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
          >
            {isLoading ? "جاري تسجيل طلبك..." : "إرسال طلب الالتحاق بالدورة 🚀"}
          </button>

        </form>
      </div>
    </div>
  );
}
