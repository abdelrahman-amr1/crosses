import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match ALL request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};

// In-memory sliding window rate limiter for Edge Middleware
const ipRateMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 60;
const WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);

  // Prevent memory growth by clearing if map grows too large
  if (ipRateMap.size > 5000) {
    ipRateMap.clear();
  }

  if (!record || now > record.resetTime) {
    ipRateMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_PER_MINUTE;
}

// Bad bot / aggressive scraper user-agents to block at Edge
const BLOCKED_BOT_REGEX = /(baiduspider|gptbot|chatgpt-user|ccbot|bytespider|anthropic-ai|claude-web|perplexitybot|scrapy|ahrefsbot|semrushbot)/i;

// Probing paths to reject immediately with lightweight response (no origin render)
const PROBED_INVALID_PATHS = ["/blog", "/api/blog", "/api/generate", "/api/demo"];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const userAgent = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";

  // 1. Block malicious or aggressive bots immediately
  if (BLOCKED_BOT_REGEX.test(userAgent)) {
    return new NextResponse("Access Denied for Bot Crawler", { status: 403 });
  }

  // 2. Reject probing fake routes (like /blog/1, /api/generate, /api/demo, /api/blog) instantly at Edge
  if (PROBED_INVALID_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  // 3. Enforce Rate Limiting (60 requests/minute per IP)
  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 4. Domain & Subdomain Tenant Routing logic
  const host = req.headers.get("host") || "";
  const searchParams = url.searchParams.toString();
  const path = `${pathname}${searchParams.length > 0 ? `?${searchParams}` : ""}`;

  const isVercelDefault = host.includes("vercel.app");
  const isRootLocalhost = host === "localhost:3000";
  
  if (isVercelDefault || isRootLocalhost) {
    if (path === "/" || path === "") {
      return NextResponse.rewrite(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  let hostname = host.replace(".localhost:3000", `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  if (
    hostname.includes("---") &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split("---")[0]}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`;
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
  const subdomain = hostname.replace(`.${rootDomain}`, "");

  if (subdomain === hostname || subdomain === "www") {
    return NextResponse.rewrite(new URL(`/home${path === "/" ? "" : path}`, req.url));
  }

  return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
}

