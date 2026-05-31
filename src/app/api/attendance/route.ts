import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, courseId, centerName } = body;

    // Here we will integrate with Google Sheets API or Make.com Webhook
    // For now, we simulate a successful Google Sheets update
    console.log(`[Google Sheets] Recorded attendance for student ${studentId} in course ${courseId} at center ${centerName}`);

    return NextResponse.json({ success: true, message: "تم تسجيل الحضور في جوجل شيت بنجاح!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تسجيل الحضور" }, { status: 500 });
  }
}
