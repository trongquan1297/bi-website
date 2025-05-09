"use client"

import { useState, useEffect } from "react"
import { ChartPreview } from "./chart-preview"
import { Loader2 } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"

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
}

interface GridItemContentProps {
  item: LayoutItem
  isEditable?: boolean
  onRemove?: (id: string) => void
  onEdit?: (id: string, content: any) => void
  charts?: Chart[]
  filters?: string[]
}

export function GridItemContent({
  item,
  isEditable = false,
  onRemove,
  onEdit,
  charts = [],
  filters = [],
}: GridItemContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [chartType, setChartType] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item.type === "chart" && item.content.chart_id) {
      const chart = charts.find((c) => c.id === item.content.chart_id)
      if (chart) {
        setChartType(chart.chart_type)
      } else {
        // If chart not found in the provided charts array, fetch it
        fetchChartType(item.content.chart_id)
      }
    }
  }, [item, charts])

  const fetchChartType = async (chartId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth(`/api/charts/${chartId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch chart: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.chart && data.chart.query && data.chart.query.chart_type) {
        setChartType(data.chart.query.chart_type)
      }
    } catch (err) {
      console.error("Error fetching chart type:", err)
      setError("Failed to load chart type")
    } finally {
      setIsLoading(false)
    }
  }

  if (item.type === "chart") {
    return (
      <div className="h-full w-full relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">{error}</div>
        ) : (
          <ChartPreview chartId={item.content.chart_id} chartType={chartType as any} filters={filters} />
        )}
      </div>
    )
  }

  if (item.type === "text") {
    return (
      <div
        className="h-full w-full p-4 overflow-auto"
        style={item.content.style || {}}
        dangerouslySetInnerHTML={{ __html: item.content.text || "" }}
      />
    )
  }

  if (item.type === "title") {
    return (
      <div className="h-full w-full flex items-center p-4">
        <h2
          className="text-2xl font-bold"
          style={item.content.style || {}}
          dangerouslySetInnerHTML={{ __html: item.content.text || "" }}
        />
      </div>
    )
  }

  return <div className="h-full w-full bg-gray-100 dark:bg-gray-700 rounded-lg">Unknown item type</div>
}
