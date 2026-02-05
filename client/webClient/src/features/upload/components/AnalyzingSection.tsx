import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Search, Brain, Loader2, AlertCircle, CheckCircle2, RefreshCcw } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { ANALYSIS_STEP_INTERVAL_MS } from "@/shared/config/analysis";

interface AnalyzingSectionProps {
  isAnalyzing?: boolean;
  analysisError?: string | null;
  analysisComplete?: boolean;
  onRetry?: () => void;
}

// 줌 위치 정의 (거북도사의 신비로운 거울 컨셉)
const ZOOM_TARGETS = [
  { name: "forehead", x: 0, y: 120, scale: 3.2, key: "faceShape" },
  { name: "eyes", x: 0, y: 35, scale: 2.8, key: "eyes" },
  { name: "nose", x: 0, y: -15, scale: 3.2, key: "nose" },
  { name: "mouth", x: 0, y: -60, scale: 3.2, key: "mouth" },
  { name: "chin", x: 0, y: -100, scale: 2.6, key: "chin" },
  { name: "overall", x: 0, y: 0, scale: 1.2, key: "combination" },
];

const ANALYSIS_STEPS = [
  { text: "이마의 기운을 살피는 중...", detailText: "이마는 타고난 기운과 삶의 초반 흐름을 살필 수 있는 부위라 하오.\n생각의 방향과 기본 성향이 이마에 자연스레 드러난다 보오.", icon: <Sparkles className="w-5 h-5" />, target: 0, label: "얼굴형" },
  { text: "눈매의 인상을 분석하는 중...", detailText: "눈은 사람의 감정과 성격이 가장 솔직하게 나타나는 곳이라 하오.\n대인관계에서의 태도와 내면의 기운을 읽는 데 중요하다 보오.", icon: <Search className="w-5 h-5" />, target: 1, label: "눈" },
  { text: "코의 균형과 특징을 살펴보는 중...", detailText: "코는 얼굴의 중심으로, 삶을 이끄는 힘과 균형을 상징한다 하오.\n코를 통해 내면의 안정감과 일의 추진력을 살피고 있소.", icon: <Brain className="w-5 h-5" />, target: 2, label: "코" },
  { text: "입매의 느낌을 확인하는 중...", detailText: "입은 말과 표정, 인간관계를 보여주는 중요한 부위라 하오.\n어떤 인상을 주는 사람인지 판단하는 데 기준이 된다오.", icon: <Sparkles className="w-5 h-5" />, target: 3, label: "입" },
  { text: "턱의 안정감을 분석하는 중...", detailText: "턱은 삶의 후반과 생활의 안정감을 살피는 부위라 하오.\n책임감과 버티는 힘이 턱의 인상에 담기게 되오.", icon: <Search className="w-5 h-5" />, target: 4, label: "턱" },
  { text: "얼굴 전체의 조화를 종합하는 중...", detailText: "관상은 개별 요소보다 얼굴 전체의 조화를 중히 여기고 있소.\n얼굴 전체의 조화를 종합하는 중이니 잠시만 기다려 주시게나.", icon: <Brain className="w-5 h-5" />, target: 5, label: "조합" },
];

