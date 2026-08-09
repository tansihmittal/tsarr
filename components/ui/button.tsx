import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#0A0A0A] text-white hover:bg-[#2563EB] dark:bg-white dark:text-[#0A0A0A] dark:hover:bg-gray-100",
        secondary: "bg-white text-[#0A0A0A] border border-[#E5E7EB] hover:border-[#60A5FA] dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:border-[#60A5FA]",
        ghost: "text-[#4B5563] hover:text-[#0A0A0A] hover:bg-[#F9FAFB] dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800",
        link: "text-[#4B5563] hover:text-[#0A0A0A] underline-offset-4 hover:underline dark:text-gray-400 dark:hover:text-white",
      },
      size: {
        default: "h-[50px] px-6 text-base",
        sm: "h-[38px] px-5 text-sm",
        icon: "h-10 w-10",
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
