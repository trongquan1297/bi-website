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

// export async function loginWithCredentials(credentials: LoginCredentials): Promise<LoginResult> {
//   // Đây là mô phỏng xác thực - trong thực tế, bạn sẽ gọi API hoặc dịch vụ xác thực
//   await new Promise((resolve) => setTimeout(resolve, 1000))

//   // Mô phỏng xác thực thành công
//   if (credentials.username && credentials.password) {
//     // Thiết lập cookie xác thực
//     (await
//           // Thiết lập cookie xác thực
//           cookies()).set("auth-token", "sample-jwt-token", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 60 * 60 * 24 * 7, // 1 tuần
//       path: "/",
//     })

//     return { success: true }
//   }

//   return {
//     success: false,
//     error: "Tên đăng nhập hoặc mật khẩu không đúng",
//   }
// }

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
  (await cookies()).delete("auth-token")
  redirect("/login")
}
