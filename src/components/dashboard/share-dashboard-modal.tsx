"use client"

import { useState, useEffect, useRef } from "react"
import { X, Loader2, UserPlus, Users, Share2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useDebounce } from "@/lib/use-debounce"
import { cn } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

interface ShareDashboardModalProps {
  isOpen: boolean
  onClose: () => void
  dashboardId: number
  dashboardName: string
}

interface SharedUser {
  username: string
  avatar_url: string
}

interface UserSearchResult {
  username: string
  avatar_url: string
}

export function ShareDashboardModal({ isOpen, onClose, dashboardId, dashboardName }: ShareDashboardModalProps) {
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({})
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedSearchTerm = useDebounce(newUsername, 300)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && dashboardId) {
      fetchSharedUsers()
    }
  }, [isOpen, dashboardId])

  useEffect(() => {
    if (debouncedSearchTerm.trim().length > 0) {
      searchUsers(debouncedSearchTerm)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [debouncedSearchTerm])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchSharedUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/shared`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error fetching shared users: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.shared_users) {
        setSharedUsers(data.shared_users)
      } else {
        setSharedUsers([])
      }
    } catch (error) {
      console.error("Error fetching shared users:", error)
      toast({
        title: "Error",
        description: "Could not fetch shared users. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/search?query=${encodeURIComponent(query)}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`Error searching users: ${response.status}`)
      }

      const data = await response.json()

      // Filter out users that are already shared
      const filteredResults = data.users.filter(
        (user: UserSearchResult) => !sharedUsers.some((shared) => shared.username === user.username),
      )

      setSearchResults(filteredResults)
      setShowDropdown(filteredResults.length > 0)
    } catch (error) {
      console.error("Error searching users:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddUser = async (username: string = newUsername.trim()) => {
    if (!username) return

    setIsAdding(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/share`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shared_with: username,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error sharing dashboard: ${response.status}`)
      }

      // Refresh the list of shared users
      fetchSharedUsers()
      setNewUsername("")
      setShowDropdown(false)
      toast({
        title: "Success",
        description: `Dashboard shared with ${username}.`,
      })
    } catch (error) {
      console.error("Error sharing dashboard:", error)
      toast({
        title: "Error",
        description: "Could not share dashboard. Please check the username and try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveUser = async (username: string) => {
    setIsRemoving((prev) => ({ ...prev, [username]: true }))
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/share/${username}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error removing shared user: ${response.status}`)
      }

      // Update the list without refetching
      setSharedUsers((prev) => prev.filter((user) => user.username !== username))
      toast({
        title: "Success",
        description: `Removed ${username} from shared users.`,
      })
    } catch (error) {
      console.error("Error removing shared user:", error)
      toast({
        title: "Error",
        description: "Could not remove shared user. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsRemoving((prev) => ({ ...prev, [username]: false }))
    }
  }

  const handleSelectUser = (username: string) => {
    handleAddUser(username)
  }

  const handleInputFocus = () => {
    if (newUsername.trim().length > 0 && searchResults.length > 0) {
      setShowDropdown(true)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="h-5 w-5 mr-2 text-primary" />
            Share Dashboard
          </DialogTitle>
          <DialogDescription>Share "{dashboardName}" with other users in your organization.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mt-4 relative">
          <div className="grid flex-1 gap-2">
            <Input
              ref={inputRef}
              placeholder="Search users by username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full"
              onFocus={handleInputFocus}
              disabled={isAdding}
            />

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">No users found</div>
                ) : (
                  <div className="py-1">
                    {searchResults.map((user) => (
                      <button
                        key={user.username}
                        className="w-full text-left px-4 py-2 hover:bg-accent hover:text-accent-foreground flex items-center"
                        onClick={() => handleSelectUser(user.username)}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage
                            src={user.avatar_url || `https://avatar.vercel.sh/${user.username}`}
                            alt={user.username}
                          />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1">{user.username}</span>
                        <User className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button onClick={() => handleAddUser()} disabled={!newUsername.trim() || isAdding} className="shrink-0">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
            Add
          </Button>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
            <Users className="h-4 w-4 mr-1" />
            Shared with
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sharedUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              This dashboard is not shared with anyone yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {sharedUsers.map(({ username, avatar_url }) => (
                <div key={username} className="flex items-center justify-between bg-accent/50 p-2 rounded-md">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={avatar_url || `https://avatar.vercel.sh/${username}`} alt={username} />
                      <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveUser(username)}
                    disabled={isRemoving[username]}
                    className={cn(
                      "h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10",
                      isRemoving[username] && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    {isRemoving[username] ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
