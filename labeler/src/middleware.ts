import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const isLocalhost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1");

  if (!isLocalhost) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/label", "/label/gallery"],
};
