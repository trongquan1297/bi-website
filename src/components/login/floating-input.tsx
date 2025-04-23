"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function FloatingInput({ label, className, ...props }: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)

  const handleFocus = () => setIsFocused(true)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value !== "")
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value !== "")
    if (props.onChange) {
      props.onChange(e)
    }
  }

  return (
    <div className="relative">
      <Input
        {...props}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn("pt-6 pb-2 h-14 transition-all duration-200", className)}
      />
      <label
        className={cn(
          "absolute left-3 transition-all duration-200 pointer-events-none",
          isFocused || hasValue
            ? "transform -translate-y-3 scale-75 text-violet-500 dark:text-violet-400"
            : "transform translate-y-1 text-muted-foreground",
        )}
      >
        {label}
      </label>
    </div>
  )
}
