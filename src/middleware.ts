import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";

const REALM = "check-stock admin";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export function middleware(req: NextRequest): NextResponse | undefined {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("Server configuration error", { status: 503 });
  }
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  const colonIdx = decoded.indexOf(":");
  if (colonIdx === -1) return unauthorized();
  const provided = decoded.slice(colonIdx + 1);
  if (!safeEqual(provided, password)) return unauthorized();
  return undefined;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
