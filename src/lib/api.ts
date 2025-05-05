const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

/**
 * Hàm tiện ích để gọi API với token xác thực
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include", // Quan trọng để gửi cookie
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  try {
    let response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions)

    // Xử lý lỗi 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
    if (response.status === 401) {
      // Thử refresh token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (refreshResponse.ok) {
        // Nếu refresh thành công, thử lại request ban đầu
        response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions)
      } else {
        // Nếu refresh thất bại và đang ở client-side, chuyển hướng đến trang đăng nhập
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Phiên đăng nhập đã hết hạn")
      }
    }

    return response
  } catch (error) {
    console.error("API call error:", error)
    throw error
  }
}
