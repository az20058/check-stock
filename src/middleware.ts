import { NextResponse, type NextRequest } from "next/server";

const REALM = "check-stock admin";

// Edge Runtime 호환: Node 'crypto' 의존성 제거.
// 길이 다르면 fast-fail (길이 자체는 노출돼도 무방), 그 외엔 모든 바이트를 XOR로 누적.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
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
