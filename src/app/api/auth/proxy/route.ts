import { type NextRequest, NextResponse } from "next/server"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"
const API_AUTH_ENDPOINT = process.env.API_AUTH_ENDPOINT || "/api/auth/login"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log(`Gửi request đến ${API_BASE_URL}${API_AUTH_ENDPOINT}`)

    // Gửi request đến API thực tế
    const response = await fetch(`${API_BASE_URL}${API_AUTH_ENDPOINT}`, {
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
    // console.log("API response:", data)

    // Chuyển đổi định dạng response để phù hợp với code client
    // Nếu API trả về access_token thay vì token
    if (response.ok && data.access_token) {
      // Tạo một object mới với cấu trúc mà client mong đợi
      const transformedData = {
        token: data.access_token,
        token_type: data.token_type,
        // Sao chép các trường khác nếu cần
        ...Object.fromEntries(Object.entries(data).filter(([key]) => !["access_token", "token_type"].includes(key))),
      }
      return NextResponse.json(transformedData, { status: response.status })
    }

    // Nếu không có access_token, kiểm tra xem có token không
    if (response.ok && !data.access_token && !data.token) {
      console.error("API trả về thành công nhưng không có token:", data)
      return NextResponse.json({ message: "Máy chủ không trả về token xác thực" }, { status: 500 })
    }

    // Trả về response từ API
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ message: "Không thể kết nối đến máy chủ xác thực" }, { status: 500 })
  }
}
