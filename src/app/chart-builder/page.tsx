"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { ChartBuilder } from "@/components/chart-builder"

interface Chart {
  id: number
  name: string
  dataset_id: number
  chart_type: string
  created_at: string
  updated_at: string
  owner?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

export default function ChartBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [charts, setCharts] = useState<Chart[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isChartBuilderOpen, setIsChartBuilderOpen] = useState(false)

  // Get chart ID from URL query parameter if editing
  const chartId = searchParams.get("id") ? Number.parseInt(searchParams.get("id") as string, 10) : null

  // Handle authentication and user info
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
    } finally {
      setIsLoading(false)
    }
  }, [router, isAuthenticated])

  // Handle save success
  const handleSaveSuccess = () => {
    router.push("/chart")
  }

  // Handle cancel
  const handleCancel = () => {
    router.push("/chart")
  }

  // Hàm lấy dữ liệu charts từ API
  const fetchCharts = async () => {
    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/charts`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy dữ liệu: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.charts) {
        setCharts(data.charts)
      } else {
        setCharts([])
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu charts:", error)
      setError("Không thể lấy dữ liệu charts. Vui lòng thử lại sau.")
      // Đặt charts thành mảng rỗng để tránh hiển thị dữ liệu cũ
      setCharts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Lọc charts theo từ khóa tìm kiếm
  const filteredCharts = charts.filter((chart) => chart.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-26">
          <DndProvider backend={HTML5Backend}>
            <ChartBuilder onClose={handleCancel} onSave={handleSaveSuccess} editChartId={chartId} isFullPage={true} />
          </DndProvider>
        </main>
      </div>
    </div>
  )
}
