"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { DraggableColumn } from "./draggble-column"
import type { Column } from "./types"

interface ColumnsListProps {
  columns: Column[]
  isFetchingColumns: boolean
}

export function ColumnsList({ columns, isFetchingColumns }: ColumnsListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filter columns by search term
  const filteredColumns = columns.filter((column) =>
    column.column_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Columns</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      {isFetchingColumns ? (
        <div className="mt-2 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading columns...
        </div>
      ) : (
        <div className="mt-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredColumns.length === 0 ? (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              {searchTerm ? "No columns match your search" : "No columns available"}
            </div>
          ) : (
            filteredColumns.map((column) => <DraggableColumn key={column.column_name} column={column} type="COLUMN" />)
          )}
        </div>
      )}
    </div>
  )
}
