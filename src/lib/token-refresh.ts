// In-memory token refresh mechanism
let currentRefreshPromise: Promise<boolean> | null = null
let lastRefreshTime = 0
const REFRESH_COOLDOWN_MS = 2000 // 2 seconds cooldown between refresh attempts

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

/**
 * Refreshes the access token using the refresh token.
 * Only one refresh operation can be in progress at a time.
 */
export async function refreshToken(): Promise<boolean> {
  const now = Date.now()

  // Check if we've refreshed recently to prevent rapid successive refreshes
  if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
    console.log(`Token refresh attempted too soon (within ${REFRESH_COOLDOWN_MS}ms). Skipping.`)
    return true // Assume token is still valid if we just refreshed
  }

  // If there's already a refresh in progress, return that promise
  if (currentRefreshPromise) {
    console.log("Token refresh already in progress, reusing existing promise")
    return currentRefreshPromise
  }

  console.log("Starting token refresh...")

  // Create a new refresh promise
  currentRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      const success = response.ok
      console.log(`Token refresh ${success ? "successful" : "failed"}`)

      // Update last refresh time on success
      if (success) {
        lastRefreshTime = Date.now()
      }

      return success
    } catch (error) {
      console.error("Token refresh error:", error)
      return false
    } finally {
      // Clear the current promise after a short delay
      // This prevents multiple refresh attempts if many API calls fail at once
      setTimeout(() => {
        currentRefreshPromise = null
      }, 500)
    }
  })()

  return currentRefreshPromise
}

/**
 * Waits for any ongoing token refresh to complete.
 * Used by API calls to ensure they don't proceed until refresh is done.
 */
export async function waitForRefresh(): Promise<void> {
  if (currentRefreshPromise) {
    console.log("Waiting for ongoing token refresh to complete...")
    await currentRefreshPromise
    console.log("Token refresh completed, proceeding with request")
  }
}

/**
 * Clears the refresh state.
 * Used during logout or when resetting the auth state.
 */
export function clearRefreshState(): void {
  console.log("Clearing token refresh state")
  currentRefreshPromise = null
  lastRefreshTime = 0
}
