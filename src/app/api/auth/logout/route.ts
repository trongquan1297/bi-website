import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    // Lấy access_token từ cookie
    const accessToken = request.cookies.get("access_token")?.value

    // Gọi API logout của backend
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `access_token=${accessToken}` } : {}),
      },
    })

    // Tạo response mới
    const nextResponse = NextResponse.json({ success: true }, { status: response.ok ? 200 : response.status })

    // Xóa cookie ở phía client
    nextResponse.cookies.delete("access_token")
    nextResponse.cookies.delete("refresh_token")

    return nextResponse
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Lỗi khi đăng xuất" }, { status: 500 })
  }
}
