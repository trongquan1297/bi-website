"use client"
import { ChartPreview } from "./chart-preview"

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

interface GridItemContentProps {
  item: LayoutItem
  charts: any[]
}

export function GridItemContent({ item, charts }: GridItemContentProps) {
  // Find chart data if this is a chart item
  const chartData =
    item.type === "chart" && item.content.chart_id ? charts.find((c) => c.id === item.content.chart_id) : null

  switch (item.type) {
    case "chart":
      return <ChartPreview chartId={item.content.chart_id} />
    case "text":
      return (
        <div
          className="h-full p-4 overflow-auto"
          style={item.content?.style || {}}
          dangerouslySetInnerHTML={{ __html: item.content?.text || "" }}
        />
      )
    case "title":
      return (
        <h2 className="text-xl font-bold p-4" style={item.content?.style || {}}>
          {item.content?.text || "Title"}
        </h2>
      )
    default:
      return <div>Unknown item type</div>
  }
}
