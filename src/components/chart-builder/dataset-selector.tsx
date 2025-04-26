"use client"

import { Loader2 } from "lucide-react"
import type { Dataset } from "./types"

interface DatasetSelectorProps {
  datasets: Dataset[]
  selectedDataset: Dataset | null
  setSelectedDataset: (dataset: Dataset | null) => void
  isFetchingDatasets: boolean
  isEditMode: boolean
}

export function DatasetSelector({
  datasets,
  selectedDataset,
  setSelectedDataset,
  isFetchingDatasets,
  isEditMode,
}: DatasetSelectorProps) {
  return (
    <div className="mb-4">
      <label htmlFor="dataset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Dataset
      </label>
      <select
        id="dataset"
        value={selectedDataset?.id || ""}
        onChange={(e) => {
          const datasetId = Number(e.target.value)
          const dataset = datasets.find((d) => d.id === datasetId) || null
          setSelectedDataset(dataset)
        }}
        className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        disabled={isEditMode} // Disable dataset selection in edit mode
      >
        <option value="">Select a dataset</option>
        {datasets.map((dataset) => (
          <option key={dataset.id} value={dataset.id}>
            {dataset.schema_name}.{dataset.table_name}
          </option>
        ))}
      </select>
      {isFetchingDatasets && (
        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading datasets...
        </div>
      )}
    </div>
  )
}
