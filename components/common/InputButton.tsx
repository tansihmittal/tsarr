import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  title: string;
  value: string;
  onTap: (value: string) => void;
}

const InputButton: React.FC<Props> = ({ title, value, onTap }) => {
  const [textareaData, setTextareaData] = useState(value);
  return (
    <div className="p-4 pt-2 grid gap-2">
      <Textarea
        className="outline-none border-[2px] border-[#E5E7EB] rounded-md p-2"
        spellCheck={false}
        rows={3}
        value={textareaData}
        onChange={(e) => setTextareaData(e.target.value)}
      />
      <Button
        className="w-full font-medium rounded-md"
        onClick={() => onTap(textareaData)}
      >
        {title}
      </Button>
    </div>
  );
};
export default InputButton;
