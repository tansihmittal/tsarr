interface Props {
  onTap: () => void;
  title: string;
  active: boolean;
}

const IconTile: React.FC<Props> = ({ title, onTap, active }) => {
  return (
    <div
      onClick={onTap}
      className={`rounded-lg border-2 border-base-200 py-2.5 px-3 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm press-effect ${
        active && "bg-primary/10 border-primary/40 shadow-sm"
      }`}
    >
      <span className={`font-medium ${active ? "text-primary" : ""}`}>{title}</span>
    </div>
  );
};

export default IconTile;
