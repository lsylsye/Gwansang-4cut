import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Card } from "@/shared/ui/core/card";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/forms/select";
import { AnalyzeMode } from "@/shared/types";
import { getResultPath } from "@/shared/config/routes";
import film01 from "@/assets/film_01.png";
import film02 from "@/assets/film_02.png";
import frame01 from "@/assets/frame_01.png";
import frame02 from "@/assets/frame_02.png";
import ssafy02 from "@/assets/ssafy_02.png";
import shutterSound from "@/assets/shutter_sound.mp3";

interface PhotoBoothSectionProps {
  onBack: () => void;
  onComplete: (photos: string[]) => void;
  mode?: AnalyzeMode;
  analysisDone?: boolean;
  onNavigateToResult?: () => void;
  onStepChange?: (isCapturing: boolean) => void;
}


type FrameType = "vertical" | "horizontal";

const TOTAL_PHOTOS = 8; // 총 8장 촬영
const FINAL_PHOTO_COUNT = 4; // 최종 4컷 선택
const TIMER_SECONDS = 5; // 촬영 타이머 초기값 (초) — 셔터 간격

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
  
  // 스크롤 따라오는 플로팅 사이드바
  const [sidebarTop, setSidebarTop] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 컴포넌트 마운트 시 이전 촬영 사진 캐시 삭제
  useEffect(() => {
    // 이전 localStorage 데이터 삭제
    try {
      localStorage.removeItem("photoBoothSets");
    } catch (error) {
      console.error("이전 촬영 데이터 삭제 실패:", error);
    }
  }, []);

  useEffect(() => {
    if (frameType === "vertical") setFrameColor("#BFE7FF");
    else if (frameType === "horizontal") setFrameColor("#F4F1EE");
  }, [frameType]);

  // 데스크톱 여부 확인
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // 스크롤 따라오는 플로팅 사이드바 효과 (뷰포트 기준으로 스크롤 내릴 때 함께 내려가도록)
  useEffect(() => {
    if (!showCustomization || !isDesktop) return;

    const handleScroll = () => {
      if (!containerRef.current || !sidebarRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerHeight = containerRect.height;
      const sidebarHeight = sidebarRef.current.offsetHeight;
      const topOffset = 186; // 상단에서 유지할 거리 (px)

      // 뷰포트 기준: 사이드바를 topOffset 위치에 두려면 컨테이너 내부 top = topOffset - containerRect.top
      let point = topOffset - containerRect.top;
      // 컨테이너 범위 안으로 클램프 (위로 넘어가면 0, 아래로 넘어가면 하단에 맞춤)
      point = Math.max(0, Math.min(containerHeight - sidebarHeight, point));

      setSidebarTop(point);
    };

    const handleResize = () => {
      handleScroll();
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showCustomization, isDesktop]);

  // Canvas에 프레임과 이미지 그리기
  useEffect(() => {
    if (!showCustomization || !frameCanvasRef.current || !frameType) return;

    const canvas = frameCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 목표 해상도 설정
    const targetWidth = frameType === "vertical" ? 579 : 1800;
    const targetHeight = frameType === "vertical" ? 1740 : 1200;

    // Canvas 크기 설정
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 배경색 그리기
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // 이미지들을 로드하고 그리기
    const loadAndDrawImages = async () => {
      const imagePromises: Promise<HTMLImageElement>[] = [];
      
      // 프레임 이미지 로드
      const frameImg = new Image();
      frameImg.crossOrigin = "anonymous";
      const framePromise = new Promise<HTMLImageElement>((resolve, reject) => {
        frameImg.onload = () => resolve(frameImg);
        frameImg.onerror = reject;
        frameImg.src = frameType === "vertical" ? frame01 : frame02;
      });
      imagePromises.push(framePromise);

      // 선택된 사진들 로드
      const photoImages: (HTMLImageElement | null)[] = [];
      for (let i = 0; i < 4; i++) {
        const photoIdx = selectedPhotoIndices[i];
        if (photoIdx !== undefined && photos[photoIdx]) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const photoPromise = new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = photos[photoIdx]!;
          });
          imagePromises.push(photoPromise);
          photoImages[i] = img;
        } else {
          photoImages[i] = null;
        }
      }

      // 모든 이미지 로드 대기
      await Promise.all(imagePromises);

      // 배경색 다시 그리기 (이미지 위에 덮어쓰기 방지)
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (frameType === "vertical") {
        // 세로 프레임: 4개 세로 배치
        const paddingTop = targetHeight * 0.03; // 11%
        const gap = targetHeight * 0.024; // 2.5%
        const imageWidth = targetWidth * 0.85; // 85%
        const imageHeight = targetHeight * 0.187; // 19%

        for (let i = 0; i < 4; i++) {
          const img = photoImages[i];
          if (img) {
            const x = (targetWidth - imageWidth) / 2;
            const y = paddingTop + i * (imageHeight + gap);
            
            // 이미지 그리기 (object-cover 효과)
            const imgAspect = img.width / img.height;
            const targetAspect = imageWidth / imageHeight;
            
            // 영역 클리핑 설정
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, imageWidth, imageHeight);
            ctx.clip();
            
            let drawWidth = imageWidth;
            let drawHeight = imageHeight;
            let drawX = x;
            let drawY = y;

            if (imgAspect > targetAspect) {
              // 이미지가 더 넓음 - 높이에 맞춤 (넓은 부분은 잘림)
              drawHeight = imageHeight;
              drawWidth = drawHeight * imgAspect;
              drawX = x - (drawWidth - imageWidth) / 2;
            } else {
              // 이미지가 더 좁음 - 너비에 맞춤 (높은 부분은 잘림)
              drawWidth = imageWidth;
              drawHeight = drawWidth / imgAspect;
              drawY = y - (drawHeight - imageHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
          }
        }
      } else {
        // 가로 프레임: 2x2 그리드
        const paddingTop = targetHeight * 0.06; // 4.1%
        const paddingLeft = targetWidth * 0.04; // 4.1%
        const paddingRight = targetWidth * 0.225; // 22.5%
        const paddingBottom = targetHeight * 0.065; // 4.1%
        const gap = targetWidth * 0.015; // 2%

        const contentWidth = targetWidth - paddingLeft - paddingRight;
        const contentHeight = targetHeight - paddingTop - paddingBottom;
        const imageWidth = (contentWidth - gap) / 2;
        const imageHeight = (contentHeight - gap) / 2;
        const imageAspect = 652 / 521;
        const actualImageHeight = imageWidth / imageAspect;

        const positions = [
          { x: paddingLeft, y: paddingTop },
          { x: paddingLeft + imageWidth + gap, y: paddingTop },
          { x: paddingLeft, y: paddingTop + imageHeight + gap },
          { x: paddingLeft + imageWidth + gap, y: paddingTop + imageHeight + gap },
        ];

        for (let i = 0; i < 4; i++) {
          const img = photoImages[i];
          if (img) {
            const { x, y } = positions[i];
            
            // 영역 클리핑 설정
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, imageWidth, actualImageHeight);
            ctx.clip();
            
            // 이미지 그리기 (object-cover 효과)
            const imgAspect = img.width / img.height;
            
            let drawWidth = imageWidth;
            let drawHeight = actualImageHeight;
            let drawX = x;
            let drawY = y;

            if (imgAspect > imageAspect) {
              // 이미지가 더 넓음 - 높이에 맞춤 (넓은 부분은 잘림)
              drawHeight = actualImageHeight;
              drawWidth = drawHeight * imgAspect;
              drawX = x - (drawWidth - imageWidth) / 2;
            } else {
              // 이미지가 더 좁음 - 너비에 맞춤 (높은 부분은 잘림)
              drawWidth = imageWidth;
              drawHeight = drawWidth / imgAspect;
              drawY = y - (drawHeight - actualImageHeight) / 2;
            }

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
          }
        }

      }

      // 프레임 이미지 그리기
      ctx.drawImage(frameImg, 0, 0, targetWidth, targetHeight);

      // 커스텀 텍스트 그리기 (가로 프레임만, 프레임 이미지 위에 표시)
      if (frameType === "horizontal" && customText) {
        ctx.save();
        // IsYun 폰트 사용 (font-hand)
        const fontSize = Math.floor(targetWidth * 0.02); // 반응형 폰트 크기 (0.015에서 0.025로 증가)
        ctx.font = `${fontSize}px 'IsYun', cursive`;
        ctx.fillStyle = "#1F2937"; // text-gray-800
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        const textX = targetWidth * 0.883; // right: 7.5% = 92.5%
        const textY = targetHeight * 0.428; // top: 37% + height: 9% / 2 = 41.5%
        const textWidth = targetWidth * 0.065; // 7.5%
        
        // 텍스트 줄바꿈 처리
        const words = customText.split("");
        const lines: string[] = [];
        let currentLine = "";
        
        for (const char of words) {
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > textWidth && currentLine !== "") {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);

        // 여러 줄 텍스트 그리기
        const lineHeight = Math.floor(targetWidth * 0.02);
        const startY = textY - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line, textX, startY + index * lineHeight, textWidth);
        });
        
        ctx.restore();
      }
    };

    loadAndDrawImages().catch(console.error);
  }, [showCustomization, frameType, frameColor, selectedPhotoIndices, photos, customText]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
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
      console.error("카메라 접근 실패:", error);
      alert("카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.");
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
      console.error("사진 캡처 중 오류:", error);
    }
  };

  const handleRetakeAll = () => {
    setPhotos(Array(TOTAL_PHOTOS).fill(null));
    setCurrentPhotoIndex(0);
    startCamera();
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
          console.error("Canvas blob 생성 실패");
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
        
        // localStorage에 저장
        const selectedPhotos = selectedPhotoIndices.map(idx => photos[idx] as string);
        const newSet = {
          id: Date.now().toString(),
          photos: selectedPhotos,
          frameImage: frameImage,
          createdAt: new Date().toISOString(),
        };
        const existing = JSON.parse(
          localStorage.getItem("photoBoothSets") || "[]"
        );
        existing.unshift(newSet);
        const toSave = existing.slice(0, 1);
        try {
          localStorage.setItem(
            "photoBoothSets",
            JSON.stringify(toSave)
          );
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
      console.error("프레임 이미지 생성 실패:", error);
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

  // Step 1: 프레임 선택하기기
  if (!frameType) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto py-12 px-4"
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold font-display mb-4 text-gray-900 tracking-tight">
            프레임 선택하기
          </h2>
          <div className="h-1 w-20 bg-brand-green/30 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div
            whileHover={{ y: -12, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-full"
          >
            <Card
              className="flex-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#BFE7FF] shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-500 rounded-[2.5rem] flex flex-col items-center p-10 bg-white hover:bg-white/90 group"
              onClick={() => setFrameType("vertical")}
            >
              <div className="w-full aspect-[4/3] mb-8 rounded-3xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors overflow-hidden p-6">
                <img
                  src={film01}
                  alt="세로 프레임"
                  className="h-full w-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="text-center w-full px-2">
                <h3 className="text-2xl font-bold text-gray-900 font-display mb-3 whitespace-nowrap tracking-tight">
                  세로 프레임
                </h3>
                <p className="text-gray-500 leading-relaxed font-hand text-base sm:text-lg break-keep">
                  클래식한 4컷 세로 레이아웃입니다.<br />
                  1~2인 촬영에 가장 추천해 드려요.
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ y: -12, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex h-full"
          >
            <Card
              className="flex-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#D9D9D9] shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-500 rounded-[2.5rem] flex flex-col items-center p-10 bg-white hover:bg-white/90 group"
              onClick={() => setFrameType("horizontal")}
            >
              <div className="w-full aspect-[4/3] mb-8 rounded-3xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors overflow-hidden p-6">
                <img
                  src={film02}
                  alt="가로 프레임"
                  className="w-full h-auto object-contain transform group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="text-center w-full px-2">
                <h3 className="text-2xl font-bold text-gray-900 font-display mb-3 whitespace-nowrap tracking-tight">
                  가로 프레임
                </h3>
                <p className="text-gray-500 leading-relaxed font-hand text-base sm:text-lg break-keep">
                  단체 촬영에 적합한 와이드 프레임입니다.<br />
                  나만의 커스텀 문구 설정이 가능해요.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="flex justify-center">
          <ActionButton
            variant="secondary"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            이전 단계로
          </ActionButton>
        </div>
      </motion.div>
    );
  }

  // Step 2 혹은 Step 3 결정
  if (!showSelection) {
    // Step 2: 촬영화면
    return (
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
                      <span className="text-brand-red font-black text-2xl font-display tabular-nums leading-none">
                        {timer}
                      </span>
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
                        <ActionButton
                          onClick={startCamera}
                          variant={isPersonal ? "primary" : "orange-primary"}
                          className="w-full"
                        >
                          촬영 시작하기
                        </ActionButton>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full bg-black">
                      {photos[currentPhotoIndex] && !isCapturing ? (
                        <img
                          src={photos[currentPhotoIndex]!}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
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


            {/* SSAFY Guide - 좌측 하단 고정 */}
            <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start md:bottom-8 md:left-8">
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  className="mb-6 ml-6 max-w-[280px] md:max-w-sm pointer-events-auto origin-bottom-left relative"
                >
                  {/* 3D Claymorphism Bubble Container with Drop Shadow Filter */}
                  <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
                    {/* Main Bubble Body with Glassmorphism */}
                    <div className="bg-white backdrop-blur-md rounded-[24px] px-6 py-5 relative z-10 text-gray-800 border border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                      <p className="relative z-20 font-medium text-base md:text-lg leading-relaxed whitespace-pre-line font-hand break-keep">
                        {!isCapturing && !photos[currentPhotoIndex] 
                          ? `다 모여모여~\n촬영 버튼을 누르면 바로 촬영이 시작돼요.`
                          : isCapturing && timer !== null
                          ? `잠시만요!\n${timer}초 후 촬영됩니다.`
                          : isCapturing
                          ? "촬영 중입니다..."
                          : `짝짝짝~\n${TOTAL_PHOTOS}장 촬영이 완료되었어요!`}
                      </p>
                    </div>

                    {/* Triangle Tail using border trick with Glassmorphism - 좌측 하단용 */}
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
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 }
                }}
                whileHover={{ scale: 1.1, rotate: -5 }}
                className="relative pointer-events-auto"
              >
                <div className="w-[100px] h-[100px] relative drop-shadow-2xl">
                  <img
                    src={ssafy02}
                    alt="SSAFY Guide"
                    className="w-full h-full object-contain filter drop-shadow-lg"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  // Step 3 혹은 Step 4 결정
  if (showSelection && !showCustomization) {
    // Step 3: 베스트샷 선택
    return (
      <div className="flex flex-col items-center justify-start w-full min-h-[90vh] pb-24 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-5xl space-y-12"
        >
          {/* Header Section */}
          <div className="text-center space-y-4 pt-12">
            <h2 className="text-5xl font-black text-gray-900 font-display tracking-tight">베스트샷 선택</h2>
            <p className="text-gray-500 text-lg font-medium">8장의 사진 중 프레임에 담을 4장을 골라주세요.</p>
            <div className="inline-flex items-center gap-2 bg-brand-red px-8 py-3 rounded-2xl text-white font-bold text-2xl shadow-clay-xs">
              {selectedPhotoIndices.length} <span className="text-white/60 text-2xl">/</span> {FINAL_PHOTO_COUNT}
            </div>
          </div>

          {/* Grid Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {photos.map((photo, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePhotoToggle(index)}
                className={`relative rounded-3xl overflow-hidden cursor-pointer border-4 transition-all duration-300 shadow-xl ${selectedPhotoIndices.includes(index)
                  ? "border-brand-red ring-8 ring-brand-red/10"
                  : "border-white hover:border-gray-100"
                  }`}
                style={{
                  aspectRatio: frameType === "vertical" ? "500 / 340" : "652 / 521"
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
                    {/* Order Number */}
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

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
            <ActionButton
              variant={isPersonal ? "secondary" : "orange-secondary"}
              onClick={() => {
                setShowSelection(false);
                handleRetakeAll();
              }}
              className="px-6"
            >
              다시 촬영하기
            </ActionButton>
            <ActionButton
              disabled={selectedPhotoIndices.length !== FINAL_PHOTO_COUNT}
              onClick={() => setShowCustomization(true)}
              variant={selectedPhotoIndices.length === FINAL_PHOTO_COUNT
                ? (isPersonal ? "primary" : "orange-primary")
                : "secondary"}
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
  }

  // Step 4: Customization Screen
  if (showCustomization) {
    return (
      <div ref={containerRef} className="flex flex-col lg:flex-row w-full bg-gray-50/20 relative overflow-x-hidden scrollbar-hide" style={{ minHeight: '100vh' }}>
        {/* Main Content Area - Frame Preview */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 pb-24 lg:pb-12 lg:max-w-[calc(100%-20rem)] xl:max-w-[calc(100%-24rem)] scrollbar-hide" 
          style={{ minHeight: '100vh' }}
        >
        {/* Header */}
          <div className="w-full max-w-5xl mb-6 sm:mb-8 md:mb-12">
            <div className="text-center space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 font-display tracking-tight">프레임 꾸미기</h2>
              <p className="text-gray-500 text-sm sm:text-base md:text-lg font-medium">나만의 취향이 담긴 배경 색상을 골라보세요.</p>
          </div>
        </div>

          {/* Frame Preview */}
          <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center">
        <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative transform transition-transform duration-700 flex justify-center w-full"
            >
                {/* Canvas로 프레임과 이미지 렌더링 */}
                <canvas
                  ref={frameCanvasRef}
                  className="mx-auto w-full"
                  style={{
                    aspectRatio: frameType === "vertical" ? "579 / 1740" : "1800 / 1200",
                  maxWidth: frameType === "vertical" ? "min(40vw, 450px)" : "min(75vw, 1000px)",
                    transition: "background-color 0.5s ease"
                  }}
                />
            </motion.div>
            </div>
          </div>

        {/* Sidebar - Controls (플로팅바처럼 따라오기) */}
        <motion.div
          ref={sidebarRef}
          initial={{ opacity: 0, x: -50 }}
          animate={{ 
            opacity: 1, 
            x: 0
          }}
          transition={{ 
            x: { duration: 0.5 }
          }}
          className="w-full lg:w-80 xl:w-96 bg-white lg:border-r border-t lg:border-t-0 border-gray-200 shadow-lg flex flex-col p-6 sm:p-7 md:p-8 lg:p-10 rounded-t-2xl lg:rounded-tr-2xl lg:rounded-br-2xl overflow-y-auto lg:overflow-visible scrollbar-hide fixed lg:absolute bottom-0 lg:bottom-auto left-0 right-0 lg:left-auto lg:right-0 z-40 max-h-[60vh] lg:max-h-none"
          style={{
            top: isDesktop ? `${sidebarTop}px` : 'auto',
            transition: isDesktop ? 'top 1s ease-out' : 'none'
          }}
        >
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {/* 배경 색상 선택 */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="flex items-center gap-2">
                <div className={`w-1 h-5 sm:w-1.5 sm:h-6 ${isPersonal ? "bg-brand-green" : "bg-brand-orange"} rounded-full shadow-sm`} />
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">배경 색상</h3>
                </div>
              <div className="grid grid-cols-8 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4 w-full max-w-[420px] sm:max-w-[480px] lg:max-w-none mx-auto">
                  {PRESET_COLORS.map((color) => (
                    <motion.button
                      key={color.name}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setFrameColor(color.value)}
                      className={`relative w-full aspect-square rounded-lg border-2 transition-all ${frameColor === color.value
                        ? (isPersonal ? "border-brand-green shadow-md ring-1 ring-brand-green/20" : "border-brand-orange shadow-md ring-1 ring-brand-orange/20")
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

            {/* 가로 프레임 말풍선 커스텀 문구 (가로 프레임일 때만 표시) */}
            {frameType === "horizontal" && (
              <div className="space-y-3 sm:space-y-4">
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
                      {PRESET_TEXTS.map((text) => (
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
                        if (value.length <= 8) {
                          setCustomText(value);
                        }
                      }}
                      placeholder="최대 8글자까지 입력 가능"
                      maxLength={8}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 border-gray-200 focus:border-brand-green focus:outline-none text-sm font-hand bg-white"
                    />
                    <p className="text-xs text-gray-500">
                      {customText.length}/8 글자
                    </p>
                  </>
                  )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto pt-4 sm:pt-6">
              <ActionButton
                onClick={handleFinish}
                variant={isPersonal ? "primary" : "orange-primary"}
                className="w-full text-sm sm:text-base py-4 sm:py-5"
              >
                저장하고 결과보러 가기
              </ActionButton>
              <ActionButton
                variant={isPersonal ? "secondary" : "orange-secondary"}
                onClick={() => setShowCustomization(false)}
                className="w-full flex items-center justify-center gap-2 text-sm sm:text-base py-4 sm:py-5"
              >
                <ArrowLeft size={18} />
                사진 선택으로
              </ActionButton>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-[90vh] pb-24 px-4 sm:px-6">
      {/* Fallback rendering */}
    </div>
  );
};
