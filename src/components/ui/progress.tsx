'use client'

import * as React from 'react'

const Progress = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value?: number }>(
  ({ className, value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-blue-600 transition-all"
        style={{ transform: `translateX(-${100 - value}%)` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
)
Progress.displayName = 'Progress'

export { Progress }