import { useId } from "react"
import { RiAddLine, RiRouteLine, RiSubtractLine } from "@remixicon/react"

import type { ReactElement, ReactNode } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function Tip({
  label,
  children,
}: {
  label: ReactNode
  children: ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function NumberField({
  label,
  value,
  min,
  step = 0.1,
  onChange,
}: {
  label: string
  value: number | undefined
  min?: number
  step?: number
  onChange: (value: number) => void
}) {
  const id = useId()
  const currentValue = value ?? 0
  const changeBy = (delta: number) => {
    const nextValue = currentValue + delta
    onChange(Number(nextValue.toFixed(4)))
  }

  return (
    <div className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      <label className="min-w-0 truncate" htmlFor={id} title={label}>
        {label}
      </label>
      <div className="flex h-8 min-w-0 overflow-hidden border bg-background focus-within:border-primary">
        <input
          id={id}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground outline-none"
          inputMode="decimal"
          type="text"
          value={currentValue}
          onChange={(event) => {
            const nextValue = Number(event.target.value)
            if (!Number.isNaN(nextValue)) {
              onChange(nextValue)
            }
          }}
        />
        <div className="grid w-6 shrink-0 border-l bg-muted/40">
          <button
            aria-label={`Increase ${label}`}
            className="grid min-h-0 place-items-center border-b text-muted-foreground hover:bg-muted hover:text-foreground"
            type="button"
            onClick={() => changeBy(step)}
          >
            <RiAddLine className="size-3" />
          </button>
          <button
            aria-label={`Decrease ${label}`}
            className="grid min-h-0 place-items-center text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={min !== undefined && currentValue <= min}
            type="button"
            onClick={() => changeBy(-step)}
          >
            <RiSubtractLine className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()

  return (
    <div className="grid min-w-0 gap-1 text-xs text-muted-foreground">
      <label className="min-w-0 truncate" htmlFor={id} title={label}>
        {label}
      </label>
      <input
        id={id}
        className="h-8 w-full min-w-0 border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function SwitchRow({
  checked,
  description,
  label,
  onCheckedChange,
}: {
  checked: boolean
  description?: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 border bg-background p-2 text-xs">
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground">
          {label}
        </span>
        {description ? (
          <span className="block truncate text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <button
        aria-checked={checked}
        className={cn(
          "relative h-5 w-9 shrink-0 border transition-colors focus-visible:ring-1 focus-visible:ring-ring/50",
          checked ? "bg-primary" : "bg-muted"
        )}
        role="switch"
        type="button"
        onClick={() => onCheckedChange(!checked)}
      >
        <span
          className={cn(
            "absolute top-1/2 left-0 size-3 -translate-y-1/2 bg-background shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="flex min-h-[22rem] items-center justify-center border bg-muted/25 p-8 text-center">
      <div className="max-w-sm space-y-3">
        <RiRouteLine className="mx-auto size-10 text-primary" />
        <div>
          <h2 className="text-base font-semibold">
            Load or create a Pedro path
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a `.pp` file, open the demo, or start placing path segments
            on the field.
          </p>
        </div>
      </div>
    </div>
  )
}
