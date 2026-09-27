import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,opacity,background-color,color] duration-(--motion-quick) ease-(--ease-out) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:opacity-90 active:not-disabled:scale-[0.96]",
        ghost:
          "bg-transparent text-fg hover:bg-raised active:not-disabled:scale-[0.96]",
        muted:
          "bg-raised text-fg hover:bg-raised/80 active:not-disabled:scale-[0.96]",
        danger:
          "bg-danger/15 text-danger hover:bg-danger/25 active:not-disabled:scale-[0.96]",
        key: "bg-raised text-fg text-xl font-medium hover:bg-surface active:not-disabled:scale-[0.96]",
      },
      size: {
        md: "h-11 rounded-md px-4 text-sm",
        lg: "h-12 rounded-lg px-5 text-base",
        xl: "h-14 rounded-lg px-6 text-base",
        icon: "size-11 rounded-md",
        key: "h-14 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
