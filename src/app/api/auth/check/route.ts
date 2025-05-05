import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  try {
    // Lấy access_token từ cookie
    const accessToken = request.cookies.get("access_token")?.value

    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Gọi một API bất kỳ để kiểm tra tính hợp lệ của token
    const response = await fetch(`${API_BASE_URL}/api/datasets/get`, {
      method: "GET",
      headers: {
        Cookie: `access_token=${accessToken}`,
      },
    })

    if (!response.ok) {
      // Nếu token không hợp lệ, thử refresh token
      if (response.status === 401) {
        const refreshToken = request.cookies.get("refresh_token")?.value

        if (refreshToken) {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
              Cookie: `refresh_token=${refreshToken}`,
            },
          })

          if (refreshResponse.ok) {
            // Nếu refresh thành công, trả về thành công và thêm Set-Cookie header
            const nextResponse = NextResponse.json({ authenticated: true })

            const setCookieHeader = refreshResponse.headers.get("set-cookie")
            if (setCookieHeader) {
              nextResponse.headers.set("set-cookie", setCookieHeader)
            }

            return nextResponse
          }
        }
      }

      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Lỗi khi kiểm tra xác thực" }, { status: 500 })
  }
}
