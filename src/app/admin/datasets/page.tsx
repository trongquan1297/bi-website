"use client"

import { useState, useEffect, useCallback } from "react"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWithAuth } from "@/lib/api"
import {
  ChevronDown,
  ChevronRight,
  Database,
  Search,
  Plus,
  MoreHorizontal,
  Trash2,
  UserPlus,
  Shield,
  Users,
  User,
  Maximize2
} from "lucide-react"
import { AddPermissionModal } from "@/components/dataset/add-permission-modal"
import { AddDatasetModal } from "@/components/dataset/add-dataset-modal"

// Types
interface Dataset {
  id: number
  database: string
  table_name: string
  schema_name: string
}

interface Permission {
  id: number
  dataset_id: number
  entity_type: string
  entity_id: string
  permission_type: string
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [expandedDataset, setExpandedDataset] = useState<number | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRemovingPermission, setIsRemovingPermission] = useState<number | null>(null)
  const [permissionToRemove, setPermissionToRemove] = useState<Permission | null>(null)
  const [isRemovePermissionDialogOpen, setIsRemovePermissionDialogOpen] = useState(false)
  const [isAddPermissionModalOpen, setIsAddPermissionModalOpen] = useState(false)
  const [selectedDatasetForPermission, setSelectedDatasetForPermission] = useState<number | null>(null)
  // State cho modal thêm dataset
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { toast } = useToast()

  // Fetch datasets
  const fetchDatasets = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth("/api/datasets/get")
      const data = await response.json()
      setDatasets(data.datasets || [])
    } catch (err) {
      console.error("Error fetching datasets:", err)
      setError("Failed to load datasets. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch permissions for a dataset
  const fetchPermissions = useCallback(async (datasetId: number) => {
    setIsPermissionsLoading(true)
    setPermissionsError(null)
    try {
      const response = await fetchWithAuth(`/api/datasets/grant/${datasetId}`)
      const data = await response.json()
      setPermissions(data || [])
    } catch (err) {
      console.error(`Error fetching permissions for dataset ${datasetId}:`, err)
      setPermissionsError("Failed to load permissions. Please try again.")
    } finally {
      setIsPermissionsLoading(false)
    }
  }, [])

  // Hàm mở modal thêm dataset
  const handleOpenAddModal = () => {
    setIsAddModalOpen(true)
  }

  // Toggle dataset expansion
  const toggleDatasetExpansion = (datasetId: number) => {
    if (expandedDataset === datasetId) {
      setExpandedDataset(null)
    } else {
      setExpandedDataset(datasetId)
      fetchPermissions(datasetId)
    }
  }

  // Open add permission modal
  const handleOpenAddPermissionModal = (datasetId: number) => {
    setSelectedDatasetForPermission(datasetId)
    setIsAddPermissionModalOpen(true)
  }

  // Delete dataset
  const deleteDataset = async () => {
    if (!datasetToDelete) return

    setIsDeleting(true)
    try {
      await fetchWithAuth(`/api/datasets/${datasetToDelete.id}`, {
        method: "DELETE",
      })

      setDatasets(datasets.filter((dataset) => dataset.id !== datasetToDelete.id))
      toast({
        title: "Dataset deleted",
        description: `Dataset "${datasetToDelete.table_name}" has been deleted.`,
      })
    } catch (err) {
      console.error("Error deleting dataset:", err)
      toast({
        title: "Error",
        description: "Failed to delete dataset. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDatasetToDelete(null)
    }
  }

  // Remove permission
  const removePermission = async () => {
    if (!permissionToRemove) return

    setIsRemovingPermission(permissionToRemove.id)
    try {
      await fetchWithAuth(`/api/datasets/grant/${permissionToRemove.id}`, {
        method: "DELETE",
      })

      setPermissions(permissions.filter((p) => p.id !== permissionToRemove.id))
      toast({
        title: "Permission removed",
        description: `Permission has been removed successfully.`,
      })
    } catch (err) {
      console.error("Error removing permission:", err)
      toast({
        title: "Error",
        description: "Failed to remove permission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingPermission(null)
      setIsRemovePermissionDialogOpen(false)
      setPermissionToRemove(null)
    }
  }

  // Handle permission added successfully
  const handlePermissionAdded = () => {
    if (expandedDataset) {
      fetchPermissions(expandedDataset)
    }
  }

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(
    (dataset) =>
      dataset.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.schema_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.database.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Load datasets on component mount
  useEffect(() => {
    fetchDatasets()
  }, [fetchDatasets])

  // Get database icon
  const getDatabaseIcon = (databaseType: string) => {
    switch (databaseType.toLowerCase()) {
      case "postgres":
      case "postgresql":
        return <Database className="h-5 w-5 text-blue-600" />
      case "mysql":
        return <Database className="h-5 w-5 text-orange-600" />
      case "redshift":
        return <Database className="h-5 w-5 text-red-600" />
      case "snowflake":
        return <Database className="h-5 w-5 text-cyan-600" />
      default:
        return <Database className="h-5 w-5 text-violet-600" />
    }
  }

  // Get entity icon
  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case "user":
        return <User className="h-4 w-4 text-blue-600" />
      case "group":
        return <Users className="h-4 w-4 text-green-600" />
      default:
        return <Shield className="h-4 w-4 text-violet-600" />
    }
  }

  // Get permission badge class
  const getPermissionBadgeClass = (permissionType: string) => {
    switch (permissionType.toLowerCase()) {
      case "read":
        return "bg-blue-100 text-blue-800"
      case "write":
        return "bg-green-100 text-green-800"
      case "admin":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex h-screen c">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 px-24 pt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dataset Management</h1>
            </div>
            <Button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center px-4 py-2 bg-violet-500 text-white rounded-md hover:bg-violet-700 transition-colors "
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Dataset
            </Button>
          </div>

          <div className="bg-background rounded-lg shadow">
            <div className="p-4 flex justify-between items-center">
              <div className="text-lg font-medium"></div>
              <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search datasets..."
                  className="pl-8 pr-4 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchDatasets}>Retry</Button>
              </div>
            ) : filteredDatasets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchQuery ? "No datasets match your search." : "No datasets found."}
              </div>
            ) : (
              <div className="divide-y">
                {/* Header row */}
                <div className="grid grid-cols-[auto_1fr_auto] px-4 py-2 bg-background font-medium text-sm border-0">
                  <div className="col-span-2 pl-12">Dataset Name</div>
                  <div className="text-right pr-4">Actions</div>
                </div>

                {/* Dataset rows */}
                {filteredDatasets.map((dataset) => (
                  <div key={dataset.id} className="group bg-background border-0">
                    {/* Dataset row */}
                    <div
                      className={`grid grid-cols-[auto_1fr_auto] px-4 py-3 items-center hover:bg-muted cursor-pointer ${
                        expandedDataset === dataset.id ? "bg-muted" : ""
                      }`}
                      onClick={() => toggleDatasetExpansion(dataset.id)}
                    >
                      <div className="flex items-center">
                        <button
                          className="mr-2 h-6 w-6 rounded-full  flex items-center justify-center text-gray-500 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDatasetExpansion(dataset.id)
                          }}
                        >
                          {expandedDataset === dataset.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="bg-background p-1.5 rounded-full">{getDatabaseIcon(dataset.database)}</div>
                      </div>

                      <div className="ml-2">
                        <div className="font-medium">{dataset.table_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {dataset.database} / {dataset.schema_name}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAddPermissionModal(dataset.id)
                              }}
                            >
                              <UserPlus className="mr-2 h-4 w-4" />
                              Add Permission
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDatasetToDelete(dataset)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Dataset
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Permissions section (expanded) */}
                    {expandedDataset === dataset.id && (
                      <div className="bg-background">
                        <div className="px-4 py-2 flex items-center">
                          <Shield className="h-4 w-4 text-violet-600 mr-2" />
                          <span className="font-medium text-sm">Permissions</span>
                        </div>

                        {isPermissionsLoading ? (
                          <div className="p-4 space-y-3">
                            {[1, 2].map((i) => (
                              <div key={i} className="flex items-center space-x-4">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-[200px]" />
                              </div>
                            ))}
                          </div>
                        ) : permissionsError ? (
                          <div className="p-4 text-center ">
                            <p className="text-red-500 mb-2 text-sm">{permissionsError}</p>
                            <Button size="sm" variant="outline" onClick={() => fetchPermissions(dataset.id)}>
                              Retry
                            </Button>
                          </div>
                        ) : permissions.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground text-sm">
                            No permissions found for this dataset.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 ">
                            {permissions.map((permission) => (
                              <div
                                key={permission.id}
                                className="grid grid-cols-[1fr_auto] px-4 py-2 pl-12 items-center group/permission hover:bg-muted border-0"
                              >
                                <div className="flex items-center">
                                  <div className="bg-muted-foreground p-1 rounded-full mr-2">
                                    {getEntityIcon(permission.entity_type)}
                                  </div>
                                  <div>
                                    <div className="text-sm text-foreground">
                                      <span className="capitalize">{permission.entity_type}:</span>{" "}
                                      {permission.entity_id}
                                    </div>
                                    <div>
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${getPermissionBadgeClass(permission.permission_type)}`}
                                      >
                                        {permission.permission_type}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="opacity-0 group-hover/permission:opacity-100 transition-opacity h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          setPermissionToRemove(permission)
                                          setIsRemovePermissionDialogOpen(true)
                                        }}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remove Permission
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Modal thêm dataset */}
      <AddDatasetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchDatasets} />

      {/* Add Permission Modal */}
      {selectedDatasetForPermission && (
        <AddPermissionModal
          isOpen={isAddPermissionModalOpen}
          onClose={() => setIsAddPermissionModalOpen(false)}
          datasetId={selectedDatasetForPermission}
          onSuccess={handlePermissionAdded}
        />
      )}

      {/* Delete Dataset Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the dataset "{datasetToDelete?.table_name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteDataset} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Permission Dialog */}
      <Dialog open={isRemovePermissionDialogOpen} onOpenChange={setIsRemovePermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Permission</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to remove this permission? This action cannot be undone.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemovePermissionDialogOpen(false)}
              disabled={isRemovingPermission !== null}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={removePermission} disabled={isRemovingPermission !== null}>
              {isRemovingPermission !== null ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
