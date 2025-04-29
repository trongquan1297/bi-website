import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const id = params.id
  
    try {
      const authHeader = request.headers.get("authorization")
  
      // Create controller for timeout handling
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/comments/${id}`, {
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
      console.error(`Error deleting comment ${id}:`, error)
      return NextResponse.json(
        {
          error: "Failed to delete comment",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  }
  