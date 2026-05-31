"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Institution } from "@/lib/db";

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);

  useEffect(() => {
    const list = db.getInstitutions();
    const current = list.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());
    if (current) {
      setInstitution(current);
    }
  }, [params.tenant]);

  // Handle student logout
  const handleLogout = () => {
    localStorage.removeItem(`loggedin_student_${params.tenant}`);
    router.push(`/${params.tenant}`);
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* Dynamic Header for the Tenant */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {institution?.logoUrl ? (
              <img src={institution.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-slate-50 border p-0.5" />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                {(institution?.name || params.tenant).charAt(0).toUpperCase()}
              </div>
            )}
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white">
              {institution?.name || `مركز ${params.tenant}`}
            </h1>
          </div>
          <nav className="flex items-center gap-4">
            <button 
              onClick={() => router.push(`/${params.tenant}`)}
              className="text-sm font-bold text-slate-650 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors"
            >
              الرئيسية
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
