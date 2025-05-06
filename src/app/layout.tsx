import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/app/contexts/theme-context"
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
  title: "BI",
  description: "Appotapay Bussiness Intelligence",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
