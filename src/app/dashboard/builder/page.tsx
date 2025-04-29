"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { getAuthHeader } from "@/lib/auth"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"
import { Loader2 } from "lucide-react"

interface Dashboard {
  id: number
  name: string
  description?: string
  layout: any[]
  created_at: string
  updated_at: string
}

export default function DashboardBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dashboardId = searchParams.get("id")
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data if editing an existing dashboard
  const fetchDashboard = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const authHeader = getAuthHeader()
      const response = await fetch(`/api/dashboard/${id}`, {
        headers: {
          Authorization: authHeader,
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching dashboard: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched dashboard data:", data)
      if (data ) {
        setDashboard(data)
      } else {
        throw new Error("Dashboard not found")
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      setError("Could not fetch dashboard. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get user info and dashboard data when component mounts
  useEffect(() => {
    // Check authentication when component mounts
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    // Get user info from token
    try {
      const token = localStorage.getItem("auth-token")
      if (token) {
        // Decode token to get user info
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const payload = JSON.parse(window.atob(base64))

        // Get username from payload
        setUsername(payload.sub || payload.username || "Người dùng")

        // Get avatar URL from payload if available
        if (payload.avatar_url) {
          setAvatarUrl(payload.avatar_url)
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error)
    }

    // Fetch dashboard data if editing an existing dashboard
    if (dashboardId) {
      fetchDashboard(dashboardId)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Handle save dashboard
  const handleSaveDashboard = async (dashboardData: any) => {
    try {
      const authHeader = getAuthHeader()
      const url = dashboardId ? `/api/dashboard/${dashboardId}` : `/api/dashboard`
      const method = dashboardId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(dashboardData),
      })
      console.log("Saved dashboard data:", dashboardData)

      if (!response.ok) {
        throw new Error(`Error saving dashboard: ${response.status}`)
      }

      const data = await response.json()
      router.push("/dashboard")
      return data
    } catch (error) {
      console.error("Error saving dashboard:", error)
      setError("Could not save dashboard. Please try again later.")
      throw error
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="pl-4 pr-4 md:pl-8 md:pr-8 pt-22 py-8">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}

          <DashboardBuilder
            initialDashboard={dashboard}
            onSave={handleSaveDashboard}
            onCancel={() => router.push("/dashboard")}
          />
        </main>
      </div>
    </div>
  )
}
