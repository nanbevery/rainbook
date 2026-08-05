import type * as React from "react"

export type ToastProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive"
  className?: string
  children?: React.ReactNode
}

export type ToastActionElement = React.ReactElement<{
  altText: string
  children?: React.ReactNode
}>
