"use client"

import type React from "react"
import { fetchWithAuth } from "@/lib/api"
import { useState, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie } from "react-chartjs-2"

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface Dataset {
  id: number
  database: string
  schema_name: string
  table_name: string
}

interface Column {
  column_name: string
  data_type: string
}

interface AddChartModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddChartModal({ isOpen, onClose, onSuccess }: AddChartModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    dataset_id: 0,
    label_field: "",
    value_field: "",
    chart_type: "line",
    filters: {},
    layout: { title: { text: "" } },
  })

  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [columns, setColumns] = useState<Column[]>([])
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingDatasets, setIsFetchingDatasets] = useState(false)
  const [isFetchingColumns, setIsFetchingColumns] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)

  // Fetch datasets khi modal mở
  useEffect(() => {
    if (isOpen) {
      fetchDatasets()
    }
  }, [isOpen])

  // Fetch columns khi dataset thay đổi
  useEffect(() => {
    if (selectedDataset) {
      fetchColumns(selectedDataset.table_name, selectedDataset.schema_name)
    } else {
      setColumns([])
    }
  }, [selectedDataset])

  // Tạo dữ liệu mẫu cho preview chart
  useEffect(() => {
    if (formData.chart_type && formData.label_field && formData.value_field) {
      generatePreviewData()
    }
  }, [formData.chart_type, formData.label_field, formData.value_field, formData.name])

  const fetchDatasets = async () => {
    setIsFetchingDatasets(true)
    setError(null)

    try {

      const response = await fetchWithAuth(`${API_BASE_URL}/api/datasets`, {
        method: "GET",
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách datasets: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.datasets) {
        setDatasets(data.datasets)

        // Nếu có datasets, tự động chọn dataset đầu tiên
        if (data.datasets.length > 0) {
          const firstDataset = data.datasets[0]
          setSelectedDataset(firstDataset)
          setFormData((prev) => ({
            ...prev,
            dataset_id: firstDataset.id,
          }))
        }
      } else {
        setDatasets([])
      }
    } catch (error) {
      console.error("Error fetching datasets:", error)
      setError(error instanceof Error ? error.message : "Không thể lấy danh sách datasets")
    } finally {
      setIsFetchingDatasets(false)
    }
  }

  const fetchColumns = async (tableName: string, schemaName: string) => {
    setIsFetchingColumns(true)
    setError(null)

    try {

      const response = await fetchWithAuth(
        `${API_BASE_URL}/api/database/columns?table_name=${encodeURIComponent(tableName)}&schema_name=${encodeURIComponent(schemaName)}`,
        {
          method: "GET",
          credentials: "include"
        },
      )

      if (!response.ok) {
        throw new Error(`Lỗi khi lấy danh sách columns: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.columns) {
        setColumns(data.columns)

        // Tự động chọn column đầu tiên cho label và value
        if (data.columns.length > 0) {
          // Tìm một column phù hợp cho label (ưu tiên string/date)
          const labelColumn =
            data.columns.find(
              (col: Column) =>
                col.data_type.includes("char") ||
                col.data_type.includes("text") ||
                col.data_type.includes("date") ||
                col.data_type.includes("time"),
            ) || data.columns[0]

          // Tìm một column phù hợp cho value (ưu tiên numeric)
          const valueColumn =
            data.columns.find(
              (col: Column) =>
                col.data_type.includes("int") ||
                col.data_type.includes("float") ||
                col.data_type.includes("numeric") ||
                col.data_type.includes("decimal") ||
                col.data_type.includes("bigint"),
            ) || (data.columns.length > 1 ? data.columns[1] : data.columns[0])

          setFormData((prev) => ({
            ...prev,
            label_field: labelColumn.column_name,
            value_field: valueColumn.column_name,
          }))
        }
      } else {
        setColumns([])
      }
    } catch (error) {
      console.error("Error fetching columns:", error)
      setError(error instanceof Error ? error.message : "Không thể lấy danh sách columns")
    } finally {
      setIsFetchingColumns(false)
    }
  }

  const generatePreviewData = () => {
    // Tạo dữ liệu mẫu cho preview chart
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const values = Array.from({ length: 6 }, () => Math.floor(Math.random() * 100))

    const chartData = {
      labels,
      datasets: [
        {
          label: `${formData.value_field} by ${formData.label_field}`,
          data: values,
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 159, 64, 0.5)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    }

    setPreviewData(chartData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "dataset_id") {
      const datasetId = Number.parseInt(value)
      const dataset = datasets.find((d) => d.id === datasetId) || null
      setSelectedDataset(dataset)
      setFormData((prev) => ({ ...prev, [name]: datasetId }))
    } else if (name === "chart_type") {
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {

      // Cập nhật layout title
      const updatedFormData = {
        ...formData,
        layout: {
          ...formData.layout,
          title: {
            ...formData.layout.title,
            text: formData.name,
          },
        },
      }

      const response = await fetch("/api/charts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(updatedFormData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Không thể tạo chart")
      }

      const data = await response.json()
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error creating chart:", error)
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo chart")
    } finally {
      setIsLoading(false)
    }
  }

  const renderChartPreview = () => {
    if (!previewData) return null

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: true,
          text: formData.name || "Chart Preview",
        },
      },
    }

    switch (formData.chart_type) {
      case "line":
        return <Line data={previewData} options={options} />
      case "bar":
        return <Bar data={previewData} options={options} />
      case "pie":
        return <Pie data={previewData} />
      default:
        return <Line data={previewData} options={options} />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tạo Biểu Đồ Mới</h3>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên biểu đồ
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Nhập tên biểu đồ"
                  required
                />
              </div>

              <div>
                <label htmlFor="dataset_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dataset
                </label>
                <div className="relative">
                  <select
                    id="dataset_id"
                    name="dataset_id"
                    value={formData.dataset_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    required
                    disabled={isFetchingDatasets || datasets.length === 0}
                  >
                    {datasets.length === 0 && !isFetchingDatasets ? (
                      <option value="">Không có dataset nào</option>
                    ) : (
                      datasets.map((dataset) => (
                        <option key={dataset.id} value={dataset.id}>
                          {dataset.schema_name}.{dataset.table_name}
                        </option>
                      ))
                    )}
                  </select>
                  {isFetchingDatasets && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="chart_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Loại biểu đồ
                </label>
                <select
                  id="chart_type"
                  name="chart_type"
                  value={formData.chart_type}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  required
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="label_field"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Trường nhãn (Label)
                </label>
                <div className="relative">
                  <select
                    id="label_field"
                    name="label_field"
                    value={formData.label_field}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    required
                    disabled={isFetchingColumns || columns.length === 0}
                  >
                    {columns.length === 0 && !isFetchingColumns ? (
                      <option value="">Không có cột nào</option>
                    ) : (
                      columns.map((column) => (
                        <option key={column.column_name} value={column.column_name}>
                          {column.column_name} ({column.data_type})
                        </option>
                      ))
                    )}
                  </select>
                  {isFetchingColumns && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="value_field"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Trường giá trị (Value)
                </label>
                <div className="relative">
                  <select
                    id="value_field"
                    name="value_field"
                    value={formData.value_field}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    required
                    disabled={isFetchingColumns || columns.length === 0}
                  >
                    {columns.length === 0 && !isFetchingColumns ? (
                      <option value="">Không có cột nào</option>
                    ) : (
                      columns.map((column) => (
                        <option key={column.column_name} value={column.column_name}>
                          {column.column_name} ({column.data_type})
                        </option>
                      ))
                    )}
                  </select>
                  {isFetchingColumns && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.dataset_id || !formData.label_field || !formData.value_field}
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? "Đang xử lý..." : "Tạo Biểu Đồ"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Xem trước biểu đồ</h4>
            {previewData ? (
              <div className="h-64">{renderChartPreview()}</div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Chọn dataset, loại biểu đồ, trường nhãn và trường giá trị để xem trước
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
