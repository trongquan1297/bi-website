import { getAuthHeader } from "./auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

/**
 * Hàm tiện ích để gọi API với token xác thực
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const authHeader = getAuthHeader()

  const headers = {
    "Content-Type": "application/json",
    ...(authHeader ? { Authorization: authHeader } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Xử lý lỗi 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
  if (response.status === 401) {
    // Nếu đang ở client-side, chuyển hướng đến trang đăng nhập
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token")
      localStorage.removeItem("token-type")
      window.location.href = "/login"
    }
    throw new Error("Phiên đăng nhập đã hết hạn")
  }

  return response
}
