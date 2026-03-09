import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { ActionButton } from "@/components/ui/core/ActionButton";
import type { FrameType } from "./FrameSelectorView";

const FINAL_PHOTO_COUNT = 4;

export interface PhotoSelectionViewProps {
  photos: (string | null)[];
  frameType: FrameType;
  selectedPhotoIndices: number[];
  onToggle: (index: number) => void;
  onRetake: () => void;
  onNext: () => void;
  isPersonal: boolean;
}

export const PhotoSelectionView: React.FC<PhotoSelectionViewProps> = ({
  photos,
  frameType,
  selectedPhotoIndices,
  onToggle,
  onRetake,
  onNext,
  isPersonal,
}) => (
  <div className="flex flex-col items-center justify-start w-full min-h-[90vh] pb-24 px-4 sm:px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl space-y-12"
    >
      <div className="text-center space-y-4 pt-12">
        <h2 className="text-5xl font-black text-gray-900 font-display tracking-tight">베스트샷 선택</h2>
        <p className="text-gray-500 text-lg font-medium">8장의 사진 중 프레임에 담을 4장을 골라주세요.</p>
        <div className="inline-flex items-center gap-2 bg-brand-red px-8 py-3 rounded-2xl text-white font-bold text-2xl shadow-clay-xs">
          {selectedPhotoIndices.length} <span className="text-white/60 text-2xl">/</span> {FINAL_PHOTO_COUNT}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(index)}
            className={`relative rounded-3xl overflow-hidden cursor-pointer border-4 transition-all duration-300 shadow-xl ${
              selectedPhotoIndices.includes(index)
                ? "border-brand-red ring-8 ring-brand-red/10"
                : "border-white hover:border-gray-100"
            }`}
            style={{
              aspectRatio: frameType === "vertical" ? "500 / 340" : "652 / 521",
            }}
          >
            {photo && (
              <img src={photo} alt={`shot-${index}`} className="w-full h-full object-cover" />
            )}
            {selectedPhotoIndices.includes(index) && (
              <>
                <div className="absolute inset-0 bg-brand-red/10 flex items-center justify-center">
                  <div className="bg-brand-red text-white p-2 rounded-full shadow-lg">
                    <Check size={24} strokeWidth={4} />
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-brand-red text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-lg">
                  {selectedPhotoIndices.indexOf(index) + 1}
                </div>
              </>
            )}
            <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-bold">
              #{index + 1}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
        <ActionButton
          variant={isPersonal ? "secondary" : "orange-secondary"}
          onClick={onRetake}
          className="px-6"
        >
          다시 촬영하기
        </ActionButton>
        <ActionButton
          disabled={selectedPhotoIndices.length !== FINAL_PHOTO_COUNT}
          onClick={onNext}
          variant={
            selectedPhotoIndices.length === FINAL_PHOTO_COUNT
              ? (isPersonal ? "primary" : "orange-primary")
              : "secondary"
          }
          className="px-10"
        >
          {selectedPhotoIndices.length === FINAL_PHOTO_COUNT
            ? "프레임 꾸미러 가기"
            : `${FINAL_PHOTO_COUNT - selectedPhotoIndices.length}장 더 선택해주세요`}
          <ArrowRight size={24} className="ml-4" />
        </ActionButton>
      </div>
    </motion.div>
  </div>
);
