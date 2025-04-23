"use client"

import type React from "react"
import '@/app/globals.css'
import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { FloatingInput } from "@/components/login/floating-input"
import { RippleButton } from "@/components/login/ui-button-extension"
import { SSOButton } from "@/components/sso-button"
import { useAuth } from "@/lib/auth"

// Giả lập Icons component
const Icons = {
  spinner: (props: React.SVGProps<SVGSVGElement>) => (
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
      className="animate-spin"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  sso: (props: React.SVGProps<SVGSVGElement>) => (
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
      {...props}
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  appota: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src="/AppotaWallet.svg" alt="Appota Logo" {...props} />
  ),
}

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [formErrors, setFormErrors] = useState({
    username: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const errors = {
      username: "",
      password: "",
    }
    let isValid = true

    if (!formData.username) {
      errors.username = "Vui lòng nhập tên đăng nhập"
      isValid = false
    }

    if (!formData.password) {
      errors.password = "Vui lòng nhập mật khẩu"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await login(formData.username, formData.password)

      if (result.success) {
        router.push("/home")
      } else {
        setError(result.error || "Đăng nhập thất bại. Vui lòng thử lại.")
      }
    } catch (error) {
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6 animate-fadeIn">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4 animate-slideUp">
          <div className="space-y-2">
            <FloatingInput
              label=""
              placeholder="Tên đăng nhập"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              className="transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50 hover:border-violet-400"
            />
            {formErrors.username && <p className="text-sm font-medium text-red-500">{formErrors.username}</p>}
          </div>

          <div className="space-y-2">
            <FloatingInput
              label=""
              placeholder="Mật khẩu"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50 hover:border-violet-400"
            />
            {formErrors.password && <p className="text-sm font-medium text-red-500">{formErrors.password}</p>}
          </div>
        </div>

        <div className="animate-slideUp" style={{ animationDelay: "100ms" }}>
          {error && <div className="text-sm font-medium text-red-500 animate-fadeIn mb-2">{error}</div>}
          <RippleButton
            type="submit"
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Icons.spinner className="mr-2 h-4 w-4" />
                <span className="bg-gradient-to-r from-violet-400 to-violet-200 bg-clip-text text-transparent animate-pulse">
                  Đang đăng nhập...
                </span>
              </div>
            ) : (
              "Đăng nhập"
            )}
          </RippleButton>
        </div>
      </form>
      <div className="grid gap-2 animate-slideUp" style={{ animationDelay: "300ms" }}>
        <SSOButton icon={<Icons.appota className="mr-2 h-4 w-4" />} className="w-full">
          Đăng nhập với Appotapay SSO
        </SSOButton>
      </div>
    </div>
  )
}
