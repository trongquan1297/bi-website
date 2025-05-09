"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Loader2, Edit, Download, Pencil, Eraser, Send, RefreshCw, Undo, Redo, Trash2, Filter, X } from "lucide-react"
import { GridItemContent } from "@/components/dashboard/grid-item-content"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Slider } from "@/components/ui/slider"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import html2canvas from "html2canvas-pro"
import { fetchWithAuth } from "@/lib/api"
import { useUser } from "@/app/contexts/user-context"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

// Cập nhật interface Dashboard để phù hợp với response format
interface Dashboard {
  id: number
  name: string
  owner: string
  message?: string
  description?: string
  layout: LayoutItem[]
  created_at?: string
  updated_at?: string
  comments?: Comment[]
  charts?: any[]
}

interface Comment {
  id: number
  resource_type: string
  resource_id: number
  username: string
  avatar_url?: string
  content: string
  created_at: string
}

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  type: "chart" | "text" | "title"
  content: {
    chart_id?: number
    text?: string
    style?: Record<string, string>
  }
}

interface Chart {
  id: number
  name: string
  chart_type: string
  dataset_id: number
  updated_at: string
  labels?: string[]
}

interface ChartData {
  labels: string[]
  values?: number[]
  datasets?: Array<{
    label: string
    data: number[]
  }>
}

