"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"

interface Schema {
  schema_name: string
}

interface Table {
  table_name: string
  schema_name: string
}

interface AddDatasetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BI_API_URL

export function AddDatasetModal({ isOpen, onClose, onSuccess }: AddDatasetModalProps) {
  const [formData, setFormData] = useState({
    database: "redshift", // Giá trị mặc định
    schema_name: "",
    table_name: "",
  })

  const [schemas, setSchemas] = useState<Schema[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingSchemas, setIsFetchingSchemas] = useState(false)
  const [isFetchingTables, setIsFetchingTables] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)

  // Fetch schemas khi modal mở
  useEffect(() => {
    if (isOpen) {
      fetchSchemas()
    }
  }, [isOpen])

  // Fetch tables khi schema thay đổi
  useEffect(() => {
    if (formData.schema_name) {
      fetchTables(formData.schema_name)
    } else {
      setTables([])
    }
  }, [formData.schema_name])

  const fetchSchemas = async () => {
    setIsFetchingSchemas(true)
    setSchemaError(null)

    try {

      const response = await fetch(`${API_BASE_URL}/api/database/schemas`, {
        method: "GET",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách schema: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.schemas) {
        setSchemas(data.schemas)

        // Nếu có schemas, tự động chọn schema đầu tiên
        if (data.schemas.length > 0) {
          setFormData((prev) => ({
            ...prev,
            schema_name: data.schemas[0].schema_name,
          }))
        }
      } else {
        setSchemas([])
      }
    } catch (error) {
      console.error("Error fetching schemas:", error)
      setSchemaError(error instanceof Error ? error.message : "Không thể lấy danh sách schema")
    } finally {
      setIsFetchingSchemas(false)
    }
  }

  const fetchTables = async (schemaName: string) => {
    setIsFetchingTables(true)
    setTableError(null)
    setFormData((prev) => ({ ...prev, table_name: "" }))

    try {

      const response = await fetch(`${API_BASE_URL}/api/database/tables?schema_name=${encodeURIComponent(schemaName)}`, {
        method: "GET",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách bảng: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.tables) {
        setTables(data.tables)

        // Nếu có tables, tự động chọn table đầu tiên
        if (data.tables.length > 0) {
          setFormData((prev) => ({
            ...prev,
            table_name: data.tables[0].table_name,
          }))
        }
      } else {
        setTables([])
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      setTableError(error instanceof Error ? error.message : "Không thể lấy danh sách bảng")
    } finally {
      setIsFetchingTables(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {

      const response = await fetch(`${API_BASE_URL}/api/datasets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể tạo dataset")
      }

      const data = await response.json()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating dataset:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo dataset")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Thêm Dataset Mới</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="database" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database
            </label>
            <select
              id="database"
              name="database"
              value={formData.database}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              required
            >
              <option value="redshift">Redshift</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="snowflake">Snowflake</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="schema_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Schema
            </label>
            <div className="relative">
              <select
                id="schema_name"
                name="schema_name"
                value={formData.schema_name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
                disabled={isFetchingSchemas || schemas.length === 0}
              >
                {schemas.length === 0 && !isFetchingSchemas ? (
                  <option value="">Không có schema nào</option>
                ) : (
                  schemas.map((schema) => (
                    <option key={schema.schema_name} value={schema.schema_name}>
                      {schema.schema_name}
                    </option>
                  ))
                )}
              </select>
              {isFetchingSchemas && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {schemaError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{schemaError}</p>}
          </div>

          <div className="mb-6">
            <label htmlFor="table_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên bảng
            </label>
            <div className="relative">
              <select
                id="table_name"
                name="table_name"
                value={formData.table_name}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                required
                disabled={isFetchingTables || !formData.schema_name || tables.length === 0}
              >
                {tables.length === 0 && !isFetchingTables ? (
                  <option value="">Không có bảng nào</option>
                ) : (
                  tables.map((table) => (
                    <option key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </option>
                  ))
                )}
              </select>
              {isFetchingTables && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {tableError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{tableError}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.schema_name || !formData.table_name}
              className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Tạo Dataset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
