"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function RippleButton({
  children,
  className = "",
  rippleColor = "rgba(255, 255, 255, 0.4)",
  variant = "default",
  size = "default",
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([])
  const [nextId, setNextId] = useState(0)

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(button.offsetWidth, button.offsetHeight)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple = { x, y, size, id: nextId }
    setNextId(nextId + 1)
    setRipples([...ripples, newRipple])
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ripples.length > 0) {
        setRipples(ripples.slice(1))
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [ripples])

  // Button styles based on variant and size
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variantStyles = {
    default: "bg-violet-600 text-white hover:bg-violet-700",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline:
      "border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700",
    ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50",
    link: "text-violet-600 underline-offset-4 hover:underline dark:text-violet-400",
  }

  const sizeStyles = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  const variantStyle = variantStyles[variant]
  const sizeStyle = sizeStyles[size]
  const buttonClasses = `${baseStyles} ${variantStyle} ${sizeStyle} ${className} relative overflow-hidden`

  return (
    <button className={buttonClasses} onClick={addRipple} {...props}>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: rippleColor,
            animation: "ripple 600ms linear",
          }}
        />
      ))}
      {children}
    </button>
  )
}
