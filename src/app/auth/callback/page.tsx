"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/app/contexts/user-context"
import { fetchWithAuth } from "@/lib/api"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL || "http://localhost:8000"

export default function Callback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setUserData } = useUser()

  useEffect(() => {
    // Simplified function to fetch user data
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data...")
        const response = await fetchWithAuth(`/api/users/me`)

        if (response.ok) {
          const userData = await response.json()
          setUserData(userData)
          return true
        }

        return false
      } catch (error) {
        console.error("Error fetching user data:", error)
        return false
      }
    }
    const handleCallback = async () => {
      try {
        // Get authorization_code and signature from URL parameters
        const authorizationCode = searchParams.get("authorization_code")
        const signature = searchParams.get("signature")

        if (!authorizationCode) {
          setError("No authorization code found in the URL")
          setIsProcessing(false)
          return
        }

        // Call the SSO callback endpoint with the authorization_code and signature
        const response = await fetch(`${API_BASE_URL}/api/auth/sso`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            authorization_code: authorizationCode,
            signature: signature || undefined,
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Authentication failed")
        }

        // Fetch user data after successful login
        await fetchUserData()
        
        router.push("/home")
      } catch (err) {
        console.error("Authentication error:", err)
        setError(err instanceof Error ? err.message : "Authentication failed")
        toast({
          title: "Authentication failed",
          description: err instanceof Error ? err.message : "An error occurred during authentication",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }

    if (searchParams.get("authorization_code")) {
      handleCallback()
    } else {
      setError("No authorization code found in the URL")
      setIsProcessing(false)
    }
  }, [searchParams, router, toast])

  if (isProcessing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Authenticating...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Authentication Error</h1>
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Authentication Successful</h1>
        <p>Redirecting you to the dashboard...</p>
      </div>
    </div>
  )
}
