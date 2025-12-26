import { useEditorContext } from "@/context/Editor";
import { ReactNode } from "react";
import FrameWrapper from "../../common/FrameWrapper";

interface Props {
  children: ReactNode;
}

const ImageWrapper: React.FC<Props> = ({ children }) => {
  const {
    selectedImage,
    currentBoxShadow,
    borderRadius,
    scale,
    tilt,
    left,
    right,
    rotate,
    selectedFrame,
  } = useEditorContext();
  const hasFrame = selectedFrame.value !== "none";
  
  return (
    <div
      style={{
        transform: `scale(${scale}) perspective(90em) ${tilt.value} translateX(${left}%) translateY(${right}%) rotateZ(${rotate}deg)`,
        boxShadow: hasFrame ? "none" : currentBoxShadow.value,
        transformStyle: "preserve-3d",
        borderRadius: hasFrame ? "0px" : borderRadius + "px",
      }}
      className={`
        ${selectedImage ? "h-fit" : "h-full"} \
        ${selectedImage ? "w-fit" : "w-full"} \
        overflow-hidden origin-center \
        transition-transform will-change-transform \
        relative
    `}
    >
      <FrameWrapper frame={selectedFrame.value}>{children}</FrameWrapper>
    </div>
  );
};

export default ImageWrapper;
