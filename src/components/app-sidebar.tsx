"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Database,
  BarChart,
  LineChart,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth"

export function AppSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>("dashboard") // Mặc định mở submenu Dashboard
  const sidebarRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Xử lý tự động ẩn sidebar khi di chuyển chuột ra khỏi sidebar
  const handleMouseEnter = () => {
    setIsHovering(true)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false)
      setIsCollapsed(true)
    }, 300) // Độ trễ trước khi ẩn sidebar
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
      name: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/home",
      active:
        isRouteActive("/home") || isRouteActive("/dashboard") || isRouteActive("/dataset") || isRouteActive("/chart"),
      submenu: [
        {
          name: "Dataset",
          icon: <Database className="h-4 w-4" />,
          href: "/dataset",
          active: isRouteActive("/dataset"),
        },
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

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
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
        {/* Toggle button - only on desktop */}
        <button
          className="absolute -right-3 top-12 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-violet-600"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          {(!isCollapsed || isHovering || isMobileOpen) && (
            <span className="ml-2 text-xl font-semibold transition-opacity duration-300">AppName</span>
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
                        className={`mt-1 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700 space-y-1 ${
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
