"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Send } from "lucide-react"
import { AppHeader } from "@/components/app-header"

export default function ChatPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([{ id: 1, text: "Xin chào! Tôi có thể giúp gì cho bạn?", sender: "bot" }])

  useEffect(() => {
    setIsLoading(false)
  }, [router])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    // Thêm tin nhắn của người dùng
    const userMessage = { id: Date.now(), text: message, sender: "user" }
    setMessages([...messages, userMessage])
    setMessage("")

    // Giả lập phản hồi từ bot sau 1 giây
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: "Cảm ơn bạn đã liên hệ. Đây là tin nhắn tự động.",
        sender: "bot",
      }
      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-violet-500 rounded-full border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      {/* Sidebar */}
      <AppSidebar />

      <div className="transition-all duration-300 md:pl-64">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chat</h1>
          </div>
        </header>

        <main className="mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-26">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg flex flex-col h-[calc(100vh-12rem)]">
            {/* Chat messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                        msg.sender === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
