import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// The field boundary is `border-input`, not an alpha of the ink, and the focus
// state is `--ring`. Both are the tokens that were measured to clear WCAG
// 1.4.11's 3:1 on every surface this control appears on — the page canvas, a
// white card and the elevated lead dialog. `border-foreground/12`, which this
// replaced, resolved to about 1.3:1 in dark mode: the input had no visible edge
// at all. Read the `--input` note in globals.css before changing either.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input bg-foreground/[0.03] px-3 py-1 text-base text-foreground transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-subtle-foreground hover:border-foreground/45 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
