import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api/charts/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Backend API error (${response.status}):`, errorText)
        return NextResponse.json({ error: `Failed to fetch chart: ${response.status}` }, { status: response.status })
      }

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
    console.error(`Error fetching chart ${id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch chart",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api/charts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { error: errorData.message || `Failed to update chart: ${response.status}` },
          { status: response.status },
        )
      }

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
    console.error(`Error updating chart ${id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to update chart",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/api/charts/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof DOMException && error.name === "AbortError") {
        return NextResponse.json({ error: "Request timed out. The server took too long to respond." }, { status: 504 })
      }

      throw error
    }
  } catch (error) {
    console.error(`Error deleting chart ${id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to delete chart",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
