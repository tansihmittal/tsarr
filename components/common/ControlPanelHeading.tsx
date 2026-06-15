import { Separator } from "../ui/separator";

interface Props {
  title: string;
}

const ControlPanelHeading: React.FC<Props> = ({ title }) => (
  <>
    <div
      className="flex items-center gap-2 px-4 py-3 bg-[#F9FAFB]"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <span className="w-1 h-4 bg-[#2563EB] rounded-full" />
      <span className="text-[0.7rem] uppercase tracking-widest font-semibold text-[#4B5563]">
        {title}
      </span>
    </div>
    <Separator />
  </>
);

export default ControlPanelHeading;
