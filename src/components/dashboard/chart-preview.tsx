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
import { Table } from "@/components/ui/table"
import { fetchWithAuth } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

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
        const response = await fetchWithAuth(`${API_BASE_URL}/api/charts/${chartId}`, {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`)
        }

        const result = await response.json()

        // Process the data based on chart type
        if (result.chart.query.chart_type === "table") {
          // For table charts, we expect the data to be in a different format
          setChartData({
            labels: [],
            tableData: result.data.tableData || transformToTableData(result.data),
          })
        } else if (result.chart.query.chart_type === "numeric") {
          // For numeric charts, we expect a single value
          setChartData({
            labels: [],
            numericValue: extractNumericValue(result.data),
          })
        } else {
          // For other chart types, use the existing format
          setChartData(result.data)
        }

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

  // Helper function to transform regular chart data to table format if needed
  const transformToTableData = (data: any) => {
    if (data.tableData) return data.tableData

    // If the API doesn't provide tableData directly, try to construct it
    const tableData = []

    if (data.labels && (data.values || data.datasets)) {
      // Convert from chart format to table format
      if (data.values) {
        // Simple case: one series of values
        for (let i = 0; i < data.labels.length; i++) {
          tableData.push({
            label: data.labels[i],
            value: data.values[i],
          })
        }
      } else if (data.datasets) {
        // Multiple series case
        for (let i = 0; i < data.labels.length; i++) {
          const row: Record<string, any> = { label: data.labels[i] }

          data.datasets.forEach((dataset: any, j: number) => {
            row[dataset.label || `Series ${j + 1}`] = dataset.data[i]
          })

          tableData.push(row)
        }
      }
    }

    return tableData
  }

  // Helper function to extract a numeric value from chart data
  const extractNumericValue = (data: any) => {
    if (data.numericValue !== undefined) return data.numericValue

    // Try to extract a single numeric value from the data
    if (data.values && data.values.length > 0) {
      return data.values[0]
    } else if (data.datasets && data.datasets.length > 0 && data.datasets[0].data.length > 0) {
      return data.datasets[0].data[0]
    }

    return 0 // Default value if we can't find a numeric value
  }

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
      accent: [
        "rgba(127, 201, 127, 0.7)",
        "rgba(190, 174, 212, 0.7)",
        "rgba(253, 192, 134, 0.7)",
        "rgba(255, 255, 153, 0.7)",
        "rgba(56, 108, 176, 0.7)",
        "rgba(240, 2, 127, 0.7)",
        "rgba(191, 91, 23, 0.7)",
      ],
      pastel1: [
        "rgba(179, 159, 181, 0.7)",
        "rgba(204, 204, 178, 0.7)",
        "rgba(255, 242, 204, 0.7)",
        "rgba(255, 230, 230, 0.7)",
        "rgba(242, 242, 242, 0.7)",
        "rgba(217, 217, 217, 0.7)",
        "rgba(204, 229, 255, 0.7)",
        "rgba(204, 255, 204, 0.7)",
      ],
      set1: [
        "rgba(228, 26, 28, 0.7)",
        "rgba(55, 126, 184, 0.7)",
        "rgba(77, 175, 74, 0.7)",
        "rgba(152, 78, 163, 0.7)",
        "rgba(255, 127, 0, 0.7)",
        "rgba(255, 255, 51, 0.7)",
        "rgba(166, 86, 40, 0.7)",
        "rgba(247, 129, 191, 0.7)",
      ],
    }

    return schemes[scheme] || schemes["tableau10"]
  }

  // Render a table chart
  const renderTableChart = () => {
    if (!chartData || !chartData.tableData || chartData.tableData.length === 0) {
      return <div className="text-gray-400 text-sm text-center p-4">No data available</div>
    }

    // Get all unique column names from the data
    const columns = Object.keys(chartData.tableData[0])

    return (
      <div className="overflow-auto h-full">
        <div className="text-lg font-semibold mb-2">{chartName}</div>
        <Table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-2 text-left font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chartData.tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : ""}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 border-t">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  // Render a numeric chart (big number)
  const renderNumericChart = () => {
    if (!chartData || chartData.numericValue === undefined) {
      return <div className="text-gray-400 text-sm text-center p-4">No data available</div>
    }

    // Format the number for display
    const formattedValue =
      typeof chartData.numericValue === "number"
        ? new Intl.NumberFormat("en-US").format(chartData.numericValue)
        : chartData.numericValue.toString()

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-lg font-semibold mb-2">{chartName}</div>
        <div className="text-5xl font-bold">{formattedValue}</div>
      </div>
    )
  }

  const renderChart = () => {
    if (!chartData) return null

    // Handle special chart types first
    if (chartType === "table") {
      return renderTableChart()
    }

    if (chartType === "numeric") {
      return renderNumericChart()
    }

    // Handle standard chart types
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
