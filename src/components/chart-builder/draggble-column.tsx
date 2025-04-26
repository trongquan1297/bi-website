"use client"

import { useDrag } from "react-dnd"
import { cn } from "@/lib/utils"

interface DraggableColumnProps {
  column: {
    column_name: string
    data_type: string
  }
  type: string
  className?: string
}

export function DraggableColumn({ column, type, className }: DraggableColumnProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "COLUMN",
    item: { ...column, columnType: type },
    collect: (monitor: { isDragging: () => any }) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  // Xác định icon dựa trên loại dữ liệu
  const getDataTypeIcon = () => {
    const dataType = column.data_type.toLowerCase()
    if (
      dataType.includes("int") ||
      dataType.includes("float") ||
      dataType.includes("numeric") ||
      dataType.includes("decimal")
    ) {
      return "# "
    } else if (dataType.includes("date") || dataType.includes("time")) {
      return "🕒 "
    } else if (dataType.includes("bool")) {
      return "✓ "
    } else {
      return "Aa "
    }
  }

  return (
    <div
        ref={drag as unknown as React.RefObject<HTMLDivElement>}
        className={cn(
            "flex items-center px-3 py-2 rounded-md cursor-move text-sm",
            "border border-gray-300 dark:border-gray-600",
            "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700",
            isDragging && "opacity-50",
            className,
        )}
    >
        <span className="text-gray-500 dark:text-gray-400 mr-2">{getDataTypeIcon()}</span>
        <span className="truncate">{column.column_name}</span>
    </div>
  )
}
