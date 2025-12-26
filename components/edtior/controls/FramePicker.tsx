import React from "react";
import { useEditorContext } from "@/context/Editor";
import CustomSelect from "./CustomSelect";
import { FiMonitor, FiLayout, FiMaximize } from "react-icons/fi";
import { BsCheck } from "react-icons/bs";

const frames = [
    { id: 1, name: "None", value: "none", icon: <FiMaximize /> },
    { id: 2, name: "macOS Light", value: "macOsLight", icon: <FiMonitor /> },
    { id: 3, name: "macOS Dark", value: "macOsDark", icon: <FiMonitor /> },
    { id: 4, name: "Browser Light", value: "browserLight", icon: <FiLayout /> },
    { id: 5, name: "Browser Dark", value: "browserDark", icon: <FiLayout /> },
    { id: 6, name: "Windows Light", value: "windowsLight", icon: <FiMonitor /> },
    { id: 7, name: "Windows Dark", value: "windowsDark", icon: <FiMonitor /> },
];

const FramePicker: React.FC = () => {
    const { selectedFrame, updateData } = useEditorContext();

    return (
        <CustomSelect title="Select Frame" icon={<FiMonitor className="text-[1rem]" />}>
            <div className="grid grid-cols-2 gap-2 p-[1rem] pt-2">
                {frames.map((frame) => (
                    <div
                        key={frame.id}
                        onClick={() => updateData && updateData("selectedFrame", { name: frame.name, value: frame.value })}
                        className={`flex items-center gap-3 p-3 rounded-md border-2 cursor-pointer transition-all ${selectedFrame.value === frame.value
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-base-200 hover:border-gray-300 bg-base-100 text-primary-content"
                            }`}
                    >
                        <div className="text-xl">{frame.icon}</div>
                        <span className="text-xs font-medium whitespace-nowrap">{frame.name}</span>
                        {selectedFrame.value === frame.value && <BsCheck className="ml-auto text-lg" />}
                    </div>
                ))}
            </div>
        </CustomSelect>
    );
};

export default FramePicker;
