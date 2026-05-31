import React from "react";
import { notFound } from "next/navigation";

export default function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenant: string };
}) {
  // In a real app, you would fetch the tenant details from Supabase here
  // If tenant does not exist, return notFound();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      {/* Dynamic Header for the Tenant */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
              {params.tenant.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              مركز {params.tenant}
            </h1>
          </div>
          <nav>
            <button className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 transition-colors">
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
