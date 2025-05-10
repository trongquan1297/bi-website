"use client"

import { useState, useEffect } from "react"
import {
  X,
  Plus,
  Calendar,
  Filter,
  Hash,
  Clock,
  CheckSquare,
  AlignLeft,
  BarChart,
  Pencil,
  Save,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { fetchWithAuth } from "@/lib/api"
import { cn } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

export interface FilterCondition {
  datasetId: string
  datasetName: string
  column: string
  columnType: string
  operator: string
  value: string
  applyToCharts: number[] // Array of chart IDs this filter applies to
}

interface FilterBuilderProps {
  onApplyFilters: (filters: FilterCondition[]) => void
  activeFilters: FilterCondition[]
  dashboardCharts?: DashboardChart[]
}

interface Dataset {
  id: string
  name: string
  schema: string
  table: string
}

interface Column {
  name: string
  type: string
}

export interface DashboardChart {
  id: number
  name: string
  chart_type: string
  dataset_id: string | number
}

export function FilterBuilder({ onApplyFilters, activeFilters = [], dashboardCharts = [] }: FilterBuilderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [filters, setFilters] = useState<FilterCondition[]>(activeFilters)
  const [isLoading, setIsLoading] = useState(false)
  const [editingFilterIndex, setEditingFilterIndex] = useState<number | null>(null)

  // Current filter being built
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [selectedDatasetName, setSelectedDatasetName] = useState<string>("")
  const [selectedDatasetSchema, setSelectedDatasetSchema] = useState<string>("")
  const [selectedDatasetTable, setSelectedDatasetTable] = useState<string>("")
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [selectedColumnType, setSelectedColumnType] = useState<string>("")
  const [selectedOperator, setSelectedOperator] = useState<string>("")
  const [filterValue, setFilterValue] = useState<string>("")
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined)
  const [endDateValue, setEndDateValue] = useState<Date | undefined>(undefined)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEndDatePickerOpen, setIsEndDatePickerOpen] = useState(false)
  const [selectedCharts, setSelectedCharts] = useState<number[]>([])
  const [showChartSelector, setShowChartSelector] = useState(false)

  // Load datasets when component mounts
  useEffect(() => {
    fetchDatasets()
  }, [])

  // Load columns when dataset changes
  useEffect(() => {
    if (selectedDataset && selectedDatasetTable && selectedDatasetSchema) {
      fetchColumns(selectedDatasetTable, selectedDatasetSchema)
    } else {
      setColumns([])
    }
  }, [selectedDataset, selectedDatasetSchema, selectedDatasetTable])

  // Reset filter form when popover closes
  useEffect(() => {
    if (!isOpen) {
      resetFilterForm()
      setEditingFilterIndex(null)
    }
  }, [isOpen])

  // Initialize filters from activeFilters prop
  useEffect(() => {
    setFilters(activeFilters)
  }, [activeFilters])

  // Filter charts by dataset when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      // Auto-select charts that match the selected dataset
      const matchingCharts = dashboardCharts
        .filter((chart) => chart.dataset_id.toString() === selectedDataset)
        .map((chart) => chart.id)

      setSelectedCharts(matchingCharts)
      setShowChartSelector(matchingCharts.length > 0)
    } else {
      setSelectedCharts([])
      setShowChartSelector(false)
    }
  }, [selectedDataset, dashboardCharts])

  const fetchDatasets = async () => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/datasets/get`)
      if (!response.ok) {
        throw new Error(`Failed to fetch datasets: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.datasets) {
        setDatasets(
          data.datasets.map((dataset: any) => ({
            id: dataset.id.toString(),
            name: dataset.name,
            schema: dataset.schema_name || "public",
            table: dataset.table_name,
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching datasets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchColumns = async (tableName: string, schemaName: string) => {
    setIsLoading(true)
    try {
      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/database/columns?table_name=${tableName}&schema_name=${schemaName}`,
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch columns: ${response.status}`)
      }
      const data = await response.json()
      if (data && data.columns) {
        setColumns(
          data.columns.map((col: any) => ({
            name: col.column_name,
            type: col.data_type.toLowerCase(),
          })),
        )
      }
    } catch (error) {
      console.error("Error fetching columns:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getOperatorsForType = (type: string) => {
    const dataType = type.toLowerCase()

    if (dataType.includes("text") || dataType.includes("char") || dataType.includes("string")) {
      return [
        { value: "equals", label: "Equals" },
        { value: "contains", label: "Contains" },
        { value: "starts with", label: "Starts with" },
        { value: "ends with", label: "Ends with" },
      ]
    } else if (
      dataType.includes("int") ||
      dataType.includes("float") ||
      dataType.includes("double") ||
      dataType.includes("decimal") ||
      dataType.includes("numeric")
    ) {
      return [
        { value: "equals", label: "Equals" },
        { value: "greater than", label: "Greater than" },
        { value: "less than", label: "Less than" },
        { value: "between", label: "Between" },
      ]
    } else if (dataType.includes("date") || dataType.includes("time") || dataType.includes("timestamp")) {
      return [
        { value: "equals", label: "Equals" },
        { value: "before", label: "Before" },
        { value: "after", label: "After" },
        { value: "between", label: "Between" },
      ]
    } else if (dataType.includes("bool")) {
      return [{ value: "equals", label: "Equals" }]
    } else {
      return [{ value: "equals", label: "Equals" }]
    }
  }

  const getDataTypeIcon = (dataType: string) => {
    const type = dataType.toLowerCase()

    if (
      type.includes("int") ||
      type.includes("float") ||
      type.includes("numeric") ||
      type.includes("decimal") ||
      type.includes("double")
    ) {
      return <Hash className="h-4 w-4 mr-2 text-blue-500" />
    } else if (type.includes("date") || type.includes("time") || type.includes("timestamp")) {
      return <Clock className="h-4 w-4 mr-2 text-amber-500" />
    } else if (type.includes("bool")) {
      return <CheckSquare className="h-4 w-4 mr-2 text-green-500" />
    } else {
      return <AlignLeft className="h-4 w-4 mr-2 text-purple-500" />
    }
  }

  const getChartTypeIcon = (chartType: string) => {
    // You can expand this with more chart type icons if needed
    return <BarChart className="h-4 w-4 mr-2 text-violet-500" />
  }

  const resetFilterForm = () => {
    setSelectedDataset("")
    setSelectedDatasetName("")
    setSelectedDatasetSchema("")
    setSelectedDatasetTable("")
    setSelectedColumn("")
    setSelectedColumnType("")
    setSelectedOperator("")
    setFilterValue("")
    setDateValue(undefined)
    setEndDateValue(undefined)
    setSelectedCharts([])
    setShowChartSelector(false)
    setEditingFilterIndex(null)
  }

  const handleDatasetChange = (value: string) => {
    setSelectedDataset(value)
    const dataset = datasets.find((d) => d.id === value)
    if (dataset) {
      setSelectedDatasetName(`${dataset.schema}.${dataset.table}`)
      setSelectedDatasetSchema(dataset.schema)
      setSelectedDatasetTable(dataset.table)
    } else {
      setSelectedDatasetName("")
      setSelectedDatasetSchema("")
      setSelectedDatasetTable("")
    }
    setSelectedColumn("")
    setSelectedColumnType("")
    setSelectedOperator("")
  }

  const handleColumnChange = (value: string) => {
    setSelectedColumn(value)
    const column = columns.find((c) => c.name === value)
    setSelectedColumnType(column?.type || "")
    setSelectedOperator("")
    setFilterValue("")
    setDateValue(undefined)
    setEndDateValue(undefined)
  }

  const handleOperatorChange = (value: string) => {
    setSelectedOperator(value)
    if (value !== "between") {
      setEndDateValue(undefined)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setDateValue(date)
    if (date) {
      setFilterValue(format(date, "yyyy-MM-dd"))
    } else {
      setFilterValue("")
    }
    setIsDatePickerOpen(false)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDateValue(date)
    if (date && dateValue) {
      setFilterValue(`${format(dateValue, "yyyy-MM-dd")}|${format(date, "yyyy-MM-dd")}`)
    }
    setIsEndDatePickerOpen(false)
  }

  const toggleChartSelection = (chartId: number) => {
    setSelectedCharts((prev) => {
      if (prev.includes(chartId)) {
        return prev.filter((id) => id !== chartId)
      } else {
        return [...prev, chartId]
      }
    })
  }

  const selectAllCharts = () => {
    const datasetCharts = dashboardCharts
      .filter((chart) => chart.dataset_id.toString() === selectedDataset)
      .map((chart) => chart.id)
    setSelectedCharts(datasetCharts)
  }

  const deselectAllCharts = () => {
    setSelectedCharts([])
  }

  const addFilter = () => {
    if (!selectedDataset || !selectedColumn || !selectedOperator || !filterValue || selectedCharts.length === 0) {
      return
    }

    const newFilter: FilterCondition = {
      datasetId: selectedDataset,
      datasetName: selectedDatasetName,
      column: selectedColumn,
      columnType: selectedColumnType,
      operator: selectedOperator,
      value: filterValue,
      applyToCharts: [...selectedCharts],
    }

    if (editingFilterIndex !== null) {
      // Update existing filter
      const updatedFilters = [...filters]
      updatedFilters[editingFilterIndex] = newFilter
      setFilters(updatedFilters)
      setEditingFilterIndex(null)
    } else {
      // Add new filter
      setFilters([...filters, newFilter])
    }

    resetFilterForm()
  }

  const editFilter = (index: number) => {
    const filter = filters[index]

    // Find the dataset
    const dataset = datasets.find((d) => d.id === filter.datasetId)

    // Set form values
    setSelectedDataset(filter.datasetId)
    setSelectedDatasetName(filter.datasetName)
    if (dataset) {
      setSelectedDatasetSchema(dataset.schema)
      setSelectedDatasetTable(dataset.table)
    }

    // Set column and operator (columns will be loaded by the useEffect)
    setSelectedColumn(filter.column)
    setSelectedColumnType(filter.columnType)
    setSelectedOperator(filter.operator)

    // Set value
    setFilterValue(filter.value)

    // Handle date values
    if (isDateType(filter.columnType)) {
      if (filter.operator === "between" && filter.value.includes("|")) {
        const [startDate, endDate] = filter.value.split("|")
        setDateValue(new Date(startDate))
        setEndDateValue(new Date(endDate))
      } else {
        setDateValue(new Date(filter.value))
      }
    }

    // Set selected charts
    setSelectedCharts(filter.applyToCharts)
    setShowChartSelector(true)

    // Set editing index
    setEditingFilterIndex(index)
  }

  const cancelEdit = () => {
    resetFilterForm()
    setEditingFilterIndex(null)
  }

  const removeFilter = (index: number) => {
    const newFilters = [...filters]
    newFilters.splice(index, 1)
    setFilters(newFilters)
  }

  const applyFilters = () => {
    onApplyFilters(filters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setFilters([])
    onApplyFilters([])
    setIsOpen(false)
  }

  const isDateType = (type: string) => {
    const dataType = type.toLowerCase()
    return dataType.includes("date") || dataType.includes("time") || dataType.includes("timestamp")
  }

  const getFilterValueInput = () => {
    if (!selectedColumnType || !selectedOperator) {
      return null
    }

    if (isDateType(selectedColumnType)) {
      if (selectedOperator === "between") {
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateValue ? format(dateValue, "PPP") : <span>Start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border shadow-lg z-50">
                  <CalendarComponent mode="single" selected={dateValue} onSelect={handleDateChange} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={isEndDatePickerOpen} onOpenChange={setIsEndDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white"
                    disabled={!dateValue}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDateValue ? format(endDateValue, "PPP") : <span>End date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border shadow-lg z-50">
                  <CalendarComponent
                    mode="single"
                    selected={endDateValue}
                    onSelect={handleEndDateChange}
                    initialFocus
                    disabled={(date) => (dateValue ? date < dateValue : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )
      }

      return (
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
              <Calendar className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border shadow-lg z-50">
            <CalendarComponent mode="single" selected={dateValue} onSelect={handleDateChange} initialFocus />
          </PopoverContent>
        </Popover>
      )
    }

    if (selectedColumnType.includes("bool")) {
      return (
        <Select value={filterValue} onValueChange={setFilterValue}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-md z-50">
            <SelectItem value="true" className="hover:bg-muted">
              True
            </SelectItem>
            <SelectItem value="false" className="hover:bg-muted">
              False
            </SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (
      selectedOperator === "between" &&
      (selectedColumnType.includes("int") ||
        selectedColumnType.includes("float") ||
        selectedColumnType.includes("double") ||
        selectedColumnType.includes("decimal") ||
        selectedColumnType.includes("numeric"))
    ) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min value"
            value={filterValue.split("|")[0] || ""}
            onChange={(e) => {
              const min = e.target.value
              const max = filterValue.includes("|") ? filterValue.split("|")[1] : ""
              setFilterValue(`${min}${max ? "|" + max : ""}`)
            }}
            className="bg-white"
          />
          <span>to</span>
          <Input
            type="number"
            placeholder="Max value"
            value={filterValue.split("|")[1] || ""}
            onChange={(e) => {
              const min = filterValue.includes("|") ? filterValue.split("|")[0] : ""
              const max = e.target.value
              setFilterValue(`${min || ""}|${max}`)
            }}
            className="bg-white"
          />
        </div>
      )
    }

    const isNumericType =
      selectedColumnType.includes("int") ||
      selectedColumnType.includes("float") ||
      selectedColumnType.includes("double") ||
      selectedColumnType.includes("decimal") ||
      selectedColumnType.includes("numeric")

    return (
      <Input
        type={isNumericType ? "number" : "text"}
        placeholder="Enter value"
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        className="bg-white"
      />
    )
  }

  const getFilterDisplayValue = (filter: FilterCondition) => {
    if (isDateType(filter.columnType)) {
      if (filter.operator === "between" && filter.value.includes("|")) {
        const [start, end] = filter.value.split("|")
        return `${start} to ${end}`
      }
      return filter.value
    }

    if (filter.operator === "between" && filter.value.includes("|")) {
      const [min, max] = filter.value.split("|")
      return `${min} to ${max}`
    }

    return filter.value
  }

  // Get chart names for a filter
  const getChartNamesForFilter = (chartIds: number[]) => {
    if (!chartIds || chartIds.length === 0) return "No charts"

    const chartNames = chartIds.map((id) => {
      const chart = dashboardCharts.find((c) => c.id === id)
      return chart ? chart.name : `Chart ${id}`
    })

    if (chartNames.length <= 2) {
      return chartNames.join(", ")
    } else {
      return `${chartNames.length} charts`
    }
  }

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={filters.length > 0 ? "default" : "outline"}
            className={cn(
              "flex items-center gap-2 transition-all",
              filters.length > 0 && "bg-primary/90 hover:bg-primary/80",
            )}
          >
            <Filter className="h-4 w-4" />
            Advanced Filter
            {filters.length > 0 && (
              <Badge variant="outline" className="ml-1 bg-white text-primary border-white">
                {filters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0 bg-white border shadow-lg z-50">
          <div className="p-4 border-b bg-muted/30">
            <h4 className="font-medium text-lg flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {editingFilterIndex !== null ? "Edit Filter" : "Build Filter"}
            </h4>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Dataset selector */}
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Dataset</label>
              <Select value={selectedDataset} onValueChange={handleDatasetChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50">
                  {datasets.map((dataset) => (
                    <SelectItem
                      key={dataset.id}
                      value={dataset.id}
                      className="hover:bg-primary/10 transition-colors cursor-pointer rounded px-2 py-1.5 my-0.5"
                    >
                      <span className="font-medium">{dataset.schema}</span>
                      <span className="text-muted-foreground">.</span>
                      <span>{dataset.table}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column selector */}
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Column</label>
              <Select value={selectedColumn} onValueChange={handleColumnChange} disabled={!selectedDataset}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md z-50 max-h-[300px]">
                  {columns.map((column) => (
                    <SelectItem
                    key={column.name}
                    value={column.name}
                    className="hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        {getDataTypeIcon(column.type)}
                        <span>{column.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operator and Value in a flex row */}
            <div className="flex gap-3">
              {/* Operator selector */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block text-muted-foreground">Operator</label>
                <Select value={selectedOperator} onValueChange={handleOperatorChange} disabled={!selectedColumn}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-md z-50">
                    {getOperatorsForType(selectedColumnType).map((op) => (
                      <SelectItem
                        key={op.value}
                        value={op.value}
                        className="hover:bg-primary/10 transition-colors cursor-pointer rounded px-2 py-1.5 my-0.5"
                      >
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Value input */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block text-muted-foreground">Value</label>
                {getFilterValueInput()}
              </div>
            </div>

            {/* Chart selector */}
            {showChartSelector && (
              <div className="bg-muted/30 p-3 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-muted-foreground">Apply to Charts</label>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllCharts}
                      className="h-6 text-xs hover:bg-primary/10 transition-colors"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAllCharts}
                      className="h-6 text-xs hover:bg-primary/10 transition-colors"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-md max-h-[150px] overflow-y-auto border">
                  {dashboardCharts
                    .filter((chart) => chart.dataset_id.toString() === selectedDataset)
                    .map((chart) => (
                      <div
                        key={chart.id}
                        className="flex items-center space-x-2 py-1.5 px-2 rounded hover:bg-primary/10 transition-colors cursor-pointer"
                        onClick={() => toggleChartSelection(chart.id)}
                      >
                        <Checkbox
                          id={`chart-${chart.id}`}
                          checked={selectedCharts.includes(chart.id)}
                          onCheckedChange={() => toggleChartSelection(chart.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label
                          htmlFor={`chart-${chart.id}`}
                          className="text-sm flex items-center cursor-pointer flex-1"
                        >
                          {getChartTypeIcon(chart.chart_type)}
                          {chart.name}
                        </label>
                      </div>
                    ))}
                </div>
                {selectedCharts.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Please select at least one chart</p>
                )}
              </div>
            )}

            {/* Action buttons for form */}
            <div className="flex gap-2 pt-2">
              {editingFilterIndex !== null ? (
                <>
                  <Button
                    onClick={addFilter}
                    disabled={
                      !selectedDataset ||
                      !selectedColumn ||
                      !selectedOperator ||
                      !filterValue ||
                      selectedCharts.length === 0
                    }
                    className="flex-1 bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} className="flex-1 hover:bg-muted/50 transition-colors">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={addFilter}
                  disabled={
                    !selectedDataset ||
                    !selectedColumn ||
                    !selectedOperator ||
                    !filterValue ||
                    selectedCharts.length === 0
                  }
                  className="w-full bg-primary hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              )}
            </div>

            {/* Active filters */}
            {filters.length > 0 && (
              <>
                <Separator className="my-4" />

                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <Check className="h-4 w-4 mr-2" />
                    Active Filters
                    <Badge variant="outline" className="ml-2 bg-primary/10">
                      {filters.length}
                    </Badge>
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {filters.map((filter, index) => (
                      <div
                        key={index}
                        className={cn(
                          "bg-muted/30 p-3 rounded-md border border-transparent transition-all hover:border-primary/20",
                          editingFilterIndex === index && "border-primary/30 bg-primary/5",
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm flex items-center">
                            {getDataTypeIcon(filter.columnType)}
                            <span>{filter.column}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => editFilter(index)}
                              className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFilter(index)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm">
                          <div className="flex flex-wrap gap-x-1 text-muted-foreground">
                            <span className="font-medium text-foreground">{filter.datasetName}</span>
                            <span>where</span>
                            <span className="font-medium text-foreground">{filter.column}</span>
                            <span>{filter.operator}</span>
                            <span className="font-medium text-foreground">{getFilterDisplayValue(filter)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center">
                            <BarChart className="h-3 w-3 mr-1 inline" />
                            Applied to: {getChartNamesForFilter(filter.applyToCharts)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with action buttons */}
          <div className="p-3 border-t bg-muted/30 flex justify-between">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={filters.length === 0}
              className="hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Clear All
            </Button>
            <Button
              onClick={applyFilters}
              disabled={filters.length === 0}
              className="bg-primary hover:bg-primary/90 transition-colors"
            >
              Apply Filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Display active filters outside the popover */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.map((filter, index) => (
            <Badge
              key={index}
              variant="outline"
              className="flex items-center gap-1 bg-primary/10 py-1 px-2 hover:bg-primary/15 transition-colors"
            >
              <span className="font-medium">{filter.datasetName}</span>
              <span className="opacity-70"> / </span>
              <span>{filter.column}</span>
              <span className="opacity-70"> {filter.operator} </span>
              <span className="font-medium">{getFilterDisplayValue(filter)}</span>
              <span className="text-xs opacity-70 ml-1">({getChartNamesForFilter(filter.applyToCharts)})</span>
              <button
                onClick={() => {
                  const newFilters = [...filters]
                  newFilters.splice(index, 1)
                  setFilters(newFilters)
                  onApplyFilters(newFilters)
                }}
                className="ml-1 text-muted-foreground hover:text-foreground hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10 px-2 py-1 rounded flex items-center transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
