import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Gọi API backend để xác thực SSO
    const response = await fetch(`${API_BASE_URL}/api/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    // Kiểm tra nếu response không phải là JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API không trả về JSON:", await response.text())
      return NextResponse.json({ message: "Máy chủ trả về định dạng không hợp lệ" }, { status: 500 })
    }

    // Lấy dữ liệu từ response
    const data = await response.json()

    // Nếu có avatar_url trong response, thêm vào token payload
    if (data.access_token && data.user_info && data.user_info.avatar_url) {
        // Giải mã token để thêm thông tin avatar
        try {
          const base64Url = data.access_token.split(".")[1]
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
          const payload = JSON.parse(window.atob(base64))
  
          // Thêm avatar_url vào payload
          payload.avatar_url = data.user_info.avatar_url
  
          // Không thể sửa token từ backend, nhưng có thể lưu thông tin này vào response
          data.user_avatar = data.user_info.avatar_url
        } catch (error) {
          console.error("Lỗi khi xử lý token để thêm avatar:", error)
        }
      }

    // Trả về response từ API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("SSO callback proxy error:", error)
    return NextResponse.json({ message: "Không thể kết nối đến máy chủ xác thực" }, { status: 500 })
  }
}
