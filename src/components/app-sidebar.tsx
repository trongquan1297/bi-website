"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Database,
  BarChart,
  LineChart,
  X,
  Users,
  Shield,
  UserCog,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"
import { useUser } from "@/app/contexts/user-context"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const { userData } = useUser()
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("dashboard") // Mặc định mở submenu Dashboard
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user has superadmin role
  const isSuperAdmin = userData?.role?.includes("superadmin") || false

  // Xử lý tự động ẩn sidebar khi di chuyển chuột ra khỏi sidebar
  const handleMouseEnter = () => {
    setIsHovering(true)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovering(false)
        setIsCollapsed(true)
      }, 300)
    } // Độ trễ trước khi ẩn sidebar
  }

  // Xử lý click bên ngoài sidebar để ẩn sidebar trên mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && window.innerWidth < 768) {
        setIsMobileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  // Xử lý toggle submenu
  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu)
  }

  // Kiểm tra xem một route có đang active không
  const isRouteActive = (route: string) => {
    return pathname === route || pathname.startsWith(route + "/")
  }

  // Tính toán chiều rộng của sidebar dựa trên trạng thái
  const sidebarWidth = isCollapsed && !isHovering ? "w-16" : "w-64"

  // Xử lý hiển thị sidebar trên mobile
  const mobileClass = isMobileOpen ? "translate-x-0" : "-translate-x-full"

  // Danh sách các mục điều hướng
  const navItems = [
    {
      name: "Analytics",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/home",
      active:
        isRouteActive("/home") || isRouteActive("/dashboard") || isRouteActive("/dataset") || isRouteActive("/chart"),
      submenu: [
        {
          name: "Dashboard",
          icon: <BarChart className="h-4 w-4" />,
          href: "/dashboard",
          active: isRouteActive("/dashboard"),
        },
        {
          name: "Chart",
          icon: <LineChart className="h-4 w-4" />,
          href: "/chart",
          active: isRouteActive("/chart"),
        },
      ],
    },
    {
      name: "Chat",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/chat",
      active: isRouteActive("/chat"),
    },
  ]

  // Add Admin section only for superadmin users
  if (isSuperAdmin) {
    navItems.push({
      name: "Admin",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin",
      active: isRouteActive("/admin"),
      submenu: [
        {
          name: "Users",
          icon: <UserCircle className="h-4 w-4" />,
          href: "/admin/users",
          active: isRouteActive("/admin/users"),
        },
        {
          name: "Roles",
          icon: <UserCog className="h-4 w-4" />,
          href: "/admin/roles",
          active: isRouteActive("/admin/roles"),
        },
        {
          name: "Groups",
          icon: <Users className="h-4 w-4" />,
          href: "/admin/groups",
          active: isRouteActive("/admin/groups"),
        },
        {
          name: "Datasets",
          icon: <Database className="h-4 w-4" />,
          href: "/admin/datasets",
          active: isRouteActive("/admin/datasets"),
        },
      ],
    })
  }

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onMouseDown={(e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
              setIsMobileOpen(false)
            }
          }}
        />
      )}

      {/* Mobile sidebar toggle button */}
      <button
        className="fixed bottom-4 right-4 z-50 md:hidden bg-violet-600 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <LayoutDashboard className="h-6 w-6" />}
      </button>

      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300 ease-in-out",
          sidebarWidth,
          "md:translate-x-0", // Always show on desktop
          mobileClass, // Control mobile visibility
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-center">
          <img src="/AppotaWallet.svg" alt="Appota Logo" className="h-10 w-10 text-violet-600" />
          {(!isCollapsed || isHovering || isMobileOpen) && (
            <span className="ml-2 text-xl font-semibold transition-opacity duration-300">BI</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 overflow-y-auto max-h-[calc(100vh-10rem)]">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name} className={item.submenu ? "mb-1" : ""}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.name.toLowerCase())}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                        item.active && "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
                      )}
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center">{item.icon}</span>
                        {(!isCollapsed || isHovering || isMobileOpen) && (
                          <span className="ml-3 transition-opacity duration-300">{item.name}</span>
                        )}
                      </div>
                      {(!isCollapsed || isHovering || isMobileOpen) && (
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            openSubmenu === item.name.toLowerCase() ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                    {/* Submenu */}
                    {(openSubmenu === item.name.toLowerCase() || (!isCollapsed && isHovering) || isMobileOpen) && (
                      <ul
                        className={`mt-1 ml-2 pl-4 space-y-1 ${
                          isCollapsed && !isHovering && !isMobileOpen ? "hidden" : "animate-fadeIn"
                        }`}
                      >
                        {item.submenu.map((subitem) => (
                          <li key={subitem.name}>
                            <Link
                              href={subitem.href}
                              className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                                subitem.active &&
                                  "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
                              )}
                              onClick={() => setIsMobileOpen(false)}
                            >
                              <span className="flex items-center justify-center">{subitem.icon}</span>
                              <span className="ml-3 transition-opacity duration-300">{subitem.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                      item.active && "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
                    )}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span className="flex items-center justify-center">{item.icon}</span>
                    {(!isCollapsed || isHovering || isMobileOpen) && (
                      <span className="ml-3 transition-opacity duration-300">{item.name}</span>
                    )}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 p-3">
          <ul className="space-y-2">
            <li>
              <Link
                href="/settings"
                className={cn(
                  "flex items-center rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
                  isRouteActive("/settings") &&
                    "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <span className="flex items-center justify-center">
                  <Settings className="h-5 w-5" />
                </span>
                {(!isCollapsed || isHovering || isMobileOpen) && (
                  <span className="ml-3 transition-opacity duration-300">Settings</span>
                )}
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="flex items-center justify-center">
                  <LogOut className="h-5 w-5" />
                </span>
                {(!isCollapsed || isHovering || isMobileOpen) && (
                  <span className="ml-3 transition-opacity duration-300">Logout</span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
