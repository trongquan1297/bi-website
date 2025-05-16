import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Gọi API backend để xác thực SSO
    const response = await fetch(`${API_BASE_URL}/api/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    })

    // Kiểm tra nếu response không phải là JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API không trả về JSON:", await response.text())
      return NextResponse.json({ message: "Máy chủ trả về định dạng không hợp lệ" }, { status: 500 })
    }

    // Trả về response thành công và để cookies được chuyển tiếp
    return NextResponse.json(
      { success: true, message: "Authentication successful" },
      {
        status: 200
      },
    )
  } catch (error) {
    console.error("SSO callback proxy error:", error)
    return NextResponse.json({ message: "Không thể kết nối đến máy chủ xác thực" }, { status: 500 })
  }
}
