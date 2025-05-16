"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()

  // Redirect to users page by default
  useEffect(() => {
    router.push("/admin/users")
  }, [router])

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto bg-violet-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-violet-600" />
          </div>
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <CardDescription>Manage users, roles, groups, and datasets</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>Redirecting to Users management...</p>
        </CardContent>
      </Card>
    </div>
  )
}
