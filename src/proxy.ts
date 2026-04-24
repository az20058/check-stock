import { NextResponse, type NextRequest } from "next/server";

const REALM = "check-stock admin";

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

export function proxy(req: NextRequest): NextResponse | undefined {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("ADMIN_PASSWORD not configured", { status: 503 });
  }
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  const [, provided] = decoded.split(":");
  if (provided !== password) return unauthorized();
  return undefined;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
