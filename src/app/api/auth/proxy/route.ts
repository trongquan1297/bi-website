import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Gọi API đăng nhập của backend
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    // Lấy dữ liệu từ response
    const data = await response.json()

    // Tạo response mới
    const nextResponse = NextResponse.json(data, { status: response.status })

    // Lấy Set-Cookie header từ response gốc và thêm vào response mới
    const setCookieHeader = response.headers.get("set-cookie")
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader)
    }

    return nextResponse
  } catch (error) {
    console.error("Auth proxy error:", error)
    return NextResponse.json(
      {
        error: "Lỗi khi xử lý yêu cầu đăng nhập",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
