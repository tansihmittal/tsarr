interface Props {
  title: string;
}

const PanelHeading: React.FC<Props> = ({ title }) => {
  return (
    <h2 className="text-[0.75rem] uppercase tracking-wider font-semibold px-4 py-3 bg-gradient-to-r from-base-200/80 to-base-200/40 text-gray-600 border-b border-base-200/50 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary rounded-full"></span>
      {title}
    </h2>
  );
};
export default PanelHeading;
