import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");

  if (!tenant) {
    return new NextResponse("Tenant parameter is required", { status: 400 });
  }

  try {
    const insts = await db.getInstitutions();
    const inst = insts.find(i => i.subdomain.toLowerCase() === tenant.toLowerCase());

    if (!inst || !inst.logoUrl) {
      return new NextResponse("Logo not found", { status: 404 });
    }

    // Parse Base64 image data: e.g. "data:image/png;base64,iVBORw0KGgoAAA..."
    const match = inst.logoUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return new NextResponse("Invalid image data format", { status: 500 });
    }

    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400", // cache for 24 hours
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error: ${error.message || error}`, { status: 500 });
  }
}
