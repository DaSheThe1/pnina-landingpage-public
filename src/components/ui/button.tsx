import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        // The primary hero/CTA action. Lively: a sheen sweeps across on
        // hover/focus (.btn-sheen), it lifts slightly, and its glow deepens.
        //
        // It wears the ACCENT-ROLE trio `--cta-fill` / `--cta-ink` /
        // `--cta-fill-hover` rather than the primary pair. Since 0.11.4 those
        // three resolve to the PINK (`--rose-deep` #8a1f58 carrying
        // `--cta-ink` #fff8f5, 8.27:1 — the live site's pink, adopted
        // 2026-07-30) in globals.css `:root` — this is a pink button,
        // not the brown one it was through 0.11.3. The indirection exists so
        // the temporary `?accent=` switcher (globals.css §11) can re-point the
        // CTA without touching the ~40 low-alpha `--brand` washes elsewhere on
        // the page; `?accent=amber` is what puts the brown back.
        //
        // The pair is deliberately IDENTICAL in light and dark in ROLE (a
        // saturated fill carrying a contrasting label, 4.6:1 or better), while
        // `--primary` inverts to a light pill with dark ink and `--brand-hover`
        // — a TEXT colour — goes light.
        //
        // `.btn-cta` (globals.css §9) carries the background IMAGE and both
        // box-shadows. They used to be Tailwind arbitrary values here; they moved
        // so an accent can re-point them instead of having to out-specify them.
        brand:
          "btn-sheen btn-cta bg-cta-fill text-cta-ink font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-cta-fill-hover",
        // ── THE SECONDARY BUTTONS CARRY FULL `--foreground` INK ──
        // Daniel, 2026-07-31, on the built site: *"The buttons, like 'Who is it
        // for?' and 'How does it work in my presentations?', that text is not
        // good, not black enough, but all the other text is good."* Those are
        // the outline-shaped CTAs beside the pink one — the hero's secondary,
        // /lectures', /about's pair — and they were the last things on the site
        // still set in `--foreground-soft`, one rung below the body copy that
        // he had just approved. A button label is shorter and more decisive
        // than a paragraph, so if anything it wants the darker end, not the
        // lighter one.
        //
        // Only the LABEL moved. The border and the 2% wash are unchanged, and
        // the FILLED pink CTA (`brand`, above) is untouched — it is the one
        // Daniel called perfect. Hover keeps its job through the background and
        // the border, which is why `hover:text-foreground` came off both: it
        // now resolves to the colour they already are.
        outline:
          "border-foreground/15 bg-foreground/[0.02] text-foreground hover:bg-foreground/[0.06] hover:border-foreground/25 aria-expanded:bg-foreground/[0.06]",
        secondary:
          "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.1] aria-expanded:bg-foreground/[0.06]",
        ghost:
          "text-foreground hover:bg-foreground/[0.06] aria-expanded:bg-foreground/[0.06]",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
