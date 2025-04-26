"use client"

import { useState } from "react"
import { X, AlignLeft, AlignCenter, AlignRight } from "lucide-react"

interface TitleEditorProps {
  text?: string
  style?: Record<string, string>
  onChange?: (text: string, style: Record<string, string>) => void
  onSave?: (text: string, style: Record<string, string>) => void
  onCancel?: () => void
  initialText?: string
  initialStyle?: Record<string, string>
}

export function TitleEditor({
  text: propText = "",
  style: propStyle = {},
  onChange,
  onSave,
  onCancel,
  initialText = "",
  initialStyle = {},
}: TitleEditorProps) {
  const [text, setText] = useState(propText || initialText)
  const [style, setStyle] = useState({
    color: "#000000",
    fontSize: "24px",
    textAlign: "left",
    ...propStyle,
    ...initialStyle,
  })

  // If we're in view mode (no onSave/onCancel), just render the title
  if (!onSave && !onCancel) {
    return (
      <h2 className="text-xl font-bold p-4" style={style}>
        {text}
      </h2>
    )
  }

  const handleStyleChange = (property: string, value: string) => {
    setStyle({
      ...style,
      [property]: value,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Title</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Formatting toolbar */}
          <div className="mb-4 flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md">
            <button
              onClick={() => handleStyleChange("textAlign", "left")}
              className={`p-1.5 rounded ${
                style.textAlign === "left" ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleStyleChange("textAlign", "center")}
              className={`p-1.5 rounded ${
                style.textAlign === "center"
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleStyleChange("textAlign", "right")}
              className={`p-1.5 rounded ${
                style.textAlign === "right"
                  ? "bg-gray-200 dark:bg-gray-700"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-1"></div>
            <div className="flex items-center">
              <label htmlFor="title-color" className="text-xs mr-1">
                Color:
              </label>
              <input
                type="color"
                id="title-color"
                value={style.color}
                onChange={(e) => handleStyleChange("color", e.target.value)}
                className="w-6 h-6 p-0 border-0"
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="title-size" className="text-xs mr-1">
                Size:
              </label>
              <select
                id="title-size"
                value={style.fontSize}
                onChange={(e) => handleStyleChange("fontSize", e.target.value)}
                className="text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              >
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="28px">28px</option>
                <option value="32px">32px</option>
                <option value="36px">36px</option>
                <option value="40px">40px</option>
              </select>
            </div>
          </div>

          {/* Title input */}
          <div className="mb-4">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter title text..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
            <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
              <h2 style={style}>{text || "Title Preview"}</h2>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(text, style)}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
            >
              Add Title
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
