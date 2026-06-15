import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title: string;
  icon: JSX.Element;
}

const CustomSelect: React.FC<Props> = ({ children, title, icon }) => {
  return (
    <div className="bg-white rounded-md border-[2px] border-[#E5E7EB] absolute z-20 right-0 top-full">
      <div className="bg-[#F9FAFB] py-2 px-4 text-[0.7rem] font-medium flex items-start gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
};

export default CustomSelect;
