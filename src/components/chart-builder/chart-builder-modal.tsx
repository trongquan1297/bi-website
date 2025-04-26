"use client"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { ChartBuilder } from "./chart-builder"

interface ChartBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editChartId?: number | null
}

export function ChartBuilderModal({ isOpen, onClose, onSuccess, editChartId }: ChartBuilderModalProps) {
  if (!isOpen) return null

  return (
    <DndProvider backend={HTML5Backend}>
      <ChartBuilder
        onClose={onClose}
        onSave={() => {
          onSuccess()
          onClose()
        }}
        editChartId={editChartId}
      />
    </DndProvider>
  )
}
