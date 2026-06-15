interface Props {
  title: string;
}

const PanelHeading: React.FC<Props> = ({ title }) => {
  return (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-[#F3F4F6] to-[#F3F4F6]/40 text-gray-600 border-b border-[#E5E7EB]/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-[#2563EB] rounded-full"></span>
      {title}
    </h2>
  );
};
export default PanelHeading;
