import React from "react";
import FlashcardGame from "@/components/FlashcardGame";

export default function TenantFlashcardsPage({
  params,
}: {
  params: { tenant: string };
}) {
  // Mock data - In reality, fetch from Supabase based on the selected Deck/Course
  const mockCards = [
    { id: 1, question: "ما هو الـ HTML؟", answer: "لغة ترميز النص التشعبي المستخدمة في بناء هيكل صفحات الويب." },
    { id: 2, question: "ما وظيفة CSS؟", answer: "تُستخدم لتنسيق وتصميم صفحات الويب (الألوان، الخطوط، التخطيط)." },
    { id: 3, question: "ما هو Next.js؟", answer: "إطار عمل مبني على React يتيح الـ Server-Side Rendering وبناء تطبيقات كاملة." },
  ];

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          لعبة البطاقات التفاعلية (Flashcards)
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          اختبر معلوماتك من خلال هذه البطاقات. اضغط على البطاقة لمعرفة الإجابة الصحيحة ثم قيم إجابتك.
        </p>
      </div>

      <FlashcardGame initialCards={mockCards} />
    </div>
  );
}
