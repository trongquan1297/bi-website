"use client"
import { type NextRequest } from "next/server"
import { useRouter } from "next/navigation"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"
export function useAuth() {
  const router = useRouter()

  const login = async (username: string, password: string) => {
    try {
      // Gọi trực tiếp đến API backend để đăng nhập
      // Backend sẽ tự động thiết lập cookie thông qua Set-Cookie header
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Quan trọng để nhận cookie từ response
      })

      // Xử lý lỗi chi tiết
      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, error: "Tên đăng nhập hoặc mật khẩu không đúng" }
        }
        if (response.status === 500) {
          return { success: false, error: "Lỗi máy chủ, vui lòng thử lại sau" }
        }

        // Thử đọc thông báo lỗi từ response
        try {
          const errorData = await response.json()
          return {
            success: false,
            error: errorData.message || `Đăng nhập thất bại (${response.status})`,
          }
        } catch {
          return { success: false, error: `Đăng nhập thất bại (${response.status})` }
        }
      }

      // Lưu thông tin người dùng nếu có
      try {
        const userData = await response.json()
        if (userData.user) {
          // Lưu thông tin người dùng vào localStorage để hiển thị UI
          if (userData.user.avatar_url) {
            localStorage.setItem("user-avatar", userData.user.avatar_url)
          }
          if (userData.user.username) {
            localStorage.setItem("username", userData.user.username)
          }
        }
      } catch (error) {
        console.error("Lỗi khi đọc thông tin người dùng:", error)
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)

      // Kiểm tra lỗi Failed to fetch
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          error:
            "Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra kết nối mạng hoặc máy chủ đã hoạt động chưa.",
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi đăng nhập",
      }
    }
  }

  const logout = async () => {
    try {
      // Gọi API logout để backend xóa cookie
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Quan trọng để gửi cookie
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Xóa thông tin người dùng khỏi localStorage
      localStorage.removeItem("user-avatar")
      localStorage.removeItem("username")

      // Chuyển hướng về trang đăng nhập
      router.push("/login")
    }
  }

  const refreshToken =  async (): Promise<boolean> => {
    try {
      // Gọi API refresh token
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Quan trọng để gửi refresh_token cookie
      })

      return response.ok
    } catch (error) {
      console.error("Refresh token error:", error)
      return false
    }
  }

  const isAuthenticated = async () => {
    try {
      // Gọi một API bất kỳ để kiểm tra tính hợp lệ của token
      const response = await fetch(`${API_BASE_URL}/api/datasets/get`, {
        method: "GET",
        credentials: "include", // Quan trọng để gửi cookie
      })

      if (!response.ok) {
        // Nếu token hết hạn (401), thử refresh token
        if (response.status === 401) {
          const refreshResult = await refreshToken()
          if (refreshResult) {
            // Nếu refresh thành công, kiểm tra lại xác thực
            const retryResponse = await fetch(`${API_BASE_URL}/api/datasets/get`, {
              method: "GET",
              credentials: "include",
            })
            return retryResponse.ok
          }
        }
        return false
      }

      return true
    } catch (error) {
      console.error("Auth check error:", error)
      return false
    }
  }

  return { login, logout, isAuthenticated, refreshToken }
}