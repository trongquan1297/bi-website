"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RippleButton } from "@/components/login/ui-button-extension"

interface SSOButtonProps {
  className?: string
  icon: React.ReactNode
  children: React.ReactNode
}

export function SSOButton({ className = "", icon, children }: SSOButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSSOLogin = async () => {
    try {
      setIsLoading(true)

      // Gọi API để lấy URL chuyển hướng SSO
      const response = await fetch("/api/auth/sso-redirect")

      if (!response.ok) {
        throw new Error("Không thể lấy URL chuyển hướng SSO")
      }

      const data = await response.json()

      if (data.redirect_uri) {
        // Chuyển hướng người dùng đến trang đăng nhập SSO
        window.location.href = data.redirect_uri
      } else {
        throw new Error("Không nhận được URL chuyển hướng SSO")
      }
    } catch (error) {
      console.error("SSO error:", error)
      alert(error instanceof Error ? error.message : "Đã xảy ra lỗi khi khởi tạo đăng nhập SSO")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RippleButton
      variant="outline"
      type="button"
      onClick={handleSSOLogin}
      disabled={isLoading}
      rippleColor="rgba(124, 58, 237, 0.1)"
      className={`transition-all duration-200 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-200 dark:hover:border-violet-800 ${className}`}
    >
      {isLoading ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin mr-2 h-4 w-4"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        icon
      )}
      {children}
    </RippleButton>
  )
}
