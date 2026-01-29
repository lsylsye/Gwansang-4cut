import React, { useRef, useEffect, useState } from "react";
import { OhengCounts } from "./FiveElementsDisplay";

interface OhengStarChartProps {
    counts: OhengCounts;
    buttonRefs: (React.RefObject<HTMLDivElement> | null)[];
    className?: string;
}

/** 오행 별 그래프 - 각 버튼 위에 해당 값의 점을 연결하여 별 모양 생성 */
export const OhengStarChart: React.FC<OhengStarChartProps> = ({
    counts,
    buttonRefs,
    className = "",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const sparkleProgressRef = useRef(0); // 반짝이는 점의 진행률 (0~1) - ref로 관리
    const [sparkleProgress, setSparkleProgress] = useState(0); // UI 업데이트용 (실제로는 ref 사용)

    const drawGraph = React.useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // 컨테이너 크기에 맞춰 캔버스 크기 조정
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        // 오른쪽 박스 높이와 맞추기 위해 높이 조정
        canvas.height = rect.height || 200;

        const width = canvas.width;
        const height = canvas.height;
        const maxValue = 4; // 오행 값의 최대값 (0~4, 총 5단계)

        // 배경 초기화
        ctx.clearRect(0, 0, width, height);

        // ============================================
        // 오행 데이터 정의 및 순서 (중요: 순서 변경 시 주의)
        // ============================================
        // 오행 순서: 목(wood), 화(fire), 토(earth), 금(metal), 수(water)
        // 이 순서는 angles 배열과 colors 배열의 인덱스와 일치해야 함
        const values = [
            counts.wood,   // 인덱스 0: 목
            counts.fire,   // 인덱스 1: 화
            counts.earth,  // 인덱스 2: 토
            counts.metal,  // 인덱스 3: 금
            counts.water,  // 인덱스 4: 수
        ];

        // 각 오행의 색상 (values 배열과 동일한 순서)
        const colors = [
            "#4CAF50", // 인덱스 0: 목 - 녹색
            "#EF5350", // 인덱스 1: 화 - 빨간색
            "#FF9800", // 인덱스 2: 토 - 주황색
            "#9E9E9E", // 인덱스 3: 금 - 회색
            "#42A5F5", // 인덱스 4: 수 - 파란색
        ];

        // 가장 강한 기운 찾기 (가장 높은 값) - 별 채우기 색상 결정용
        const maxCount = Math.max(...values);
        const maxIndex = values.findIndex(v => v === maxCount);
        const strongestColor = colors[maxIndex];

        // ============================================
        // 그래프 좌표계 설정
        // ============================================
        // 중심점 계산 (그래프 영역의 중심)
        const centerX = width / 2;
        const centerY = height / 2;
        // 외곽 원의 지름을 오른쪽 박스 높이와 동일하게 맞추기
        // 오른쪽 박스 높이를 별 그래프 높이와 동일하게 설정했으므로
        // 외곽 원의 지름 = height, 반경 = height / 2
        // 라벨 공간을 고려하여 더 줄임 (상단 한자가 잘리지 않도록)
        const maxRadius = (height / 2) * 0.65; // 외곽 원 반경 (라벨 공간 고려, 상단 여유 공간 확보)
        const minRadius = maxRadius * 0.2; // 최소 반경 (값이 0일 때도 별이 보이도록) - 별을 더 크게

        // ============================================
        // 오행별 각도 계산 (중요: 순서 변경 시 주의)
        // ============================================
        // 오각형 각도: 위에서 시작하여 시계방향으로 72도씩
        const baseAngle = -Math.PI / 2; // 위쪽 시작 (-90도)
        const angleStep = (2 * Math.PI) / 5; // 72도 (360/5)

        // 각 오행의 꼭짓점 각도 (values, colors 배열과 동일한 순서)
        // 인덱스 0: 목(위), 1: 화(오른쪽 아래), 2: 토(왼쪽 아래), 3: 금(왼쪽 위), 4: 수(오른쪽 위)
        const angles = [
            baseAngle,                    // 인덱스 0: 목 (위, -90도)
            baseAngle + angleStep,        // 인덱스 1: 화 (오른쪽 아래, -18도)
            baseAngle + angleStep * 2,    // 인덱스 2: 토 (왼쪽 아래, 54도)
            baseAngle + angleStep * 3,    // 인덱스 3: 금 (왼쪽 위, 126도)
            baseAngle + angleStep * 4,    // 인덱스 4: 수 (오른쪽 위, 198도)
        ];

        // ============================================
        // 오행 값 → 좌표 변환 (0~4 범위, 총 5단계)
        // ============================================
        // 각 오행의 값에 따라 반경 계산하여 점 위치 결정
        // 값이 0이어도 최소 반경을 가지도록 변환하여 별 모양이 항상 보이도록 함
        // 변환 규칙: 원본 값(0~4)에 +1을 하여 1~5 범위로 변환 후 반경 계산
        // 0 → minRadius (가장 짧은 별)
        // 1 → minRadius + (maxRadius - minRadius) * 0.25
        // 2 → minRadius + (maxRadius - minRadius) * 0.5
        // 3 → minRadius + (maxRadius - minRadius) * 0.75
        // 4 → maxRadius (가장 긴 별, 최대값)
        const points: Array<{ x: number; y: number; value: number; color: string }> = [];
        
        values.forEach((value, index) => {
            // 원본 값: 0~4 범위 (5단계)
            const originalValue = Math.min(value, maxValue); // 최대값 4로 제한
            
            // 값 변환: 0~4 → 1~5 (한 단계씩 높이 변환)
            // 목적: 값이 0이어도 최소 반경을 가져 별 모양이 항상 보이도록 함
            // 변환 예시: 0→1, 1→2, 2→3, 3→4, 4→5
            const transformedValue = originalValue + 1;
            const transformedMaxValue = maxValue + 1; // 5 (변환된 최대값)
            
            // 변환된 값을 반경으로 매핑
            // transformedValue가 1일 때 (원본 0): minRadius
            // transformedValue가 5일 때 (원본 4): maxRadius
            // 선형 보간: (transformedValue - 1) / (5 - 1) = (transformedValue - 1) / 4
            const normalizedRatio = (transformedValue - 1) / (transformedMaxValue - 1); // 0 ~ 1
            const radius = minRadius + normalizedRatio * (maxRadius - minRadius);
            
            // 각도 가져오기 (인덱스와 일치)
            // 인덱스 0: 목, 1: 화, 2: 토, 3: 금, 4: 수
            const angle = angles[index];
            
            // 좌표 계산 (중심에서 각도 방향으로 반경만큼 떨어진 위치)
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            // 점 정보 저장
            // 주의: value는 원본 값(0~4)을 저장하여 나중에 표시할 때 사용
            points.push({
                x: x,
                y: y,
                value: originalValue, // 원본 값 (0~4)
                color: colors[index], // 색상 (인덱스와 일치)
            });
        });

        if (points.length < 5) return;

        // ============================================
        // 외곽 원 그리기 (그래프 범위 표시)
        // ============================================
        ctx.strokeStyle = "#E0E0E0";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // ============================================
        // 원형 외곽에 오행 라벨 표시
        // ============================================
        // 각 오행의 라벨 (angles 배열과 동일한 순서) - 한자만 표시
        const ohengLabels = ["木", "火", "土", "金", "水"];
        
        ctx.fillStyle = "#424242";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        angles.forEach((angle, index) => {
            // 원형 외곽에서 약간 바깥쪽에 라벨 배치
            const labelRadius = maxRadius + 20;
            const labelX = centerX + labelRadius * Math.cos(angle);
            const labelY = centerY + labelRadius * Math.sin(angle);
            ctx.fillText(ohengLabels[index], labelX, labelY);
        });

        // ============================================
        // 별 모양 {5/2} 연결 순서 정의 (중요: 순서 변경 시 주의)
        // ============================================
        // 별 모양을 만들기 위해 각 꼭지점을 2번째 다음 꼭지점과 연결
        // 연결 순서: 0(목) -> 2(토) -> 4(수) -> 1(화) -> 3(금) -> 0(목)
        // 이 순서는 points 배열의 인덱스를 의미함
        const starOrder = [0, 2, 4, 1, 3]; // 목 -> 토 -> 수 -> 화 -> 금 -> 목

        // 별 경로 계산 (애니메이션용)
        const calculateStarPath = (): Array<{ x: number; y: number }> => {
            const path: Array<{ x: number; y: number }> = [];
            
            for (let i = 0; i < starOrder.length; i++) {
                const p0 = i > 0 ? points[starOrder[i - 1]] : points[starOrder[starOrder.length - 1]];
                const p1 = points[starOrder[i]];
                const p2 = points[starOrder[(i + 1) % starOrder.length]];
                const p3 = points[starOrder[(i + 2) % starOrder.length]];

                // Catmull-Rom 스플라인을 사용한 부드러운 곡선
                for (let t = 0; t <= 1; t += 0.02) {
                    const t2 = t * t;
                    const t3 = t2 * t;

                    const x = 0.5 * (
                        (2 * p1.x) +
                        (-p0.x + p2.x) * t +
                        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
                    );

                    const y = 0.5 * (
                        (2 * p1.y) +
                        (-p0.y + p2.y) * t +
                        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
                    );

                    path.push({ x, y });
                }
            }
            
            return path;
        };

        const starPath = calculateStarPath();
        const totalPathLength = starPath.length;

        // 별 영역 채우기 (가장 강한 기운의 색상을 연하게) - 반짝반짝 효과
        // sparkleProgressRef를 이용해 펄스 효과 (부드러운 진동)
        const currentSparkleProgress = sparkleProgressRef.current;
        // 부드러운 easing 함수 사용 (ease-in-out 효과)
        const normalizedProgress = (Math.sin(currentSparkleProgress * Math.PI * 0.5) + 1) / 2; // 0~1로 정규화
        const pulseValue = normalizedProgress * 2 - 1; // -1~1로 변환
        const pulseOpacity = 0.2 + pulseValue * 0.15; // 0.05 ~ 0.35 사이 부드러운 진동
        const opacityHex = Math.floor(pulseOpacity * 255).toString(16).padStart(2, '0');
        ctx.fillStyle = strongestColor + opacityHex;
        ctx.beginPath();
        starPath.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.closePath();
        ctx.fill();

        // 별 테두리 그리기 (항상 전체 그리기)
        ctx.strokeStyle = "#FF6B6B";
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        
        ctx.beginPath();
        ctx.moveTo(starPath[0].x, starPath[0].y);
        for (let i = 1; i < starPath.length; i++) {
            ctx.lineTo(starPath[i].x, starPath[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // 반짝이는 점 그리기 (별 선을 따라 계속 이동)
        const sparkleIndex = Math.floor(currentSparkleProgress * totalPathLength);
        if (sparkleIndex < starPath.length && sparkleIndex >= 0) {
            const sparklePoint = starPath[sparkleIndex];
            
            // 반짝이는 점 그리기 (톤 다운된 흰색 계열)
            const sparkleSize = 10;
            const gradient = ctx.createRadialGradient(
                sparklePoint.x, sparklePoint.y, 0,
                sparklePoint.x, sparklePoint.y, sparkleSize
            );
            gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
            gradient.addColorStop(0.3, "rgba(250, 250, 250, 0.7)");
            gradient.addColorStop(0.6, "rgba(240, 240, 240, 0.4)");
            gradient.addColorStop(1, "rgba(240, 240, 240, 0)");
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(sparklePoint.x, sparklePoint.y, sparkleSize, 0, 2 * Math.PI);
            ctx.fill();
            
            // 반짝이는 점 중심에 밝은 점 추가 (톤 다운)
            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.beginPath();
            ctx.arc(sparklePoint.x, sparklePoint.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }

        // 각 점 그리기 (더 크고 동글동글하게 - 별을 더 크게)
        points.forEach((point) => {
            // 외곽 흰색 원 (더 크게)
            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI);
            ctx.fill();
            
            // 내부 색상 원 (더 크게)
            ctx.fillStyle = point.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5.5, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, [counts, buttonRefs]);

    // 애니메이션 루프
    useEffect(() => {
        // counts가 변경되면 반짝이는 애니메이션 리셋
        sparkleProgressRef.current = 0;
        setSparkleProgress(0);

        let lastTime = 0;
        const animate = (currentTime: number) => {
            // sparkleProgressRef를 직접 업데이트 (상태 업데이트는 선택적)
            if (currentTime - lastTime >= 16) { // 약 60fps
                sparkleProgressRef.current = (sparkleProgressRef.current + 0.01) % 1; // 속도 늦춤
                lastTime = currentTime;
            }
            drawGraph(); // 매 프레임마다 그리기 (ref 값 사용)
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        // 초기 그리기 후 애니메이션 시작
        const timeoutId = setTimeout(() => {
            drawGraph(); // 초기 그리기
            animationFrameRef.current = requestAnimationFrame(animate);
        }, 100);

        // 리사이즈 이벤트 처리
        const handleResize = () => {
            drawGraph();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [drawGraph, counts]);

    return (
        <div ref={containerRef} className={`relative w-full ${className}`} style={{ height: '200px' }}>
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
                style={{ height: '200px' }}
            />
        </div>
    );
};
