import { useRef, useState, useEffect, useCallback } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

// 얼굴 추적 및 상태 관리 인터페이스
interface FaceTracker {
  id: number;
  lastX: number;
  lastY: number;
  startTime: number;    // 정면 응시 시작 시간
  isSent: boolean;      // 전송 완료 여부
  isFrontal: boolean;   // 현재 정면인지 여부 (추가됨)
}

function getEulerAngles(matrix: any) {
  const m20 = matrix[2];
  const m21 = matrix[6];
  const m22 = matrix[10];

  const yaw = Math.atan2(-m20, Math.sqrt(m21 * m21 + m22 * m22));
  const pitch = Math.asin(m21); 
  return { pitch, yaw };
}

interface FaceMeshWebcamProps {
  onCapture?: (image: string, metadata?: any) => void;
  onClose?: () => void;
  onFaceCountChange?: (count: number) => void;
  maxFaces?: number;
  title?: string;
  themeColor?: "green" | "orange";
  showFaceCount?: boolean;
  useEllipseGuide?: boolean; // 개인관상용 ellipse 범위 체크
}

// Ellipse 설정 (중심: 0.5, 0.5 / 반지름: x=0.35, y=0.45)
const ELLIPSE_CX = 0.5;
const ELLIPSE_CY = 0.5;
const ELLIPSE_RX = 0.35;
const ELLIPSE_RY = 0.45;
const MIN_FACE_RATIO = 0.5; // 얼굴이 ellipse 크기의 최소 50% 이상이어야 함

// Ellipse 범위 안에 점이 있는지 체크
const isPointInsideEllipse = (x: number, y: number): boolean => {
  return Math.pow((x - ELLIPSE_CX) / ELLIPSE_RX, 2) + Math.pow((y - ELLIPSE_CY) / ELLIPSE_RY, 2) <= 1;
};

// 바운딩 박스 전체가 Ellipse 안에 있고, 충분히 큰지 체크
const isFaceInsideEllipse = (minX: number, minY: number, maxX: number, maxY: number): boolean => {
  // 1. 네 꼭짓점 모두 ellipse 안에 있어야 함
  const allCornersInside = (
    isPointInsideEllipse(minX, minY) &&
    isPointInsideEllipse(maxX, minY) &&
    isPointInsideEllipse(minX, maxY) &&
    isPointInsideEllipse(maxX, maxY)
  );
  
  if (!allCornersInside) return false;
  
  // 2. 얼굴이 충분히 커야 함 (ellipse 크기 대비)
  const faceWidth = maxX - minX;
  const faceHeight = maxY - minY;
  const ellipseWidth = ELLIPSE_RX * 2;
  const ellipseHeight = ELLIPSE_RY * 2;
  
  const widthRatio = faceWidth / ellipseWidth;
  const heightRatio = faceHeight / ellipseHeight;
  
  // 너비 또는 높이가 ellipse의 40% 이상이어야 함
  return widthRatio >= MIN_FACE_RATIO || heightRatio >= MIN_FACE_RATIO;
};

