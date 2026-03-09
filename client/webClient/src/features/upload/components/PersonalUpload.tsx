import React from "react";
import { motion } from "motion/react";
import { Camera, Upload, RefreshCcw, ArrowRight, CheckCircle2, X } from "lucide-react";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/core/Modal";
import { SajuInputForm } from "./SajuInputForm";
import { FaceMeshWebcam } from "./FaceMeshWebcam";
import { usePersonalUploadFlow } from "../hooks/usePersonalUploadFlow";
import type { SajuData } from "@/types";
import profileImage from "@/assets/profile.png";
import selfieImage from "@/assets/selfie.png";

export interface PersonalUploadProps {
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: SajuData,
    groupMembers?: undefined,
    faceMeshMetadata?: import("@/types").AnalysisMetadata,
  ) => void;
  isPersonalAnalyzing?: boolean;
  onSajuInputVisible?: (visible: boolean) => void;
  onPersonalConfirmStepVisible?: (visible: boolean) => void;
  onPersonalCameraVisible?: (visible: boolean) => void;
}

export function PersonalUpload({
  onAnalyze,
  isPersonalAnalyzing = false,
  onSajuInputVisible,
  onPersonalConfirmStepVisible,
  onPersonalCameraVisible,
}: PersonalUploadProps) {
  const {
    fileInputRef,
    capturedImages,
    setCapturedImages,
    currentStep,
    isCapturing,
    setIsCapturing,
    sajuData,
    setSajuData,
    showSajuInput,
    setShowSajuInput,
    faceMeshMetadata,
    setFaceMeshMetadata,
    isPersonalUploadAnalyzing,
    cameFromPersonalFileUpload,
    isPersonalUploadModalOpen,
    setIsPersonalUploadModalOpen,
    setCameFromPersonalFileUpload,
    isScanning,
    handleFileUpload,
    handleNextStep,
    handleRetake,
  } = usePersonalUploadFlow({
    onAnalyze,
    isPersonalAnalyzing,
    onSajuInputVisible,
    onPersonalConfirmStepVisible,
    onPersonalCameraVisible,
  });

  // --- Saju Input Screen ---
  if (showSajuInput && capturedImages[0]) {
    return (
      <SajuInputForm
        value={sajuData}
        onChange={setSajuData}
        onSubmit={handleNextStep}
        isSubmitting={isPersonalAnalyzing}
      />
    );
  }

  // --- Photo Confirmation View ---
  const isPersonalConfirming =
    capturedImages[currentStep] !== null &&
    !isPersonalUploadModalOpen &&
    !cameFromPersonalFileUpload;
  if (isPersonalConfirming) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <GlassCard className="p-0 w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-gray-900 shadow-clay-lg rounded-[32px] border-8 border-white">
            <img
              src={capturedImages[currentStep]!}
              alt="Captured Photo"
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 via-black/40 to-transparent text-white text-center pointer-events-none">
              <div className="inline-block px-4 py-1.5 bg-brand-green rounded-full text-xs font-bold mb-3 shadow-sm">
                촬영 완료
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display mb-1 drop-shadow-lg">
                정면 촬영
              </h3>
              <p className="text-sm opacity-90 drop-shadow-md">촬영된 사진을 확인하세요</p>
            </div>
            <div className="absolute top-5 right-5 flex gap-2 pointer-events-auto">
              <button
                onClick={handleRetake}
                className="bg-brand-green hover:bg-brand-green/80 text-white p-2.5 rounded-full backdrop-blur-md transition-colors"
                title="다시 찍기"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
            <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
              <ActionButton variant="primary" onClick={handleNextStep} className="px-8 py-4" disabled={!capturedImages[0]}>
                다음
                <ArrowRight size={18} className="ml-2" />
              </ActionButton>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // --- Camera View ---
  if (currentStep === 0 && !showSajuInput && isCapturing) {
    const stepOverlay = (
      <svg
        viewBox="0 0 100 100"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] opacity-50 pointer-events-none"
      >
        <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4" />
        <path d="M50 50 L50 95" stroke="white" strokeWidth="0.5" strokeDasharray="2" />
        <path d="M15 50 L85 50" stroke="white" strokeWidth="0.5" strokeDasharray="2" />
      </svg>
    );
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <GlassCard className="w-full aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center bg-black shadow-clay-lg rounded-[40px] border-[10px] border-white">
          <div className="absolute inset-0">
            <FaceMeshWebcam
              onCapture={(img, metadata) => {
                setCapturedImages((prev) => {
                  const newImages = [...prev];
                  newImages[currentStep] = img;
                  return newImages;
                });
                if (metadata) setFaceMeshMetadata(metadata);
              }}
              onClose={() => setIsCapturing(false)}
              maxFaces={1}
              title="카메라를 3초간 응시해 주세요"
              themeColor="green"
              showFaceCount={false}
              useEllipseGuide={true}
            />
          </div>
          {isScanning && stepOverlay}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </GlassCard>
      </div>
    );
  }

  // --- Initial View (choice cards + upload modal) ---
  const showInitial =
    !isCapturing &&
    (capturedImages[0] === null || isPersonalUploadModalOpen) &&
    !showSajuInput;
  if (showInitial) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[60vh] px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
            개인 관상 확인하기
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-green hover:shadow-md shadow-clay-md"
            onClick={() => {
              setIsCapturing(true);
            }}
          >
            <div className="w-24 h-24 bg-brand-green-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Camera className="w-12 h-12 text-brand-green" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">사진 촬영하기</h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                실시간 안면 인식 시스템으로
                <br />
                나의 관상을 확인합니다.
              </p>
            </div>
          </GlassCard>

          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-orange hover:shadow-md shadow-clay-md"
            onClick={() => setIsPersonalUploadModalOpen(true)}
          >
            <div className="w-24 h-24 bg-brand-orange-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Upload className="w-12 h-12 text-brand-orange" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">사진 업로드하기</h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                미리 촬영한 사진을 업로드하여
                <br />
                나의 관상을 확인합니다.
              </p>
            </div>
          </GlassCard>
        </div>

        <Modal
          isOpen={isPersonalUploadModalOpen}
          onClose={() => {
            setIsPersonalUploadModalOpen(false);
            setCapturedImages([null]);
            setFaceMeshMetadata(null);
            setCameFromPersonalFileUpload(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          size="md"
        >
          <ModalHeader description="정확한 관상 분석을 위해 가이드를 확인해주세요.">
            사진 업로드
          </ModalHeader>
          <ModalBody>
            <div className="relative min-h-[320px]">
              {isPersonalUploadAnalyzing && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] rounded-2xl">
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-gray-100 w-fit max-w-[90%]">
                    <div className="relative w-14 h-14">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-3 border-dashed border-brand-green rounded-full"
                      />
                      <div className="absolute inset-1.5 bg-white/80 rounded-full flex items-center justify-center">
                        <Camera size={24} className="text-brand-green animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 font-display">얼굴 분석 중...</h3>
                    <p className="text-gray-500 text-sm">MediaPipe로 얼굴 특징점을 추출하고 있습니다.</p>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                <button
                  onClick={() => {
                    if (!isPersonalUploadAnalyzing) fileInputRef.current?.click();
                  }}
                  className="w-full group"
                  disabled={isPersonalUploadAnalyzing}
                >
                  <div
                    className={`p-10 flex flex-col items-center justify-center gap-4 ${capturedImages[0] ? "bg-green-50/50 border-brand-green/30" : "bg-orange-50/50 border-brand-orange/30"} rounded-[32px] border-2 border-dashed group-hover:border-brand-orange group-hover:bg-orange-50 transition-all relative overflow-hidden min-h-[240px] ${isPersonalUploadAnalyzing ? "pointer-events-none opacity-60" : ""}`}
                  >
                    {capturedImages[0] ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-clay-sm border-4 border-white">
                            <img src={capturedImages[0]} alt="Selected" className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-green rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <CheckCircle2 size={16} className="text-white" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h4 className="text-xl font-bold text-gray-800 font-display">얼굴 분석 완료</h4>
                          <p className="text-sm text-gray-500 mt-1 italic">다른 사진을 선택하려면 다시 클릭하세요</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-brand-orange shadow-clay-sm group-hover:scale-110 transition-transform">
                          <Upload size={32} />
                        </div>
                        <div className="text-center">
                          <h4 className="text-xl font-bold text-gray-800 font-display">사진 업로드하기</h4>
                          <p className="text-sm text-gray-500 mt-1">이곳을 클릭하여 사진을 선택하세요</p>
                        </div>
                      </>
                    )}
                  </div>
                </button>

                <div className="bg-gray-50/40 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex gap-4 shrink-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-green-200 flex flex-col items-center justify-center overflow-hidden p-0.5">
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-green rounded-full flex items-center justify-center z-10 shadow-sm">
                          <CheckCircle2 size={7} className="text-white" />
                        </div>
                        <img src={profileImage} alt="권장 예시" className="w-[95%] h-[95%] object-contain rounded-md" />
                      </div>
                      <span className="text-[9px] font-bold text-brand-green">여권/증명</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-red-100 flex items-center justify-center overflow-hidden p-0.5">
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                          <X size={7} className="text-white" strokeWidth={3} />
                        </div>
                        <img src={selfieImage} alt="잘못된 예시" className="w-[95%] h-[95%] object-contain rounded-md opacity-60 grayscale blur-[0.5px]" />
                      </div>
                      <span className="text-[9px] font-bold text-red-400">잘못된 예시</span>
                    </div>
                  </div>
                  <div className="flex-1 text-left space-y-1.5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <p className="text-[12px] text-gray-700 leading-relaxed break-keep">
                      정확한 관상 분석을 위해 <span className="text-brand-green font-bold">여권 사진이나 증명사진</span>처럼 이목구비가 뚜렷하게 나온 정면 사진을 업로드해 주세요.
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed break-keep">
                      흐릿한 저화질 사진이나 얼굴 일부가 가려진 사진은 인식이 원활하지 않을 수 있으니 주의해 주세요.
                    </p>
                  </div>
                </div>

                <ActionButton
                  variant="clay"
                  onClick={() => {
                    setIsPersonalUploadModalOpen(false);
                    setShowSajuInput(true);
                  }}
                  className="w-full py-4 text-base font-bold shadow-clay-sm"
                  disabled={!capturedImages[0]}
                >
                  다음
                </ActionButton>
              </div>
            </div>
          </ModalBody>
        </Modal>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>
    );
  }

  return null;
}
