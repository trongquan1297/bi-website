"use client"

import { useState, useEffect } from "react"
import { Responsive, WidthProvider } from "react-grid-layout"
import { X } from "lucide-react"
import { ChartPreview } from "@/components/dashboard/chart-preview"
import { TextEditor } from "@/components/dashboard/text-editor"
import { TitleEditor } from "@/components/dashboard/title-editor"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

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

interface GridLayoutProps {
  layout: LayoutItem[]
  onLayoutChange: (layout: LayoutItem[]) => void
  onUpdateContent: (id: string, content: any) => void
  onRemoveItem: (id: string) => void
  charts: Chart[]
}

export function GridLayout({ layout, onLayoutChange, onUpdateContent, onRemoveItem, charts }: GridLayoutProps) {
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after component mounts to avoid SSR issues with react-grid-layout
  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert layout items to format expected by react-grid-layout
  const gridLayout = layout.map((item) => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: 3,
    minH: item.type === "title" ? 1 : 2,
  }))

  // Handle layout change from react-grid-layout
  const handleLayoutChange = (newLayout: any[]) => {
    // Merge the new positions with the existing layout items
    const updatedLayout = layout.map((item) => {
      const newPos = newLayout.find((l) => l.i === item.i)
      if (newPos) {
        return {
          ...item,
          x: newPos.x,
          y: newPos.y,
          w: newPos.w,
          h: newPos.h,
        }
      }
      return item
    })

    onLayoutChange(updatedLayout)
  }

  // Render the content of each layout item
  const renderItemContent = (item: LayoutItem) => {
    switch (item.type) {
      case "chart":
        const chart = charts.find((c) => c.id === item.content.chart_id)
        return (
          <div className="h-full">
            <div className="p-2 font-medium text-sm border-b border-gray-200 dark:border-gray-700">
              {chart ? chart.name || "Untitled Chart" : "Chart not found"}
            </div>
            <div className="p-2 h-[calc(100%-40px)]">
              <ChartPreview chartId={item.content.chart_id} />
            </div>
          </div>
        )
      case "text":
        return (
          <TextEditor
            text={item.content.text || ""}
            style={item.content.style || {}}
            onChange={(text, style) => onUpdateContent(item.i, { text, style })}
          />
        )
      case "title":
        return (
          <TitleEditor
            text={item.content.text || ""}
            style={item.content.style || {}}
            onChange={(text, style) => onUpdateContent(item.i, { text, style })}
          />
        )
      default:
        return <div>Unknown item type</div>
    }
  }

  if (!mounted) return <div className="w-full h-[70vh] bg-gray-100 dark:bg-gray-800 rounded-lg"></div>

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: gridLayout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={80}
      margin={[16, 16]}
      containerPadding={[16, 16]}
      onLayoutChange={(layout) => handleLayoutChange(layout)}
      isDraggable={true}
      isResizable={true}
    >
      {layout.map((item) => (
        <div
          key={item.i}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden"
        >
          <div className="relative h-full">
            {/* Remove button */}
            <button
              onClick={() => onRemoveItem(item.i)}
              className="absolute top-2 right-2 z-10 p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
            {renderItemContent(item)}
          </div>
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
