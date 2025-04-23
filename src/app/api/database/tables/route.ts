import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Lấy token từ request headers
    const authHeader = request.headers.get("authorization")

    // Lấy schema_name từ query params
    const searchParams = request.nextUrl.searchParams
    const schemaName = searchParams.get("schema_name")

    if (!schemaName) {
      return NextResponse.json({ error: "schema_name is required" }, { status: 400 })
    }

    // Tạo controller để có thể hủy request nếu cần
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 giây timeout

    try {
      const response = await fetch(
        `http://localhost:8000/api/database/tables?schema_name=${encodeURIComponent(schemaName)}`,
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
    console.error("Error fetching tables:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch tables",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
