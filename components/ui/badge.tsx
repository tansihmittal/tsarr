import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#F3F4F6] dark:bg-gray-800 text-[#4B5563] dark:text-gray-400",
        primary: "bg-[#EFF6FF] dark:bg-blue-900/30 text-[#2563EB] border border-[#DBEAFE]",
        outline: "border border-[#E5E7EB] dark:border-gray-700 text-[#4B5563] dark:text-gray-400 bg-transparent",
      },
      size: {
        default: "px-3 py-1.5 text-xs",
        sm: "px-2.5 py-1 text-xs",
        lg: "px-4 py-2 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
