"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Users, Shield } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface IUser {
  username: string
  avatar_url?: string
}

interface Group {
  id: number
  name: string
}

interface AddPermissionModalProps {
  isOpen: boolean
  onClose: () => void
  datasetId: number
  onSuccess: () => void
}

export function AddPermissionModal({ isOpen, onClose, datasetId, onSuccess }: AddPermissionModalProps) {
  const [entityType, setEntityType] = useState<"user" | "group">("user")
  const [entityId, setEntityId] = useState("")
//   const [permissionType, setPermissionType] = useState<"read" | "write">("read")
  const [permissionType, setPermissionType] = useState<"read" >("read")
  const [users, setUsers] = useState<IUser[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [entitiesError, setEntitiesError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()

  // Fetch users or groups based on entity type
  useEffect(() => {
    if (!isOpen) return

    const fetchEntities = async () => {
      setIsLoadingEntities(true)
      setEntitiesError(null)
      setEntityId("")

      try {
        if (entityType === "user") {
          const response = await fetchWithAuth("/api/users")
          const data = await response.json()
          setUsers(data || [])
        } else {
          const response = await fetchWithAuth("/api/groups")
          const data = await response.json()
          setGroups(data || [])
        }
      } catch (err) {
        console.error(`Error fetching ${entityType}s:`, err)
        setEntitiesError(`Failed to load ${entityType}s. Please try again.`)
      } finally {
        setIsLoadingEntities(false)
      }
    }

    fetchEntities()
  }, [entityType, isOpen])

  // Handle form submission
  const handleSubmit = async () => {
    if (!entityId || !permissionType) return

    setIsSubmitting(true)
    try {
      const response = await fetchWithAuth("/api/datasets/grant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          entity_type: entityType,
          entity_id: entityId,
          permission_type: permissionType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add permission")
      }

      toast({
        title: "Permission added",
        description: `Successfully granted ${permissionType} permission to ${entityType} ${entityId}.`,
      })

      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error adding permission:", err)
      toast({
        title: "Error",
        description: "Failed to add permission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when modal is closed
  const handleClose = () => {
    if (!isSubmitting) {
      setEntityType("user")
      setEntityId("")
      setPermissionType("read")
      onClose()
    }
  }

  // Get initials from username
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Permission</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Entity Type Selection */}
          <div className="grid gap-2">
            <Label htmlFor="entity-type">Entity Type</Label>
            <RadioGroup
              id="entity-type"
              value={entityType}
              onValueChange={(value) => setEntityType(value as "user" | "group")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user" className="flex items-center cursor-pointer">
                  <Users className="h-4 w-4 mr-2 text-blue-600" />
                  User
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="group" id="group" />
                <Label htmlFor="group" className="flex items-center cursor-pointer">
                  <Users className="h-4 w-4 mr-2 text-green-600" />
                  Group
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Entity Selection */}
          <div className="grid gap-2">
            <Label htmlFor="entity-id">{entityType === "user" ? "Select User" : "Select Group"}</Label>
            <Select value={entityId} onValueChange={setEntityId} disabled={isLoadingEntities}>
              <SelectTrigger id="entity-id" className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingEntities
                      ? `Loading ${entityType}s...`
                      : entityType === "user"
                        ? "Select a user"
                        : "Select a group"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {entitiesError ? (
                  <div className="p-2 text-center text-sm text-red-500">{entitiesError}</div>
                ) : entityType === "user" ? (
                  users.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">No users found</div>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.username} value={user.username}>
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            {user.avatar_url ? (
                              <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                            ) : (
                              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                            )}
                          </Avatar>
                          {user.username}
                        </div>
                      </SelectItem>
                    ))
                  )
                ) : groups.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">No groups found</div>
                ) : (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.name.toString()}>
                      <div className="flex items-center">
                        <div className="bg-green-100 p-1 rounded-full mr-2">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        {group.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Permission Type Selection */}
          <div className="grid gap-2">
            <Label htmlFor="permission-type">Permission Type</Label>
            <Select
              value={permissionType}
            //   onValueChange={(value) => setPermissionType(value as "read" | "write")}
              onValueChange={(value) => setPermissionType(value as "read")}
            >
              <SelectTrigger id="permission-type">
                <SelectValue placeholder="Select permission type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-1 rounded-full mr-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    Read
                  </div>
                </SelectItem>
                {/* <SelectItem value="write">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-1 rounded-full mr-2">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    Write
                  </div>
                </SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!entityId || isSubmitting}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSubmitting ? "Adding..." : "Add Permission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
