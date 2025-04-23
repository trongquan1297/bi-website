"use client"

import { useState } from "react"
import { X } from "lucide-react"

interface ConfirmDeleteModalProps {
  isOpen: boolean
  datasetId: number | null
  datasetName: string
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmDeleteModal({ isOpen, datasetId, datasetName, onClose, onConfirm }: ConfirmDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsLoading(true)
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Xác nhận xóa</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa dataset <span className="font-semibold">{datasetName}</span>?
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Hành động này không thể hoàn tác.</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  )
}
