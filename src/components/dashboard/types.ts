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
  tableData?: Array<Record<string, any>>
  numericValue?: number | string
}

export interface Filter {
  column: Column
  operator: string
  value: string | string[] | number | Date | [Date, Date]
  filterType?: "custom" | "timeRange" | "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "lastMonth"
}

export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "area"
  | "doughnut"
  | "scatter"
  | "radar"
  | "polarArea"
  | "table"
  | "numeric"

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

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  type: "chart" | "text" | "title"
  content: {
    chart_id?: number
    text?: string
    style?: Record<string, string>
  }
}

export interface Dashboard {
  id?: number
  name: string
  owner?: string
  description?: string
  layout: LayoutItem[]
  created_at?: string
  updated_at?: string
  message?: string
}

export interface Chart {
  id: number
  name: string
  chart_type: ChartType
  dataset_id: number
  updated_at: string
  config?: {
    colorScheme?: string
    showLegend?: boolean
  }
}
