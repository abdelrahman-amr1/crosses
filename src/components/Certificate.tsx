"use client";

import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface CertificateProps {
  studentName: string;
  courseName: string;
  centerName: string;
  date: string;
}

export default function Certificate({
  studentName,
  courseName,
  centerName,
  date,
}: CertificateProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("certificate-container");
      if (!element) return;

      // Capture the element as a canvas
      const canvas = await html2canvas(element, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      // Create PDF (A4 Landscape)
      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`شهادة-${studentName.replace(/\s+/g, "-")}.pdf`);
    } catch (error) {
      alert("حدث خطأ أثناء إنشاء ملف الـ PDF. تأكد من تثبيت الحزم المطلوبة.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        id="certificate-container"
        className="relative w-full max-w-4xl aspect-[1.414/1] bg-white border-[16px] border-double border-blue-900 p-12 text-center shadow-2xl flex flex-col justify-center items-center font-serif text-slate-800"
      >
        {/* Background Pattern or Logo Watermark can go here */}
        
        <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-2 uppercase tracking-widest">
          شهادة إتمام
        </h1>
        <p className="text-xl md:text-2xl text-blue-600 mb-12 font-medium">
          مُقدمة بكل فخر من مركز {centerName}
        </p>

        <p className="text-lg md:text-xl text-slate-600 mb-4">تشهد إدارة المركز بأن المتدرب(ة)</p>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 border-b-2 border-slate-300 pb-2 px-12 inline-block">
          {studentName}
        </h2>

        <p className="text-lg md:text-xl text-slate-600 mb-4">قد أتم(ت) بنجاح متطلبات اجتياز دورة</p>
        <h3 className="text-3xl md:text-4xl font-bold text-blue-800 mb-16">
          {courseName}
        </h3>

        <div className="w-full flex justify-between items-end px-12 mt-auto">
          <div className="text-center">
            <p className="text-lg font-bold border-t-2 border-slate-400 pt-2 w-32">التاريخ</p>
            <p className="mt-2 text-slate-600">{date}</p>
          </div>
          
          {/* Logo Placeholder */}
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-900">
            <span className="text-blue-900 font-bold text-xl">{centerName.charAt(0)}</span>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold border-t-2 border-slate-400 pt-2 w-32">توقيع المدير</p>
            <p className="mt-2 font-signature text-blue-800 text-2xl">Manager Sign</p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        className="mt-8 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50"
      >
        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
        {isGenerating ? "جاري تحضير الشهادة..." : "تحميل الشهادة (PDF)"}
      </button>
    </div>
  );
}
