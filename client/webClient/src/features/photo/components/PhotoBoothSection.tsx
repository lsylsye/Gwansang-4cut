import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, ArrowRight, ArrowLeft, CheckCircle2, X } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { AnalyzeMode } from "@/shared/types";

interface PhotoBoothSectionProps {
  onBack: () => void;
  onComplete: (photos: string[]) => void;
  mode?: AnalyzeMode;
}

const PHOTO_COUNT = 4;

export const PhotoBoothSection: React.FC<PhotoBoothSectionProps> = ({
  onBack,
  onComplete,
  mode = "personal",
}) => {
  const isPersonal = mode === "personal";
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(PHOTO_COUNT).fill(null)
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setIsCapturing(true);
    } catch (error) {
      console.error("카메라 접근 실패:", error);
      alert("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
      setIsCapturing(false);
    }
  };

  // video는 isCapturing일 때만 DOM에 마운트되므로, 마운트 후에 srcObject 연결
  useEffect(() => {
    if (!isCapturing || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    video.srcObject = stream;
    const onReady = () => {
      video.play().catch(() => {});
    };
    video.onloadedmetadata = onReady;
    if (video.readyState >= 2) onReady();
    return () => {
      video.onloadedmetadata = null;
    };
  }, [isCapturing]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video) {
      console.error("Video element not found");
      return;
    }
    
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }
    
    if (!video.videoWidth || !video.videoHeight) {
      console.error("카메라가 준비되지 않았습니다. videoWidth:", video.videoWidth, "videoHeight:", video.videoHeight);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        console.error("Canvas context를 가져올 수 없습니다.");
        return;
      }
      
      // 거울 모드로 저장 (좌우 반전)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      ctx.restore();
      
      // JPEG(0.85)로 저장해 용량을 줄여 photoBoothSets localStorage 저장 시 QuotaExceeded 방지
      const imageData = canvas.toDataURL("image/jpeg", 0.85);
      console.log("사진 캡처 성공, 크기:", canvas.width, "x", canvas.height);
      
      const newPhotos = [...photos];
      newPhotos[currentPhotoIndex] = imageData;
      setPhotos(newPhotos);

      stopCamera();

      // Move to next photo if not last
      if (currentPhotoIndex < PHOTO_COUNT - 1) {
        setTimeout(() => {
          setCurrentPhotoIndex(currentPhotoIndex + 1);
        }, 500);
      }
    } catch (error) {
      console.error("사진 캡처 중 오류:", error);
      alert("사진 캡처에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleRetake = () => {
    const newPhotos = [...photos];
    newPhotos[currentPhotoIndex] = null;
    setPhotos(newPhotos);
    startCamera();
  };

  const handleNext = () => {
    if (currentPhotoIndex < PHOTO_COUNT - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleFinish = () => {
    const completedPhotos = photos.filter(
      (photo): photo is string => photo !== null
    );
    if (completedPhotos.length === PHOTO_COUNT) {
      onComplete(completedPhotos);
    }
  };

  const allPhotosCompleted = photos.every((photo) => photo !== null);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full min-h-[75vh] py-8 px-4 ${
        isPersonal ? "bg-brand-green-pale/20" : "bg-brand-orange-muted/30"
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-4xl rounded-2xl p-6 md:p-8 ${
          isPersonal
            ? "bg-white/90 border-2 border-brand-green shadow-lg"
            : "bg-white/90 border-2 border-brand-orange shadow-lg"
        }`}
      >
        {/* 인생네컷 스타일: 2×6인치형 세로 4컷 포토 스트립 */}
        <div className="flex flex-col items-center mb-6">
          <p className="text-sm text-gray-500 font-sans mb-3">
            {currentPhotoIndex + 1} / {PHOTO_COUNT}
          </p>
          <div
            className={`w-[140px] sm:w-[160px] rounded-xl overflow-hidden border-2 shadow-xl ${
              isPersonal
                ? "border-brand-green bg-white"
                : "border-brand-orange bg-white"
            }`}
          >
            {/* 상단: 로고 + 날짜·시간 (인생네컷 상단 구조) */}
            <div
              className={`py-2 px-2 text-center border-b ${
                isPersonal
                  ? "bg-brand-green-muted border-brand-green/30"
                  : "bg-brand-orange-muted border-brand-orange/30"
              }`}
            >
              <span
                className={`block text-xs font-black tracking-[0.2em] font-display ${
                  isPersonal ? "text-brand-green" : "text-brand-orange"
                }`}
              >
                싸피네컷
              </span>
              <span className="text-[9px] text-gray-500 mt-0.5 block font-sans">
                {new Date().toLocaleDateString("ko-KR", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {/* 세로 4컷: 컷 사이 얇은 구분 (인생네컷 4프레임 연속) */}
            <div className="flex flex-col bg-white">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden flex-shrink-0 ${
                    index < PHOTO_COUNT - 1 ? "border-b-2 border-gray-100" : ""
                  } ${index === currentPhotoIndex ? "ring-2 ring-offset-0 " + (isPersonal ? "ring-brand-green" : "ring-brand-orange") : ""}`}
                  style={{ aspectRatio: "3/4" }}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`${index + 1}컷`}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                          isPersonal ? "bg-brand-green" : "bg-brand-orange"
                        }`}
                      >
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 bg-gray-50/50">
                      <Camera size={16} className="mb-0.5" />
                      <span className="text-[9px] font-medium">{index + 1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* 하단 바 (인생네컷 스트립 끝) */}
            <div
              className={`h-1.5 ${isPersonal ? "bg-brand-green-muted" : "bg-brand-orange-muted"}`}
            />
          </div>
        </div>

        {/* Camera View - 모드별 테두리 */}
        <GlassCard
          className={`p-0 w-full relative overflow-hidden mb-8 bg-gray-900 ${
            isPersonal ? "ring-2 ring-brand-green" : "ring-2 ring-brand-orange"
          }`}
          style={{ aspectRatio: "4/3", minHeight: "400px" }}
        >
          {!photos[currentPhotoIndex] && !isCapturing ? (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center ${
                isPersonal ? "bg-brand-green-muted/50" : "bg-brand-orange-muted/50"
              }`}
            >
              <div className="text-center space-y-4">
                <div className={`w-20 h-20 ${isPersonal ? "bg-brand-green-muted" : "bg-brand-orange-muted"} rounded-full flex items-center justify-center mx-auto ring-4 ${isPersonal ? "ring-brand-green/30" : "ring-brand-orange/30"}`}>
                  <Camera size={40} className={isPersonal ? "text-brand-green" : "text-brand-orange"} />
                </div>
                <p className="text-gray-700 font-bold">
                  {currentPhotoIndex + 1}컷 찍기
                </p>
                <ActionButton
                  variant={isPersonal ? "primary" : "orange-primary"}
                  onClick={startCamera}
                  className="mt-4"
                >
                  촬영 시작
                </ActionButton>
              </div>
            </div>
          ) : photos[currentPhotoIndex] && !isCapturing ? (
            <div className="relative w-full h-full">
              <img
                src={photos[currentPhotoIndex]!}
                alt={`Captured ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-4">
                <ActionButton
                  variant="secondary"
                  onClick={handleRetake}
                  className="flex items-center gap-2"
                >
                  <X size={18} />
                  다시 찍기
                </ActionButton>
              </div>
            </div>
          ) : (
            <div className="relative w-full bg-black" style={{ aspectRatio: "4/3", minHeight: "400px" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover bg-black"
                style={{ transform: "scaleX(-1)", zIndex: 1 }}
              />
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
              {/* 인생네컷 스타일: 하단 셔터·취소 */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4 z-10">
                <ActionButton
                  variant="secondary"
                  onClick={stopCamera}
                  className="flex items-center gap-2 py-4 px-5"
                >
                  <X size={18} />
                  취소
                </ActionButton>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                    isPersonal ? "bg-brand-green" : "bg-brand-orange"
                  } hover:opacity-90 active:scale-95 transition-all`}
                  aria-label="촬영"
                >
                  <Camera size={28} className="text-white" />
                </button>
                <div className="w-[88px]" aria-hidden="true" />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Navigation */}
        <div className="flex justify-between items-center gap-4">
          <ActionButton
            variant="secondary"
            onClick={onBack}
            className="flex items-center gap-2"
            disabled={isCapturing}
          >
            <ArrowLeft size={18} />
            돌아가기
          </ActionButton>

          <div className="flex gap-2">
            {currentPhotoIndex > 0 && (
              <ActionButton
                variant="secondary"
                onClick={handlePrev}
                disabled={isCapturing}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                이전
              </ActionButton>
            )}
            {currentPhotoIndex < PHOTO_COUNT - 1 && (
              <ActionButton
                variant={isPersonal ? "primary" : "orange-primary"}
                onClick={handleNext}
                disabled={!photos[currentPhotoIndex] || isCapturing}
                className="flex items-center gap-2"
              >
                다음
                <ArrowRight size={18} />
              </ActionButton>
            )}
          </div>

          {allPhotosCompleted && (
            <ActionButton
              variant={isPersonal ? "primary" : "orange-primary"}
              onClick={handleFinish}
              className="flex items-center gap-2"
            >
              완료
              <ArrowRight size={18} />
            </ActionButton>
          )}
        </div>
      </motion.div>
    </div>
  );
};
