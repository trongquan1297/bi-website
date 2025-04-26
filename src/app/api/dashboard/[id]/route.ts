import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`http://localhost:8000/api/dashboards/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Error fetching dashboard: ${response.status}`)
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
    console.error(`Error fetching dashboard ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`http://localhost:8000/api/dashboards/${id}`, {
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
          { error: errorData.message || `Failed to update dashboard: ${response.status}` },
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
    console.error(`Error updating dashboard ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to update dashboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const authHeader = request.headers.get("authorization")

    // Create controller for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(`http://localhost:8000/api/dashboards/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        return NextResponse.json(
          { error: errorData.message || `Failed to delete dashboard: ${response.status}` },
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
    console.error(`Error deleting dashboard ${params.id}:`, error)
    return NextResponse.json(
      {
        error: "Failed to delete dashboard",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
