import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-secondary-foreground border border-border hover:bg-border hover:border-muted-foreground/30",
        primary:
          "bg-gradient-to-br from-[#164e6e] to-[#0c4a6e] border border-[#155e75] text-[#f0f9ff] hover:from-[#1a6b8f] hover:to-[#155e75] hover:border-primary shadow-lg shadow-primary/10",
        destructive:
          "text-destructive border border-destructive/30 hover:bg-destructive/10",
        outline:
          "border border-border bg-transparent hover:bg-secondary hover:text-foreground",
        ghost:
          "border-transparent hover:bg-secondary hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline border-transparent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
