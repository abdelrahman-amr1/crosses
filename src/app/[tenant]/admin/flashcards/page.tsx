"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, Save, ArrowRight, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { db, Flashcard } from "@/lib/db";

export default function FlashcardsBuilder({
  params,
}: {
  params: { tenant: string };
}) {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("web-dev");
  const [selectedLecture, setSelectedLecture] = useState(1);

  const generateUUID = () => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  useEffect(() => {
    db.getFlashcards(params.tenant, selectedCourseId, selectedLecture)
      .then(setCards)
      .catch(console.error);
  }, [selectedCourseId, selectedLecture, params.tenant]);

  const addCard = () => {
    const newCard: Flashcard = {
      id: generateUUID(),
      courseId: selectedCourseId,
      lectureNumber: selectedLecture,
      question: "",
      answer: "",
      difficulty: "medium"
    };
    setCards([...cards, newCard]);
  };

  const updateCard = (id: string, field: "question" | "answer", value: string) => {
    setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleSave = async () => {
    const allCards = await db.getFlashcards(params.tenant);
    // Remove old cards of this course & lecture, then insert new ones
    const filtered = allCards.filter(c => !(c.courseId === selectedCourseId && c.lectureNumber === selectedLecture));
    const merged = [...filtered, ...cards.filter(c => c.question && c.answer)];
    
    await db.saveFlashcards(params.tenant, merged);
    alert("✅ تم حفظ بطاقات المحاضرة الحالية بنجاح في قاعدة البيانات!");
  };

  const handleDelete = (id: string) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto text-right py-8" dir="rtl">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/${params.tenant}/admin`)}
          className="inline-flex items-center gap-2 text-sm text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl"
        >
          <ArrowRight size={16} /> العودة للوحة التحكم الرئيسية
        </button>
      </div>

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">صانع الكروت التفاعلية (Flashcards Builder)</h2>
          <p className="text-slate-500">أضف أسئلة وأجوبة للمحاضرات ليتمكن الطلاب من المذاكرة بنظام التكرار المتباعد.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm font-medium"
          >
            <option value="web-dev">دورة تطوير الويب الشامل</option>
            <option value="digital-marketing">دورة التسويق الرقمي</option>
          </select>

          <select 
            value={selectedLecture}
            onChange={(e) => setSelectedLecture(Number(e.target.value))}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm font-medium"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
              <option key={n} value={n}>المحاضرة رقم {n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {cards.map((card, index) => (
          <div key={card.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-sm font-bold text-blue-600">بطاقة رقم {index + 1}</span>
              <button onClick={() => handleDelete(card.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">حذف</button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-2">السؤال</label>
                <textarea 
                  value={card.question}
                  onChange={(e) => updateCard(card.id, "question", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm"
                  placeholder="اكتب السؤال هنا..."
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-2">الإجابة النموذجية</label>
                <textarea 
                  value={card.answer}
                  onChange={(e) => updateCard(card.id, "answer", e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] text-sm"
                  placeholder="اكتب الإجابة هنا..."
                />
              </div>
            </div>
          </div>
        ))}

        {cards.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-bold bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200">
            لا توجد بطاقات مضافة للمحاضرة والمقرر المحددين. اضغط "إضافة بطاقة جديدة" للبدء.
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          onClick={addCard}
          className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-6 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <PlusCircle size={20} /> إضافة بطاقة جديدة
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Save size={20} /> حفظ تعديلات المحاضرة
        </button>
      </div>
    </div>
  );
}
