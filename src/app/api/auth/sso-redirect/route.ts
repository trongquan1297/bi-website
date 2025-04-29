import { NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"

export async function GET() {
  try {
    // Gọi API backend để lấy URL chuyển hướng SSO
    const response = await fetch(`${API_BASE_URL}/api/auth/sso/redirect`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("SSO redirect error:", errorText)
      return NextResponse.json({ message: "Không thể lấy URL chuyển hướng SSO" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("SSO redirect proxy error:", error)
    return NextResponse.json({ message: "Không thể kết nối đến máy chủ xác thực" }, { status: 500 })
  }
}
