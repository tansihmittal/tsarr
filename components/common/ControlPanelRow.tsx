import { ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

interface Props {
  title: string;
  value?: string;
  children?: ReactNode;
  onTap?: () => void;
  noBorder?: boolean;
}

const ControlPanelRow: React.FC<Props> = ({ title, value, children, onTap, noBorder }) => (
  <>
    <div
      className={`flex items-center justify-between py-3 px-4 ${onTap ? "cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-gray-800" : ""} transition-colors`}
      onClick={onTap}
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[#0A0A0A] dark:text-white font-medium text-sm">{title}</span>
        {value && (
          <Badge size="sm">{value}</Badge>
        )}
      </div>
      {children}
    </div>
    {!noBorder && <Separator />}
  </>
);

export default ControlPanelRow;
