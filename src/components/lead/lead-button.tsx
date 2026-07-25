"use client";

import type { ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";

import { buttonVariants } from "@/components/ui/button";
import type { LeadSource } from "@/lib/contact-schema";
import { useLeadDialog } from "@/components/lead/lead-dialog";
import { cn } from "@/lib/utils";

// A CTA button that opens the app-wide lead popup (see LeadDialogProvider).
// Drop-in replacement for the old `<Link href="/contact">` brand CTAs.
export function LeadButton({
  children,
  className,
  variant = "brand",
  size,
  onClick,
  source = "landing",
}: {
  children: ReactNode;
  className?: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  /** Runs before the popup opens — e.g. to close an open mobile menu. */
  onClick?: () => void;
  /** Tags the lead with which CTA produced it, so n8n can route the reply. */
  source?: LeadSource;
}) {
  const { open } = useLeadDialog();
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        open(source);
      }}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {children}
    </button>
  );
}
