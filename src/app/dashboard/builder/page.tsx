"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"
import { Loader2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

interface Dashboard {
  id: number
  name: string
  description?: string
  layout: any[]
  created_at: string
  updated_at: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

export default function DashboardBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dashboardId = searchParams.get("id")
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data if editing an existing dashboard
  const fetchDashboard = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${id}`, {
        method: "GET",
        credentials: "include"
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

  useEffect(() => {
    const preloadData = async () => {
      try {
        if (dashboardId) {
          await fetchDashboard(dashboardId)
        } else {
          setIsLoading(false)
        }
    
      } catch (error) {
        console.error("Error during preload:", error)
      }
    }

    preloadData()
  }, [])

  // Handle save dashboard
  const handleSaveDashboard = async (dashboardData: any) => {
    try {
      const url = dashboardId ? `${API_BASE_URL}/api/dashboards/${dashboardId}` : `${API_BASE_URL}/api/dashboards`
      const method = dashboardId ? "PUT" : "POST"

      const response = await fetchWithAuth(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
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
        <AppHeader/>

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
