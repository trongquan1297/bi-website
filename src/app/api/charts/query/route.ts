import { type NextRequest, NextResponse } from "next/server"

// Define types for request and response
interface ChartQueryRequest {
  dataset_id: number
  chart_type: string
  label_fields: string[]
  value_fields: string[] // Changed from value_field to value_fields to support multiple metrics
  dimension_field?: string // Added to support dimension field
  filters?: Record<
    string,
    {
      column: string
      operator: string
      value: string | number | string[] | Date | [Date, Date]
      filterType?: string
    }
  >
  limit?: number
  sort_by?: string
  sort_order?: "asc" | "desc"
}

interface ChartQueryResponse {
  labels: string[]
  values?: number[] // Optional now since we might have datasets instead
  datasets?: Array<{
    label: string
    data: number[]
  }>
  error?: string
}

// Validate the request body
function validateRequest(body: any): { isValid: boolean; error?: string } {
  if (!body) {
    return { isValid: false, error: "Request body is required" }
  }

  if (!body.dataset_id || typeof body.dataset_id !== "number") {
    return { isValid: false, error: "dataset_id is required and must be a number" }
  }

  if (!body.label_fields || !Array.isArray(body.label_fields) || body.label_fields.length === 0) {
    return { isValid: false, error: "label_fields is required and must be a non-empty array" }
  }

  // Check for either value_field (legacy) or value_fields (new format)
  if (
    (!body.value_field && !body.value_fields) ||
    (body.value_field && typeof body.value_field !== "string" && !Array.isArray(body.value_fields))
  ) {
    return { isValid: false, error: "value_field or value_fields is required" }
  }

  return { isValid: true }
}

// Process the response data - updated to handle both formats
function processResponseData(data: any): ChartQueryResponse {
  console.log("Processing response data:", data)

  // If the response has labels and datasets (multi-series format)
  if (data.labels && data.datasets && Array.isArray(data.labels) && Array.isArray(data.datasets)) {
    return {
      labels: data.labels,
      datasets: data.datasets,
    }
  }

  // If the response has labels and values (single-series format)
  if (data.labels && data.values && Array.isArray(data.labels) && Array.isArray(data.values)) {
    return {
      labels: data.labels,
      values: data.values,
    }
  }

  // If the response has labels but values is null (handle this case)
  if (data.labels && Array.isArray(data.labels) && data.values === null && data.datasets) {
    return {
      labels: data.labels,
      datasets: data.datasets,
    }
  }

  // If the response has a different structure, try to extract labels and values
  if (data.data && Array.isArray(data.data)) {
    try {
      // Attempt to extract labels and values from the data array
      const labels = data.data.map((item: any) => item.label || item.name || item.key || "")
      const values = data.data.map((item: any) => Number(item.value || item.count || 0))

      return { labels, values }
    } catch (error) {
      console.error("Error processing response data:", error)
      return {
        labels: [],
        values: [],
        error: "Failed to process response data",
      }
    }
  }

  // If we can't extract the data, return empty arrays
  console.error("Unexpected response format:", data)
  return {
    labels: [],
    values: [],
    error: "Unexpected response format",
  }
}

// Update the POST function to return the raw data
export async function POST(request: NextRequest) {
  console.log("Chart query API called")

  try {
    const body = await request.json()
    console.log("Request body:", JSON.stringify(body, null, 2))

    // Validate the request
    const validation = validateRequest(body)
    if (!validation.isValid) {
      console.error("Validation error:", validation.error)
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      console.log("Sending request to backend...")
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/charts/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Backend API error (${response.status}):`, errorText)

        try {
          // Try to parse the error as JSON
          const errorJson = JSON.parse(errorText)
          return NextResponse.json(
            { error: errorJson.message || errorJson.error || "Backend API error" },
            { status: response.status },
          )
        } catch {
          // If not JSON, return the text
          return NextResponse.json(
            { error: errorText || `Backend API error (${response.status})` },
            { status: response.status },
          )
        }
      }

      const data = await response.json()
      console.log("Backend response:", JSON.stringify(data, null, 2))

      // Just return the data directly without processing
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === "AbortError") {
        console.error("Request timeout")
        return NextResponse.json({ error: "Request timed out. The server took too long to respond." }, { status: 504 })
      }

      console.error("Fetch error:", error)
      throw error
    }
  } catch (error) {
    console.error("Error processing chart query:", error)
    return NextResponse.json(
      {
        error: "Failed to query chart data",
        message: error instanceof Error ? error.message : "Unknown error",
        labels: [],
        values: [],
      },
      { status: 500 },
    )
  }
}
