import React, { useState, useEffect, type RefObject } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, Printer } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import { useFrameCanvas } from "./useFrameCanvas";
import type { FrameType } from "./FrameSelectorView";

export interface PresetColor {
  name: string;
  value: string;
}

export interface CustomizationViewProps {
  frameCanvasRef: RefObject<HTMLCanvasElement | null>;
  frameType: FrameType;
  frameColor: string;
  setFrameColor: (color: string) => void;
  customText: string;
  setCustomText: (text: string) => void;
  isCustomInput: boolean;
  setIsCustomInput: (v: boolean) => void;
  selectedPhotoIndices: number[];
  photos: (string | null)[];
  presetTexts: string[];
  presetColors: PresetColor[];
  onBack: () => void;
  onPrint: () => void;
  onFinish: () => void;
  isPersonal: boolean;
}

export const CustomizationView: React.FC<CustomizationViewProps> = ({
  frameCanvasRef,
  frameType,
  frameColor,
  setFrameColor,
  customText,
  setCustomText,
  isCustomInput,
  setIsCustomInput,
  selectedPhotoIndices,
  photos,
  presetTexts,
  presetColors,
  onBack,
  onPrint,
  onFinish,
  isPersonal,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const [sidebarTop, setSidebarTop] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useFrameCanvas(frameCanvasRef, frameType, frameColor, selectedPhotoIndices, photos, customText);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const handleScroll = () => {
      if (!containerRef.current || !sidebarRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const topOffset = 186;
      let point = topOffset - containerRect.top;
      point = Math.max(0, Math.min(containerHeight - sidebarHeight, point));
      setSidebarTop(point);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isDesktop]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col lg:flex-row w-full bg-gray-50/20 relative overflow-x-hidden scrollbar-hide"
    >
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 pb-20 sm:pb-24 lg:pb-12 lg:max-w-[calc(100%-20rem)] xl:max-w-[calc(100%-24rem)] scrollbar-hide">
        <div className="w-full max-w-5xl mb-2 sm:mb-3">
          <button
            type="button"
            onClick={onBack}
            className={`inline-flex items-center justify-center p-2.5 rounded-xl border-2 transition-all shadow-sm hover:shadow-md ${
              isPersonal
                ? "text-gray-700 border-gray-200 bg-white hover:border-brand-green hover:bg-green-50/80 hover:text-brand-green"
                : "text-gray-700 border-gray-200 bg-white hover:border-brand-orange hover:bg-orange-50/80 hover:text-brand-orange"
            }`}
            aria-label="사진 선택으로 돌아가기"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        </div>
        <div className="w-full max-w-5xl mb-6 sm:mb-8 md:mb-12">
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 font-display tracking-tight">
              프레임 꾸미기
            </h2>
            <p className="text-gray-500 text-sm sm:text-base md:text-lg font-medium">
              나만의 취향이 담긴 배경 색상을 골라보세요.
            </p>
          </div>
        </div>
        <div className="relative w-full max-w-5xl flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative transform transition-transform duration-700 flex justify-center w-full"
          >
            <canvas
              ref={frameCanvasRef}
              className="mx-auto w-full"
              style={{
                aspectRatio: frameType === "vertical" ? "579 / 1740" : "1800 / 1200",
                maxWidth: frameType === "vertical" ? "min(40vw, 450px)" : "min(75vw, 1000px)",
                transition: "background-color 0.5s ease",
              }}
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        ref={sidebarRef}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ x: { duration: 0.5 } }}
        className="w-full lg:w-80 xl:w-96 bg-white lg:border-r border-t lg:border-t-0 border-gray-200 shadow-lg flex flex-col p-4 sm:p-5 lg:p-10 rounded-t-2xl lg:rounded-tr-2xl lg:rounded-br-2xl overflow-y-auto lg:overflow-visible scrollbar-hide fixed lg:absolute bottom-0 lg:bottom-auto left-0 right-0 lg:left-auto lg:right-0 z-40 max-h-[42vh] sm:max-h-[45vh] lg:max-h-none"
        style={{
          top: isDesktop ? `${sidebarTop}px` : "auto",
          transition: isDesktop ? "top 1s ease-out" : "none",
        }}
      >
        <div className="space-y-3 sm:space-y-4 lg:space-y-6 flex-1 min-h-0">
          <div className="space-y-1.5 sm:space-y-2 lg:space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-5 sm:w-1.5 sm:h-6 ${isPersonal ? "bg-brand-green" : "bg-brand-orange"} rounded-full shadow-sm`} />
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">배경 색상</h3>
            </div>
            <div className="grid grid-cols-8 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4 w-full max-w-[420px] sm:max-w-[480px] lg:max-w-none mx-auto">
              {presetColors.map((color) => (
                <motion.button
                  key={color.name}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setFrameColor(color.value)}
                  className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                    frameColor === color.value
                      ? isPersonal
                        ? "border-brand-green shadow-md ring-1 ring-brand-green/20"
                        : "border-brand-orange shadow-md ring-1 ring-brand-orange/20"
                      : "border-gray-200 hover:border-gray-300 shadow-sm"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {frameColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={color.value === "#000000" || color.value === "#010C13" || color.value === "#0C354E" ? "text-white" : "text-gray-900"}>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" strokeWidth={3} />
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {frameType === "horizontal" && (
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-6 ${isPersonal ? "bg-brand-green" : "bg-brand-orange"} rounded-full shadow-sm`} />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">말풍선 문구</h3>
              </div>
              <Select
                value={isCustomInput ? "직접입력" : customText}
                onValueChange={(value) => {
                  if (value === "직접입력") {
                    setIsCustomInput(true);
                    setCustomText("");
                  } else {
                    setIsCustomInput(false);
                    setCustomText(value);
                  }
                }}
              >
                <SelectTrigger
                  className={`w-full bg-white/80 border-2 border-gray-100 shadow-inner h-10 rounded-lg transition-all px-3 text-sm min-w-0 ${
                    isPersonal ? "focus:border-brand-green" : "focus:border-brand-orange"
                  }`}
                >
                  <SelectValue placeholder="문구 선택" />
                </SelectTrigger>
                <SelectContent>
                  {presetTexts.map((text) => (
                    <SelectItem key={text} value={text}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCustomInput && (
                <>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 8) setCustomText(value);
                    }}
                    placeholder="최대 8글자까지 입력 가능"
                    maxLength={8}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-green focus:outline-none text-sm font-hand bg-white"
                  />
                  <p className="text-xs text-gray-500">{customText.length}/8 글자</p>
                </>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-2 sm:pt-4 lg:pt-6">
            <ActionButton
              onClick={onFinish}
              variant={isPersonal ? "primary" : "orange-primary"}
              className="w-full text-sm sm:text-base py-2.5 sm:py-4 lg:py-5"
            >
              저장하고 결과보러 가기
            </ActionButton>
            <ActionButton
              variant={isPersonal ? "secondary" : "orange-secondary"}
              onClick={onPrint}
              className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-4 lg:py-5"
            >
              <Printer size={18} />
              인쇄
            </ActionButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
