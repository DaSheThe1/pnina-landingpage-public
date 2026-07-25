import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-foreground/12 bg-foreground/[0.03] px-3 py-2.5 text-base text-foreground transition-colors outline-none placeholder:text-subtle-foreground hover:border-foreground/22 focus-visible:border-brand-accent/60 focus-visible:ring-3 focus-visible:ring-brand-accent/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
