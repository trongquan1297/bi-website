"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { fetchWithAuth } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

interface User {
  username: string
  email: string
  active: boolean
  avatar_url?: string
}

interface FormErrors {
  username?: string
  password?: string
  email?: string
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state for creating a new user
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    email: "",
    active: true,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetchWithAuth(`${API_BASE_URL}/api/users`)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (user: User) => {
    try {
      setActionLoading(user.username)
      const newStatus = !user.active

      const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${user.username}`, {
        method: "PUT",
        body: JSON.stringify({ active: newStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update user status: ${response.status}`)
      }

      // Update local state
      setUsers(users.map((u) => (u.username === user.username ? { ...u, active: newStatus } : u)))

      toast({
        title: "User updated",
        description: `${user.username}'s status changed to ${newStatus ? "active" : "inactive"}`,
        variant: "default",
      })
    } catch (err) {
      console.error("Error updating user:", err)
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      setActionLoading(userToDelete.username)

      const response = await fetchWithAuth(`${API_BASE_URL}/api/users/${userToDelete.username}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`)
      }

      // Update local state
      setUsers(users.filter((u) => u.username !== userToDelete.username))

      toast({
        title: "User deleted",
        description: `${userToDelete.username} has been removed`,
        variant: "default",
      })

      setDeleteDialogOpen(false)
    } catch (err) {
      console.error("Error deleting user:", err)
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const validateForm = () => {
    const errors: FormErrors = {}
    let isValid = true

    // Username validation
    if (!newUser.username.trim()) {
      errors.username = "Username is required"
      isValid = false
    }

    // Password validation
    if (!newUser.password) {
      errors.password = "Password is required"
      isValid = false
    } else if (newUser.password.length < 6) {
      errors.password = "Password must be at least 6 characters"
      isValid = false
    } else {
      // Check for uppercase, lowercase, number, and special character
      const hasUpperCase = /[A-Z]/.test(newUser.password)
      const hasLowerCase = /[a-z]/.test(newUser.password)
      const hasNumber = /[0-9]/.test(newUser.password)
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newUser.password)

      if (!(hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar)) {
        errors.password = "Password must include uppercase, lowercase, number, and special character"
        isValid = false
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!newUser.email.trim()) {
      errors.email = "Email is required"
      isValid = false
    } else if (!emailRegex.test(newUser.email)) {
      errors.email = "Please enter a valid email address"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetchWithAuth(`${API_BASE_URL}/api/users`, {
        method: "POST",
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to create user: ${response.status}`)
      }

      const createdUser = await response.json()

      // Update local state
      setUsers([...users, createdUser])

      toast({
        title: "User created",
        description: `${newUser.username} has been created successfully`,
        variant: "default",
      })

      // Reset form and close dialog
      setNewUser({
        username: "",
        password: "",
        email: "",
        active: true,
      })
      setCreateDialogOpen(false)
    } catch (err) {
      console.error("Error creating user:", err)
      toast({
        title: "Creation failed",
        description: err instanceof Error ? err.message : "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNewUser({
      ...newUser,
      [name]: type === "checkbox" ? checked : value,
    })

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Get user initials for avatar fallback
  const getUserInitials = (username: string) => {
    return username
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <>
      <AppHeader />
      <AppSidebar />

      <div className="md:ml-16 pt-16 min-h-screen bg-background text-foreground">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 pr-4 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                  <Button variant="outline" className="mt-4" onClick={() => fetchUsers()}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            {searchTerm ? "No users found matching your search" : "No users found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Avatar className="h-9 w-9 mr-3">
                                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                                  <AvatarFallback className="bg-violet-100 text-violet-600">
                                    {getUserInitials(user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.username}</span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Switch
                                  checked={user.active}
                                  onCheckedChange={() => handleStatusToggle(user)}
                                  disabled={actionLoading === user.username}
                                  className="mr-2"
                                />
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    user.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {actionLoading === user.username ? (
                                    <span className="flex items-center">
                                      <span className="animate-pulse mr-1">•</span>
                                      Updating...
                                    </span>
                                  ) : user.active ? (
                                    <span className="flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactive
                                    </span>
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => openDeleteDialog(user)}
                                disabled={actionLoading === user.username}
                              >
                                {actionLoading === user.username ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.username}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={actionLoading === userToDelete?.username}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={actionLoading === userToDelete?.username}
            >
              {actionLoading === userToDelete?.username ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>Delete</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) {
            // Reset form state when dialog is closed
            setNewUser({
              username: "",
              password: "",
              email: "",
              active: true,
            })
            setFormErrors({})
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the system. All fields are required.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className={formErrors.username ? "border-red-500" : ""}
                />
                {formErrors.username && <p className="text-sm text-red-500">{formErrors.username}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={newUser.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
                  className={formErrors.password ? "border-red-500" : ""}
                />
                {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
                <p className="text-xs text-gray-500">
                  Password must be at least 6 characters and include uppercase, lowercase, number, and special
                  character.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  name="active"
                  checked={newUser.active}
                  onCheckedChange={(checked) => setNewUser({ ...newUser, active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>

            {Object.keys(formErrors).length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Please fix the errors above before submitting.</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>Create User</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
