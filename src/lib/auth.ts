"use client"

import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

// Lấy cấu hình từ biến môi trường
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const TOKEN_EXPIRY_DAYS = Number.parseInt(process.env.AUTH_TOKEN_EXPIRY_DAYS || "7")
const COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === "true"
const COOKIE_SAME_SITE = process.env.AUTH_COOKIE_SAME_SITE || "strict"

// Lưu cả token và token_type
export function setAuthToken(token: string, tokenType = "bearer") {
  // Lưu token vào localStorage để sử dụng trong các API call
  localStorage.setItem("auth-token", token)
  localStorage.setItem("token-type", tokenType)

  // Lưu token vào cookie để middleware có thể truy cập
  Cookies.set("auth-token", token, {
    expires: TOKEN_EXPIRY_DAYS,
    path: "/",
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE as "strict" | "lax" | "none",
  })
  // Lưu thông tin avatar nếu có trong token
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(window.atob(base64))

    if (payload.avatar_url) {
      localStorage.setItem("user-avatar", payload.avatar_url)
    }
  } catch (error) {
    console.error("Lỗi khi giải mã token để lấy avatar:", error)
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth-token")
  }
  return null
}

export function getTokenType(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token-type") || "bearer"
  }
  return "bearer"
}

// Tạo Authorization header
export function getAuthHeader(): string {
  const token = getAuthToken()
  const tokenType = getTokenType()
  if (!token) return ""

  // Viết hoa chữ cái đầu của token type (bearer -> Bearer)
  const formattedType = tokenType.charAt(0).toUpperCase() + tokenType.slice(1)
  return `${formattedType} ${token}`
}

export function removeAuthToken() {
  localStorage.removeItem("auth-token")
  localStorage.removeItem("token-type")
  Cookies.remove("auth-token", { path: "/" })
}

export function useAuth() {
  const router = useRouter()

  const login = async (username: string, password: string) => {
    try {
      // Sử dụng API route của Next.js làm proxy
      const response = await fetch("/api/auth/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
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

      const data = await response.json()
      // console.log("Login response:", data)

      if (data.token) {
        // Lưu token và token_type (nếu có)
        setAuthToken(data.token, data.token_type || "bearer")
        return { success: true }
      }

      throw new Error("Không nhận được token xác thực")
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

  const logout = () => {
    removeAuthToken()
    router.push("/login")
  }

  const isAuthenticated = () => {
    // Kiểm tra token có hợp lệ không
    const token = getAuthToken()
    if (!token) return false

    try {
      // Giải mã token để kiểm tra
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const payload = JSON.parse(window.atob(base64))

      // Kiểm tra thời gian hết hạn
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        // Token đã hết hạn
        removeAuthToken()
        return false
      }

      return true
    } catch (error) {
      console.error("Token validation error:", error)
      return false
    }
  }

  return { login, logout, isAuthenticated }
}
