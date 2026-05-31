"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db, Institution } from "@/lib/db";
import { School, PlusCircle, Globe, ExternalLink, ShieldCheck, Landmark, Sparkles, CheckCircle2, Lock, User, LogOut } from "lucide-react";

export default function SuperAdminPortal() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  // Super Admin login states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [superEmail, setSuperEmail] = useState("");
  const [superPassword, setSuperPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Create Center states
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdTenantLinks, setCreatedTenantLinks] = useState<{
    admin: string;
    student: string;
    register: string;
    name: string;
    adminEmail: string;
    adminPassword: string;
  } | null>(null);

  useEffect(() => {
    setInstitutions(db.getInstitutions());
    if (typeof window !== "undefined") {
      const logged = sessionStorage.getItem("superadmin_logged");
      if (logged === "true") {
        setIsLoggedIn(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (superEmail.trim().toLowerCase() === "superadmin@crosses.com" && superPassword === "superadmin123") {
      setIsLoggedIn(true);
      sessionStorage.setItem("superadmin_logged", "true");
    } else {
      setLoginError("⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة!");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("superadmin_logged");
    setIsLoggedIn(false);
    setSuperEmail("");
    setSuperPassword("");
  };

  const handleCreateCenter = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    setCreatedTenantLinks(null);

    if (!name.trim() || !subdomain.trim()) {
      setErrorMsg("⚠️ يرجى إدخال اسم المركز والرابط الفرعي.");
      return;
    }

    // Subdomain alphanumeric check
    const cleanSubdomain = subdomain.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(cleanSubdomain)) {
      setErrorMsg("⚠️ الرابط الفرعي يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام وعلامة - فقط وبدون مسافات.");
      return;
    }

    // Check uniqueness
    const all = db.getInstitutions();
    const exists = all.find(inst => inst.subdomain === cleanSubdomain);
    if (exists) {
      setErrorMsg("⚠️ هذا الرابط الفرعي مستخدم بالفعل لمركز آخر. يرجى اختيار اسم آخر.");
      return;
    }

    // Create Institution with custom/default admin credentials
    const finalAdminEmail = adminEmail.trim() || `admin@${cleanSubdomain}.com`;
    const finalAdminPass = adminPassword.trim() || `admin_${cleanSubdomain}`;
    const newInst = db.addInstitution(name, cleanSubdomain, logoUrl, finalAdminEmail, finalAdminPass);
    setInstitutions([...all, newInst]);
    
    // Clear Form
    setName("");
    setSubdomain("");
    setLogoUrl("");
    setAdminEmail("");
    setAdminPassword("");

    // Generate dynamic links for preview
    const rootUrl = typeof window !== "undefined" ? window.location.origin : "https://crosses-one.vercel.app";
    const links = {
      admin: `${rootUrl}/${cleanSubdomain}/admin`,
      student: `${rootUrl}/${cleanSubdomain}`,
      register: `${rootUrl}/${cleanSubdomain}/register`,
      name: newInst.name,
      adminEmail: finalAdminEmail,
      adminPassword: finalAdminPass
    };
    
    setCreatedTenantLinks(links);
    setSuccessMsg(`🎉 تم إنشاء وتأسيس مركز "${newInst.name}" بنجاح!`);
  };

  // 1. Render Login Screen if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-right" dir="rtl">
        <div className="bg-slate-800 border border-slate-700/60 p-8 sm:p-10 rounded-3xl w-full max-w-md shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient-glow pointer-events-none opacity-20" />
          
          <div className="text-center z-10 relative">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20 shadow-inner">
              <ShieldCheck size={38} />
            </div>
            <h1 className="text-2xl font-extrabold text-white">لوحة الإشراف العليا</h1>
            <p className="text-xs text-slate-400 mt-2 font-bold">بوابة تسجيل الدخول لمالك منصة SaaS التعليمية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 z-10 relative">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">البريد الإلكتروني للادمن العام:</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="superadmin@crosses.com"
                  value={superEmail}
                  onChange={(e) => setSuperEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-semibold"
                  dir="ltr"
                />
                <User className="absolute right-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">كلمة المرور:</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={superPassword}
                  onChange={(e) => setSuperPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-semibold"
                  dir="ltr"
                />
                <Lock className="absolute right-3.5 top-3.5 text-slate-500" size={16} />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-bold">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/10 transition-all flex items-center justify-center gap-2 mt-2"
            >
              تسجيل الدخول للوحة العليا
            </button>
          </form>

          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 text-[10px] text-slate-400 space-y-1 font-semibold leading-relaxed">
            <p className="text-center font-bold text-blue-400 mb-1 text-xs">⚠️ بيانات الدخول التجريبية الافتراضية:</p>
            <p className="flex justify-between" dir="ltr">
              <span>superadmin@crosses.com</span>
              <span className="text-slate-500">Email:</span>
            </p>
            <p className="flex justify-between" dir="ltr">
              <span>superadmin123</span>
              <span className="text-slate-500">Password:</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Super Admin Dashboard if logged in
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-right p-6 sm:p-12" dir="rtl">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={32} /> لوحة الإشراف العليا (SaaS Super Admin)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">لوحة تحكم مالك المنصة لإنشاء وإدارة المراكز التعليمية وتوليد روابطهم الفورية.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/")}
            className="bg-white border text-slate-700 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            العودة للرئيسية
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <LogOut size={14} /> تسجيل الخروج
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Registered Institutions list (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <Landmark size={24} className="text-blue-600" /> المراكز والمدارس النشطة بالمنصة ({institutions.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {institutions.map((inst) => (
              <div
                key={inst.id}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-xl shadow-inner">
                      {inst.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-white text-lg">{inst.name}</h4>
                      <p className="text-xs text-slate-400 font-bold mt-1">تاريخ الإنشاء: {new Date(inst.createdAt).toLocaleDateString("ar-EG")}</p>
                    </div>
                  </div>
                  
                  {/* Domain path info */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2 font-medium">
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400">النطاق الفرعي:</span>
                      <span className="font-bold text-blue-600 select-all" dir="ltr">{inst.subdomain}.localhost</span>
                    </p>
                    <p className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>إيميل الأدمن:</span>
                      <span className="select-all font-mono" dir="ltr">{inst.adminEmail || `admin@${inst.subdomain}.com`}</span>
                    </p>
                    <p className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>باسورد الأدمن:</span>
                      <span className="select-all font-mono" dir="ltr">{inst.adminPassword || `admin_${inst.subdomain}`}</span>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400">رابط بوابة الطالب:</span>
                      <a href={`/${inst.subdomain}`} target="_blank" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        /{inst.subdomain} <ExternalLink size={10} />
                      </a>
                    </p>
                    <p className="flex justify-between items-center">
                      <span className="text-slate-400">لوحة تحكم الأدمن:</span>
                      <a href={`/${inst.subdomain}/admin`} target="_blank" className="font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                        /{inst.subdomain}/admin <ExternalLink size={10} />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Create New Center Form (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <PlusCircle className="text-blue-600" size={22} /> إنشاء مركز تعليمي جديد
            </h3>
            
            <form onSubmit={handleCreateCenter} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المركز التعليمي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مركز النخبة التعليمي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرابط الفرعي (Subdomain):</label>
                <span className="text-[10px] text-slate-400 block mb-2 font-medium">سيكون رابط الدخول للمركز بناءً على هذه الكلمة.</span>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="example-center"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                    className="w-full pl-28 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left font-bold"
                    dir="ltr"
                  />
                  <div className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold" dir="ltr">
                    .vercel.app
                  </div>
                </div>
              </div>

              {/* Admin customization credentials */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2 space-y-3">
                <span className="block text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-1">⚙️ تخصيص حساب الأدمن للمركز (اختياري):</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">البريد الإلكتروني للأدمن:</label>
                  <input
                    type="email"
                    placeholder="سيتم إنشاؤه افتراضياً لو ترك فارغاً"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-left font-bold text-xs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">كلمة مرور الأدمن:</label>
                  <input
                    type="text"
                    placeholder="سيتم إنشاؤه افتراضياً لو ترك فارغاً"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-left font-bold text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <PlusCircle size={16} /> تأسيس المركز وتفعيل الكورسات
              </button>
            </form>
          </div>

          {/* Success Dialog & Action Links */}
          {createdTenantLinks && (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl text-emerald-800 space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg">
                <CheckCircle2 size={22} className="text-emerald-600 animate-bounce" />
                <span>{successMsg}</span>
              </div>
              <p className="text-xs font-medium leading-relaxed text-emerald-700">
                تم تهيئة قاعدة البيانات المحلية للمركز وتفعيل الكورسات الافتراضية بنجاح! حساب أدمن هذا المركز جاهز:
              </p>

              <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs font-mono space-y-1 text-slate-800">
                <p className="flex justify-between">
                  <span>{createdTenantLinks.adminEmail}</span>
                  <span className="text-slate-400 font-bold">Email:</span>
                </p>
                <p className="flex justify-between">
                  <span>{createdTenantLinks.adminPassword}</span>
                  <span className="text-slate-400 font-bold">Password:</span>
                </p>
              </div>
              
              <div className="space-y-2 text-xs font-bold text-slate-800">
                <p className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span>لوحة أدمن المركز:</span>
                  <a href={createdTenantLinks.admin} target="_blank" className="text-blue-600 hover:underline flex items-center gap-0.5">
                    دخول للأدمن <ExternalLink size={10} />
                  </a>
                </p>
                <p className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span>بوابة تسجيل الطلاب:</span>
                  <a href={createdTenantLinks.register} target="_blank" className="text-blue-600 hover:underline flex items-center gap-0.5">
                    صفحة التسجيل <ExternalLink size={10} />
                  </a>
                </p>
                <p className="bg-white p-3 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span>بوابة دخول الطلاب:</span>
                  <a href={createdTenantLinks.student} target="_blank" className="text-blue-600 hover:underline flex items-center gap-0.5">
                    بوابة الطلاب <ExternalLink size={10} />
                  </a>
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

