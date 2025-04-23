"use client"

import type React from "react"

import { useState, useRef } from "react"

interface TiltCardProps {
  children: React.ReactNode
  className?: string
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current || !isHovering) return

    const rect = ref.current.getBoundingClientRect()

    // Calculate mouse position relative to the card center, normalized to -1 to 1
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const normalizedX = (e.clientX - centerX) / (rect.width / 2)
    const normalizedY = (e.clientY - centerY) / (rect.height / 2)

    setTilt({ x: normalizedY * -7, y: normalizedX * 7 }) // Invert X for correct tilt direction
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <div
      ref={ref}
      className={`transition-transform duration-200 ${className}`}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </div>
  )
}
