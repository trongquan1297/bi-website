export interface Column {
  column_name: string
  data_type: string
  aggregation?: string
}

export interface Dataset {
  id: number
  database: string
  schema_name: string
  table_name: string
}

export interface ChartData {
  labels: string[]
  values?: number[]
  datasets?: Array<{
    label: string
    data: number[]
  }>
}

export interface Filter {
  column: Column
  operator: string
  value: string | string[] | number | Date | [Date, Date]
  filterType?: "custom" | "timeRange" | "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth"
}

export type ChartType = "bar" | "line" | "pie" | "area" | "doughnut" | "scatter" | "radar" | "polarArea"

export interface ChartConfig {
  limit: number
  sortOrder: "asc" | "desc"
  colorScheme: string
  showLegend: boolean
}

export interface DateRangeOption {
  label: string
  value: string
  getRange: () => [Date, Date]
}
