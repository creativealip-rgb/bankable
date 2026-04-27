import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Define protected and public routes
  const isProtectedPage = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/profile") || 
    pathname.startsWith("/my-courses") ||
    pathname.startsWith("/billing");
    
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");

  // Get session from Better Auth (using cookie for efficiency)
  const sessionCookie = request.cookies.get("better-auth.session_token");

  // 1. If trying to access protected page without session, redirect to login
  if (isProtectedPage && !sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 2. If trying to access auth pages with session, redirect to dashboard
  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. For admin pages, we need to verify the role. 
  // Since we can't easily verify the full session in middleware without a DB call (which slows things down), 
  // we can either allow it and let the layout handle the refined check, 
  // or do an API call if really necessary. 
  // Recommending: let AdminLayout handle the refined role check for now to avoid latency.

  return NextResponse.next();
}

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
