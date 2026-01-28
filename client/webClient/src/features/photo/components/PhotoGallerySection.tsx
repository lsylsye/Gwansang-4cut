import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, ArrowLeft, Download, X } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { AnalyzeMode } from "@/shared/types";

interface PhotoGallerySectionProps {
  onBack: () => void;
  onNavigateToPhotoBooth?: () => void;
  mode?: AnalyzeMode;
}

interface PhotoSet {
  id: string;
  photos: string[];
  createdAt: string;
}

export const PhotoGallerySection: React.FC<PhotoGallerySectionProps> = ({
  onBack,
  onNavigateToPhotoBooth,
  mode = "personal",
}) => {
  const isPersonal = mode === "personal";
  const brand = isPersonal ? "green" : "orange";
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<PhotoSet | null>(null);

  useEffect(() => {
    loadPhotoSets();
  }, []);

  const loadPhotoSets = () => {
    try {
      // 싸피네컷(photo-booth) onComplete에서 저장한 photoBoothSets 조회
      const saved = localStorage.getItem("photoBoothSets");
      if (saved) {
        const sets: PhotoSet[] = JSON.parse(saved);
        setPhotoSets(sets.slice(0, 1));
      } else {
        // If no sets, check for old format (single array)
        const oldPhotos = localStorage.getItem("photoBoothPhotos");
        if (oldPhotos) {
          const photos: (string | null)[] = JSON.parse(oldPhotos);
          const validPhotos = photos.filter(
            (photo): photo is string => photo !== null
          );
          if (validPhotos.length === 4) {
            const newSet: PhotoSet = {
              id: Date.now().toString(),
              photos: validPhotos,
              createdAt: new Date().toISOString(),
            };
            setPhotoSets([newSet]);
            localStorage.setItem("photoBoothSets", JSON.stringify([newSet]));
            localStorage.removeItem("photoBoothPhotos");
          }
        }
      }
    } catch (error) {
      console.error("Failed to load photo sets:", error);
    }
  };

  const handleDeleteSet = (id: string) => {
    const updated = photoSets.filter((set) => set.id !== id);
    setPhotoSets(updated);
    localStorage.setItem("photoBoothSets", JSON.stringify(updated));
    if (selectedSet?.id === id) {
      setSelectedSet(null);
    }
  };

  const handleDownload = (photo: string, index: number) => {
    const link = document.createElement("a");
    link.href = photo;
    link.download = `saffy-necut-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** 인생네컷형 세로 4컷 스트립 (상단 로고+날짜, 4컷, 하단 바) */
  const renderStrip = (
    photos: string[],
    opts?: { size?: "sm" | "md" | "lg"; showDate?: string; brand?: "green" | "orange" }
  ) => {
    const size = opts?.size ?? "md";
    const isGreen = opts?.brand !== "orange";
    const w = size === "sm" ? "w-[100px]" : size === "lg" ? "w-[200px] sm:w-[240px]" : "w-[140px] sm:w-[160px]";
    const headerPad = size === "sm" ? "py-1 px-1" : size === "lg" ? "py-3 px-3" : "py-2 px-2";
    const logoSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";
    const dateStr = opts?.showDate ?? new Date().toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    return (
      <div
        className={`${w} rounded-xl overflow-hidden border-2 shadow-xl ${
          isGreen ? "border-brand-green bg-white" : "border-brand-orange bg-white"
        }`}
      >
        <div
          className={`${headerPad} text-center border-b ${
            isGreen ? "bg-brand-green-muted border-brand-green/30" : "bg-brand-orange-muted border-brand-orange/30"
          }`}
        >
          <span className={`block ${logoSize} font-black tracking-[0.2em] font-display ${isGreen ? "text-brand-green" : "text-brand-orange"}`}>
            싸피네컷
          </span>
          {(opts?.showDate !== undefined || size !== "sm") && (
            <span className="text-[9px] text-gray-500 mt-0.5 block font-sans">{dateStr}</span>
          )}
        </div>
        <div className="flex flex-col bg-white">
          {photos.map((photo, index) => (
            <div
              key={index}
              className={`relative overflow-hidden flex-shrink-0 ${index < photos.length - 1 ? "border-b-2 border-gray-100" : ""}`}
              style={{ aspectRatio: "3/4" }}
            >
              <img src={photo} alt={`${index + 1}컷`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className={`h-1.5 ${isGreen ? "bg-brand-green-muted" : "bg-brand-orange-muted"}`} />
      </div>
    );
  };

  if (selectedSet) {
    return (
      <div
        className={`flex flex-col items-center justify-center w-full min-h-[75vh] py-8 px-4 ${
          isPersonal ? "bg-brand-green-pale/20" : "bg-brand-orange-muted/30"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl flex flex-col items-center"
        >
          <div className="flex items-center justify-between w-full mb-6">
            <button
              onClick={() => setSelectedSet(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-bold"
            >
              <ArrowLeft size={20} />
              갤러리로 돌아가기
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDeleteSet(selectedSet.id)}
                className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="저장 삭제"
                aria-label="저장 삭제"
              >
                <X size={20} />
              </button>
              <p className="text-sm text-gray-500">{formatDate(selectedSet.createdAt)}</p>
            </div>
          </div>

          {/* 인생네컷형 세로 4컷 스트립 (크게) */}
          <div className="mb-6">
            {renderStrip(selectedSet.photos, {
              size: "lg",
              showDate: new Date(selectedSet.createdAt).toLocaleDateString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              }),
              brand,
            })}
          </div>

          {/* 액션: 다운로드 */}
          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton
              variant={isPersonal ? "primary" : "orange-primary"}
              onClick={() => {
                selectedSet.photos.forEach((p, i) => handleDownload(p, i));
              }}
              className="flex items-center gap-2"
            >
              <Download size={18} />
              네컷 모두 다운로드
            </ActionButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-h-[75vh] py-8 px-4 ${
        isPersonal ? "bg-brand-green-pale/20" : "bg-brand-orange-muted/30"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-display">
              사진 갤러리
            </h2>
            <p className="text-gray-600 font-sans">
              찍은 사진 네컷을 확인하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            {photoSets.length > 0 && (
              <button
                onClick={() => handleDeleteSet(photoSets[0].id)}
                className="p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="저장 삭제"
                aria-label="저장 삭제"
              >
                <X size={20} />
              </button>
            )}
            <ActionButton
              variant="secondary"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              돌아가기
            </ActionButton>
          </div>
        </div>

        {/* Photo Sets Grid */}
        {photoSets.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-gray-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 font-display">
                  아직 찍은 사진이 없습니다
                </h3>
                <p className="text-gray-500">
                  사진 네컷을 찍어보세요!
                </p>
              </div>
            </div>
          </GlassCard>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {photoSets.map((set) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="cursor-pointer flex flex-col items-center"
                onClick={() => setSelectedSet(set)}
              >
                {renderStrip(set.photos, { size: "sm", brand })}
                <p className="text-xs text-gray-500 mt-2 font-sans">
                  {formatDate(set.createdAt)}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* 싸피네컷 버튼 */}
        <div className="flex justify-center mb-10 no-capture">
          {onNavigateToPhotoBooth && (
            <ActionButton
              variant={isPersonal ? "primary" : "orange-primary"}
              onClick={onNavigateToPhotoBooth}
              className="flex items-center gap-3 px-8 py-6 text-lg"
            >
              <Camera size={22} />
              싸피네컷
            </ActionButton>
          )}
        </div>
      </motion.div>
    </div>
  );
};
