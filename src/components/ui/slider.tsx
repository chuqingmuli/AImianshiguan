'use client'

import * as React from 'react'

const Slider = React.forwardRef<HTMLInputElement, {
  className?: string
  value?: number[]
  min?: number
  max?: number
  step?: number
  onValueChange?: (value: number[]) => void
  disabled?: boolean
}>(
  ({ className, value = [0], min = 0, max = 100, step = 1, onValueChange, disabled }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [parseFloat(e.target.value)]
      if (onValueChange) {
        onValueChange(newValue)
      }
    }

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
      />
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }