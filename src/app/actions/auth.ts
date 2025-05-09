"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

interface LoginCredentials {
  username: string
  password: string
}

interface SSOLoginParams {
  domain: string
}

interface LoginResult {
  success: boolean
  error?: string
  redirectUrl?: string
}

export async function loginWithSSO({ domain }: SSOLoginParams): Promise<LoginResult> {
  // Mô phỏng quá trình bắt đầu đăng nhập SSO
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Trong thực tế, bạn sẽ tạo URL chuyển hướng đến nhà cung cấp danh tính
  // dựa trên tên miền được cung cấp [^1]
  const redirectUrl = `/api/auth/sso/redirect?domain=${encodeURIComponent(domain)}`

  return {
    success: true,
    redirectUrl,
  }
}

export async function logout() {
  redirect("/login")
}
