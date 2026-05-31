import React from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center font-mono text-sm lg:flex text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          مرحباً بك في نظام إدارة المراكز التعليمية (SaaS)
        </h1>
      </div>
      
      <div className="mt-8 flex gap-4">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-2">النطاقات الفرعية</h2>
          <p className="text-slate-500 dark:text-slate-400">كل مركز له الدومين الخاص به</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold mb-2">لعبة البطاقات (Flashcards)</h2>
          <p className="text-slate-500 dark:text-slate-400">تدريب تفاعلي للطلاب</p>
        </div>
      </div>
    </main>
  );
}
