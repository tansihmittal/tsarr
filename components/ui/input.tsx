import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex w-full rounded-full border border-[#E5E7EB] bg-[#EFF6FF] px-4 py-2 text-sm text-[#0A0A0A] placeholder:text-[#4B5563]/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#60A5FA]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "h-[50px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
