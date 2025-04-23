import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Lấy cấu hình từ biến môi trường
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth", "/auth/callback"]

export function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const token = request.cookies.get("auth-token")?.value

  // Kiểm tra xem route hiện tại có phải là route công khai không
  const isPublicRoute = PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))

  // Kiểm tra xem URL có chứa authorization_code không (cho phép truy cập trang chủ với authorization_code)
  const hasAuthCode = request.nextUrl.searchParams.has("authorization_code")

  // Nếu đang truy cập route công khai hoặc có authorization_code, cho phép truy cập
  if (isPublicRoute || hasAuthCode) {
    return NextResponse.next()
  }

  // Nếu không có token và đang truy cập route cần xác thực, chuyển hướng đến trang đăng nhập
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Nếu có token, cho phép truy cập
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