export const AnalyzingSection: React.FC<AnalyzingSectionProps> = ({ 
  isAnalyzing: _isAnalyzing = true,
  analysisError = null,
  analysisComplete = false,
  onRetry
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const faceContainerRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Mystical Scanning Line
    gsap.to(scanLineRef.current, {
      top: "100%",
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });

    // 2. Floating Mirror Animation
    gsap.to(mirrorRef.current, {
      y: -15,
      rotateY: 10,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });

    // 3. Step Transition (ANALYSIS_STEP_INTERVAL_MS에 맞춰 스텝 순환)
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % ANALYSIS_STEPS.length);
    }, ANALYSIS_STEP_INTERVAL_MS);

    return () => {
      clearInterval(stepInterval);
      gsap.killTweensOf([scanLineRef.current, mirrorRef.current]);
    };
  }, []);

  useEffect(() => {
    const target = ZOOM_TARGETS[ANALYSIS_STEPS[currentStep].target];
    gsap.to(faceContainerRef.current, {
      x: target.x,
      y: target.y,
      scale: target.scale,
      duration: 2,
      ease: "expo.inOut",
    });

    if (textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: "back.out(1.7)" }
      );
    }

    if (detailRef.current) {
      gsap.fromTo(
        detailRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 1, delay: 0.5, ease: "power2.out" }
      );
    }
  }, [currentStep]);

  // 에러 상태일 때 표시할 UI
  if (analysisError) {
    return (
      <div 
        ref={containerRef}
        className="flex flex-col items-center justify-center w-full min-h-[75vh] py-8 px-4 overflow-hidden rounded-[40px] relative"
      >
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 blur-[150px] rounded-full" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6 z-30 max-w-md text-center"
        >
          {/* Error Icon */}
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          
          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">분석 중 오류가 발생했습니다</h2>
            <p className="text-gray-600">{analysisError}</p>
          </div>
          
          {/* Retry Button */}
          {onRetry && (
            <ActionButton
              variant="primary"
              onClick={onRetry}
              className="mt-4"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              다시 시도하기
            </ActionButton>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full min-h-[75vh] py-8 px-4 overflow-hidden rounded-[40px] relative"
    >
      {/* Mystical Background - Enhanced Aura */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-green/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L50 100 M0 50 L100 50' fill='none' stroke='%2300897B' stroke-width='0.5'/%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-20 w-full max-w-6xl z-30">
        
        {/* Right: The Turtle Master Character - 3D Hand Mirror (order-2로 우측 배치) */}
        <div ref={mirrorRef} className="relative w-80 h-[500px] md:w-[400px] md:h-[600px] flex flex-col items-center justify-center order-2 lg:order-2">
          
          {/* Hand Mirror SVG Frame (3D Morphism Style) */}
          <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
            <svg viewBox="0 0 300 500" className="w-full h-full filter drop-shadow-xl">
              <defs>
                <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur" />
                  <feOffset in="blur" dx="0" dy="10" result="offsetBlur" />
                  <feFlood floodColor="#000" floodOpacity="0.05" result="offsetColor" />
                  <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow" />
                  <feMerge>
                    <feMergeNode in="shadow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="mirrorFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5F5F0" />
                  <stop offset="100%" stopColor="#E6E6DC" />
                </linearGradient>
              </defs>
              
              {/* Mirror Handle */}
              <path 
                d="M150 320 C130 320 120 350 125 420 C128 460 135 480 150 480 C165 480 172 460 175 420 C180 350 170 320 150 320 Z" 
                fill="url(#mirrorFrameGrad)" 
                filter="url(#clayShadow)"
              />
              {/* Handle Decorative Cross/Pattern */}
              <path 
                d="M135 430 L165 430 M150 415 L150 445" 
                stroke="#D6D6C8" 
                strokeWidth="2" 
                strokeLinecap="round" 
                opacity="0.5"
              />
              <circle cx="150" cy="465" r="5" fill="#D6D6C8" opacity="0.3" />

              {/* Outer Round Frame */}
              <circle 
                cx="150" cy="170" r="145" 
                fill="url(#mirrorFrameGrad)" 
                filter="url(#clayShadow)"
              />
              
              {/* Inner Frame Inset Shadow Effect */}
              <circle cx="150" cy="170" r="131.5" fill="#D6D6C8" opacity="0.2" />
              <circle cx="150" cy="170" r="129.5" fill="#FFF" opacity="0.4" />
            </svg>
          </div>

          {/* Mirror Content Area (Inside the round frame) */}
          <div className="relative w-64 h-64 md:w-[256px] md:h-[256px] rounded-full overflow-hidden z-10 bg-[#0a120a] -mt-32 md:-mt-44 shadow-[inset_0_0_40px_rgba(0,137,123,0.3)] border border-brand-green/10">
            {/* Mirror Surface Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,137,123,0.2)_0%,transparent_80%)] animate-pulse" />
            
            {/* Glass Reflection Highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none z-20" />
            
            {/* Face Container */}
            <div ref={faceContainerRef} className="relative w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 200 250" className="w-full h-full p-10 drop-shadow-[0_0_15px_rgba(165,214,167,0.3)]">
                <defs>
                  <linearGradient id="turtleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A5D6A7" />
                    <stop offset="100%" stopColor="#66BB6A" />
                  </linearGradient>
                  <filter id="softGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Round Turtle Head */}
                <circle 
                  cx="100" cy="110" r="80" 
                  fill="url(#turtleGrad)" 
                  stroke="#2E7D32" 
                  strokeWidth="3" 
                />

                {/* Blushes */}
                <ellipse cx="50" cy="125" rx="12" ry="8" fill="#FFAB91" opacity="0.7" />
                <ellipse cx="150" cy="125" rx="12" ry="8" fill="#FFAB91" opacity="0.7" />

                {/* Bead Eyes */}
                <g className="eyes">
                  <circle cx="70" cy="100" r="9" fill="#212121" />
                  <circle cx="67" cy="97" r="3" fill="white" /> {/* Eye Highlight */}
                  
                  <circle cx="130" cy="100" r="9" fill="#212121" />
                  <circle cx="127" cy="97" r="3" fill="white" /> {/* Eye Highlight */}
                </g>

                {/* Happy Mouth */}
                <path 
                  d="M85 140 Q 100 155 115 140" 
                  fill="none" 
                  stroke="#212121" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                />

                {/* Tiny Nostrils */}
                <circle cx="95" cy="125" r="1.5" fill="#2E7D32" opacity="0.5" />
                <circle cx="105" cy="125" r="1.5" fill="#2E7D32" opacity="0.5" />

                {/* Floating Analysis Essence Nodes (Step-specific Sparkles) */}
                <g filter="url(#softGlow)">
                  <AnimatePresence>
                    {/* Forehead Node - Step 0 */}
                    {(currentStep === 0 || currentStep === 5) && (
                      <motion.circle 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity } }}
                        cx="100" cy="60" r="3" fill="#FF9800" 
                      />
                    )}
                    
                    {/* Eye Nodes - Step 1 */}
                    {(currentStep === 1 || currentStep === 5) && (
                      <>
                        <motion.circle 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity, delay: 0.2 } }}
                          cx="70" cy="100" r="3" fill="#00F0FF" 
                        />
                        <motion.circle 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity, delay: 0.4 } }}
                          cx="130" cy="100" r="3" fill="#00F0FF" 
                        />
                      </>
                    )}

                    {/* Nose Node - Step 2 */}
                    {(currentStep === 2 || currentStep === 5) && (
                      <motion.circle 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity, delay: 0.3 } }}
                        cx="100" cy="125" r="3" fill="#FFEB3B" 
                      />
                    )}

                    {/* Mouth Node - Step 3 */}
                    {(currentStep === 3 || currentStep === 5) && (
                      <motion.circle 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity, delay: 0.5 } }}
                        cx="100" cy="145" r="3" fill="#00F0FF" 
                      />
                    )}

                    {/* Chin Node - Step 4 */}
                    {(currentStep === 4 || currentStep === 5) && (
                      <motion.circle 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: [1, 1.4, 1] }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.5, scale: { duration: 1.5, repeat: Infinity, delay: 0.7 } }}
                        cx="100" cy="180" r="3" fill="#FF5722" 
                      />
                    )}
                  </AnimatePresence>
                </g>
              </svg>
            </div>

            {/* Scanning Laser */}
            <div ref={scanLineRef} className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-transparent via-brand-green/30 to-transparent z-30 pointer-events-none" />
          </div>
        </div>

        {/* Left: Analysis Info - Traditional Slate Design (order-1로 좌측 배치) */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-8 order-1 lg:order-1">
          <div className="inline-flex items-center gap-3 bg-brand-green/10 border border-brand-green/30 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(0,137,123,0.2)]">
            {analysisError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : analysisComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Loader2 className="w-5 h-5 text-brand-green animate-spin" />
            )}
            <span className={`font-bold tracking-[0.2em] text-[10px] uppercase font-sans ${
              analysisError ? 'text-red-500' : analysisComplete ? 'text-green-600' : 'text-brand-green'
            }`}>
              {analysisError ? 'Analysis Error' : analysisComplete ? 'Analysis Complete' : 'Celestial Neural Scanning'}
            </span>
          </div>
          
          <div ref={textRef}>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 font-display leading-tight tracking-tight">
              <span className="text-brand-orange block text-lg md:text-xl mb-3 font-bold opacity-90">
                {ANALYSIS_STEPS[currentStep].label}의 기운
              </span>
              {ANALYSIS_STEPS[currentStep].text}
            </h2>
          </div>

          <div ref={detailRef} className="min-h-[160px] bg-white rounded-[40px] p-8 border border-gray-100 shadow-clay-lg relative overflow-hidden group">
            {/* Traditional Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brand-green/40 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brand-green/40 rounded-br-2xl" />
            
            <div className="flex flex-col items-center lg:items-start gap-4">
              {analysisError ? (
                <>
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <p className="text-red-500 font-hand text-lg md:text-xl leading-relaxed">
                    "허허, 천기를 읽는 데 어려움이 있구먼... 잠시 후 다시 시도해보게나."
                  </p>
                  <p className="text-gray-400 text-sm mt-2">{analysisError}</p>
                </>
              ) : analysisComplete ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <p className="text-green-600 font-hand text-lg md:text-xl leading-relaxed">
                    "허허, 관상을 다 읽었네! 곧 결과를 보여주리다..."
                  </p>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} className="w-2 h-2 bg-brand-green rounded-full" />
                    ))}
                  </div>
                  <p className="text-gray-500 font-hand text-lg md:text-xl italic leading-relaxed whitespace-pre-line">
                    "{ANALYSIS_STEPS[currentStep].detailText}"
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Progress Section - Nature Inspired */}
          <div className="space-y-4 pt-4">
            <div className="px-2">
              <span className="text-[12px] font-sans text-gray-400 tracking-wide">도사의 기운이 모이는 중...</span>
            </div>
            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 relative">
              {/* 개발용: duration 0초 (운영 시 28초로 변경) */}
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0, ease: "linear" }}
                className="h-full rounded-full bg-gradient-to-r from-brand-green via-brand-orange to-brand-green bg-[length:200%_100%] animate-[gradient_2.5s_linear_infinite] shadow-[0_0_20px_rgba(0,137,123,0.3)] relative"
              >
                {/* 로딩 중 shimmer */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                    backgroundSize: "50% 100%",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
