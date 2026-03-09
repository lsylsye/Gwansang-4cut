import React from "react";
import { motion } from "motion/react";
import {
  RefreshCcw,
  Camera,
  Upload,
  Trash2,
  Users,
  ArrowRight,
  UserCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/core/Modal";
import { FaceMeshWebcam } from "./FaceMeshWebcam";
import { GroupMemberManager } from "./GroupMemberManager";
import { useGroupUploadFlow } from "../hooks/useGroupUploadFlow";
import { ROUTES } from "@/routes/routes";
import type { GroupMember } from "@/types";

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface GroupUploadProps {
  pathname: string;
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: import("@/types").SajuData | null,
    groupMembers: GroupMember[],
    faceMeshMetadata?: import("@/types").AnalysisMetadata,
  ) => void;
  onNavigateToMembers?: (state?: { initialGroupMembers?: GroupMember[] }) => void;
  onNavigateToUpload?: () => void;
}

export function GroupUpload({
  pathname,
  onAnalyze,
  onNavigateToMembers,
  onNavigateToUpload,
}: GroupUploadProps) {
  const flow = useGroupUploadFlow({
    pathname,
    onAnalyze,
    onNavigateToMembers,
    onNavigateToUpload,
  });

  const {
    groupFileInputRef,
    capturedImages,
    setCapturedImages,
    currentStep,
    isCameraActive,
    setIsCameraActive,
    isGroupPhotoConfirming,
    detectedCount,
    isScanning,
    faceDetectionError,
    faceMeshMetadata,
    setFaceMeshMetadata,
    groupMembers,
    setGroupMembers,
    memberIdAnalyzing,
    memberAvatarErrorId,
    isUploadTypeModalOpen,
    setIsUploadTypeModalOpen,
    isIndividualPhotoUpload,
    setIsIndividualPhotoUpload,
    handleGroupPhotoUpload,
    handleNextStep,
    handleRetake,
    addGroupMember,
    removeGroupMember,
    updateGroupMemberPatch,
    handleMemberAvatarUpload,
    handleGroupAnalyze,
    isReady,
  } = flow;

  // --- Segmenting Overlay ---
  if (flow.isSegmenting) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[50vh]">
        <div className="relative w-48 h-48 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-dashed border-brand-orange rounded-full"
          />
          <div className="absolute inset-4 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-clay-sm">
            <Users size={48} className="text-brand-orange animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">인원 분석 및 세그멘테이션 중...</h2>
        <p className="text-gray-500 mt-2">각 멤버의 얼굴을 개별적으로 추출하고 있습니다.</p>
      </div>
    );
  }

  // --- Individual Photo Upload View ---
  if (isIndividualPhotoUpload && currentStep !== 3) {
    const allPhotosUploaded = groupMembers.length >= 2 && groupMembers.every((m) => m.avatar);
    return (
      <div className="relative flex flex-col items-center justify-center w-full max-w-7xl mx-auto pb-20 px-4 min-h-[50vh]">
        {memberIdAnalyzing !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md">
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl border border-gray-100 w-fit max-w-[90%]">
              <div className="relative w-14 h-14">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-3 border-dashed border-brand-orange rounded-full"
                />
                <div className="absolute inset-1.5 bg-white/80 rounded-full flex items-center justify-center">
                  <Camera size={24} className="text-brand-orange animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-800 font-display">얼굴 분석 중...</h3>
              <p className="text-gray-500 text-sm">MediaPipe로 얼굴을 추출하고 있습니다.</p>
            </div>
          </div>
        )}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">멤버별 사진 등록</h2>
            <p className="text-lg text-gray-600 font-sans">각 멤버의 얼굴 사진을 업로드해주세요.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {groupMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                layout
                className="w-[48%] sm:w-[23%] min-w-[140px]"
              >
                <GlassCard className="p-4 sm:p-6 flex flex-col items-center gap-4 sm:gap-6 hover:border-teal-200 transition-all w-full h-full relative group/card">
                  {groupMembers.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeGroupMember(member.id);
                      }}
                      className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full opacity-0 group-hover/card:opacity-100"
                      title="멤버 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  <div className="relative">
                    <div
                      className={`w-40 h-40 rounded-3xl overflow-hidden shadow-clay-md border-4 border-white bg-gray-50 transition-all flex items-center justify-center ${member.avatar ? "" : "cursor-pointer hover:bg-gray-100"}`}
                      onClick={() =>
                        !member.avatar && document.getElementById(`individual-upload-${member.id}`)?.click()
                      }
                    >
                      {member.avatar ? (
                        <img src={member.avatar} alt={`Member ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300 gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Camera size={32} />
                          </div>
                          <span className="text-sm font-bold text-center text-gray-400">사진 업로드</span>
                        </div>
                      )}
                    </div>
                    {memberAvatarErrorId === member.id && (
                      <p className="mt-2 text-xs text-red-500 font-medium text-center">얼굴을 인식하지 못했습니다.</p>
                    )}
                    <input
                      type="file"
                      id={`individual-upload-${member.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleMemberAvatarUpload(member.id, e)}
                    />
                    {member.avatar && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="bg-teal-50 px-4 py-2 rounded-full text-sm font-bold text-teal-700">멤버 {index + 1}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <ActionButton
              variant="secondary"
              onClick={addGroupMember}
              disabled={groupMembers.length >= 7}
              className={`w-full py-5 border-4 border-dashed transition-all flex items-center justify-center gap-3 rounded-2xl shadow-none ${
                groupMembers.length >= 7
                  ? "border-gray-100 bg-gray-50/30 text-gray-400 cursor-not-allowed opacity-50"
                  : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-white hover:border-teal-200 hover:text-teal-600"
              }`}
            >
              <Users size={20} />
              <span className="font-bold">{groupMembers.length >= 7 ? "최대 7명까지만 가능합니다" : "멤버 추가하기"}</span>
            </ActionButton>
            <ActionButton
              variant="orange-primary"
              onClick={() => {
                setIsIndividualPhotoUpload(false);
                if (onNavigateToMembers) onNavigateToMembers();
                else flow.setCurrentStep(3);
              }}
              disabled={!allPhotosUploaded}
              className={`w-full py-6 transition-all duration-300 text-base ${!allPhotosUploaded ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
            >
              {allPhotosUploaded ? (
                <>
                  다음 단계로 <ArrowRight size={20} className="ml-2" />
                </>
              ) : (
                "모든 멤버의 사진을 업로드해주세요"
              )}
            </ActionButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Photo Confirmation View ---
  if (
    isGroupPhotoConfirming &&
    capturedImages[0] !== null &&
    currentStep !== 3 &&
    pathname !== ROUTES.GROUP_UPLOAD_MEMBERS
  ) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <GlassCard className="p-0 w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-gray-900 shadow-clay-lg rounded-[32px] border-8 border-white">
            <img src={capturedImages[0]!} alt="Captured Photo" className="w-full h-full object-cover" />
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 via-black/40 to-transparent text-white text-center pointer-events-none">
              <div className="inline-block px-4 py-1.5 bg-brand-orange rounded-full text-xs font-bold mb-3 shadow-sm">
                {detectedCount > 0 ? detectedCount : "?"}명 감지됨
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display mb-1 drop-shadow-lg">단체 촬영</h3>
              <p className="text-sm opacity-90 drop-shadow-md">촬영된 사진을 확인하세요</p>
              {faceDetectionError && (
                <p className="mt-3 text-sm text-red-200 bg-red-900/60 px-3 py-2 rounded-lg">{faceDetectionError}</p>
              )}
            </div>
            <div className="absolute top-5 right-5 flex gap-2 pointer-events-auto">
              <button
                onClick={handleRetake}
                className="bg-brand-orange hover:bg-brand-orange/80 text-white p-2.5 rounded-full backdrop-blur-md transition-colors"
                title="다시 찍기"
              >
                <RefreshCcw size={20} />
              </button>
            </div>
            {!faceDetectionError && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
                <ActionButton variant="orange-primary" onClick={handleNextStep} className="px-8 py-4" disabled={!capturedImages[0]}>
                  다음
                  <ArrowRight size={18} className="ml-2" />
                </ActionButton>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // --- Camera View ---
  if (isCameraActive && pathname !== ROUTES.GROUP_UPLOAD_MEMBERS) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <GlassCard className="w-full aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center bg-black shadow-clay-lg rounded-[40px] border-[10px] border-white">
          <div className="absolute inset-0">
            <FaceMeshWebcam
              onCapture={(img, metadata) => {
                setCapturedImages((prev) => {
                  const newImages = [...prev];
                  newImages[0] = img;
                  return newImages;
                });
                if (metadata) setFaceMeshMetadata(metadata);
                flow.setIsGroupPhotoConfirming(true);
              }}
              onClose={() => setIsCameraActive(false)}
              onFaceCountChange={flow.setDetectedCount}
              maxFaces={7}
              title="카메라를 3초간 응시해 주세요"
              themeColor="orange"
              showFaceCount={true}
              useEllipseGuide={false}
            />
          </div>
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 opacity-60 bg-brand-orange shadow-[0_0_15px_var(--brand-orange)]"
              />
            </div>
          )}
          <div className="absolute top-6 right-6 flex gap-2 pointer-events-auto">
            <button
              onClick={handleRetake}
              className="bg-brand-orange hover:bg-brand-orange/80 text-white p-3 rounded-full transition-all shadow-lg"
              title="다시 찍기"
            >
              <RefreshCcw size={24} />
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- Members Step ---
  const isMembersStep = pathname === ROUTES.GROUP_UPLOAD_MEMBERS || currentStep === 3;
  if (isMembersStep) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-4xl mx-auto pb-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="w-full">
            <div className="w-full p-5 sm:p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-clay-md border-4 border-white relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange-muted rounded-full -mr-12 -mt-12 opacity-50 blur-2xl" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3 relative z-10">
                <div className="flex-1">
                  <h3 className="text-gray-800 font-bold text-xl sm:text-2xl flex items-center gap-2 font-display">
                    <Users size={26} className="text-brand-orange shrink-0" />
                    멤버별 인적 사항 등록
                  </h3>
                  <p className="text-gray-500 mt-1 font-sans text-sm leading-relaxed break-keep">
                    각 멤버의 이름과 생년월일, 생시를 입력해주세요.
                  </p>
                </div>
                <div className="flex items-center gap-3 self-end md:self-auto flex-wrap justify-end">
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 text-sm font-bold group"
                  >
                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    다시 촬영하기
                  </button>
                  <div className="px-5 py-2 bg-orange-50 text-brand-orange rounded-2xl text-sm font-bold border-2 border-orange-100 shadow-sm flex items-center gap-2">
                    <Sparkles size={16} />
                    {groupMembers.length}명의 기운 감지
                  </div>
                </div>
              </div>
              <GroupMemberManager
                members={groupMembers}
                onUpdateMember={updateGroupMemberPatch}
                onAvatarUpload={handleMemberAvatarUpload}
                onAddMember={addGroupMember}
                onRemoveMember={removeGroupMember}
                maxMembers={7}
                memberAvatarErrorId={memberAvatarErrorId}
                memberIdAnalyzing={memberIdAnalyzing}
              />
            </div>
            <ActionButton
              variant="orange-primary"
              onClick={handleGroupAnalyze}
              disabled={!isReady}
              className={`w-full py-5 mt-4 transition-all duration-300 text-sm sm:text-base ${!isReady ? "opacity-50 grayscale cursor-not-allowed" : "animate-bounce-subtle"}`}
            >
              {isReady ? "모임 궁합 분석하기" : "모든 멤버의 정보(이름, 사진, 생년월일)를 입력해주세요"}
            </ActionButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Initial View ---
  if (!isCameraActive && capturedImages[0] === null) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[60vh] px-4 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">모임 궁합 확인하기</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-green hover:shadow-md shadow-clay-md"
            onClick={() => setIsCameraActive(true)}
          >
            <div className="w-24 h-24 bg-brand-green-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Camera className="w-12 h-12 text-brand-green" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">사진 촬영하기</h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                실시간 안면 인식 시스템으로
                <br />
                모임 궁합을 확인합니다.
              </p>
            </div>
          </GlassCard>
          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-orange hover:shadow-md shadow-clay-md"
            onClick={() => setIsUploadTypeModalOpen(true)}
          >
            <div className="w-24 h-24 bg-brand-orange-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Upload className="w-12 h-12 text-brand-orange" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">사진 업로드하기</h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                미리 촬영한 사진을 업로드하여
                <br />
                모임 궁합을 확인합니다.
              </p>
            </div>
          </GlassCard>
        </div>
        <Modal isOpen={isUploadTypeModalOpen} onClose={() => setIsUploadTypeModalOpen(false)} size="md">
          <ModalHeader description="업로드할 사진의 종류를 선택해주세요.">사진 선택 방식</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => groupFileInputRef.current?.click()} className="group relative w-full text-left">
                <div className="p-6 bg-orange-50 rounded-2xl border-2 border-orange-100 hover:border-brand-orange transition-all flex items-center gap-6 hover:shadow-md">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-brand-orange shadow-sm">
                    <Users size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 font-display mb-1">단체 사진 등록</h4>
                    <p className="text-sm text-gray-500 font-sans">한 장의 사진에서 인물들을 자동 추출합니다.</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setGroupMembers([
                    {
                      id: Date.now(),
                      name: "멤버1",
                      birthDate: getTodayDateString(),
                      birthTime: "",
                      gender: "male",
                      avatar: "",
                      birthTimeUnknown: false,
                    },
                    {
                      id: Date.now() + 1,
                      name: "멤버2",
                      birthDate: getTodayDateString(),
                      birthTime: "",
                      gender: "male",
                      avatar: "",
                      birthTimeUnknown: false,
                    },
                  ]);
                  setCapturedImages([
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY4TcAAAAASUVORK5CYII=",
                    null,
                    null,
                  ]);
                  setIsUploadTypeModalOpen(false);
                  setIsIndividualPhotoUpload(true);
                }}
                className="group relative w-full text-left"
              >
                <div className="p-6 bg-teal-50 rounded-2xl border-2 border-teal-100 hover:border-teal-500 transition-all flex items-center gap-6 hover:shadow-md">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm">
                    <UserCheck size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 font-display mb-1">멤버별 개인 사진 등록</h4>
                    <p className="text-sm text-gray-500 font-sans">각 멤버의 사진을 개별적으로 등록합니다.</p>
                  </div>
                </div>
              </button>
            </div>
          </ModalBody>
        </Modal>
        <input
          type="file"
          ref={groupFileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleGroupPhotoUpload}
        />
      </div>
    );
  }

  return null;
}
