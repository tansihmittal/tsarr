import { ReactNode } from "react";

interface Props {
  title: string;
  isActive: boolean;
  onClick: () => void;
  children?: ReactNode;
}

const ControlTabButton: React.FC<Props> = ({ title, isActive, onClick, children }) => (
  <div
    className={`flex justify-center items-center gap-2 font-medium px-3 py-2.5 transition-all duration-200 cursor-pointer ${
      isActive ? "bg-base-100 rounded-lg shadow-sm text-primary" : "text-primary-content hover:text-primary"
    }`}
    onClick={onClick}
  >
    {children && (
      <span className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>{children}</span>
    )}
    <span className="text-sm">{title}</span>
  </div>
);

export default ControlTabButton;
