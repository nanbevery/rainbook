"use client"

import { useToast } from "@/hooks/use-toast"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-[150] flex flex-col-reverse gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-state={toast.open ? "open" : "closed"}
          className={cn(
            "pointer-events-auto relative bg-background border rounded-lg shadow-lg overflow-hidden transition-all duration-200",
            toast.open ? "animate-toast-slide-in" : "animate-toast-dismiss",
            toast.variant === "destructive"
              ? "border-red-200 dark:border-red-800"
              : "border-emerald-200 dark:border-emerald-800"
          )}
          role="alert"
        >
          <div className="flex items-start gap-3 p-4 pr-10">
            {toast.variant === "destructive" ? (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              {toast.title && <div className="font-semibold text-sm">{toast.title}</div>}
              {toast.description && <div className="text-sm text-muted-foreground mt-0.5">{toast.description}</div>}
            </div>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-3 right-3 shrink-0 rounded-md p-0.5 hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div
            className={cn(
              "h-1 animate-toast-progress",
              toast.variant === "destructive" ? "bg-red-500" : "bg-emerald-500"
            )}
          />
        </div>
      ))}
    </div>
  )
}
