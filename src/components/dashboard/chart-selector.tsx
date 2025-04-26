"use client"

import { useState } from "react"
import { X, Search, BarChart, LineChart, PieChart } from "lucide-react"

interface ChartSelectorProps {
  charts: any[]
  onSelect: (chartId: number) => void
  onClose: () => void
}

export function ChartSelector({ charts, onSelect, onClose }: ChartSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filter charts by search term and chart type
  const filteredCharts = charts.filter((chart) => {
    const matchesSearch = chart.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = activeTab === "all" || chart.chart_type === activeTab
    return matchesSearch && matchesType
  })

  // Get chart icon based on type
  const getChartIcon = (type: string) => {
    switch (type) {
      case "line":
        return <LineChart className="h-5 w-5" />
      case "bar":
        return <BarChart className="h-5 w-5" />
      case "pie":
        return <PieChart className="h-5 w-5" />
      default:
        return <BarChart className="h-5 w-5" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a Chart</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Search and filter */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search charts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Chart type tabs */}
          <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("all")}
                className={`py-2 px-4 inline-flex items-center text-sm font-medium border-b-2 ${
                  activeTab === "all"
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setActiveTab("line")}
                className={`py-2 px-4 inline-flex items-center text-sm font-medium border-b-2 ${
                  activeTab === "line"
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <LineChart className="h-4 w-4 mr-2" />
                Line
              </button>
              <button
                onClick={() => setActiveTab("bar")}
                className={`py-2 px-4 inline-flex items-center text-sm font-medium border-b-2 ${
                  activeTab === "bar"
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Bar
              </button>
              <button
                onClick={() => setActiveTab("pie")}
                className={`py-2 px-4 inline-flex items-center text-sm font-medium border-b-2 ${
                  activeTab === "pie"
                    ? "border-violet-500 text-violet-600 dark:text-violet-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <PieChart className="h-4 w-4 mr-2" />
                Pie
              </button>
            </nav>
          </div>

          {/* Chart list */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCharts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No charts found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredCharts.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => onSelect(chart.id)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-violet-100 dark:bg-violet-900/20 rounded-md text-violet-600 dark:text-violet-400 mr-3">
                        {getChartIcon(chart.chart_type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{chart.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Dataset ID: {chart.dataset_id} • Last updated:{" "}
                          {new Date(chart.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
