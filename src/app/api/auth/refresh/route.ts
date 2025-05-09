import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    console.log("Refresh token API called")

    // Lấy refresh_token từ cookie
    const refreshToken = request.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      console.log("No refresh token found in cookies")
      return NextResponse.json({ error: "Không tìm thấy refresh token" }, { status: 401 })
    }

    console.log("Calling backend refresh endpoint")

    // Gọi API refresh token của backend
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
    })

    if (!response.ok) {
      console.log("Backend refresh failed with status:", response.status)
      return NextResponse.json({ error: "Không thể làm mới token" }, { status: response.status })
    }

    // Lấy dữ liệu từ response
    const data = await response.json()
    console.log("Refresh successful, got new tokens")

    // Tạo response mới
    const nextResponse = NextResponse.json({ success: true })

    // Lấy Set-Cookie header từ response gốc và thêm vào response mới
    const setCookieHeader = response.headers.get("set-cookie")
    if (setCookieHeader) {
      console.log("Setting cookies from backend response")
      nextResponse.headers.set("set-cookie", setCookieHeader)
    }

    return nextResponse
  } catch (error) {
    console.error("Error in refresh token API:", error)
    return NextResponse.json({ error: "Lỗi khi làm mới token" }, { status: 500 })
  }
}
