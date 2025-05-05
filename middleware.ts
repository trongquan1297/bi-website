import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Lấy cấu hình từ biến môi trường
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth", "/auth/callback"]
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export async function middleware(request: NextRequest) {
  // Lấy token từ cookie
  const accessToken = request.cookies.get("access_token")?.value

  // Kiểm tra xem route hiện tại có phải là route công khai không
  const isPublicRoute = PUBLIC_ROUTES.some((route) => request.nextUrl.pathname.startsWith(route))

  // Kiểm tra xem URL có chứa authorization_code không (cho phép truy cập trang chủ với authorization_code)
  const hasAuthCode = request.nextUrl.searchParams.has("authorization_code")

  // Nếu đang truy cập route công khai hoặc có authorization_code, cho phép truy cập
  if (isPublicRoute || hasAuthCode) {
    return NextResponse.next()
  }

  // Nếu không có access_token và đang truy cập route cần xác thực, chuyển hướng đến trang đăng nhập
  if (!accessToken) {
    // Kiểm tra xem có refresh_token không
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (refreshToken) {
      // Nếu có refresh_token, thử refresh token
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            Cookie: `refresh_token=${refreshToken}`,
          },
        })

        if (response.ok) {
          // Nếu refresh thành công, lấy Set-Cookie header từ response
          const setCookieHeader = response.headers.get("set-cookie")

          if (setCookieHeader) {
            // Tạo response mới và thêm Set-Cookie header
            const nextResponse = NextResponse.next()
            nextResponse.headers.set("set-cookie", setCookieHeader)
            return nextResponse
          }
        }
      } catch (error) {
        console.error("Error refreshing token in middleware:", error)
      }
    }

    // Nếu không có refresh_token hoặc refresh thất bại, chuyển hướng đến trang đăng nhập
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Nếu có access_token hợp lệ, cho phép truy cập
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
