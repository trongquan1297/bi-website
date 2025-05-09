"use client"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { DroppableZone } from "./droppable-zone"
import { DroppedColumn } from "./dropped-column"
import { FilterItem } from "./filter-item"
import { ChartPreview } from "./chart-preview"
import { ChartTypeSelector } from "./chart-type-selector"
import { DatasetSelector } from "./dataset-selector"
import { ColumnsList } from "./columns-list"
import type { Column, Dataset, ChartData, Filter, ChartType } from "./types"
import { fetchDatasets, fetchColumns, fetchChartById, createChartPreview, saveChart } from "./chart-api"

interface ChartBuilderProps {
  onClose: () => void
  onSave: () => void
  editChartId?: number | null
  isFullPage?: boolean
}

export function ChartBuilder({ onClose, onSave, editChartId = null, isFullPage = false }: ChartBuilderProps) {
  // Data states
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [columns, setColumns] = useState<Column[]>([])

  // Chart configuration states
  const [chartName, setChartName] = useState("")
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [xAxisColumns, setXAxisColumns] = useState<Column[]>([])
  const [metricsColumns, setMetricsColumns] = useState<Column[]>([])
  const [dimensionColumn, setDimensionColumn] = useState<Column | null>(null)
  const [filters, setFilters] = useState<Record<string, Filter>>({})

  // UI states
  const [previewData, setPreviewData] = useState<ChartData | null>(null)
  const [isFetchingDatasets, setIsFetchingDatasets] = useState(false)
  const [isFetchingColumns, setIsFetchingColumns] = useState(false)
  const [isFetchingChartData, setIsFetchingChartData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Add state for new chart options
  const [limit, setLimit] = useState<number>(10)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [colorScheme, setColorScheme] = useState<string>("tableau10")
  const [showLegend, setShowLegend] = useState<boolean>(true)

  // Determine if dimension selector should be shown
  const showDimensionSelector = ["bar", "line", "area"].includes(chartType)

  // Determine if chart type supports multiple metrics
  const supportsMultipleMetrics = !["pie", "donut", "numeric"].includes(chartType)

  // Get column names for table headers
  const getXAxisLabel = () => {
    return xAxisColumns.length > 0 ? xAxisColumns[0].column_name : "Labels"
  }

  const getMetricsLabels = () => {
    return metricsColumns.map((col) => {
      const aggregation = col.aggregation || "SUM"
      return `${aggregation}(${col.column_name})`
    })
  }

  // Fetch datasets when component mounts
  useEffect(() => {
    loadDatasets()

    // Set edit mode if editChartId is provided
    if (editChartId) {
      setIsEditMode(true)
      loadChartData(editChartId)
    }
  }, [editChartId])

  // Fetch columns when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      loadColumns(selectedDataset.table_name, selectedDataset.schema_name)
    } else {
      setColumns([])
    }
  }, [selectedDataset])

  // Load datasets
  const loadDatasets = async () => {
    setIsFetchingDatasets(true)
    setError(null)

    try {
      const data = await fetchDatasets()
      setDatasets(data)

      // If not in edit mode and datasets are available, select the first one
      if (!isEditMode && data.length > 0) {
        setSelectedDataset(data[0])
      }
    } catch (error) {
      console.error("Error loading datasets:", error)
      setError(error instanceof Error ? error.message : "Could not fetch datasets")
    } finally {
      setIsFetchingDatasets(false)
    }
  }

  // Load columns
  const loadColumns = async (tableName: string, schemaName: string) => {
    setIsFetchingColumns(true)
    setError(null)

    try {
      const data = await fetchColumns(tableName, schemaName)
      setColumns(data)

      // Auto-select columns for new charts (not in edit mode)
      if (!isEditMode && data.length > 0) {
        // Find a suitable column for label (prefer string/date)
        const labelColumn =
          data.find(
            (col: Column) =>
              col.data_type.includes("char") ||
              col.data_type.includes("text") ||
              col.data_type.includes("date") ||
              col.data_type.includes("time"),
          ) || data[0]

        // Find a suitable column for value (prefer numeric)
        const valueColumn =
          data.find(
            (col: Column) =>
              col.data_type.includes("int") ||
              col.data_type.includes("float") ||
              col.data_type.includes("numeric") ||
              col.data_type.includes("decimal") ||
              col.data_type.includes("bigint"),
          ) || (data.length > 1 ? data[1] : data[0])

        setXAxisColumns([labelColumn])
        setMetricsColumns([{ ...valueColumn, aggregation: "SUM" }])
      }
    } catch (error) {
      console.error("Error loading columns:", error)
      setError(error instanceof Error ? error.message : "Could not fetch columns")
    } finally {
      setIsFetchingColumns(false)
    }
  }

  // Fix the loadChartData function to properly extract chart configuration
  const loadChartData = async (chartId: number) => {
    setIsFetchingChartData(true)
    setError(null)

    try {
      const data = await fetchChartById(chartId)
      console.log("Chart data loaded:", data)

      if (data && data.chart) {
        const chart = data.chart

        // Set chart name
        setChartName(chart.name || "")

        // Set chart type
        if (chart.query && chart.query.chart_type) {
          setChartType(chart.query.chart_type as ChartType)
        }

        // Find and set the dataset
        const datasetId = chart.dataset_id

        // Load datasets if not already loaded
        if (datasets.length === 0) {
          const allDatasets = await fetchDatasets()
          setDatasets(allDatasets)

          const foundDataset = allDatasets.find((d) => d.id === datasetId)
          if (foundDataset) {
            setSelectedDataset(foundDataset)

            // Load columns for this dataset
            const columnsData = await fetchColumns(foundDataset.table_name, foundDataset.schema_name)
            setColumns(columnsData)

            // Now that we have columns, set up the chart configuration
            setupChartConfiguration(chart, columnsData)
          }
        } else {
          // Datasets already loaded
          const dataset = datasets.find((d) => d.id === datasetId)
          if (dataset) {
            setSelectedDataset(dataset)

            // Load columns if not already loaded
            if (columns.length === 0) {
              const columnsData = await fetchColumns(dataset.table_name, dataset.schema_name)
              setColumns(columnsData)

              // Now that we have columns, set up the chart configuration
              setupChartConfiguration(chart, columnsData)
            } else {
              // Columns already loaded
              setupChartConfiguration(chart, columns)
            }
          }
        }

        // Set preview data if available
        if (data.data) {
          if (data.data.datasets) {
            setPreviewData({
              labels: data.data.labels || [],
              datasets: data.data.datasets,
            })
          } else if (data.data.labels && data.data.values) {
            setPreviewData({
              labels: data.data.labels,
              values: data.data.values,
            })
          } else if (data.data.labels) {
            setPreviewData({
              labels: data.data.labels,
              values: [],
            })
          }
        }
      }
    } catch (error) {
      console.error("Error loading chart data:", error)
      setError(error instanceof Error ? error.message : "Could not fetch chart data")
    } finally {
      setIsFetchingChartData(false)
    }
  }

  // Add a new helper function to set up chart configuration
  const setupChartConfiguration = (chart: any, columnsData: Column[]) => {
    console.log("Setting up chart configuration with:", chart, columnsData)

    // Set chart name
    setChartName(chart.name || "")

    // Set chart type - directly from query.chart_type
    if (chart.query && chart.query.chart_type) {
      setChartType(chart.query.chart_type as ChartType)
    }

    // Set x-axis columns (label fields)
    if (chart.query && chart.query.label_fields && chart.query.label_fields.length > 0) {
      const labelFields = chart.query.label_fields
      const xAxisCols: Column[] = []

      labelFields.forEach((labelField: string) => {
        const xAxisColumn = columnsData.find((col) => col.column_name === labelField)
        if (xAxisColumn) {
          xAxisCols.push(xAxisColumn)
        }
      })

      if (xAxisCols.length > 0) {
        setXAxisColumns(xAxisCols)
      }
    }

    // Set metrics columns
    if (chart.query && chart.query.value_fields && Array.isArray(chart.query.value_fields)) {
      const newMetricsColumns: Column[] = []

      chart.query.value_fields.forEach((valueField: string) => {
        // Parse value field to extract aggregation and column name
        // Format is typically "SUM(column_name)"
        const match = valueField.match(/^(\w+)\(([^)]+)\)$/)

        if (match && match.length === 3) {
          const aggregation = match[1]
          const columnName = match[2]

          console.log("Extracted aggregation:", aggregation, "column name:", columnName)

          const metricsColumn = columnsData.find((col) => col.column_name === columnName)
          if (metricsColumn) {
            newMetricsColumns.push({
              ...metricsColumn,
              aggregation: aggregation,
            })
          }
        } else {
          // Handle case where there's no aggregation
          const metricsColumn = columnsData.find((col) => col.column_name === valueField)
          if (metricsColumn) {
            newMetricsColumns.push({
              ...metricsColumn,
              aggregation: "SUM", // Default aggregation
            })
          }
        }
      })

      if (newMetricsColumns.length > 0) {
        setMetricsColumns(newMetricsColumns)
      }
    }

    // Set dimension column if available
    if (chart.query && chart.query.dimension_field) {
      const dimensionField = chart.query.dimension_field
      const dimensionCol = columnsData.find((col) => col.column_name === dimensionField)
      if (dimensionCol) {
        setDimensionColumn(dimensionCol)
      }
    }

    // Set filters if available
    if (chart.query && chart.query.filters) {
      const chartFilters = chart.query.filters
      const newFilters: Record<string, Filter> = {}

      Object.entries(chartFilters).forEach(([columnName, filterConfig]: [string, any]) => {
        const column = columnsData.find((col) => col.column_name === columnName)
        if (column) {
          const filterKey = `${columnName}_filter`
          newFilters[filterKey] = {
            column,
            operator: filterConfig.operator || "=",
            value: filterConfig.value || "",
            filterType: filterConfig.filterType || "custom",
          }
        }
      })

      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters)
      }
    }

    // Set chart config options
    if (chart.config) {
      if (chart.config.limit !== undefined) {
        setLimit(chart.config.limit)
      }
      if (chart.config.sortOrder) {
        setSortOrder(chart.config.sortOrder)
      }
      if (chart.config.colorScheme) {
        setColorScheme(chart.config.colorScheme)
      }
      if (chart.config.showLegend !== undefined) {
        setShowLegend(chart.config.showLegend)
      }
    }

    // Generate preview after configuration is set up
    setTimeout(() => {
      if (selectedDataset && xAxisColumns.length > 0 && metricsColumns.length > 0) {
        handleGeneratePreview()
      }
    }, 500)
  }

  // Handle dropping a column on X-axis zone
  const handleXAxisDrop = (item: Column) => {
    if (xAxisColumns.length === 0) {
      setXAxisColumns([item])
    }
  }

  // Handle dropping a column on Metrics zone
  const handleMetricsDrop = (item: Column) => {
    // Check if column already exists in metrics
    const exists = metricsColumns.some((col) => col.column_name === item.column_name)
    if (!exists) {
      // Add default aggregation for metrics
      const newColumn = { ...item, aggregation: "SUM" }

      // If chart type doesn't support multiple metrics, replace the existing one
      if (!supportsMultipleMetrics && metricsColumns.length > 0) {
        setMetricsColumns([newColumn])
      } else {
        setMetricsColumns([...metricsColumns, newColumn])
      }
    }
  }

  // Handle dropping a column on Dimension zone
  const handleDimensionDrop = (item: Column) => {
    setDimensionColumn(item)
  }

  // Handle dropping a column on Filters zone
  const handleFiltersDrop = (item: Column) => {
    // Create unique filter key
    const filterKey = `${item.column_name}_filter_${Date.now()}`

    // Check if filter already exists
    const existingFilterKeys = Object.keys(filters).filter(
      (key) => filters[key].column.column_name === item.column_name,
    )

    if (existingFilterKeys.length === 0) {
      // Create default value for filter based on data type
      let defaultValue: string | number = ""
      let defaultOperator = "="
      let filterType = "custom"

      if (item.data_type.includes("int") || item.data_type.includes("float")) {
        defaultValue = 0
      } else if (item.data_type.includes("date") || item.data_type.includes("time")) {
        defaultOperator = "between"
        defaultValue = [new Date(), new Date()] as unknown as string // Cast to string to match Filter type
        filterType = "today"
      }

      // Create a new filter object with the correct type
      const newFilter: Filter = {
        column: item,
        operator: defaultOperator,
        value: defaultValue,
        filterType,
      }

      // Update filters with the new filter
      setFilters((prevFilters) => ({
        ...prevFilters,
        [filterKey]: newFilter,
      }))
    }
  }

  // Handle changing aggregation for metrics
  const handleAggregationChange = (index: number, aggregation: string) => {
    const updatedMetrics = [...metricsColumns]
    updatedMetrics[index] = { ...updatedMetrics[index], aggregation }
    setMetricsColumns(updatedMetrics)
  }

  // Handle changing filter
  const handleFilterChange = (
    key: string,
    operator: string,
    value: string | string[] | number | Date | [Date, Date],
    filterType?: string,
  ) => {
    setFilters({
      ...filters,
      [key]: {
        ...filters[key],
        operator,
        value,
        filterType: filterType || "custom",
      },
    })
  }

  // Handle removing column from X-axis
  const handleRemoveXAxisColumn = () => {
    setXAxisColumns([])
  }

  // Handle removing column from Metrics
  const handleRemoveMetricsColumn = (index: number) => {
    const updatedMetrics = [...metricsColumns]
    updatedMetrics.splice(index, 1)
    setMetricsColumns(updatedMetrics)
  }

  // Handle removing dimension column
  const handleRemoveDimensionColumn = () => {
    setDimensionColumn(null)
  }

  // Handle removing filter
  const handleRemoveFilter = (key: string) => {
    const updatedFilters = { ...filters }
    delete updatedFilters[key]
    setFilters(updatedFilters)
  }

  // Check if the chart can be saved
  const canSaveChart = () => {
    const hasChartName = !!chartName
    const hasXAxisColumns = xAxisColumns.length > 0
    const hasMetricsColumns = metricsColumns.length > 0
    const hasPreviewData = !!previewData

    return hasChartName && hasXAxisColumns && hasMetricsColumns && hasPreviewData
  }

  // Update the handleGeneratePreview function to properly format filters
  const handleGeneratePreview = async () => {
    if (!selectedDataset || xAxisColumns.length === 0 || metricsColumns.length === 0) {
      setError("Please select a dataset, X-axis, and Metrics to create a chart")
      return
    }

    setIsPreviewLoading(true)
    setError(null)

    try {
      // Format filters for API request
      const filtersFormatted = Object.entries(filters).reduce(
        (acc, [key, filter]) => {
          acc[filter.column.column_name] = {
            operator: filter.operator,
            value: filter.value,
            filterType: filter.filterType,
          }
          return acc
        },
        {} as Record<string, any>,
      )

      console.log("Generating preview with filters:", filtersFormatted)

      const data = await createChartPreview(
        selectedDataset.id,
        chartType,
        xAxisColumns.map((col) => col.column_name),
        metricsColumns,
        filtersFormatted,
        limit,
        sortOrder,
        dimensionColumn ? dimensionColumn.column_name : null,
      )

      setPreviewData(data)
    } catch (error) {
      console.error("Error generating preview:", error)
      setError(error instanceof Error ? error.message : "An error occurred while creating chart preview")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  // Update the handleSaveChart function to properly format filters
  const handleSaveChart = async () => {
    if (!chartName) {
      setError("Please enter a chart name")
      return
    }

    if (!selectedDataset || xAxisColumns.length === 0 || metricsColumns.length === 0) {
      setError("Please select a dataset, X-axis, and Metrics to save the chart")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // Format filters for API request
      const filtersFormatted = Object.entries(filters).reduce(
        (acc, [key, filter]) => {
          acc[filter.column.column_name] = {
            operator: filter.operator,
            value: filter.value,
            filterType: filter.filterType,
          }
          return acc
        },
        {} as Record<string, any>,
      )

      console.log("Saving chart with filters:", filtersFormatted)

      await saveChart(
        chartName,
        selectedDataset.id,
        chartType,
        xAxisColumns.map((col) => col.column_name),
        metricsColumns,
        filtersFormatted,
        {
          limit,
          sortOrder,
          colorScheme,
          showLegend,
        },
        dimensionColumn ? dimensionColumn.column_name : null,
        editChartId,
      )

      // Close modal and refresh chart list
      onSave()
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "saving"} chart:`, error)
      setError(
        error instanceof Error
          ? error.message
          : `An error occurred while ${isEditMode ? "updating" : "saving"} the chart`,
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`${isFullPage ? "" : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"}`}
    >
      <div
        className={`bg-white dark:bg-gray-900 ${isFullPage ? "w-full" : "w-[95vw] max-w-6xl max-h-[90vh] rounded-lg shadow-lg"} overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editChartId ? "Edit Chart" : "Create New Chart"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Content */}
          <div
            className={`flex flex-col md:flex-row ${isFullPage ? "h-[calc(100vh-12rem)]" : "h-[70vh]"} overflow-hidden`}
          >
            {/* Left panel - Dataset and columns */}
            <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 pr-4 overflow-y-auto">
              <DatasetSelector
                datasets={datasets}
                selectedDataset={selectedDataset}
                setSelectedDataset={setSelectedDataset}
                isFetchingDatasets={isFetchingDatasets}
                isEditMode={isEditMode}
              />

              <ColumnsList columns={columns} isFetchingColumns={isFetchingColumns} />
            </div>

            {/* Middle panel - Chart configuration */}
            <div className="w-2/5 px-4 overflow-y-auto">
              <div className="mb-4">
                <label htmlFor="chartName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chart Name
                </label>
                <input
                  type="text"
                  id="chartName"
                  value={chartName}
                  onChange={(e) => setChartName(e.target.value)}
                  placeholder="Enter chart name"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <ChartTypeSelector chartType={chartType} setChartType={setChartType} />

              <DroppableZone
                title="X-Axis"
                description="Drag and drop a column to use as X-Axis"
                accept={["COLUMN"]}
                onDrop={handleXAxisDrop}
                isEmpty={xAxisColumns.length === 0}
              >
                {xAxisColumns.length > 0 && (
                  <DroppedColumn column={xAxisColumns[0]} onRemove={handleRemoveXAxisColumn} />
                )}
              </DroppableZone>

              <DroppableZone
                title="Metrics"
                description={`Drag and drop columns to use as metrics${supportsMultipleMetrics ? "" : " (only one allowed for this chart type)"}`}
                accept={["COLUMN"]}
                onDrop={handleMetricsDrop}
                isEmpty={metricsColumns.length === 0}
              >
                <div className="space-y-2">
                  {metricsColumns.map((column, index) => (
                    <DroppedColumn
                      key={`${column.column_name}-${index}`}
                      column={column}
                      onRemove={() => handleRemoveMetricsColumn(index)}
                      onAggregationChange={(aggregation) => handleAggregationChange(index, aggregation)}
                      showAggregation
                    />
                  ))}
                </div>
              </DroppableZone>

              {showDimensionSelector && (
                <DroppableZone
                  title="Dimension"
                  description="Drag and drop a column to use as dimension (optional)"
                  accept={["COLUMN"]}
                  onDrop={handleDimensionDrop}
                  isEmpty={!dimensionColumn}
                >
                  {dimensionColumn && <DroppedColumn column={dimensionColumn} onRemove={handleRemoveDimensionColumn} />}
                </DroppableZone>
              )}

              <DroppableZone
                title="Filters"
                description="Drag and drop columns to add filters"
                accept={["COLUMN"]}
                onDrop={handleFiltersDrop}
                isEmpty={Object.keys(filters).length === 0}
              >
                <div className="space-y-2">
                  {Object.entries(filters).map(([key, filter]) => (
                    <FilterItem
                      key={key}
                      column={filter.column}
                      filter={{
                        operator: filter.operator,
                        value: filter.value,
                        filterType: filter.filterType,
                      }}
                      onRemove={() => handleRemoveFilter(key)}
                      onFilterChange={(operator, value, filterType) =>
                        handleFilterChange(key, operator, value, filterType)
                      }
                    />
                  ))}
                </div>
              </DroppableZone>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Chart Options</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Limit
                    </label>
                    <input
                      type="number"
                      id="limit"
                      min="1"
                      max="1000"
                      value={limit}
                      onChange={(e) => setLimit(Math.max(1, Number.parseInt(e.target.value) || 10))}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sortOrder"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Sort Order
                    </label>
                    <select
                      id="sortOrder"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="colorScheme"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Color Scheme
                    </label>
                    <select
                      id="colorScheme"
                      value={colorScheme}
                      onChange={(e) => setColorScheme(e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="tableau10">Tableau 10</option>
                      <option value="category10">Category 10</option>
                      <option value="accent">Accent</option>
                      <option value="pastel1">Pastel 1</option>
                      <option value="set1">Set 1</option>
                      <option value="dark2">Dark 2</option>
                      {/* Add more color schemes as needed */}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="showLegend"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Show Legend
                    </label>
                    <input
                      type="checkbox"
                      id="showLegend"
                      checked={showLegend}
                      onChange={(e) => setShowLegend(e.target.checked)}
                      className="rounded border-gray-300 dark:border-gray-600 text-violet-500 focus:ring-violet-500 h-5 w-5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel - Chart preview and actions */}
            <div className="w-2/5 pl-4">
              <ChartPreview
                data={previewData}
                isLoading={isPreviewLoading}
                chartType={chartType}
                showLegend={showLegend}
                colorScheme={colorScheme}
                chartName={chartName}
                xAxisLabel={getXAxisLabel()}
                metricsLabels={getMetricsLabels()}
              />

              <div className="mt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={!selectedDataset || xAxisColumns.length === 0 || metricsColumns.length === 0}
                  className="rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate Preview
                </button>

                <button
                  type="button"
                  onClick={handleSaveChart}
                  disabled={!canSaveChart()}
                  className="rounded-md bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="flex items-center gap-2">
                      Saving...
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : isEditMode ? (
                    "Update Chart"
                  ) : (
                    "Save Chart"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
