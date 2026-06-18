"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Institution } from "@/lib/db";
import { Sun, Moon } from "lucide-react";

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load configuration and dark mode on mount
  useEffect(() => {
    db.getInstitutions().then(list => {
      const current = list.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());
      if (current) {
        setInstitution(current);
      }
    }).catch(console.error);

    // Dark mode check
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("theme") === "dark";
    if (isDark) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, [params.tenant]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // Handle student logout
  const handleLogout = () => {
    localStorage.removeItem(`loggedin_student_${params.tenant}`);
    router.push(`/${params.tenant}`);
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300" dir="rtl">
      {/* Dynamic Header for the Tenant */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            {institution?.logoUrl ? (
              <img src={institution.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border p-0.5" />
            ) : (
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl">
                {(institution?.name || params.tenant).charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white text-center sm:text-right">
              {institution?.name || `مركز ${params.tenant}`}
            </h1>
          </div>
          <nav className="flex items-center gap-6">
            <button 
              onClick={() => router.push(`/${params.tenant}`)}
              className="text-sm font-bold text-slate-650 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              الرئيسية
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-650 dark:text-slate-200 transition-all flex items-center justify-center shadow-inner"
              title="تغيير المظهر"
            >
              {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-red-500 hover:text-red-650 transition-colors"
            >
              تسجيل الخروج
            </button>
          </nav>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-[fadeIn_0.4s_ease-out]">
        {children}
      </main>
    </div>
  );
}