export const FaceMeshWebcam = ({ 
  onCapture, 
  onClose, 
  onFaceCountChange,
  maxFaces = 5,
  title = "",
  themeColor = "green",
  showFaceCount = false,
  useEllipseGuide = false
}: FaceMeshWebcamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const runningRef = useRef(false);
  const requestRef = useRef<number>(0);
  const facesStatusRef = useRef<FaceTracker[]>([]);

  const [running, setRunning] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isFaceOutsideGuide, setIsFaceOutsideGuide] = useState(false); // 얼굴이 가이드 밖에 있는지
  
  // CSS 변수에서 브랜드 폰트 가져오기
  const fontSans = getComputedStyle(document.documentElement).getPropertyValue('--font-family-sans').trim() || "'Pretendard', sans-serif";

  useEffect(() => {
    const loadModel = async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: maxFaces,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFacialTransformationMatrixes: true, 
      });
      setIsModelLoaded(true);
    };
    loadModel();
    return () => {
      stop();
      faceLandmarkerRef.current?.close();
    };
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current || !faceLandmarkerRef.current) return;
    
    runningRef.current = true;
    setRunning(true);
    facesStatusRef.current = [];

    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 960 },
        facingMode: "user"
      } 
    });
    streamRef.current = stream;
    video.srcObject = stream;
    
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => video.play().then(() => resolve());
    });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const loop = () => {
      if (!runningRef.current) return;
      const now = performance.now();

      if(faceLandmarkerRef.current) {
        const results = faceLandmarkerRef.current.detectForVideo(video, now);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (results.faceLandmarks && results.facialTransformationMatrixes) {
          
          // 1. 개별 상태 업데이트 (아직 전송 판단 X)
          const currentFrameTrackers: FaceTracker[] = [];
          const landmarksList = results.faceLandmarks;

          // 가이드 밖에 있는 얼굴 체크용 플래그
          let hasOutsideFace = false;
          let hasInsideFace = false;

          landmarksList.forEach((landmarks, i) => {
            // 중심점 계산
            let minX = 1, minY = 1, maxX = 0, maxY = 0;
            landmarks.forEach((pt) => {
              if (pt.x < minX) minX = pt.x;
              if (pt.y < minY) minY = pt.y;
              if (pt.x > maxX) maxX = pt.x;
              if (pt.y > maxY) maxY = pt.y;
            });
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;

            // ellipse 가이드 범위 체크 (개인관상일 때만) - 얼굴 전체가 들어와야 함
            if (useEllipseGuide && !isFaceInsideEllipse(minX, minY, maxX, maxY)) {
              hasOutsideFace = true; // 범위 밖 얼굴 있음
              return; // 범위 밖이면 무시
            }
            hasInsideFace = true; // 범위 안 얼굴 있음

            // 각도 계산
            const matrix = results.facialTransformationMatrixes![i].data;
            const { pitch, yaw } = getEulerAngles(matrix);
            const isFrontal = Math.abs(pitch) < 0.3 && Math.abs(yaw) < 0.3;

            // 이전 트래커 매칭
            let match = facesStatusRef.current.find(prev => {
               const dist = Math.sqrt(Math.pow(prev.lastX - centerX, 2) + Math.pow(prev.lastY - centerY, 2));
               return dist < 0.1;
            });

            let newTracker: FaceTracker;

            if (match) {
              if (isFrontal) {
                // 정면 유지 중 -> 시간 이어감
                newTracker = { ...match, lastX: centerX, lastY: centerY, isFrontal: true };
              } else {
                // 정면 아님 -> 리셋
                newTracker = { 
                  ...match, lastX: centerX, lastY: centerY, 
                  startTime: Date.now(), isSent: false, isFrontal: false 
                };
              }
            } else {
              // 새로운 얼굴
              newTracker = {
                id: Date.now() + i, lastX: centerX, lastY: centerY,
                startTime: Date.now(), isSent: false, isFrontal
              };
            }
            currentFrameTrackers.push(newTracker);
          });

          // 2. 🔥 [핵심 로직] "모두가 준비되었는가?" 판단
          const detectedFaceCount = currentFrameTrackers.length;
          setFaceCount(detectedFaceCount);
          if (onFaceCountChange) onFaceCountChange(detectedFaceCount);
          
          // 가이드 밖 얼굴 상태 업데이트 (얼굴이 감지되었지만 가이드 안에 없을 때)
          setIsFaceOutsideGuide(hasOutsideFace && !hasInsideFace);
          const DURATION = 3000;
          // const DURATION = 0; // 개발용 3초 대기 없음

          // 조건: 개인(1명 이상), 그룹(2명 이상)이어야 하고, 모두가 정면이고, 모두가 3초를 넘겨야 함
          const minFaces = maxFaces === 1 ? 1 : 2;
          // const minFaces = 0; // 개발용 최소 인원 없음
          const allReady = detectedFaceCount >= minFaces && currentFrameTrackers.every(t => t.isFrontal && (Date.now() - t.startTime >= DURATION));
          // const allReady = detectedFaceCount >= minFaces; // 개발용
          
          // 중복 전송 방지: 구성원 중 한 명이라도 아직 'isSent'가 안 된 상태여야 보냄
          // (즉, 이미 다 보냈으면 또 안 보냄)
          const needToSend = allReady && currentFrameTrackers.some(t => !t.isSent);

          if (needToSend) {
            // ✅ 1. 현재 로컬 시간(한국 시간 등)을 ISO 포맷으로 변환
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000; // 타임존 오프셋 계산 (분 -> 밀리초)
            const localDateTime = new Date(now.getTime() - offset).toISOString().slice(0, -1); // 'Z' 제거

            // ✅ 2. payload 생성 (백엔드 전송용 메타데이터)
            const payload = {
              timestamp: localDateTime, // "2026-01-19T14:40:25.123" 형식으로 들어감
              faces: currentFrameTrackers.map((tracker, idx) => ({
                faceIndex: idx + 1,
                duration: Date.now() - tracker.startTime,
                landmarks: landmarksList[idx].map((pt, i) => ({ 
                    index: i + 1, 
                    x: pt.x, 
                    y: pt.y, 
                    z: pt.z 
                }))
              }))
            };

            // 인식 완료(Done) 즉시 다음 단계(사진 확인)로 이동
            if (onCapture && canvasRef.current) {
              onCapture(canvasRef.current.toDataURL('image/jpeg'), payload);
            }

            // 중복 전송 방지 및 시각화 피드백을 위해 상태 업데이트
            currentFrameTrackers.forEach(t => t.isSent = true);
          }

          // 3. 🎨 시각화 그리기
          currentFrameTrackers.forEach((tracker, idx) => {
             const landmarks = landmarksList[idx];
             
             // 바운딩 박스 좌표 계산 (시각화를 위해 다시 계산)
             let minX = 1, minY = 1, maxX = 0, maxY = 0;
             landmarks.forEach((pt) => {
               if (pt.x < minX) minX = pt.x;
               if (pt.y < minY) minY = pt.y;
               if (pt.x > maxX) maxX = pt.x;
               if (pt.y > maxY) maxY = pt.y;
             });

             const x = minX * canvas.width;
             const y = minY * canvas.height;
             const w = (maxX - minX) * canvas.width;
             const h = (maxY - minY) * canvas.height;
             
             const elapsed = Date.now() - tracker.startTime;
             
             // 색상 로직:
             // 🔴 실패: brand-red (#FF5252)
             // 🔵 스캔중: 투명 파란색 (rgba(0, 180, 255, 0.8))
             // 🟢 성공: brand-green (#00897B)
             
             const brandRed = "#FF5252";
             const scanBlue = "rgba(0, 180, 255, 0.8)";
             const successGreen = "#00897B"; // brand-green
             
             let color = brandRed; // 실패 (정면 아님)
             if (tracker.isSent) {
               color = successGreen; // 전송됨 (성공)
             } else if (tracker.isFrontal) {
               color = scanBlue; // 스캔 중
             }

             // 랜드마크 점 찍기
             ctx.fillStyle = color;
             for (const pt of landmarks) {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 0.8, 0, 2 * Math.PI);
                ctx.fill();
             }

             // 촬영 프레임 스타일 (둥근 코너)
             ctx.strokeStyle = color;
             ctx.lineWidth = 5;
             const cornerLength = Math.min(w, h) * 0.2; // 코너 길이 (박스 크기의 20%)
             const radius = 10; // 둥근 정도
             
             // 좌상단 코너 (둥근)
             ctx.beginPath();
             ctx.moveTo(x, y + cornerLength);
             ctx.lineTo(x, y + radius);
             ctx.arcTo(x, y, x + radius, y, radius);
             ctx.lineTo(x + cornerLength, y);
             ctx.stroke();
             
             // 우상단 코너 (둥근)
             ctx.beginPath();
             ctx.moveTo(x + w - cornerLength, y);
             ctx.lineTo(x + w - radius, y);
             ctx.arcTo(x + w, y, x + w, y + radius, radius);
             ctx.lineTo(x + w, y + cornerLength);
             ctx.stroke();
             
             // 좌하단 코너 (둥근)
             ctx.beginPath();
             ctx.moveTo(x, y + h - cornerLength);
             ctx.lineTo(x, y + h - radius);
             ctx.arcTo(x, y + h, x + radius, y + h, radius);
             ctx.lineTo(x + cornerLength, y + h);
             ctx.stroke();
             
             // 우하단 코너 (둥근)
             ctx.beginPath();
             ctx.moveTo(x + w - cornerLength, y + h);
             ctx.lineTo(x + w - radius, y + h);
             ctx.arcTo(x + w, y + h, x + w, y + h - radius, radius);
             ctx.lineTo(x + w, y + h - cornerLength);
             ctx.stroke();

             // 텍스트 및 게이지 (좌우반전 보정)
             ctx.save();
             ctx.scale(-1, 1);
             ctx.font = `700 22px ${fontSans}`; // 브랜드 sans 폰트 사용

             const textX = -(x + w); // 반전된 x 좌표

             const textGap = 24; // 프레임과 텍스트 사이 간격
             const barGap = 16;  // 프레임과 게이지 바 사이 간격

             if (!tracker.isFrontal) {
               ctx.fillStyle = brandRed;
               ctx.fillText(`❌ 정면을 바라봐주세요`, textX, y - textGap);
             } else if (tracker.isSent) {
               ctx.fillStyle = successGreen;
               ctx.fillText(`✅ 촬영 완료`, textX, y - textGap);
             } else {
               // 전체가 대기 중일 때 (스캔 중)
               ctx.fillStyle = "white";
               // 내 시간 보여주기
               const progress = Math.min(elapsed / DURATION, 1);
               
               // 다른 사람이 안 보고 있어서 대기 중이라면? (그룹 모드일 때만)
               if (!allReady && elapsed >= DURATION && maxFaces > 1) {
                 ctx.fillText(`⏳ 다른 인원 대기중`, textX, y - textGap);
               } else {
                 ctx.fillText(`✅ 인식중 ${(elapsed/1000).toFixed(1)}s`, textX, y - textGap);
               }
               
               // 게이지 바 (반전 보정) 
               ctx.fillStyle = "rgba(255,255,255,0.3)";
               ctx.fillRect(-(x + w), y - barGap, w, 4);
               ctx.fillStyle = scanBlue;
               ctx.fillRect(-(x + w), y - barGap, w * progress, 4);
             }
             ctx.restore();
          });

          facesStatusRef.current = currentFrameTrackers;
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [onCapture]);

  // 모델 로드 완료 시 자동 시작
  useEffect(() => {
    if (isModelLoaded && !running) {
      start();
    }
  }, [isModelLoaded, running, start]);

  const stop = () => {
    runningRef.current = false;
    setRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    canvasRef.current?.getContext("2d")?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
    if (onClose) onClose();
  };

  const bgColorClass = themeColor === "green" ? "bg-brand-green" : "bg-brand-orange";
  
  // 상황별 안내 메시지
  const getDisplayTitle = () => {
    // 개인 모드: 가이드 밖에 얼굴이 있거나 너무 작을 때
    if (useEllipseGuide && isFaceOutsideGuide) {
      return "가이드에 맞게 얼굴을 가까이 해주세요";
    }
    // 그룹 모드: 인원 부족 시
    if (showFaceCount && faceCount < 2) {
      return "2명 이상부터 촬영 가능합니다";
    }
    return title;
  };
  const displayTitle = getDisplayTitle();

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Top Center - Title */}
      {displayTitle && (
        <div className="absolute top-5 z-10 w-full text-center flex justify-center">
          <h2 className={`${bgColorClass} text-white text-sm font-bold px-4 py-2 rounded-full shadow-md font-sans`}>
            {displayTitle}
          </h2>
        </div>
      )}
      
      {/* Bottom Right - Face Count */}
      {showFaceCount && (
        <div className="absolute bottom-5 right-5 z-10">
          <div className={`${bgColorClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5`}>
            <span className="animate-pulse">●</span>
            {faceCount}명 감지
          </div>
        </div>
      )}
      
      {!isModelLoaded && <p className="text-white absolute top-20 z-10">⏳ 모델 로딩 중...</p>}
      <div className="w-full h-full">
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} className="w-full h-full object-cover bg-black" style={{ transform: 'scaleX(-1)' }} />
      </div>
    </div>
  );
};
