import { getAuthHeader } from "@/lib/auth"
import type { Dataset, Column, ChartData, ChartType } from "./types"

// Fetch datasets from API
export async function fetchDatasets(): Promise<Dataset[]> {
  try {
    const authHeader = getAuthHeader()
    const response = await fetch("/api/datasets", {
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching datasets: ${response.status}`)
    }

    const data = await response.json()
    return data.datasets || []
  } catch (error) {
    console.error("Error fetching datasets:", error)
    throw error
  }
}

// Fetch columns from API
export async function fetchColumns(tableName: string, schemaName: string): Promise<Column[]> {
  try {
    const authHeader = getAuthHeader()
    const response = await fetch(
      `/api/database/columns?table_name=${encodeURIComponent(tableName)}&schema_name=${encodeURIComponent(schemaName)}`,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Error fetching columns: ${response.status}`)
    }

    const data = await response.json()
    return data.columns || []
  } catch (error) {
    console.error("Error fetching columns:", error)
    throw error
  }
}

// Update the fetchChartById function to properly handle the chart data
export async function fetchChartById(chartId: number) {
  try {
    const authHeader = getAuthHeader()
    const response = await fetch(`/api/charts/${chartId}`, {
      headers: {
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      throw new Error(`Error fetching chart: ${response.status}`)
    }

    const data = await response.json()
    console.log("Chart data fetched:", data) // Add logging to debug
    return data
  } catch (error) {
    console.error("Error fetching chart:", error)
    throw error
  }
}

// Update the saveChart function to properly format the request body
export async function saveChart(
  chartName: string,
  datasetId: number,
  chartType: ChartType,
  labelFields: string[],
  metricsColumns: Column[],
  filters: Record<string, any>,
  config: {
    limit: number
    sortOrder: string
    colorScheme: string
    showLegend: boolean
  },
  dimensionField: string | null = null,
  editChartId: number | null = null,
) {
  try {
    // Format value fields with aggregation
    const valueFields = metricsColumns.map((col) =>
      col.aggregation ? `${col.aggregation}(${col.column_name})` : col.column_name,
    )

    // Prepare request body
    const requestBody = {
      name: chartName,
      query: {
        dataset_id: datasetId,
        chart_type: chartType,
        label_fields: labelFields,
        value_fields: valueFields,
        filters,
        dimension_field: dimensionField || undefined,
      },
      config: {
        limit: config.limit || 10,
        sortOrder: config.sortOrder || "desc",
        colorScheme: config.colorScheme || "tableau10",
        showLegend: config.showLegend !== undefined ? config.showLegend : true,
      },
    }

    console.log(`${editChartId ? "Updating" : "Creating"} chart with data:`, requestBody)
    console.log("Body request:", JSON.stringify(requestBody, null, 2))

    // Call API to save chart
    const authHeader = getAuthHeader()
    const url = editChartId ? `/api/charts/${editChartId}` : "/api/charts"
    const method = editChartId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || `Could not ${editChartId ? "update" : "save"} chart`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error ${editChartId ? "updating" : "saving"} chart:`, error)
    throw error
  }
}

// Create chart preview
export async function createChartPreview(
  datasetId: number,
  chartType: ChartType,
  labelFields: string[],
  metricsColumns: Column[],
  filters: Record<string, any>,
  limit = 10,
  sortOrder = "desc",
  dimensionField: string | null = null,
): Promise<ChartData> {
  try {
    // Format value fields with aggregation
    const valueFields = metricsColumns.map((col) =>
      col.aggregation ? `${col.aggregation}(${col.column_name})` : col.column_name,
    )

    // Prepare request body
    const requestBody = {
      dataset_id: datasetId,
      chart_type: chartType,
      label_fields: labelFields,
      value_fields: valueFields,
      filters,
      limit,
      sort_order: sortOrder,
      dimension_field: dimensionField || undefined,
    }

    console.log("Chart preview request:", requestBody)

    // Call API to get chart data
    const authHeader = getAuthHeader()
    const response = await fetch("/api/charts/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(requestBody),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || `API error: ${response.status}`)
    }

    console.log("Chart preview response:", data)

    // Handle both response formats
    if (data.datasets) {
      // Response with dimension field (multi-series)
      return {
        labels: data.labels || [],
        datasets: data.datasets,
      }
    } else if (data.labels && data.values) {
      // Response without dimension field (single-series)
      return {
        labels: data.labels,
        values: data.values,
      }
    } else if (data.labels) {
      // Handle case where values is null but labels exist
      return {
        labels: data.labels,
        values: [],
      }
    } else {
      throw new Error(
        "No data available for the selected parameters. Try adjusting your filters or selecting different fields.",
      )
    }
  } catch (error) {
    console.error("Error creating chart preview:", error)
    throw error
  }
}
