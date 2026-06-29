import { ReactNode } from "react";

interface Props {
  title: string;
  onTap?: () => void;
  children: ReactNode;
  disabled?: boolean;
}

const ToolbarButton: React.FC<Props> = ({ title, onTap, children, disabled }) => (
  <div
    className={`text-[#0A0A0A] dark:text-white bg-white dark:bg-gray-900 py-2.5 px-4 flex items-center justify-center gap-2.5 border border-[#E5E7EB] dark:border-gray-700 rounded-[10px] transition-all duration-200 ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#EFF6FF] dark:hover:bg-blue-900/30 hover:border-[#2563EB]/20 hover:shadow-sm cursor-pointer press-effect"
    }`}
    onClick={disabled ? undefined : onTap}
  >
    <span className="text-lg">{children}</span>
    <span className="font-medium">{title}</span>
  </div>
);

export default ToolbarButton;
