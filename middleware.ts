import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") || "";
  
  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // Check if we are running on Vercel's default domain or root localhost without subdomain
  const isVercelDefault = host.includes("vercel.app");
  const isRootLocalhost = host === "localhost:3000";
  
  if (isVercelDefault || isRootLocalhost) {
    // If the path is just root '/', rewrite to the SaaS landing page '/home'
    if (path === "/" || path === "") {
      return NextResponse.rewrite(new URL("/home", req.url));
    }
    
    // If accessing path directly (e.g. /center1 or /center1/admin), pass through to Next.js dynamic routing
    return NextResponse.next();
  }

  // Otherwise, handle subdomain routing (SaaS production mode)
  // e.g. center1.localhost:3000/dashboard -> /[tenant]/dashboard
  // e.g. center1.yoursaas.com/dashboard -> /[tenant]/dashboard
  let hostname = host.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`; // Vercel preview URLs
  }

  // Extract subdomain
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
  const subdomain = hostname.replace(`.${rootDomain}`, "");

  if (subdomain === hostname || subdomain === "www") {
    // No subdomain or www, rewrite to home
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  // Rewrite to the tenant-specific folder
  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}
