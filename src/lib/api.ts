import { refreshToken, waitForRefresh } from "./token-refresh"

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

/**
 * Fetch with authentication handling.
 * Automatically handles token refresh on 401 responses.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Ensure we're not in the middle of a token refresh
  await waitForRefresh()

  // Prepare the full URL
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`

  // Set default options
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }

  // Make the initial request
  let response = await fetch(url, fetchOptions)

  // If we get a 401, try to refresh the token and retry the request
  if (response.status === 401) {
    console.log(`Got 401 from ${endpoint}, attempting token refresh`)

    const refreshSuccess = await refreshToken()

    if (refreshSuccess) {
      console.log(`Token refresh successful, retrying request to ${endpoint}`)
      // Retry the original request with the new token
      response = await fetch(url, fetchOptions)

      // If we still get a 401 after refresh, redirect to login
      if (response.status === 401) {
        console.log(`Still got 401 after token refresh, redirecting to login`)
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
      }
    } else {
      console.log("Token refresh failed, redirecting to login")
      // If refresh failed, redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  return response
}

/**
 * Fetches data with authentication and parses JSON response
 */
export async function fetchWithAuthJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(endpoint, options)

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  return response.json()
}
