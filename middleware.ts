import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/auth/callback",
  "/_next",
  "/favicon.ico",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))

  // Allow access to public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for authorization code in URL (for OAuth flows)
  const hasAuthCode = request.nextUrl.searchParams.has("authorization_code")
  if (hasAuthCode) {
    return NextResponse.next()
  }

  // Get access token from cookies
  const accessToken = request.cookies.get("access_token")?.value

  // If we have a valid access token, allow the request
  if (accessToken) {
    return NextResponse.next()
  }

  // If no access token, redirect to login page
  // We'll let the client-side handle token refresh
  const loginUrl = new URL("/login", request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
