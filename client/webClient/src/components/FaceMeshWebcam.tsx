import { useRef, useState, useEffect } from "react";
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

export default function FaceLandmarkerGroupChallenge() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const runningRef = useRef(false);
  const requestRef = useRef<number>(0);
  const facesStatusRef = useRef<FaceTracker[]>([]);

  const [running, setRunning] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

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
        numFaces: 5,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFacialTransformationMatrixes: true, 
      });
      setIsModelLoaded(true);
    };
    loadModel();
    return () => faceLandmarkerRef.current?.close();
  }, []);

  const start = async () => {
    if (runningRef.current || !faceLandmarkerRef.current) return;
    
    runningRef.current = true;
    setRunning(true);
    facesStatusRef.current = [];

    const video = videoRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
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
          const faceCount = currentFrameTrackers.length;
          const DURATION = 3000;

          // 조건: 사람이 1명 이상이어야 하고, 모두가 정면이고, 모두가 3초를 넘겨야 함
          const allReady = faceCount > 0 && currentFrameTrackers.every(t => t.isFrontal && (Date.now() - t.startTime >= DURATION));
          
          // 중복 전송 방지: 구성원 중 한 명이라도 아직 'isSent'가 안 된 상태여야 보냄
          // (즉, 이미 다 보냈으면 또 안 보냄)
          const needToSend = allReady && currentFrameTrackers.some(t => !t.isSent);

          if (needToSend) {
            console.log("🚀 모두 3초 정면 응시 성공! 데이터 전송!");
            
            // ✅ 1. 현재 로컬 시간(한국 시간 등)을 ISO 포맷으로 변환
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000; // 타임존 오프셋 계산 (분 -> 밀리초)
            const localDateTime = new Date(now.getTime() - offset).toISOString().slice(0, -1); // 'Z' 제거

            // ✅ 2. payload 생성
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

            fetch("http://localhost:8080/api/facemesh", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).catch(() => {});

            // 모두 전송 완료 처리
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
             // 🔴 빨강: 정면 아님 (나 때문에 실패!)
             // 🟡 노랑: 정면 O, 시간 가는 중 (나도 대기 중)
             // 🟢 초록: 모두 성공해서 전송됨
             
             let color = "red";
             if (tracker.isSent) {
               color = "#00FF00"; // 전송됨 (성공)
             } else if (tracker.isFrontal) {
               color = "yellow";  // 대기 중
             }

             // 랜드마크 점 찍기
             ctx.fillStyle = color;
             for (const pt of landmarks) {
                ctx.beginPath();
                ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 0.8, 0, 2 * Math.PI);
                ctx.fill();
             }

             // 박스 그리기
             ctx.strokeStyle = color;
             ctx.lineWidth = 2;
             ctx.strokeRect(x, y, w, h);

             // 텍스트 및 게이지
             ctx.font = "bold 16px Arial";

             const faceLabel = `Face ${idx + 1}`;

             if (!tracker.isFrontal) {
               ctx.fillStyle = "red";
               ctx.fillText(`${faceLabel}: ❌ Look Front`, x, y - 10);
             } else if (tracker.isSent) {
               ctx.fillStyle = "#00FF00";
               ctx.fillText(`${faceLabel}: ✅ Done`, x, y - 10);
             } else {
               // 전체가 대기 중일 때
               ctx.fillStyle = "white";
               // 내 시간 보여주기
               const progress = Math.min(elapsed / DURATION, 1);
               
               // 다른 사람이 안 보고 있어서 대기 중이라면?
               if (!allReady && elapsed >= DURATION) {
                 ctx.fillText(`${faceLabel}: ⚠️ Wait for others`, x, y - 10);
               } else {
                 ctx.fillText(`${faceLabel}: ${(elapsed/1000).toFixed(1)}s`, x, y - 10);
               }
               
               // 게이지 바
               ctx.fillStyle = "rgba(255,255,255,0.3)";
               ctx.fillRect(x, y - 5, w, 4);
               ctx.fillStyle = "yellow";
               ctx.fillRect(x, y - 5, w * progress, 4);
             }
          });

          facesStatusRef.current = currentFrameTrackers;
        }
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    loop();
  };

  const stop = () => {
    runningRef.current = false;
    setRunning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    canvasRef.current?.getContext("2d")?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>모두 정면 3초 유지!</h2>
      {!isModelLoaded && <p>⏳ 모델 로딩 중...</p>}
      <div style={{ position: "relative", display: "inline-block" }}>
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', backgroundColor: '#222' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={start} disabled={running || !isModelLoaded}>▶ 시작</button>
        <button onClick={stop} disabled={!running}>⏹ 종료</button>
      </div>
    </div>
  );
}