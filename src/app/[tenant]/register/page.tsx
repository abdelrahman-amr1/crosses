import RegisterClient from "./RegisterClient";
import { db } from "@/lib/db";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  let currentInstitutionName = `مركز ${params.tenant}`;
  let imageUrl = "";

  try {
    const insts = await db.getInstitutions();
    const current = insts.find(i => i.subdomain.toLowerCase() === params.tenant.toLowerCase());

    if (current) {
      currentInstitutionName = current.name;
      if (current.logoUrl) {
        // Construct absolute URL for the Open Graph image
        const rootUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : "https://crosses-one.vercel.app";
        imageUrl = `${rootUrl}/api/institution/logo?tenant=${current.subdomain}`;
      }
    }
  } catch (error) {
    console.error("Failed to generate metadata:", error);
  }

  const title = `تسجيل طالب جديد - ${currentInstitutionName}`;
  const description = `طلب التحاق بالدورات التدريبية لـ ${currentInstitutionName}. سجل بياناتك الآن لتفعيل حسابك ومتابعة محاضراتك.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: imageUrl ? [{ url: imageUrl, width: 250, height: 250, alt: title }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    }
  };
}

export default function Page({ params }: { params: { tenant: string } }) {
  return <RegisterClient params={params} />;
}
