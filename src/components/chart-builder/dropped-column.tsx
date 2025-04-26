"use client"

import { useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface DroppedColumnProps {
  column: {
    column_name: string
    data_type: string
    aggregation?: string
  }
  onRemove: () => void
  onAggregationChange?: (aggregation: string) => void
  showAggregation?: boolean
  className?: string
}

export function DroppedColumn({
  column,
  onRemove,
  onAggregationChange,
  showAggregation = false,
  className,
}: DroppedColumnProps) {
  const [showAggregationMenu, setShowAggregationMenu] = useState(false)

  const aggregationOptions = [
    { value: "SUM", label: "SUM" },
    { value: "AVG", label: "AVG" },
    { value: "MIN", label: "MIN" },
    { value: "MAX", label: "MAX" },
    { value: "COUNT", label: "COUNT" },
  ]

  const handleAggregationSelect = (aggregation: string) => {
    if (onAggregationChange) {
      onAggregationChange(aggregation)
    }
    setShowAggregationMenu(false)
  }

  // Xác định icon dựa trên loại dữ liệu
  const getDataTypeIcon = () => {
    const dataType = column.data_type.toLowerCase()
    if (
      dataType.includes("int") ||
      dataType.includes("float") ||
      dataType.includes("numeric") ||
      dataType.includes("decimal")
    ) {
      return "# "
    } else if (dataType.includes("date") || dataType.includes("time")) {
      return "🕒 "
    } else if (dataType.includes("bool")) {
      return "✓ "
    } else {
      return "Aa "
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-md text-sm",
        "border border-gray-300 dark:border-gray-600",
        "bg-white dark:bg-gray-800",
        className,
      )}
    >
      <div className="flex items-center">
        <span className="text-gray-500 dark:text-gray-400 mr-2">{getDataTypeIcon()}</span>
        <span className="truncate">
          {showAggregation && column.aggregation ? `${column.aggregation}(${column.column_name})` : column.column_name}
        </span>
      </div>
      <div className="flex items-center">
        {showAggregation && (
          <div className="relative mr-1">
            <button
              type="button"
              onClick={() => setShowAggregationMenu(!showAggregationMenu)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            {showAggregationMenu && (
              <div className="absolute right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {aggregationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAggregationSelect(option.value)}
                      className={cn(
                        "block w-full text-left px-4 py-2 text-sm",
                        column.aggregation === option.value
                          ? "bg-violet-100 text-violet-900 dark:bg-violet-900/20 dark:text-violet-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
