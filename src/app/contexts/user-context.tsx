"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/api"

// Define the user data interface
export interface UserData {
  username: string
  email: string
  avatar_url: string | null
  role: string
}

// Create context with default values
interface UserContextType {
  userData: UserData | null
  setUserData: (data: UserData | null) => void
  isLoading: boolean
  fetchUserData: () => Promise<void>
  clearUserData: () => void
}

const defaultUserContext: UserContextType = {
  userData: null,
  setUserData: () => {},
  isLoading: false,
  fetchUserData: async () => {},
  clearUserData: () => {},
}

const UserContext = createContext<UserContextType>(defaultUserContext)

// List of public routes where we don't need to fetch user data
const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"]

// Custom hook to use the user context
export const useUser = () => useContext(UserContext)

// Provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))

  const clearUserData = () => {
    setUserData(null)
    setFetchAttempted(false)
  }

  const fetchUserData = async () => {
    // Don't fetch on public routes
    if (isPublicRoute) return

    // Don't fetch if we've already loaded user data
    if (userData) return

    // Set loading state
    setIsLoading(true)
    setFetchAttempted(true)

    try {
      console.log("Fetching user data from context")
      const response = await fetchWithAuth("/api/users/me")

      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      } else if (!isPublicRoute && typeof window !== "undefined") {
        // If we can't get user data and we're not on a public route, redirect to login
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user data when on a protected route and we haven't fetched yet
  useEffect(() => {
    if (!isPublicRoute && !fetchAttempted) {
      fetchUserData()
    }
  }, [pathname, fetchAttempted, isPublicRoute])

  // Reset fetch attempted when navigating to a public route
  useEffect(() => {
    if (isPublicRoute) {
      setFetchAttempted(false)
    }
  }, [isPublicRoute])

  return (
    <UserContext.Provider value={{ userData, setUserData, isLoading, fetchUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  )
}
