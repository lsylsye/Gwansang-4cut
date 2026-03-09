import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera } from "lucide-react";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ActionButton } from "@/components/ui/core/ActionButton";
import ssafy02 from "@/assets/ssafy_02.png";
import type { FrameType } from "./FrameSelectorView";

const TOTAL_PHOTOS = 8;
const TIMER_SECONDS = 3;

export interface CaptureViewProps {
  frameType: FrameType;
  isPersonal: boolean;
  photos: (string | null)[];
  currentPhotoIndex: number;
  isCapturing: boolean;
  timer: number | null;
  isFlash: boolean;
  onStartCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const CaptureView: React.FC<CaptureViewProps> = ({
  frameType,
  isPersonal,
  photos,
  currentPhotoIndex,
  isCapturing,
  timer,
  isFlash,
  onStartCamera,
  videoRef,
  canvasRef,
}) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 w-full h-full flex flex-col bg-white z-50"
    >
      <GlassCard className="p-0 overflow-hidden border-none shadow-none rounded-none bg-white flex-grow flex flex-col h-full">
        <div className="relative flex-grow flex flex-col">
          <div className="absolute top-8 left-8 right-8 z-30 flex justify-between items-center">
            <div className="min-w-[100px]">
              <AnimatePresence mode="wait">
                {timer !== null && (
                  <motion.div
                    key={timer}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 bg-white px-6 py-2.5 rounded-full border border-gray-100 shadow-sm"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-red" />
                    <span className="text-sm font-medium text-gray-600 mr-1">남은 시간</span>
                    <span className="text-brand-red font-black text-2xl font-display tabular-nums leading-none">{timer}</span>
                    <span className="text-sm font-medium text-gray-600 ml-1">초</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="bg-gray-50 px-6 py-2.5 rounded-full border border-gray-100 flex items-center gap-3 shadow-sm">
              <span className="text-sm font-medium text-gray-600">촬영 횟수</span>
              <span className="text-xl font-black text-gray-800 font-display">
                {currentPhotoIndex + (photos[currentPhotoIndex] ? 1 : 0)}
                <span className="text-gray-300 font-medium text-lg px-2">/</span>
                {TOTAL_PHOTOS}
              </span>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center p-4 sm:p-8">
            <div
              style={{
                aspectRatio: frameType === "vertical" ? "511 / 350" : "652 / 521",
                width: "60%",
                maxWidth: "100%",
              }}
              className="relative bg-gray-100 overflow-hidden border-4 border-white shadow-[0_8px_32px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.08)] mx-auto transition-all duration-500 rounded-lg"
            >
              <div className="absolute inset-0 w-full h-full">
                {!photos[currentPhotoIndex] && !isCapturing ? (
                  <div className={`absolute inset-0 flex flex-col items-center justify-center ${isPersonal ? "bg-brand-green/5" : "bg-brand-orange/5"}`}>
                    <div className="flex flex-col items-center text-center space-y-8 max-w-md px-6">
                      <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center">
                        <Camera size={40} className={isPersonal ? "text-brand-green" : "text-brand-orange"} />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">촬영을 시작할까요?</h3>
                        <p className="text-gray-500 font-medium leading-relaxed text-sm sm:text-base">
                          {TIMER_SECONDS}초 간격으로 자동으로 셔터가 작동합니다.
                        </p>
                      </div>
                      <ActionButton onClick={onStartCamera} variant={isPersonal ? "primary" : "orange-primary"} className="w-full">
                        촬영 시작하기
                      </ActionButton>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-black">
                    {photos[currentPhotoIndex] && !isCapturing ? (
                      <img src={photos[currentPhotoIndex]!} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover bg-black"
                        style={{ transform: "scaleX(-1)" }}
                      />
                    )}
                    <AnimatePresence>
                      {isFlash && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.1 }}
                          className="absolute inset-0 bg-white z-50 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          </div>

          <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start md:bottom-8 md:left-8">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                className="mb-6 ml-6 max-w-[280px] md:max-w-sm pointer-events-auto origin-bottom-left relative"
              >
                <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                  <div className="bg-white backdrop-blur-md rounded-[24px] px-6 py-5 relative z-10 text-gray-800 border border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                    <p className="relative z-20 font-medium text-base md:text-lg leading-relaxed whitespace-pre-line font-hand break-keep">
                      {!isCapturing && !photos[currentPhotoIndex]
                        ? "다 모여모여~\n촬영 버튼을 누르면 바로 촬영이 시작돼요."
                        : isCapturing && timer !== null
                          ? `잠시만요!\n${timer}초 후 촬영됩니다.`
                          : isCapturing
                            ? "촬영 중입니다..."
                            : `짝짝짝~\n${TOTAL_PHOTOS}장 촬영이 완료되었어요!`}
                    </p>
                  </div>
                  <div className="absolute -bottom-4 left-12">
                    <svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 16C16 16 4 4 2 2C1 1 0 0 0 0H32C32 0 31 1 30 2C28 4 16 16 16 16Z" fill="white" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
              transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, opacity: { duration: 0.2 }, scale: { duration: 0.2 } }}
              whileHover={{ scale: 1.1, rotate: -5 }}
              className="relative pointer-events-auto"
            >
              <div className="w-[100px] h-[100px] relative drop-shadow-2xl">
                <img src={ssafy02} alt="SSAFY Guide" className="w-full h-full object-contain filter drop-shadow-lg" />
              </div>
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
);
