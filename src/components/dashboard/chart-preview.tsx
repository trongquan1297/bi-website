"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie, Doughnut, Scatter, Radar, PolarArea } from "react-chartjs-2"
import type { ChartData, ChartType } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartPreviewProps {
  chartId?: number
  chartType?: ChartType
}

export function ChartPreview({ chartId, chartType: initialChartType }: ChartPreviewProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [chartType, setChartType] = useState<ChartType>(initialChartType || "bar")
  const [chartName, setChartName] = useState("Chart Preview")
  const [colorScheme, setColorScheme] = useState("tableau10")
  const [showLegend, setShowLegend] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartId) {
      setIsLoading(false)
      return
    }

    const fetchChart = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/api/charts/${chartId}`, {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`)
        }

        const result = await response.json()

        setChartData(result.data)
        setChartType(result.chart.query.chart_type)
        setChartName(result.chart.name)
        setColorScheme(result.chart.config?.colorScheme || "tableau10")
        setShowLegend(result.chart.config?.showLegend ?? true)
      } catch (err) {
        console.error("Error fetching chart:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChart()
  }, [chartId])

  const getColorScheme = (scheme: string): string[] => {
    const schemes: Record<string, string[]> = {
      tableau10: [
        "rgba(31, 119, 180, 0.7)",
        "rgba(255, 127, 14, 0.7)",
        "rgba(44, 160, 44, 0.7)",
        "rgba(214, 39, 40, 0.7)",
        "rgba(148, 103, 189, 0.7)",
        "rgba(140, 86, 75, 0.7)",
        "rgba(227, 119, 194, 0.7)",
        "rgba(127, 127, 127, 0.7)",
        "rgba(188, 189, 34, 0.7)",
        "rgba(23, 190, 207, 0.7)",
      ],
      category10: [
        "rgba(31, 119, 180, 0.7)",
        "rgba(255, 127, 14, 0.7)",
        "rgba(44, 160, 44, 0.7)",
        "rgba(214, 39, 40, 0.7)",
        "rgba(148, 103, 189, 0.7)",
        "rgba(140, 86, 75, 0.7)",
        "rgba(227, 119, 194, 0.7)",
        "rgba(127, 127, 127, 0.7)",
        "rgba(188, 189, 34, 0.7)",
        "rgba(23, 190, 207, 0.7)",
      ],
    }

    return schemes[scheme] || schemes["tableau10"]
  }

  const renderChart = () => {
    if (!chartData) return null

    const colors = getColorScheme(colorScheme)

    const data = chartData.datasets
      ? {
          labels: chartData.labels,
          datasets: chartData.datasets.map((dataset, index) => ({
            label: dataset.label || `Dataset ${index + 1}`,
            data: dataset.data || [],
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length].replace("0.7", "1"),
            borderWidth: 1,
            fill: chartType === "area" ? true : undefined,
          })),
        }
      : {
          labels: chartData.labels,
          datasets: [
            {
              label: "Value",
              data: chartData.values || [],
              backgroundColor: colors,
              borderColor: colors.map((c) => c.replace("0.7", "1")),
              borderWidth: 1,
              fill: chartType === "area" ? true : undefined,
            },
          ],
        }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: "top" as const,
        },
        title: {
          display: true,
          text: chartName,
        },
      },
      scales:
        chartType !== "pie" && chartType !== "doughnut" && chartType !== "polarArea"
          ? {
              x: { display: true, title: { display: true } },
              y: { display: true, title: { display: true }, beginAtZero: true },
            }
          : undefined,
    }

    switch (chartType) {
      case "line":
      case "area":
        return <Line data={data} options={options} />
      case "bar":
        return <Bar data={data} options={options} />
      case "pie":
        return <Pie data={data} options={options} />
      case "doughnut":
        return <Doughnut data={data} options={options} />
      case "scatter":
        return <Scatter data={data} options={options} />
      case "radar":
        return <Radar data={data} options={options} />
      case "polarArea":
        return <PolarArea data={data} options={options} />
      default:
        return <Bar data={data} options={options} />
    }
  }

  if (!chartId) {
    return <div className="text-gray-400 text-sm text-center p-4">No chart selected</div>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <Loader2 className="animate-spin w-8 h-8 text-violet-500" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-sm text-center p-4">{error}</div>
  }

  return <div className="h-full">{renderChart()}</div>
}
