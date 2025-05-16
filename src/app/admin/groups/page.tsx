"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Users, Search, Plus, Trash2, ChevronDown, ChevronRight, UserMinus, UserPlus, Loader2, X, Shield } from "lucide-react"
import { fetchWithAuth } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { useDebounce } from "@/lib/use-debounce"
import { cn } from "@/lib/utils"

interface Group {
  id: number
  name: string
}

interface Member {
  username: string
  avatar_url: string
  is_admin: boolean
}

interface User {
  username: string
  avatar_url: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})
  const [groupMembers, setGroupMembers] = useState<Record<number, Member[]>>({})
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState<Record<number, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteGroupId, setDeleteGroupId] = useState<number | null>(null)
  const [removeMemberData, setRemoveMemberData] = useState<{ groupId: number; username: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [togglingAdmin, setTogglingAdmin] = useState<{ groupId: number; username: string } | null>(null)

  // Add member state
  const [addMemberGroupId, setAddMemberGroupId] = useState<number | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const debouncedUserSearchQuery = useDebounce(userSearchQuery, 300)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Add group state
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const newGroupInputRef = useRef<HTMLInputElement>(null)

  // Fetch groups
  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true)
      setError(null)
      try {
        const response = await fetchWithAuth("/api/groups")
        if (!response.ok) {
          throw new Error("Failed to fetch groups")
        }
        const data = await response.json()
        setGroups(data)
      } catch (err) {
        console.error("Error fetching groups:", err)
        setError("Failed to load groups. Please try again.")
      } finally {
        setLoadingGroups(false)
      }
    }

    fetchGroups()
  }, [])

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedUserSearchQuery.trim()) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const response = await fetchWithAuth(`/api/users/search?query=${encodeURIComponent(debouncedUserSearchQuery)}`)
        if (!response.ok) {
          throw new Error("Failed to search users")
        }
        const data = await response.json()
        setSearchResults(data.users || [])
      } catch (err) {
        console.error("Error searching users:", err)
        toast({
          title: "Error",
          description: "Failed to search users. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSearching(false)
      }
    }

    searchUsers()
  }, [debouncedUserSearchQuery])

  // Focus search input when modal opens
  useEffect(() => {
    if (addMemberGroupId !== null && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [addMemberGroupId])

  // Focus new group input when modal opens
  useEffect(() => {
    if (isAddGroupModalOpen && newGroupInputRef.current) {
      setTimeout(() => {
        newGroupInputRef.current?.focus()
      }, 100)
    }
  }, [isAddGroupModalOpen])

  // Fetch members when a group is expanded
  const toggleGroupExpand = async (groupId: number) => {
    const isCurrentlyExpanded = expandedGroups[groupId]

    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !isCurrentlyExpanded,
    }))

    // If we're expanding and don't have members loaded yet
    if (!isCurrentlyExpanded && !groupMembers[groupId]) {
      setLoadingMembers((prev) => ({ ...prev, [groupId]: true }))

      try {
        const response = await fetchWithAuth(`/api/groups/${groupId}/members`)
        if (!response.ok) {
          throw new Error("Failed to fetch group members")
        }
        const data = await response.json()

        setGroupMembers((prev) => ({
          ...prev,
          [groupId]: data,
        }))
      } catch (err) {
        console.error(`Error fetching members for group ${groupId}:`, err)
        toast({
          title: "Error",
          description: "Failed to load group members. Please try again.",
          variant: "destructive",
        })
        // Collapse the group on error
        setExpandedGroups((prev) => ({
          ...prev,
          [groupId]: false,
        }))
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [groupId]: false }))
      }
    }
  }

  // Delete group
  const confirmDeleteGroup = (groupId: number) => {
    setDeleteGroupId(groupId)
  }

  const handleDeleteGroup = async () => {
    if (deleteGroupId === null) return

    try {
      const response = await fetchWithAuth(`/api/groups/${deleteGroupId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete group")
      }

      // Remove group from state
      setGroups(groups.filter((group) => group.id !== deleteGroupId))
      toast({
        title: "Success",
        description: "Group deleted successfully",
      })
    } catch (err) {
      console.error("Error deleting group:", err)
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteGroupId(null)
    }
  }

  // Remove member
  const confirmRemoveMember = (groupId: number, username: string) => {
    setRemoveMemberData({ groupId, username })
  }

  const handleRemoveMember = async () => {
    if (!removeMemberData) return

    const { groupId, username } = removeMemberData

    try {
      const response = await fetchWithAuth(`/api/groups/${groupId}/members/${username}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      // Update members list
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: prev[groupId].filter((member) => member.username !== username),
      }))

      toast({
        title: "Success",
        description: "Member removed successfully",
      })
    } catch (err) {
      console.error("Error removing member:", err)
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoveMemberData(null)
    }
  }

  // Toggle admin status
  const handleToggleAdmin = async (groupId: number, username: string, isAdmin: boolean) => {
    setTogglingAdmin({ groupId, username })

    try {
      const response = await fetchWithAuth(`/api/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          is_admin: isAdmin,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update admin status")
      }

      // Update member in state
      setGroupMembers((prev) => ({
        ...prev,
        [groupId]: prev[groupId].map((member) =>
          member.username === username ? { ...member, is_admin: isAdmin } : member,
        ),
      }))

      toast({
        title: "Success",
        description: `${username} is ${isAdmin ? "now" : "no longer"} an admin`,
      })
    } catch (err) {
      console.error("Error updating admin status:", err)
      toast({
        title: "Error",
        description: "Failed to update admin status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTogglingAdmin(null)
    }
  }

  // Open add member modal
  const openAddMemberModal = (groupId: number) => {
    setAddMemberGroupId(groupId)
    setUserSearchQuery("")
    setSelectedUser(null)
    setSearchResults([])
  }

  // Handle user selection
  const selectUser = (user: User) => {
    setSelectedUser(user)
    setUserSearchQuery(user.username)
    setSearchResults([])
  }

  // Add member to group
  const handleAddMember = async () => {
    if (!selectedUser || addMemberGroupId === null) return

    setIsAddingMember(true)
    try {
      const response = await fetchWithAuth(`/api/groups/${addMemberGroupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: selectedUser.username }),
      })

      if (!response.ok) {
        throw new Error("Failed to add member")
      }

      // If the group is expanded, refresh the members list
      if (expandedGroups[addMemberGroupId]) {
        const membersResponse = await fetchWithAuth(`/api/groups/${addMemberGroupId}/members`)
        if (membersResponse.ok) {
          const data = await membersResponse.json()
          setGroupMembers((prev) => ({
            ...prev,
            [addMemberGroupId]: data,
          }))
        }
      }

      toast({
        title: "Success",
        description: `${selectedUser.username} added to the group successfully`,
      })

      // Close the modal
      setAddMemberGroupId(null)
      setSelectedUser(null)
    } catch (err) {
      console.error("Error adding member:", err)
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingMember(false)
    }
  }

  // Add new group
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsAddingGroup(true)
    try {
      const response = await fetchWithAuth("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create group")
      }

      const newGroup = await response.json()

      // Add new group to state
      setGroups((prev) => [...prev, newGroup])

      toast({
        title: "Success",
        description: "Group created successfully",
      })

      // Close the modal and reset form
      setIsAddGroupModalOpen(false)
      setNewGroupName("")
    } catch (err) {
      console.error("Error creating group:", err)
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingGroup(false)
    }
  }

  // Clear selected user
  const clearSelectedUser = () => {
    setSelectedUser(null)
    setUserSearchQuery("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Filter groups by name
  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 pt-20">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Group Management</h1>
              </div>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setIsAddGroupModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Group
              </Button>
            </div>

            <Card className=" shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-lg"></CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    className="pl-8 pr-4 py-2 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-4 rounded-md flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                )}

                <div className="w-full">

                  {loadingGroups ? (
                    Array(4)
                      .fill(0)
                      .map((_, i) => (
                        <div key={i} className="grid grid-cols-12 items-center border-b py-3 px-4">
                          <div className="col-span-6">
                            <Skeleton className="h-6 w-48" />
                          </div>
                          <div className="col-span-6 text-right">
                            <Skeleton className="h-8 w-20 ml-auto" />
                          </div>
                        </div>
                      ))
                  ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No groups found matching your search" : "No groups found"}
                    </div>
                  ) : (
                    filteredGroups.map((group) => (
                      <div key={group.id} className="">
                        {/* Group row */}
                        <div
                          className={cn(
                            "grid grid-cols-12 items-center py-3 px-4 rounded cursor-pointer transition-colors duration-200 hover:bg-muted",
                            expandedGroups[group.id] && "bg-muted",
                          )}
                        >
                          <div className="col-span-6 flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="mr-2 h-8 w-8"
                              onClick={() => toggleGroupExpand(group.id)}
                              disabled={loadingMembers[group.id]}
                            >
                              {loadingMembers[group.id] ? (
                                <div className="h-4 w-4 border-2 border-t-transparent border-violet-600 rounded-full animate-spin" />
                              ) : expandedGroups[group.id] ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex items-center">
                              <div className="bg-violet-100 p-2 rounded-full mr-3">
                                <Users className="h-5 w-5 text-violet-600" />
                              </div>
                              <span className="font-medium">{group.name}</span>
                            </div>
                          </div>
                          <div className="col-span-6 flex justify-end space-x-2">
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openAddMemberModal(group.id)}
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => confirmDeleteGroup(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Members section (expanded) */}
                        {expandedGroups[group.id] && (
                          <div className="bg-muted/10 ">

                            {groupMembers[group.id]?.length === 0 ? (
                              <div className="p-4 px-20 text-sm text-muted-foreground">No members in this group</div>
                            ) : (
                              <div>
                                {groupMembers[group.id]?.map((member) => (
                                  <div
                                    key={member.username}
                                    className="grid grid-cols-12 items-center py-3 px-20 hover:bg-muted transition-colors duration-200 rounded cursor-pointer"
                                  >
                                    <div className="col-span-6 flex items-center">
                                      <Avatar className="h-8 w-8 mr-3">
                                        <AvatarImage
                                          src={member.avatar_url || "/placeholder.svg"}
                                          alt={member.username}
                                        />
                                        <AvatarFallback>{getInitials(member.username)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <span className="font-medium">{member.username}</span>
                                        {member.is_admin && (
                                          <Badge
                                          variant="outline"
                                          className="ml-2 bg-violet-50 text-violet-700 border-violet-200"
                                        >
                                          <Shield className="h-3 w-3 mr-1" />
                                          Admin
                                        </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="col-span-6 flex justify-end items-center space-x-4">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-sm text-muted-foreground">Admin</span>
                                        {togglingAdmin?.groupId === group.id &&
                                        togglingAdmin?.username === member.username ? (
                                          <div className="h-5 w-5 border-2 border-t-transparent border-violet-600 rounded-full animate-spin" />
                                        ) : (
                                            <Switch
                                                checked={member.is_admin}
                                                onCheckedChange={(checked) => handleToggleAdmin(group.id, member.username, checked)}
                                                className="relative bg-gray-200 data-[state=checked]:bg-gray-300 transition-colors"
                                                >
                                                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-gray-500 data-[state=checked]:bg-violet-200 transition-transform" />
                                            </Switch>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => confirmRemoveMember(group.id, member.username)}
                                      >
                                        <UserMinus className="h-4 w-4 mr-1" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteGroupId !== null} onOpenChange={(open) => !open && setDeleteGroupId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteGroupId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={removeMemberData !== null} onOpenChange={(open) => !open && setRemoveMemberData(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>Are you sure you want to remove this member from the group?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveMemberData(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberGroupId !== null} onOpenChange={(open) => !open && setAddMemberGroupId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member to Group</DialogTitle>
            <DialogDescription>Search for a user by username to add them to this group.</DialogDescription>
          </DialogHeader>

          <div className="relative">
            <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search users..."
                className="pl-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                disabled={!!selectedUser}
              />
              {selectedUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={clearSelectedUser}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Search results dropdown */}
            {!selectedUser && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                    onClick={() => selectUser(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.username} />
                      <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isSearching && !selectedUser && (
              <div className="absolute right-2 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* No results message */}
            {!isSearching && userSearchQuery && searchResults.length === 0 && !selectedUser && (
              <div className="text-sm text-muted-foreground mt-2">No users found matching "{userSearchQuery}"</div>
            )}

            {/* Selected user preview */}
            {selectedUser && (
              <div className="mt-4 p-3 border rounded-md bg-muted/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar_url || "/placeholder.svg"} alt={selectedUser.username} />
                    <AvatarFallback>{getInitials(selectedUser.username)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.username}</div>
                    <div className="text-sm text-muted-foreground">Will be added to the group</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setAddMemberGroupId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser || isAddingMember}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isAddingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Dialog */}
      <Dialog open={isAddGroupModalOpen} onOpenChange={setIsAddGroupModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>Enter a name for the new group.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="group-name" className="text-sm font-medium">
                Group Name
              </label>
              <Input
                id="group-name"
                ref={newGroupInputRef}
                placeholder="Enter group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newGroupName.trim()) {
                    handleAddGroup()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGroupModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddGroup}
              disabled={!newGroupName.trim() || isAddingGroup}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isAddingGroup && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
