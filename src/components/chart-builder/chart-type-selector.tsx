"use client"

import type { ChartType } from "./types"
import {
  BarChart,
  LineChart,
  PieChart,
  DonutIcon as Doughnut,
  ScatterChartIcon as ScatterPlot,
  Radar,
  AreaChartIcon as PolarArea,
  LayoutGrid,
  Hash
} from "lucide-react"

interface ChartTypeSelectorProps {
  chartType: ChartType
  setChartType: (type: ChartType) => void
}

export function ChartTypeSelector({ chartType, setChartType }: ChartTypeSelectorProps) {
  const chartTypes = [
    { type: "bar", label: "Bar", icon: BarChart },
    { type: "line", label: "Line", icon: LineChart },
    { type: "area", label: "Area", icon: LineChart },
    { type: "pie", label: "Pie", icon: PieChart },
    { type: "doughnut", label: "Doughnut", icon: Doughnut },
    { type: "scatter", label: "Scatter", icon: ScatterPlot },
    { type: "radar", label: "Radar", icon: Radar },
    { type: "polarArea", label: "Polar Area", icon: PolarArea },
    { type: "table", label: "Table", icon: LayoutGrid },
    { type: "numeric", label: "Numeric", icon: Hash }
  ]

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chart Type</label>
      <div className="grid grid-cols-4 gap-2">
        {chartTypes.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => setChartType(item.type as ChartType)}
              className={`flex flex-col items-center justify-center p-2 rounded-md text-sm font-medium ${
                chartType === item.type
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  : "bg-white text-gray-700 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
