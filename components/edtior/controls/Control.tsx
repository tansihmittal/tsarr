import { MouseEventHandler, ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  value?: string | number | null;
  onTap?: () => void;
}

const Control: React.FC<Props> = ({ title, value, children, onTap }) => {
  return (
    <div
      className="control-item flex justify-between items-center p-[1rem] border-b border-base-200/60 cursor-pointer overflow-hidden group"
      onClick={onTap}
    >
      <div className="flex justify-between items-center gap-2 shrink-0">
        <span className="text-primary-content font-medium">{title}</span>
        {value != null && (
          <span className="px-2.5 py-1 text-[0.65rem] bg-base-200/80 rounded-full font-medium text-gray-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            {value}
          </span>
        )}
      </div>
      <div className="flex items-center overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Control;
