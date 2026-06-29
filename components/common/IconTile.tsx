interface Props {
  onTap: () => void;
  title: string;
  active: boolean;
}

const IconTile: React.FC<Props> = ({ title, onTap, active }) => {
  return (
    <div
      onClick={onTap}
      className={`rounded-[10px] border-2 border-[#E5E7EB] dark:border-gray-700 py-2.5 px-3 cursor-pointer transition-all duration-200 hover:border-[#2563EB]/30 hover:bg-[#2563EB]/5 hover:shadow-sm press-effect ${
        active && "bg-[#2563EB]/10 border-[#2563EB]/40 shadow-sm"
      }`}
    >
      <span className={`font-medium ${active ? "text-[#2563EB]" : ""}`}>{title}</span>
    </div>
  );
};

export default IconTile;
