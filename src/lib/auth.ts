"use client"
import { useRouter } from "next/navigation"
import { useUser } from "@/app/contexts/user-context"
import { clearRefreshState } from "./token-refresh"
import { fetchWithAuth } from "./api"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export function useAuth() {
  const router = useRouter()
  const { setUserData, clearUserData } = useUser()

  const login = async (username: string, password: string) => {
    try {
      // Clear any existing user data and cookies before login attempt
      clearUserData()
      clearRefreshState()

      // Clear problematic cookies
      document.cookie = "attempted_refresh=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

      // Gọi trực tiếp đến API backend để đăng nhập
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
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

      // Fetch user data after successful login
      await fetchUserData()

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
      // Clear refresh state first to prevent any refresh attempts during logout
      clearRefreshState()

      // Call the logout API
      await fetchWithAuth(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })

      // Clear cookies on the client side as a fallback
      if (typeof document !== "undefined") {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }

      // Clear user data
      clearUserData()

      // Force a page reload to clear all state
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    } catch (error) {
      console.error("Logout error:", error)

      // Even if the API call fails, clear cookies and redirect
      if (typeof document !== "undefined") {
        document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
        document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  // Simplified function to fetch user data
  const fetchUserData = async () => {
    try {
      console.log("Fetching user data...")
      const response = await fetchWithAuth(`/api/users/me`)

      if (response.ok) {
        const userData = await response.json()
        setUserData(userData)
        return true
      }

      return false
    } catch (error) {
      console.error("Error fetching user data:", error)
      return false
    }
  }

  return { login, logout, fetchUserData }
}

