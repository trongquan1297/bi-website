"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Kiểm tra xem có authorization_code trong URL không
    const authorizationCode = searchParams.get("authorization_code")
    const signature = searchParams.get("signature")

    if (authorizationCode && signature) {
      // Nếu có, xử lý đăng nhập SSO
      handleSSOCallback(authorizationCode, signature)
    } else {
      // Nếu không, chuyển hướng đến trang chủ thực sự
      router.push("/home")
    }
  }, [router, searchParams])

  const handleSSOCallback = async (authorizationCode: string, signature: string) => {
    try {
      setIsProcessing(true)

      // Gửi authorization code đến backend để xác thực
      const response = await fetch("/api/auth/sso-callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorization_code: authorizationCode,
          signature: signature,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Đăng nhập SSO thất bại")
      }

      const data = await response.json()

      if (data.access_token) {
        // Lưu token và chuyển hướng đến trang chủ
        router.push("/home")
      } else {
        throw new Error("Không nhận được token xác thực")
      }
    } catch (error) {
      console.error("SSO callback error:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi xác thực SSO")
      // Chuyển hướng đến trang đăng nhập sau 3 giây nếu có lỗi
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } finally {
      setIsProcessing(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-bold text-center">Đăng nhập thất bại</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <p className="text-gray-500 text-center text-sm mb-4">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin h-12 w-12 border-4 border-violet-500 rounded-full border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-bold mb-2">Đang xác thực...</h2>
        <p className="text-gray-600">Vui lòng đợi trong khi chúng tôi hoàn tất quá trình đăng nhập.</p>
      </div>
    </div>
  )
}
