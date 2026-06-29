import * as React from "react";
import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex w-full rounded-[14px] border border-[#E5E7EB] dark:border-gray-700 bg-[#EFF6FF] dark:bg-blue-900/30 px-4 py-3 text-sm text-[#0A0A0A] dark:text-white placeholder:text-[#4B5563]/50 resize-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:border-[#60A5FA]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "min-h-[80px]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
