import React from "react";
import Certificate from "@/components/Certificate";

export default function TenantCertificatePage({
  params,
  searchParams,
}: {
  params: { tenant: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const studentName = (searchParams.name as string) || "أحمد محمد محمود";
  const courseName = (searchParams.course as string) || "برمجة تطبيقات الويب باستخدام React & Next.js";
  const dateStr = (searchParams.date as string) || new Date().toLocaleDateString('ar-EG');

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          شهادتك المعتمدة
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          تهانينا على إتمام الدورة! يمكنك الآن استعراض وتحميل شهادتك بالأسفل.
        </p>
      </div>

      <Certificate 
        studentName={studentName}
        courseName={courseName}
        centerName={params.tenant}
        date={dateStr}
      />
    </div>
  );
}
