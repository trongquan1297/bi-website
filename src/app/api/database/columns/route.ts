import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.BI_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  try {
    // Lấy token từ request headers
    const authHeader = request.headers.get("authorization")

    // Lấy table_name và schema_name từ query params
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table_name")
    const schemaName = searchParams.get("schema_name")

    if (!tableName || !schemaName) {
      return NextResponse.json({ error: "table_name and schema_name are required" }, { status: 400 })
    }

    // Tạo controller để có thể hủy request nếu cần
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 giây timeout

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/database/columns?table_name=${encodeURIComponent(
          tableName,
        )}&schema_name=${encodeURIComponent(schemaName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          signal: controller.signal,
        },
      )

      clearTimeout(timeoutId)

      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out. The server took too long to respond." }, { status: 504 })
      }
      throw error
    }
  } catch (error) {
    console.error("Error fetching columns:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch columns",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
