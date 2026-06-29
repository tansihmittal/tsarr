import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface Props {
  title: string;
  isActive: boolean;
  onClick: () => void;
  children?: ReactNode;
}

const ControlTabButton: React.FC<Props> = ({ title, isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex justify-center items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
      isActive
        ? "bg-white dark:bg-gray-900 shadow-sm text-[#0A0A0A] dark:text-white"
        : "text-[#4B5563] dark:text-gray-400 hover:text-[#0A0A0A] dark:hover:text-white hover:bg-white/60"
    )}
    style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
  >
    {children && (
      <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
        {children}
      </span>
    )}
    {title}
  </button>
);

export default ControlTabButton;
