import React from "react";
import Certificate from "@/components/Certificate";

export default function TenantCertificatePage({
  params,
}: {
  params: { tenant: string };
}) {
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
        studentName="أحمد محمد محمود"
        courseName="برمجة تطبيقات الويب باستخدام React & Next.js"
        centerName={params.tenant}
        date={new Date().toLocaleDateString('ar-EG')}
      />
    </div>
  );
}
