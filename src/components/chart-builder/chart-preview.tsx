"use client"

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
  RadialLinearScale,
  Filler,
  PointElement as ScatterElement,
} from "chart.js"
import { Line, Bar, Pie, Doughnut, Scatter, Radar, PolarArea } from "react-chartjs-2"
import type { ChartData, ChartType } from "./types"

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  ScatterElement,
  Title,
  Tooltip,
  Legend,
)

interface ChartPreviewProps {
  data: ChartData | null
  isLoading: boolean
  chartType: ChartType
  showLegend?: boolean
  colorScheme?: string
  chartName?: string
}

export function ChartPreview({
  data: previewData,
  isLoading,
  chartType,
  showLegend = true,
  colorScheme = "tableau10",
  chartName = "Chart Preview",
}: ChartPreviewProps) {
  
  // Get color scheme based on the selected option
  const getColorScheme = () => {
    const colorSchemes = {
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

    return colorSchemes[colorScheme] || colorSchemes.tableau10
  }

  // Render chart based on type and data
  const renderChart = () => {
    if (!previewData) return null

    const colors = getColorScheme()
    let chartData

    if (previewData.datasets) {
      // Multi-series data format
      chartData = {
        labels: previewData.labels,
        datasets: previewData.datasets.map((dataset, index) => ({
          label: dataset.label || `Dataset ${index + 1}`,
          data: dataset.data || [],
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace("0.7", "1"), // Adjust alpha for border
          borderWidth: 1,
          fill: chartType === "area" ? true : undefined,
        })),
      }
    } else {
      // Single-series data format
      chartData = {
        labels: previewData.labels,
        datasets: [
          {
            label: "Value",
            data: previewData.values || [],
            backgroundColor: colors,
            borderColor: colors.map((color: string) => color.replace("0.7", "1")),
            borderWidth: 1,
            fill: chartType === "area" ? true : undefined,
          },
        ],
      }
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
          display: showLegend,
        },
        title: {
          display: true,
          text: chartName || "Chart Preview",
        },
      },
      scales:
        chartType !== "pie" && chartType !== "doughnut" && chartType !== "polarArea"
          ? {
              x: {
                display: true,
                title: {
                  display: true,
                },
              },
              y: {
                display: true,
                title: {
                  display: true,
                },
                beginAtZero: true,
              },
            }
          : undefined,
    }

    switch (chartType) {
      case "line":
        return <Line data={chartData} options={options} />
      case "bar":
        return <Bar data={chartData} options={options} />
      case "pie":
        return <Pie data={chartData} options={options} />
      case "doughnut":
        return <Doughnut data={chartData} options={options} />
      case "scatter":
        return <Scatter data={chartData} options={options} />
      case "radar":
        return <Radar data={chartData} options={options} />
      case "polarArea":
        return <PolarArea data={chartData} options={options} />
      case "area":
        // For area charts, we need to set fill: true
        return <Line data={chartData} options={options} />
      default:
        return <Bar data={chartData} options={options} />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 h-[500px] flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading preview...</p>
        </div>
      ) : previewData ? (
        renderChart()
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>Configure your chart and click "Generate Preview" to see a preview</p>
        </div>
      )}
    </div>
  )
}
