"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { getAuthHeader } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Clock,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const API_BASE_URL = process.env.BI_API_URL || "http://appotapay-bi-api"

interface Dashboard {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
  owner?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [username, setUsername] = useState<string>("Người dùng")
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Check authentication when component mounts
    if (!isAuthenticated()) {
      router.push("/login")
      return
    }

    // Get user info from token
    try {
      const token = localStorage.getItem("auth-token")
      if (token) {
        // Decode token to get user info
        const base64Url = token.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const payload = JSON.parse(window.atob(base64))

        // Get username from payload
        setUsername(payload.sub || payload.username || "Người dùng")

        // Get avatar URL from payload if available
        if (payload.avatar_url) {
          setAvatarUrl(payload.avatar_url)
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error)
    }

    fetchDashboards()
  }, [])

  const fetchDashboards = async () => {
    setIsLoading(true)
    setIsRefreshing(true)
    setError(null)

    try {
      const authHeader = getAuthHeader()
      const response = await fetch(`${API_BASE_URL}/api/dashboards/get`, {
        headers: {
          Authorization: authHeader,
        },
      })

      if (!response.ok) {
        throw new Error(`Error fetching dashboards: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.dashboards) {
        setDashboards(data.dashboards)
      } else {
        setDashboards([])
      }
    } catch (error) {
      console.error("Error fetching dashboards:", error)
      setError("Could not fetch dashboards. Please try again later.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleDeleteDashboard = async (id: number) => {
    if (!confirm("Are you sure you want to delete this dashboard?")) {
      return
    }

    try {
      const authHeader = getAuthHeader()
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: authHeader,
        },
      })

      if (!response.ok) {
        throw new Error(`Error deleting dashboard: ${response.status}`)
      }

      // Refresh dashboards list
      fetchDashboards()
    } catch (error) {
      console.error("Error deleting dashboard:", error)
      setError("Could not delete dashboard. Please try again later.")
    }
  }

  // Filter dashboards by search term
  const filteredDashboards = dashboards.filter((dashboard) =>
    dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-16">
        <AppHeader username={username} avatarUrl={avatarUrl} />

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-26">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <LayoutDashboard className="h-6 w-6 text-violet-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboards</h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search dashboards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button
                variant="outline"
                onClick={fetchDashboards}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button onClick={() => router.push("/dashboard/builder")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}

          {isLoading && !isRefreshing ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">Loading dashboards...</p>
              </div>
            </div>
          ) : filteredDashboards.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <LayoutDashboard className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No dashboards found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm
                  ? "No dashboards match your search criteria."
                  : "Create your first dashboard to visualize your data."}
              </p>
              <Button onClick={() => router.push("/dashboard/builder")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredDashboards.map((dashboard) => (
                      <tr key={dashboard.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <LayoutDashboard className="h-5 w-5 text-violet-500 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{dashboard.name}</div>
                              {dashboard.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {dashboard.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{dashboard.owner || username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(dashboard.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(dashboard.updated_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                              className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/builder?id=${dashboard.id}`)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                                  className="flex items-center"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/dashboard/builder?id=${dashboard.id}`)}
                                  className="flex items-center"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDashboard(dashboard.id)}
                                  className="flex items-center text-red-600 hover:text-red-700 focus:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
