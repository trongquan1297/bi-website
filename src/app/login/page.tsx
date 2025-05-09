import type { Metadata } from "next"
import LoginForm from "@/components/login/login-form"
import { ParticlesBackground } from "@/components/login/particles-background"
import { TiltCard } from "@/components/login/tilt-card"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản của bạn",
}

// Add noStore to prevent caching of this page
export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      <ParticlesBackground />

      {/* Decorative blobs */}
      <div className="absolute h-56 w-56 top-20 -left-10 bg-violet-500/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute h-56 w-56 bottom-20 -right-10 bg-indigo-500/30 rounded-full blur-3xl animate-blob animation-delay-2000" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px] pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0">
        <TiltCard className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-xl">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <div className="mx-auto mb-2">
              <img src="/AppotaWallet.svg" alt="Appota Logo" className="h-10 w-10 text-violet-600" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
          </div>
          <LoginForm />
        </TiltCard>
      </div>
    </div>
  )
}
