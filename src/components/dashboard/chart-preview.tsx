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
import type { FilterCondition } from "./filter-builder"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartPreviewProps {
  chartId?: number
  chartType?: ChartType
  filters?: FilterCondition[]
}

export function ChartPreview({ chartId, chartType: initialChartType, filters = [] }: ChartPreviewProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [originalData, setOriginalData] = useState<ChartData | null>(null)
  const [chartType, setChartType] = useState<ChartType>(initialChartType || "bar")
  const [chartName, setChartName] = useState("Chart Preview")
  const [colorScheme, setColorScheme] = useState("tableau10")
  const [showLegend, setShowLegend] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartConfig, setChartConfig] = useState<any>(null)
  const [datasetId, setDatasetId] = useState<string | null>(null)
  const [chartQuery, setChartQuery] = useState<any>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)


  useEffect(() => {
    const preloadData = async () => {
      try {
        if (!chartId) {
          setIsLoading(false)
          return
        }
        await fetchChartData(chartId)
      } catch (error) {
        console.error("Error during preload:", error)
      }
    }
    preloadData()
  }, [chartId])

  // Apply filters when they change
  useEffect(() => {
    if (!chartId || filters.length === 0) {
      // If no filters, reset to original data
      if (originalData) {
        setChartData(originalData)
      }
      return
    }

    // Check if any filters apply to this chart
    const applicableFilters = filters.filter((filter) => filter.applyToCharts.includes(Number(chartId)))

    if (applicableFilters.length === 0) {
      // No filters apply to this chart
      if (originalData) {
        setChartData(originalData)
      }
      return
    }

    // Apply filters by re-querying the API
    applyFiltersToChart(chartId, applicableFilters)
  }, [filters, chartId, originalData, chartQuery])

  const fetchChartData = async (chartId: number) => {
    console.log(`[fetchChartData] called with chartId: ${chartId}`)
    console.trace("[fetchChartData] Trace of who called me")

    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const response = await fetchWithAuth(`/api/charts/${chartId}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch chart data: ${response.status}`)
      }

      const result = await response.json()
      console.log("Original chart data :", result)

      // Store chart configuration and dataset ID
      setChartConfig(result.chart.config || {})
      setDatasetId(result.chart.dataset_id?.toString() || null)
      setChartQuery(result.chart.query || {})

      // Process the data based on chart type
      let processedData: ChartData | null = null

      if (result.chart.query.chart_type === "table") {
        // For table charts, we expect the data to be in a different format
        const tableData = result.data.tableData || transformToTableData(result.data)
        console.log("Table data processed:", tableData)

        processedData = {
          labels: [],
          tableData: tableData,
        }
      } else if (result.chart.query.chart_type === "numeric") {
        // For numeric charts, we expect a single value
        processedData = {
          labels: [],
          numericValue: extractNumericValue(result.data),
        }
      } else {
        // For other chart types, use the existing format
        processedData = result.data
      }

      // Store both original and current data
      setOriginalData(processedData)
      setChartData(processedData)

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

  const applyFiltersToChart = async (chartId: number, filters: FilterCondition[]) => {
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      if (!chartQuery) {
        throw new Error("Chart query configuration not available")
      }

      // Prepare the filter parameters for the API
      const filterParams = filters.reduce(
        (acc, filter) => {
          const value =
            filter.operator === "between" && typeof filter.value === "string" ? filter.value.split("|") : filter.value

          acc[filter.column] = {
            operator: filter.operator,
            value,
            filterType: "custom",
          }

          return acc
        },
        {} as Record<string, { operator: string; value: any; filterType: string }>,
      )

      // Prepare the request body with all required fields
      const requestBody = {
        filters: filterParams,
        dataset_id: datasetId,
        chart_type: chartType,
        label_fields: chartQuery.label_fields || [],
        value_fields: chartQuery.value_fields || [],
        config: chartConfig,
      }

      console.log("Sending filter request:", requestBody)

      // Call the API with the filters
      const response = await fetchWithAuth(`${API_BASE_URL}/api/charts/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Failed to apply filters: ${response.status}`)
      }

      const result = await response.json()
      console.log("Filtered chart data response:", result)

      // Set debug info for troubleshooting
      setDebugInfo(JSON.stringify(result, null, 2))

      // Process the filtered data
      let filteredData: ChartData | null = null

      if (chartType === "table") {
        // For table charts, handle different possible response structures
        let tableData: any[] = []

        // Try different possible locations for table data
        if (result.data?.tableData && Array.isArray(result.data.tableData)) {
          tableData = result.data.tableData
        } else if (result.tableData && Array.isArray(result.tableData)) {
          tableData = result.tableData
        } else if (Array.isArray(result.data)) {
          tableData = result.data
        } else if (result.rows && Array.isArray(result.rows)) {
          // Some APIs return data as 'rows'
          tableData = result.rows
        } else if (result.data?.rows && Array.isArray(result.data.rows)) {
          tableData = result.data.rows
        } else if (result.results && Array.isArray(result.results)) {
          // Some APIs return data as 'results'
          tableData = result.results
        } else if (result.data?.results && Array.isArray(result.data.results)) {
          tableData = result.data.results
        }

        // If we still don't have table data, try to construct it from other fields
        if (tableData.length === 0) {
          tableData = transformToTableData(result.data || result)
        }

        console.log("Processed table data:", tableData)

        // Ensure we have at least an empty array if all else fails
        filteredData = {
          labels: [],
          tableData: tableData.length > 0 ? tableData : [],
        }
      } else if (chartType === "numeric") {
        // For numeric charts
        const numericValue =
          result.data?.numericValue !== undefined
            ? result.data.numericValue
            : typeof result.data === "number"
              ? result.data
              : result.value !== undefined
                ? result.value
                : 0

        filteredData = {
          labels: [],
          numericValue: numericValue,
        }
      } else {
        // For standard charts (bar, line, pie, etc.)
        // Check if the result has the expected structure
        if (result.data) {
          filteredData = result.data
        } else if (result.labels) {
          // If the result is directly the chart data
          filteredData = result
        } else {
          // Try to construct chart data from the result
          filteredData = {
            labels: result.labels || [],
            datasets: result.datasets || [],
            values: result.values || [],
          }
        }
      }

      console.log("Processed filtered data:", filteredData)
      setChartData(filteredData)
    } catch (err) {
      console.error("Error applying filters:", err)
      setError(err instanceof Error ? err.message : "Error applying filters")

      // On error, revert to original data
      if (originalData) {
        setChartData(originalData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to transform regular chart data to table format if needed
  const transformToTableData = (data: any) => {
    console.log("Transforming to table data:", data)

    if (!data) return []
    if (data.tableData && Array.isArray(data.tableData)) return data.tableData
    if (Array.isArray(data)) return data

    // If the API doesn't provide tableData directly, try to construct it
    const tableData = []

    if (data.labels && (data.values || data.datasets)) {
      // Convert from chart format to table format
      if (data.values && Array.isArray(data.values)) {
        // Simple case: one series of values
        for (let i = 0; i < data.labels.length; i++) {
          tableData.push({
            label: data.labels[i],
            value: data.values[i],
          })
        }
      } else if (data.datasets && Array.isArray(data.datasets)) {
        // Multiple series case
        for (let i = 0; i < data.labels.length; i++) {
          const row: Record<string, any> = { label: data.labels[i] }

          data.datasets.forEach((dataset: any, j: number) => {
            if (dataset && dataset.data && Array.isArray(dataset.data)) {
              row[dataset.label || `Series ${j + 1}`] = dataset.data[i]
            }
          })

          tableData.push(row)
        }
      }
    }

    // If we have a records or rows property, use that
    if (data.records && Array.isArray(data.records)) {
      return data.records
    }

    if (data.rows && Array.isArray(data.rows)) {
      return data.rows
    }

    return tableData
  }

  // Helper function to extract a numeric value from chart data
  const extractNumericValue = (data: any) => {
    if (data?.numericValue !== undefined) return data.numericValue
    if (typeof data === "number") return data

    // Try to extract a single numeric value from the data
    if (data?.values && data.values.length > 0) {
      return data.values[0]
    } else if (data?.datasets && data.datasets.length > 0 && data.datasets[0].data.length > 0) {
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
      return (
        <div className="flex flex-col gap-2 text-gray-400 text-sm text-center p-4">
          <div>No data available</div>
          {debugInfo && (
            <details className="text-left text-xs bg-gray-50 p-2 rounded border">
              <summary className="cursor-pointer font-medium">Debug Info</summary>
              <pre className="mt-2 overflow-auto max-h-[300px]">{debugInfo}</pre>
            </details>
          )}
        </div>
      )
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
    return (
      <div className="text-red-500 text-sm text-center p-4">
        {error}
        {debugInfo && (
          <details className="mt-2 text-left text-xs bg-gray-50 p-2 rounded border">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-2 overflow-auto max-h-[300px]">{debugInfo}</pre>
          </details>
        )}
      </div>
    )
  }

  return <div className="h-full">{renderChart()}</div>
}
