import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { devError } from "@/utils/logger";
import { useNavigate } from "react-router-dom";
import { AnalyzeMode } from "@/types";
import { getResultPath } from "@/routes/routes";
import shutterSound from "@/assets/shutter_sound.mp3";
import { FrameSelectorView, type FrameType } from "./FrameSelectorView";
import { CaptureView } from "./CaptureView";
import { PhotoSelectionView } from "./PhotoSelectionView";
import { CustomizationView } from "./CustomizationView";

export interface PhotoBoothSectionProps {
  onBack: () => void;
  onComplete: (photos: string[]) => void;
  mode?: AnalyzeMode;
  analysisDone?: boolean;
  onNavigateToResult?: () => void;
  onStepChange?: (isCapturing: boolean) => void;
}


const TOTAL_PHOTOS = 8; // 총 8장 촬영
const FINAL_PHOTO_COUNT = 4; // 최종 4컷 선택
const TIMER_SECONDS = 3; // 촬영 타이머 초기값 (초) — 셔터 간격 (3초에 1장)

export const PhotoBoothSection: React.FC<PhotoBoothSectionProps> = ({
  onBack,
  onComplete,
  mode = "personal",
  analysisDone = false,
  onNavigateToResult,
  onStepChange,
}) => {
  const isPersonal = mode === "personal";

  // Step 1: Frame selection
  const [frameType, setFrameType] = useState<FrameType | null>(null);

  // Step 2: Photo capture (8 photos)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const currentIndexRef = useRef(0); // stale closure 방지용 Ref
  const [photos, setPhotos] = useState<(string | null)[]>(
    Array(TOTAL_PHOTOS).fill(null)
  );

  const [isCapturing, setIsCapturing] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isFlash, setIsFlash] = useState(false);

  // Step 3: Selection
  const [showSelection, setShowSelection] = useState(false);
  const [selectedPhotoIndices, setSelectedPhotoIndices] = useState<number[]>([]);

  // Step 4: Customization
  const [showCustomization, setShowCustomization] = useState(false);
  const [frameColor, setFrameColor] = useState("");
  const [customText, setCustomText] = useState("아자스");
  const [isCustomInput, setIsCustomInput] = useState(false);

  const PRESET_TEXTS = [
    "아자스",
    "부울경 이즈굿",
    "14기 화이팅♡",
    "15기 화이팅♡",
    "운동 많이 된다",
    "두쫀쿠 먹고싶다",
    "직접입력"
  ];

  const PRESET_COLORS = [
    { name: "Sky Blue", value: "#BFE7FF" },
    { name: "Cream", value: "#F4F1EE" },
    { name: "Lavender", value: "#E7E4FF" },
    { name: "Mint", value: "#E4F9F1" },
    { name: "Pink", value: "#FFD9E6" },
    { name: "White", value: "#FFFFFF" },
    { name: "Navy Blue", value: "#0C354E" },
    { name: "Black", value: "#010C13" },
  ];

  // 컴포넌트 마운트 시 현재 모드의 이전 촬영 캐시만 삭제 (개인/모임 분리)
  const storageKey = isPersonal ? "photoBoothSets_personal" : "photoBoothSets_group";
  useEffect(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      devError("이전 촬영 데이터 삭제 실패:", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (frameType === "vertical") setFrameColor("#BFE7FF");
    else if (frameType === "horizontal") setFrameColor("#F4F1EE");
  }, [frameType]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shutterAudioRef = useRef<HTMLAudioElement | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 셔터음 사전 로딩
    shutterAudioRef.current = new Audio(shutterSound);

    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setIsCapturing(true);
      // 인덱스 초기화
      currentIndexRef.current = 0;
      setCurrentPhotoIndex(0);
      setPhotos(Array(TOTAL_PHOTOS).fill(null));
      // 촬영 시작과 함께 자동 셔터 루틴 시작
      startAutoShootRoutine();
    } catch (error) {
      toast.error("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
      setIsCapturing(false);
    }
  };

  const startAutoShootRoutine = () => {
    runTimer(TIMER_SECONDS);
  };

  const runTimer = (seconds: number) => {
    setTimer(seconds);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!isCapturing || !streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    video.srcObject = stream;
    const onReady = () => {
      video.play().catch(() => { });
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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsCapturing(false);
    setTimer(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const index = currentIndexRef.current;

    if (!video || !canvas || !video.videoWidth) return;

    if (shutterAudioRef.current) {
      shutterAudioRef.current.currentTime = 0;
      shutterAudioRef.current.play().catch(() => { });
    }
    setIsFlash(true);
    setTimeout(() => setIsFlash(false), 200);

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      ctx.restore();

      const imageData = canvas.toDataURL("image/jpeg", 0.85);

      setPhotos((prev) => {
        const nextPhotos = [...prev];
        nextPhotos[index] = imageData;
        return nextPhotos;
      });

      if (index < TOTAL_PHOTOS - 1) {
        currentIndexRef.current = index + 1;
        setCurrentPhotoIndex(index + 1);
        setTimeout(() => {
          runTimer(TIMER_SECONDS);
        }, 1500);
      } else {
        stopCamera();
        setTimeout(() => {
          setShowSelection(true);
        }, 1500);
      }
    } catch (error) {
      devError("사진 캡처 중 오류:", error);
    }
  };

  const handleRetakeAll = () => {
    setPhotos(Array(TOTAL_PHOTOS).fill(null));
    setCurrentPhotoIndex(0);
    startCamera();
  };

  /** 캔버스(프레임) 영역만 인쇄 — 새 창에 이미지만 띄운 뒤 해당 창 인쇄 */
  const handlePrint = () => {
    const canvas = frameCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>인쇄</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; }
            @media print { body { padding: 0; } img { max-width: 100% !important; } }
          </style>
        </head>
        <body><img src="${dataUrl}" alt="프레임" /></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 300);
  };

  const handleFinish = async () => {
    if (!frameCanvasRef.current) {
      const selectedPhotos = selectedPhotoIndices.map(idx => photos[idx] as string);
      onComplete(selectedPhotos);
      return;
    }

    try {
      const canvas = frameCanvasRef.current;
      
      // Canvas에서 직접 PNG 데이터 가져오기
      canvas.toBlob((blob) => {
        if (!blob) {
          devError("Canvas blob 생성 실패");
          const selectedPhotos = selectedPhotoIndices.map(idx => photos[idx] as string);
          onComplete(selectedPhotos);
          return;
        }

        // Blob URL 생성 및 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `싸피네컷_${new Date().getTime()}.png`;
        link.href = url;
        link.click();
        
        // Blob URL 정리
        setTimeout(() => URL.revokeObjectURL(url), 100);

        // Data URL로 변환하여 localStorage에 저장
        const frameImage = canvas.toDataURL("image/png", 1.0);
        
        // localStorage에 저장 (개인/모임 분리)
        const selectedPhotos = selectedPhotoIndices.map(idx => photos[idx] as string);
        const storageKey = mode === "personal" ? "photoBoothSets_personal" : "photoBoothSets_group";
        const newSet = {
          id: Date.now().toString(),
          photos: selectedPhotos,
          frameImage: frameImage,
          createdAt: new Date().toISOString(),
        };
        const existing = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        );
        existing.unshift(newSet);
        const toSave = existing.slice(0, 1);
        try {
          localStorage.setItem(storageKey, JSON.stringify(toSave));
        } catch {
          // QuotaExceededError 등: 저장 실패해도 진행
        }
        
        // PNG 저장 완료 후 /result로 이동 (onComplete 호출하지 않음)
        // onComplete를 호출하면 analysisDone이 false일 때 /analyzing으로 이동하므로
        // 직접 navigate만 호출
        // fromPhotoBooth를 false로 설정하여 관상 분석 탭으로 이동
        setTimeout(() => {
          navigate(getResultPath(mode), {
            state: {
              frameImage,
              fromPhotoBooth: false,
            },
            replace: true,
          });
        }, 500);
      }, "image/png", 1.0);
    } catch (error) {
      devError("프레임 이미지 생성 실패:", error);
      // 실패 시 기존 로직 실행
      const selectedPhotos = selectedPhotoIndices.map(idx => photos[idx] as string);
      onComplete(selectedPhotos);
    }
  };

  const handlePhotoToggle = (index: number) => {
    setSelectedPhotoIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length >= FINAL_PHOTO_COUNT) {
        return [...prev.slice(1), index];
      }
      return [...prev, index];
    });
  };

  // 분석 완료 알림은 App.tsx에서 관리하므로 여기서는 제거

  // 헤더 표시 제어: 사진 촬영 단계가 아닐 때 헤더 표시
  useEffect(() => {
    const isCapturing = !frameType ? false : !showSelection;
    onStepChange?.(isCapturing);
    return () => {
      onStepChange?.(false);
    };
  }, [frameType, showSelection, onStepChange]);

  // Step 1: 프레임 선택
  if (!frameType) {
    return <FrameSelectorView onSelectFrame={setFrameType} onBack={onBack} />;
  }

  // Step 2: 촬영 화면
  if (!showSelection) {
    return (
      <CaptureView
        frameType={frameType}
        isPersonal={isPersonal}
        photos={photos}
        currentPhotoIndex={currentPhotoIndex}
        isCapturing={isCapturing}
        timer={timer}
        isFlash={isFlash}
        onStartCamera={startCamera}
        videoRef={videoRef}
        canvasRef={canvasRef}
      />
    );
  }

  // Step 3: 베스트샷 선택
  if (showSelection && !showCustomization) {
    return (
      <PhotoSelectionView
        photos={photos}
        frameType={frameType}
        selectedPhotoIndices={selectedPhotoIndices}
        onToggle={handlePhotoToggle}
        onRetake={() => {
          setShowSelection(false);
          handleRetakeAll();
        }}
        onNext={() => setShowCustomization(true)}
        isPersonal={isPersonal}
      />
    );
  }

  // Step 4: 프레임 꾸미기
  if (showCustomization) {
    return (
      <CustomizationView
        frameCanvasRef={frameCanvasRef}
        frameType={frameType}
        frameColor={frameColor}
        setFrameColor={setFrameColor}
        customText={customText}
        setCustomText={setCustomText}
        isCustomInput={isCustomInput}
        setIsCustomInput={setIsCustomInput}
        selectedPhotoIndices={selectedPhotoIndices}
        photos={photos}
        presetTexts={PRESET_TEXTS}
        presetColors={PRESET_COLORS}
        onBack={() => setShowCustomization(false)}
        onPrint={handlePrint}
        onFinish={handleFinish}
        isPersonal={isPersonal}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-[90vh] pb-24 px-4 sm:px-6">
      {/* Fallback */}
    </div>
  );
};
