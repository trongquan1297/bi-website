"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { UserCog, Search, Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {AppHeader} from "@/components/app-header"
import {AppSidebar} from "@/components/app-sidebar"

interface Role {
  id: number
  role_name: string
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isAddingRole, setIsAddingRole] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch roles from API
  const fetchRoles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchWithAuth("/api/roles")
      if (!response.ok) {
        throw new Error("Failed to fetch roles")
      }
      const data = await response.json()
      setRoles(data)
      setFilteredRoles(data)
    } catch (err) {
      setError("Failed to load roles. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Filter roles based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRoles(roles)
    } else {
      const filtered = roles.filter((role) => role.role_name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredRoles(filtered)
    }
  }, [searchQuery, roles])

  // Handle role deletion
  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!roleToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetchWithAuth(`/api/roles/${roleToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete role")
      }

      // Remove the deleted role from the state
      setRoles((prevRoles) => prevRoles.filter((role) => role.id !== roleToDelete.id))

      toast({
        title: "Role deleted",
        description: `Role "${roleToDelete?.role_name}" has been deleted successfully.`,
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    }
  }

  // Handle adding a new role
  const handleAddRole = async () => {
    // Validate role name
    if (!newRoleName.trim()) {
      setValidationError("Role name is required")
      return
    }

    setValidationError(null)
    setIsAddingRole(true)

    try {
      const response = await fetchWithAuth("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role_name: newRoleName }),
      })

      if (!response.ok) {
        throw new Error("Failed to create role")
      }

      const newRole = await response.json()

      // Add the new role to the state
      setRoles((prevRoles) => [...prevRoles, newRole])

      toast({
        title: "Role created",
        description: `Role "${newRoleName}" has been created successfully.`,
      })

      // Reset form and close dialog
      setNewRoleName("")
      setAddRoleDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to create role. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingRole(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pt-16">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Role Management</h1>
                <p className="text-muted-foreground">Define user roles and permissions</p>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setAddRoleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Role
              </Button>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search roles..."
                      className="pl-8 pr-4 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                    <Button variant="outline" size="sm" className="ml-auto" onClick={fetchRoles}>
                      Retry
                    </Button>
                  </Alert>
                )}

                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    <span className="ml-2 text-lg">Loading roles...</span>
                  </div>
                ) : (
                  <>
                    {filteredRoles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchQuery
                          ? "No roles found matching your search."
                          : "No roles found. Create your first role."}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRoles.map((role) => (
                            <TableRow key={role.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <div className="bg-violet-100 p-1.5 rounded-full mr-2">
                                    <UserCog className="h-5 w-5 text-violet-600" />
                                  </div>
                                  {role.role_name}
                                </div>
                              </TableCell>
                              <TableCell>{role.id}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(role)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete Role Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.role_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog
        open={addRoleDialogOpen}
        onOpenChange={(open) => {
          setAddRoleDialogOpen(open)
          if (!open) {
            setNewRoleName("")
            setValidationError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>Create a new role for the system.</DialogDescription>
          </DialogHeader>

          {validationError && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="role-name" className="text-right">
                Role Name
              </label>
              <Input
                id="role-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="col-span-3"
                placeholder="Enter role name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)} disabled={isAddingRole}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={isAddingRole} className="bg-violet-600 hover:bg-violet-700">
              {isAddingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
