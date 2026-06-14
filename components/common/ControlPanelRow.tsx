import { ReactNode } from "react";

interface Props {
  title: string;
  value?: string;
  children?: ReactNode;
  onTap?: () => void;
}

const ControlPanelRow: React.FC<Props> = ({ title, value, children, onTap }) => (
  <div
    className={`flex items-center justify-between py-3 px-4 border-b border-base-200/60 ${onTap ? "cursor-pointer hover:bg-base-200/30" : ""}`}
    onClick={onTap}
  >
    <div className="flex items-center gap-2">
      <span className="text-primary-content font-medium text-sm">{title}</span>
      {value && (
        <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600">{value}</span>
      )}
    </div>
    {children}
  </div>
);

export default ControlPanelRow;
