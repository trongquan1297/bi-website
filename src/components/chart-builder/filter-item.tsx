"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface FilterItemProps {
  column: {
    column_name: string
    data_type: string
  }
  filter: {
    operator: string
    value: string | string[] | number | Date | [Date, Date]
    filterType?: string
  }
  onRemove: () => void
  onFilterChange: (
    operator: string,
    value: string | string[] | number | Date | [Date, Date],
    filterType?: string,
  ) => void
  className?: string
}

export function FilterItem({ column, filter, onRemove, onFilterChange, className }: FilterItemProps) {
  const [operator, setOperator] = useState(filter.operator || "=")
  const [value, setValue] = useState<string | number>(
    Array.isArray(filter.value) ? filter.value.join(", ") : filter.value.toString(),
  )
  const [filterType, setFilterType] = useState(filter.filterType || "custom")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState<[Date, Date]>(
    Array.isArray(filter.value) && filter.value.length === 2
      ? [new Date(filter.value[0]), new Date(filter.value[1])]
      : [new Date(), new Date(Date.now() + 86400000)], // Today and tomorrow
  )
  const [activeDate, setActiveDate] = useState<"start" | "end">("start")

  const datePickerRef = useRef<HTMLDivElement>(null)

  const isDateColumn =
    column.data_type.toLowerCase().includes("date") || column.data_type.toLowerCase().includes("time")

  // Date range options
  const dateRangeOptions = [
    { label: "Custom", value: "custom" },
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "last7days" },
    { label: "Last 30 days", value: "last30days" },
    { label: "This month", value: "thisMonth" },
    { label: "Last month", value: "lastMonth" },
  ]

  // Calculate date range based on selected option
  const getDateRange = (option: string): [Date, Date] => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const last7Days = new Date(today)
    last7Days.setDate(last7Days.getDate() - 7)

    const last30Days = new Date(today)
    last30Days.setDate(last30Days.getDate() - 30)

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    switch (option) {
      case "today":
        return [today, tomorrow]
      case "yesterday":
        return [yesterday, today]
      case "last7days":
        return [last7Days, tomorrow]
      case "last30days":
        return [last30Days, tomorrow]
      case "thisMonth":
        return [firstDayOfMonth, tomorrow]
      case "lastMonth":
        return [lastMonth, lastDayOfLastMonth]
      default:
        return [today, tomorrow]
    }
  }

  // Update filter when date range option changes
  useEffect(() => {
    if (isDateColumn && filterType !== "custom") {
      const dateRange = getDateRange(filterType)
      // We need to stringify the dateRange to avoid infinite loops with object comparisons
      const currentValue =
        Array.isArray(filter.value) && filter.value.length === 2
          ? [new Date(filter.value[0]), new Date(filter.value[1])]
          : null

      // Only update if the values are actually different
      if (
        !currentValue ||
        dateRange[0].getTime() !== currentValue[0].getTime() ||
        dateRange[1].getTime() !== currentValue[1].getTime()
      ) {
        onFilterChange("between", dateRange, filterType)
      }
    }
  }, [filterType, isDateColumn, filter.value, onFilterChange])

  // Handle click outside to close date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleOperatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOperator = e.target.value
    setOperator(newOperator)

    // Convert value based on operator
    let newValue: string | string[] | number = value
    if (newOperator === "in") {
      newValue = value
        .toString()
        .split(",")
        .map((v) => v.trim())
    } else if (column.data_type.includes("int") || column.data_type.includes("float")) {
      newValue = Number(value)
    }

    onFilterChange(newOperator, newValue, filterType)
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)

    // Convert value based on operator and data type
    let processedValue: string | string[] | number = newValue
    if (operator === "in") {
      processedValue = newValue.split(",").map((v) => v.trim())
    } else if (column.data_type.includes("int") || column.data_type.includes("float")) {
      processedValue = Number(newValue)
    }

    onFilterChange(operator, processedValue, filterType)
  }

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilterType = e.target.value
    setFilterType(newFilterType)

    if (newFilterType === "custom") {
      onFilterChange("between", dateRange, newFilterType)
    } else {
      onFilterChange("between", getDateRange(newFilterType), newFilterType)
    }
  }

  const handleDateClick = () => {
    if (filterType === "custom") {
      setShowDatePicker(!showDatePicker)
    }
  }

  const handleDateSelect = (date: Date) => {
    const newDateRange = [...dateRange] as [Date, Date]

    if (activeDate === "start") {
      newDateRange[0] = date
      setActiveDate("end")
    } else {
      newDateRange[1] = date
      setShowDatePicker(false)
    }

    setDateRange(newDateRange)
    onFilterChange("between", newDateRange, "custom")
  }

  const renderCalendar = () => {
    const currentDate = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Generate days for the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const isSelected =
        (dateRange[0] && date.toDateString() === dateRange[0].toDateString()) ||
        (dateRange[1] && date.toDateString() === dateRange[1].toDateString())
      const isInRange = dateRange[0] && dateRange[1] && date >= dateRange[0] && date <= dateRange[1]

      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-sm",
            isSelected && "bg-violet-600 text-white",
            !isSelected && isInRange && "bg-violet-100 dark:bg-violet-900/20",
            !isSelected && !isInRange && "hover:bg-gray-100 dark:hover:bg-gray-700",
          )}
        >
          {i}
        </button>,
      )
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
            {day}
          </div>
        ))}
        {days}
      </div>
    )
  }

  // Get operators based on data type
  const getOperators = () => {
    const dataType = column.data_type.toLowerCase()

    if (
      dataType.includes("int") ||
      dataType.includes("float") ||
      dataType.includes("numeric") ||
      dataType.includes("decimal")
    ) {
      return [
        { value: "=", label: "=" },
        { value: "!=", label: "!=" },
        { value: ">", label: ">" },
        { value: ">=", label: ">=" },
        { value: "<", label: "<" },
        { value: "<=", label: "<=" },
        { value: "in", label: "IN" },
      ]
    } else if (dataType.includes("date") || dataType.includes("time")) {
      return [
        { value: "=", label: "=" },
        { value: "!=", label: "!=" },
        { value: ">", label: ">" },
        { value: ">=", label: ">=" },
        { value: "<", label: "<" },
        { value: "<=", label: "<=" },
        { value: "between", label: "BETWEEN" },
      ]
    } else {
      return [
        { value: "=", label: "=" },
        { value: "!=", label: "!=" },
        { value: "like", label: "LIKE" },
        { value: "in", label: "IN" },
      ]
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col space-y-2 p-3 rounded-md",
        "border border-gray-300 dark:border-gray-600",
        "bg-white dark:bg-gray-800",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{column.column_name}</div>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {isDateColumn && (
          <select
            value={filterType}
            onChange={handleDateRangeChange}
            className="flex-grow rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {(!isDateColumn || filterType === "custom") && (
          <>
            <select
              value={operator}
              onChange={handleOperatorChange}
              className="w-24 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {getOperators().map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>

            {isDateColumn && filterType === "custom" ? (
              <div className="relative flex-1">
                <div
                  onClick={handleDateClick}
                  className="flex items-center justify-between w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white cursor-pointer"
                >
                  <span>
                    {dateRange[0] && dateRange[1]
                      ? `${format(dateRange[0], "MMM d, yyyy")} - ${format(dateRange[1], "MMM d, yyyy")}`
                      : "Select date range"}
                  </span>
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>

                {showDatePicker && (
                  <div
                    ref={datePickerRef}
                    className="absolute z-10 mt-1 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-sm font-medium">{format(new Date(), "MMMM yyyy")}</div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => setActiveDate("start")}
                          className={cn(
                            "px-2 py-1 text-xs rounded",
                            activeDate === "start"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                              : "",
                          )}
                        >
                          Start
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveDate("end")}
                          className={cn(
                            "px-2 py-1 text-xs rounded",
                            activeDate === "end"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300"
                              : "",
                          )}
                        >
                          End
                        </button>
                      </div>
                    </div>
                    {renderCalendar()}
                    <div className="mt-2 text-xs text-gray-500">
                      {activeDate === "start" ? "Select start date" : "Select end date"}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={value}
                onChange={handleValueChange}
                placeholder="Value"
                className="flex-1 min-w-0 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