export default function DashboardViewPage() {
  const router = useRouter()
  const { userData } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [charts, setCharts] = useState<Chart[]>([])
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const dashboardId = params?.id

  // Filter state
  const [availableLabels, setAvailableLabels] = useState<string[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [isFilterActive, setIsFilterActive] = useState(false)
  const [isCollectingLabels, setIsCollectingLabels] = useState(false)

  // Comment state
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Handle delete comment
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error deleting comment: ${response.status}`)
      }

      // Remove the comment from the list
      setComments(comments.filter((comment) => comment.id !== commentId))
    } catch (error) {
      console.error("Error deleting comment:", error)
      setCommentError("Could not delete comment. Please try again.")
    }
  }

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [drawingColor, setDrawingColor] = useState("#ff0000") // Red
  const [drawingWidth, setDrawingWidth] = useState(3)
  const [isErasing, setIsErasing] = useState(false)
  const [canvasHistory, setCanvasHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Fetch dashboard data
  useEffect(() => {
    const preloadData = async () => {
      try {
        await fetchDashboard()
      } catch (error) {
        console.error("Error during preload:", error)
      }
    }

    preloadData()
  }, [])

  // Fetch dashboard data
  const fetchDashboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error fetching dashboard: ${response.status}`)
      }

      const data = await response.json()
      // Kiểm tra xem response có đúng định dạng không
      if (data && data.id && data.name && data.layout) {
        setDashboard(data)
        // Set comments if available
        if (data.comments) {
          setComments(data.comments)
        }

        // After dashboard is loaded, fetch charts and collect labels
        await fetchCharts()
      } else {
        throw new Error("Invalid dashboard data format")
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error)
      setError("Could not fetch dashboard. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch charts data
  const fetchCharts = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/charts/get`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error fetching charts: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.charts) {
        setCharts(data.charts)

        // After charts are loaded, collect labels
        collectLabelsFromCharts(data.charts)
      }
    } catch (error) {
      console.error("Error fetching charts:", error)
    }
  }

  // Collect labels from charts
  const collectLabelsFromCharts = useCallback(
    async (allCharts: Chart[]) => {
      if (!dashboard) return

      setIsCollectingLabels(true)
      console.log("Starting to collect labels...")

      try {
        const chartIds = dashboard.layout
          .filter((item) => item.type === "chart" && item.content.chart_id)
          .map((item) => item.content.chart_id)

        console.log(`Found ${chartIds.length} charts in dashboard layout`)

        const uniqueLabels = new Set<string>()

        for (const chartId of chartIds) {
          if (!chartId) continue

          try {
            console.log(`Fetching data for chart ${chartId}...`)
            const response = await fetchWithAuth(`${API_BASE_URL}/api/charts/${chartId}`, {
              method: "GET",
              credentials: "include",
            })

            if (!response.ok) {
              console.error(`Failed to fetch chart ${chartId}: ${response.status}`)
              continue
            }

            const result = await response.json()
            console.log(`Chart ${chartId} data:`, result)

            // Extract labels from chart data
            if (result.data && result.data.labels && Array.isArray(result.data.labels)) {
              console.log(`Found ${result.data.labels.length} labels in chart ${chartId}`)
              result.data.labels.forEach((label: string) => {
                if (label) uniqueLabels.add(label)
              })
            } else {
              console.log(`No labels found in chart ${chartId}`)
            }
          } catch (error) {
            console.error(`Error processing chart ${chartId}:`, error)
          }
        }

        const labelsArray = Array.from(uniqueLabels)
        console.log(`Collected ${labelsArray.length} unique labels:`, labelsArray)
        setAvailableLabels(labelsArray)
      } catch (error) {
        console.error("Error collecting labels:", error)
      } finally {
        setIsCollectingLabels(false)
      }
    },
    [dashboard, API_BASE_URL],
  )

  // Toggle label selection
  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) => {
      if (prev.includes(label)) {
        return prev.filter((l) => l !== label)
      } else {
        return [...prev, label]
      }
    })
  }

  // Apply filters
  const applyFilters = () => {
    if (selectedLabels.length > 0) {
      setIsFilterActive(true)
    } else {
      clearFilters()
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedLabels([])
    setIsFilterActive(false)
  }

  // Remove a single filter
  const removeFilter = (label: string) => {
    setSelectedLabels((prev) => prev.filter((l) => l !== label))
    if (selectedLabels.length <= 1) {
      setIsFilterActive(false)
    }
  }

  // Submit a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      return
    }

    setIsSubmittingComment(true)
    setCommentError(null)

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          resource_type: "dashboard",
          resource_id: dashboardId,
          content: newComment,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error submitting comment: ${response.status}`)
      }

      const data = await response.json()

      // Add the new comment to the list
      if (data && data.id) {
        const newCommentObj: Comment = {
          id: data.id,
          resource_type: "dashboard",
          resource_id: Number(dashboardId),
          username: userData?.username || "User",
          avatar_url: userData?.avatar_url || undefined,
          content: newComment,
          created_at: new Date().toISOString(),
        }

        setComments([...comments, newCommentObj])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error submitting comment:", error)
      setCommentError("Could not submit comment. Please try again.")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Refresh comments
  const refreshComments = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error fetching comments: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.comments) {
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error refreshing comments:", error)
      setCommentError("Could not refresh comments. Please try again.")
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return dateString
    }
  }

  // Initialize canvas when dashboard is loaded
  useEffect(() => {
    if (dashboard && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      // Set canvas dimensions to match the dashboard container
      const container = document.getElementById("dashboard-container")
      if (container && ctx) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight

        // Save initial blank canvas state
        const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height)
        setCanvasHistory([initialState])
        setHistoryIndex(0)
      }
    }
  }, [dashboard, isLoading])

  // Handle window resize to adjust canvas size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")
        const container = document.getElementById("dashboard-container")

        if (container && ctx) {
          // Save current drawing
          const currentDrawing = ctx.getImageData(0, 0, canvas.width, canvas.height)

          // Resize canvas
          canvas.width = container.clientWidth
          canvas.height = container.clientHeight

          // Try to restore drawing (note: this will likely scale poorly on resize)
          ctx.putImageData(currentDrawing, 0, 0)
        }
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get coordinates
    let x, y
    if ("touches" in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)

    // Set drawing styles
    ctx.globalCompositeOperation = isErasing ? "destination-out" : "source-over"
    ctx.strokeStyle = drawingColor
    ctx.lineWidth = drawingWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get coordinates
    let x, y
    if ("touches" in e) {
      // Touch event
      const rect = canvas.getBoundingClientRect()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX
      y = e.nativeEvent.offsetY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current) return

    setIsDrawing(false)

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Save current state to history
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Remove any forward history if we drew something new after undoing
    const newHistory = canvasHistory.slice(0, historyIndex + 1)

    setCanvasHistory([...newHistory, currentState])
    setHistoryIndex(newHistory.length)
  }

  // Undo/Redo functions
  const undo = () => {
    if (historyIndex <= 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newIndex = historyIndex - 1
    ctx.putImageData(canvasHistory[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  const redo = () => {
    if (historyIndex >= canvasHistory.length - 1 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const newIndex = historyIndex + 1
    ctx.putImageData(canvasHistory[newIndex], 0, 0)
    setHistoryIndex(newIndex)
  }

  // Clear canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save cleared state to history
    const clearedState = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Remove any forward history
    const newHistory = canvasHistory.slice(0, historyIndex + 1)

    setCanvasHistory([...newHistory, clearedState])
    setHistoryIndex(newHistory.length)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
          <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <div className="transition-all duration-300 md:pl-64">
          <AppHeader />
          <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              <p>{error || "Dashboard not found"}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="mt-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
              >
                Return to dashboard list
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const exportDashboard = async () => {
    const dashboardElement = document.getElementById("dashboard-capture")
    if (!dashboardElement) return

    const canvas = await html2canvas(dashboardElement, {
      backgroundColor: null, // giữ trong suốt nếu cần
      useCORS: true, // nếu dashboard có ảnh từ domain khác
      scale: 2, // tăng độ nét (HD export)
    })

    // Hàm định dạng ngày
    const formatDate = () => {
      const date = new Date()
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()
      return `${day}${month}${year}`
    }

    const dashboardName = dashboard?.name || "unnamed"
    const cleanDashboardName = dashboardName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Thay thế ký tự không phải chữ/số bằng dấu gạch ngang
      .replace(/^-+|-+$/g, "")

    const fileName = `dashboard-${cleanDashboardName}-${formatDate()}.png`

    const dataUrl = canvas.toDataURL("image/png")

    // Tải xuống file
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = fileName
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-22">
          {/* Dashboard header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-1xl font-bold text-gray-900 dark:text-white mb-1">{dashboard.name}</h3>
              {dashboard.description && <p className="text-gray-500 dark:text-gray-400">{dashboard.description}</p>}

              {/* Active filters display */}
              {isFilterActive && selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Filters:</span>
                  {selectedLabels.map((label) => (
                    <Badge
                      key={label}
                      variant="outline"
                      className="flex items-center gap-1 bg-violet-50 dark:bg-violet-900/20"
                    >
                      {label}
                      <button
                        onClick={() => removeFilter(label)}
                        className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
              {/* Filter dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isFilterActive ? "default" : "outline"}
                    className={`flex items-center gap-2 ${isFilterActive ? "bg-violet-600 text-white" : ""}`}
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                    {isFilterActive && (
                      <Badge variant="outline" className="ml-1 bg-white text-violet-600 border-white">
                        {selectedLabels.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Filter by Labels</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {isCollectingLabels ? (
                    <div className="p-4 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-violet-500" />
                      <p className="text-sm text-gray-500">Loading labels...</p>
                    </div>
                  ) : availableLabels.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-gray-500">No labels available</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => collectLabelsFromCharts(charts)}
                        className="mt-2 text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh Labels
                      </Button>
                    </div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto">
                      {availableLabels.map((label) => (
                        <DropdownMenuCheckboxItem
                          key={label}
                          checked={selectedLabels.includes(label)}
                          onCheckedChange={() => toggleLabel(label)}
                        >
                          {label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  )}

                  <DropdownMenuSeparator />
                  <div className="flex justify-between p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Clear
                    </Button>
                    <Button size="sm" onClick={applyFilters} disabled={selectedLabels.length === 0}>
                      Apply
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                <div
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    isDrawingMode ? "bg-gray-100 dark:bg-gray-800" : ""
                  }`}
                >
                  {/* Draw Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isDrawingMode && !isErasing) {
                            // Đang vẽ → bấm lại tắt
                            setIsDrawingMode(false)
                          } else {
                            setIsDrawingMode(true)
                            setIsErasing(false)
                          }
                        }}
                        className={`transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 ${
                          isDrawingMode && !isErasing ? "text-violet-600 dark:text-violet-400" : ""
                        }`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Draw</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Erase Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (isDrawingMode && isErasing) {
                            // Đang erase → bấm lại tắt
                            setIsDrawingMode(false)
                          } else {
                            setIsDrawingMode(true)
                            setIsErasing(true)
                          }
                        }}
                        className={`transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 ${
                          isErasing ? "text-violet-600 dark:text-violet-400" : ""
                        }`}
                      >
                        <Eraser className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Erase</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Hiển thị tùy chọn vẽ nếu đang bật chế độ vẽ */}
                  {isDrawingMode && (
                    <>
                      {/* Color Picker + Stroke Width */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={drawingColor}
                          onChange={(e) => setDrawingColor(e.target.value)}
                          className="w-6 h-6 border-0 p-0 bg-transparent cursor-pointer"
                          disabled={isErasing}
                        />
                        <div className="w-24">
                          <Slider
                            value={[drawingWidth]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(value) => setDrawingWidth(value[0])}
                          />
                        </div>
                      </div>

                      {/* Undo / Redo / Clear */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={undo}
                          disabled={historyIndex <= 0}
                          className="transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50"
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={redo}
                          disabled={historyIndex >= canvasHistory.length - 1}
                          className="transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50"
                        >
                          <Redo className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={clearCanvas}
                          className="transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TooltipProvider>

              {/* Action buttons ngoài */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={exportDashboard}
                  className="flex items-center gap-2 transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/dashboard/builder?id=${dashboard?.id}`)}
                  className="flex items-center gap-2 transition text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <Edit className="h-4 w-4" />
                  Edit Dashboard
                </Button>
              </div>
            </div>
          </div>

          <div id="dashboard-capture" className="relative w-full h-full">
            {/* Dashboard content */}
            <div className="relative touch-none overscroll-none">
              <div id="dashboard-container" className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 min-h-[70vh]">
                <div
                  className="grid gap-4"
                  style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "80px" }}
                >
                  {dashboard.layout.map((item, index) => {
                    const isChart = item.type === "chart"
                    const itemClassName = isChart
                      ? "bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
                      : "bg-white dark:bg-gray-800 overflow-hidden"

                    const safeKey = `${item.i}_${index}` // 👈 thêm index để tránh trùng

                    return (
                      <div
                        key={safeKey}
                        className={itemClassName}
                        style={{
                          gridColumnStart: item.x + 1,
                          gridColumnEnd: item.x + item.w + 1,
                          gridRowStart: item.y + 1,
                          gridRowEnd: item.y + item.h + 1,
                        }}
                      >
                        <div className="h-full">
                          <GridItemContent item={item} charts={charts} filters={isFilterActive ? selectedLabels : []} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Canvas overlay for drawing */}
              <canvas
                ref={canvasRef}
                className={`absolute top-0 left-0 w-full h-full ${isDrawingMode ? "cursor-crosshair" : "pointer-events-none"}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
              />
            </div>
          </div>

          {/* Comments section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Comments</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshComments}
                className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            {/* Comments list */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4 p-2">
              {comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                [...comments]
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 group"
                    >
                      <Avatar className="h-8 w-8">
                        {comment.avatar_url ? (
                          <AvatarImage src={comment.avatar_url || "/placeholder.svg"} alt={comment.username} />
                        ) : (
                          <AvatarImage src={`https://avatar.vercel.sh/${comment.username}`} alt={comment.username} />
                        )}
                        <AvatarFallback>{comment.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">{comment.username}</span>

                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(comment.created_at)}
                          </span>

                          {comment.username === userData?.username && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 h-auto"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-trash-2"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </Button>
                          )}
                        </div>

                        <p className="mt-1 text-gray-700 dark:text-gray-300 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Comment error */}
            {commentError && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-2 rounded-md mb-4 text-sm">
                {commentError}
              </div>
            )}

            {/* Comment form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[40px] resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                />
              </div>
              <Button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="self-end">
                {isSubmittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
