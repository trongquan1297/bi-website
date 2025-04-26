import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500 mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )
}
