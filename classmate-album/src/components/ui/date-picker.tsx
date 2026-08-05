'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10',
            'text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            '[color-scheme:light]',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
