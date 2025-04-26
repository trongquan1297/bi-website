"use client"

import { useState, useEffect } from "react"
import { Responsive, WidthProvider } from "react-grid-layout"
import { Plus, Save, X, LayoutGrid, Type, Heading1 } from "lucide-react"
import { getAuthHeader } from "@/lib/auth"
import { GridItemContent } from "./grid-item-content"
import { ChartSelector } from "./chart-selector"
import { TextEditor } from "./text-editor"
import { TitleEditor } from "./title-editor"

// Import react-grid-layout styles
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardBuilderProps {
  initialDashboard?: any
  onSave: (dashboard: any) => Promise<any>
  onCancel: () => void
}

export function DashboardBuilder({ initialDashboard, onSave, onCancel }: DashboardBuilderProps) {
  const [dashboardName, setDashboardName] = useState(initialDashboard?.name || "Untitled Dashboard")
  const [dashboardDescription, setDashboardDescription] = useState(initialDashboard?.description || "")
  const [layout, setLayout] = useState<any[]>(initialDashboard?.layout || [])
  const [charts, setCharts] = useState<any[]>([])
  const [isChartSelectorOpen, setIsChartSelectorOpen] = useState(false)
  const [isTextEditorOpen, setIsTextEditorOpen] = useState(false)
  const [isTitleEditorOpen, setIsTitleEditorOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextItemId, setNextItemId] = useState(1)

  // Fetch available charts
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        const authHeader = getAuthHeader()
        const response = await fetch("/api/charts", {
          headers: {
            Authorization: authHeader,
          },
        })

        if (!response.ok) {
          throw new Error(`Error fetching charts: ${response.status}`)
        }

        const data = await response.json()
        if (data && data.charts) {
          setCharts(data.charts)
        }
      } catch (error) {
        console.error("Error fetching charts:", error)
        setError("Could not fetch charts. Please try again later.")
      }
    }

    fetchCharts()
  }, [])

  // Generate a unique ID for new items
  const generateItemId = (type: string) => {
    const id = `${type}_${nextItemId}`
    setNextItemId(nextItemId + 1)
    return id
  }

  // Add a chart to the layout
  const handleAddChart = (chartId: number) => {
    const itemId = generateItemId("chart")
    const newItem = {
      i: itemId,
      x: 0,
      y: Number.POSITIVE_INFINITY, // Put it at the bottom
      w: 6,
      h: 4,
      type: "chart",
      content: {
        chart_id: chartId,
      },
    }

    setLayout([...layout, newItem])
    setIsChartSelectorOpen(false)
  }

  // Add text to the layout
  const handleAddText = (text: string, style: any) => {
    const itemId = generateItemId("text")
    const newItem = {
      i: itemId,
      x: 0,
      y: Number.POSITIVE_INFINITY, // Put it at the bottom
      w: 12,
      h: 2,
      type: "text",
      content: {
        text,
        style,
      },
    }

    setLayout([...layout, newItem])
    setIsTextEditorOpen(false)
  }

  // Add title to the layout
  const handleAddTitle = (text: string, style: any) => {
    const itemId = generateItemId("title")
    const newItem = {
      i: itemId,
      x: 0,
      y: Number.POSITIVE_INFINITY, // Put it at the bottom
      w: 12,
      h: 1,
      type: "title",
      content: {
        text,
        style,
      },
    }

    setLayout([...layout, newItem])
    setIsTitleEditorOpen(false)
  }

  // Remove an item from the layout
  const handleRemoveItem = (itemId: string) => {
    setLayout(layout.filter((item) => item.i !== itemId))
  }

  // Handle layout change
  const handleLayoutChange = (newLayout: any[]) => {
    // Update positions and sizes while preserving content and type
    const updatedLayout = newLayout.map((newItem) => {
      const existingItem = layout.find((item) => item.i === newItem.i)
      return {
        ...newItem,
        type: existingItem?.type,
        content: existingItem?.content,
      }
    })

    setLayout(updatedLayout)
  }

  // Save the dashboard
  const handleSave = async () => {
    if (!dashboardName.trim()) {
      setError("Dashboard name is required")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const dashboardData = {
        name: dashboardName,
        description: dashboardDescription,
        layout,
      }

      await onSave(dashboardData)
    } catch (error) {
      console.error("Error saving dashboard:", error)
      setError("Could not save dashboard. Please try again later.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      {/* Dashboard header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex-1">
          <input
            type="text"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            placeholder="Dashboard Name"
            className="w-full text-xl font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            value={dashboardDescription}
            onChange={(e) => setDashboardDescription(e.target.value)}
            placeholder="Dashboard Description (optional)"
            className="w-full text-sm text-gray-500 dark:text-gray-400 bg-transparent border-0 focus:outline-none focus:ring-0 mt-1"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 flex items-center"
          >
            {isSaving ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3">
          <p>{error}</p>
        </div>
      )}

      <div className="flex">
        {/* Main grid area */}
        <div className="flex-1 p-4">
          {layout.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <LayoutGrid className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your dashboard is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Add charts, text, or titles from the right panel to build your dashboard.
              </p>
            </div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: layout }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              isDraggable={true}
              isResizable={true}
              margin={[16, 16]}
            >
              {layout.map((item) => (
                <div
                  key={item.i}
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate px-2">
                      {item.type === "chart" ? "chart": item.type === "text" ? "Text" : "Title"}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.i)}
                      className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-2 h-[calc(100%-32px)] overflow-auto">
                    <GridItemContent item={item} charts={charts} />
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Add Elements</h3>

          <div className="space-y-2">
            <button
              onClick={() => setIsChartSelectorOpen(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4 mr-2 text-violet-500" />
              Add Chart
            </button>

            <button
              onClick={() => setIsTextEditorOpen(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Type className="h-4 w-4 mr-2 text-violet-500" />
              Add Text
            </button>

            <button
              onClick={() => setIsTitleEditorOpen(true)}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Heading1 className="h-4 w-4 mr-2 text-violet-500" />
              Add Title
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout Tips</h3>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-4">
              <li>Drag items to reposition them</li>
              <li>Resize items using the handle in the bottom-right corner</li>
              <li>Click the X icon to remove an item</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chart selector modal */}
      {isChartSelectorOpen && (
        <ChartSelector charts={charts} onSelect={handleAddChart} onClose={() => setIsChartSelectorOpen(false)} />
      )}

      {/* Text editor modal */}
      {isTextEditorOpen && (
        <TextEditor
          onSave={handleAddText}
          onCancel={() => setIsTextEditorOpen(false)}
          initialText="Enter your text here..."
          initialStyle={{ fontSize: "16px", color: "#666" }}
        />
      )}

      {/* Title editor modal */}
      {isTitleEditorOpen && (
        <TitleEditor
          onSave={handleAddTitle}
          onCancel={() => setIsTitleEditorOpen(false)}
          initialText="Dashboard Title"
          initialStyle={{ fontSize: "24px", fontWeight: "bold", color: "#333" }}
        />
      )}
    </div>
  )
}
