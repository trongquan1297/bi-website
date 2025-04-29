import { ThemeProvider } from "@/app/contexts/theme-context"
import type React from "react"
import "./globals.css"

export const metadata = {
  title: "BI",
  description: "Appotapay Bussiness Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
    <body>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </body>
  </html>
  )
}
