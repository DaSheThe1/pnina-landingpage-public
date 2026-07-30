import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Same boundary/focus tokens as Input — see the note there.
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-foreground/[0.03] px-3 py-2.5 text-base text-foreground transition-colors outline-none placeholder:text-subtle-foreground hover:border-foreground/45 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
