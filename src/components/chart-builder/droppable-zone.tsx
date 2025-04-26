"use client"

import type React from "react"

import { useDrop } from "react-dnd"
import { cn } from "@/lib/utils"

interface DroppableZoneProps {
  title: string
  description?: string
  accept: string[]
  onDrop: (item: any) => void
  children?: React.ReactNode
  className?: string
  isEmpty?: boolean
}

export function DroppableZone({
  title,
  description,
  accept,
  onDrop,
  children,
  className,
  isEmpty = true,
}: DroppableZoneProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept,
    drop: (item) => {
      onDrop(item)
      return undefined
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  return (
    <div className={cn("mb-4", className)}>
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{description}</p>}
      <div
        ref={drop as unknown as React.RefObject<HTMLDivElement>}
        className={cn(
          "min-h-[60px] p-2 rounded-md border border-dashed transition-colors",
          isEmpty ? "flex items-center justify-center" : "",
          isOver && canDrop
            ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
            : "border-gray-300 dark:border-gray-600",
          className,
        )}
      >
        {isEmpty ? (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isOver && canDrop ? "Drop here" : "Drag and drop columns here"}
          </span>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </div>
    </div>
  )
}
