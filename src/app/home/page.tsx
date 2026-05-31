import React from "react";
import AnimatedCard from "@/components/AnimatedCard";
import { BookOpen, CreditCard, LayoutDashboard, Settings } from "lucide-react";

export default function HomeLanding() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden" dir="rtl">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8">
            منصة <span className="text-blue-600">SaaS</span> التعليمية المتكاملة
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-10">
            أدر مركزك التعليمي، تتبع حضور طلابك، أضف الكورسات وأنشئ الألعاب التفاعلية (Flashcards) في مكان واحد مخصص باسمك.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-blue-500/30">
              تسجيل دخول كمركز
            </button>
            <button className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-full transition-all shadow-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
              بوابة الطلاب
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatedCard 
            title="نطاق مخصص" 
            description="كل مركز يحصل على رابط خاص به مع شعاره وألوانه المميزة."
            icon={<LayoutDashboard />}
          />
          <AnimatedCard 
            title="إدارة الحضور" 
            description="ربط تلقائي مع جداول جوجل (Google Sheets) لتسجيل الحضور."
            icon={<Settings />}
          />
          <AnimatedCard 
            title="ألعاب تفاعلية" 
            description="لعبة البطاقات الذكية (Flashcards) لتدريب الطلاب."
            icon={<BookOpen />}
          />
          <AnimatedCard 
            title="تحصيل يدوي" 
            description="نظام مالي يتناسب مع طريقتك (كاش أو محافظ إلكترونية)."
            icon={<CreditCard />}
          />
        </div>
      </div>
    </main>
  );
}
