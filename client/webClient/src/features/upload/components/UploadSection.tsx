import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import {
  RefreshCcw,
  Camera,
  Upload,
  Trash2,
  Users,
  ArrowRight,
  Scan,
  UserCheck,
  Check,
  Sparkles,
  Calendar,
  Clock,
  X,
} from "lucide-react";
import { Checkbox } from "@/shared/ui/forms/checkbox";
import { Label } from "@/shared/ui/forms/label";
import { Input } from "@/shared/ui/forms/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui/forms/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/forms/select";
import { motion, AnimatePresence } from "motion/react";
import { AnalyzeMode, SajuData, GroupMember } from "@/shared/types";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { FaceMeshWebcam } from "./FaceMeshWebcam";

interface UploadSectionProps {
  mode: AnalyzeMode;
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: SajuData,
    groupMembers?: GroupMember[],
  ) => void;
}

const CAPTURE_STEPS = [
  {
    id: "front",
    title: "정면 촬영",
    guide: "얼굴 정면을 가이드에 맞춰주세요 (Enter로 촬영)",
    overlay: (
      <svg
        viewBox="0 0 100 100"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] opacity-50 pointer-events-none"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="35"
          ry="45"
          fill="none"
          stroke="white"
          strokeWidth="1"
          strokeDasharray="4"
        />
        <path
          d="M50 50 L50 95"
          stroke="white"
          strokeWidth="0.5"
          strokeDasharray="2"
        />
        <path
          d="M15 50 L85 50"
          stroke="white"
          strokeWidth="0.5"
          strokeDasharray="2"
        />
      </svg>
    ),
  },
];

// Mock Avatar Images for Segmentation Simulation
const MOCK_AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
];

export const UploadSection: React.FC<UploadSectionProps> = ({
  mode,
  onAnalyze,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupFileInputRef = useRef<HTMLInputElement>(null);

  const [capturedImages, setCapturedImages] = useState<
    (string | null)[]
  >([null]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCapturing, setIsCapturing] = useState(
    mode === "personal",
  );
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGroupPhotoConfirming, setIsGroupPhotoConfirming] =
    useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [isUploadTypeModalOpen, setIsUploadTypeModalOpen] =
    useState(false);
  const [isIndividualPhotoUpload, setIsIndividualPhotoUpload] =
    useState(false);

  const [groupMembers, setGroupMembers] = useState<
    GroupMember[]
  >([]);

  // Simulation: Initialize group members after detection
  const processGroupPhoto = useCallback(
    (_photo: string) => {
      setIsSegmenting(true);
      // Simulate segmentation time
      setTimeout(() => {
        const count = detectedCount || 3;
        const members: GroupMember[] = Array.from({
          length: count,
        }).map((_, i) => ({
          id: Date.now() + i,
          name: `멤버 ${i + 1}`,
          birthDate: "",
          birthTime: "",
          gender: i % 2 === 0 ? "male" : "female",
          avatar: MOCK_AVATARS[i % MOCK_AVATARS.length],
          birthTimeUnknown: false,
        }));
        setGroupMembers(members);
        setIsSegmenting(false);
        setCurrentStep(3);
      }, 2000);
    },
    [detectedCount],
  );

  useEffect(() => {
    if (isCapturing || isCameraActive) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
      setDetectedCount(0);
    }
  }, [isCapturing, isCameraActive]);

  const capture = useCallback(() => {
    // Manual capture is disabled as FaceMeshWebcam handles auto-capture
  }, []);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (mode === "personal") {
          const newImages = [...capturedImages];
          newImages[currentStep] = result;
          setCapturedImages(newImages);
        } else {
          setCapturedImages([result, null, null]);
          setCurrentStep(3);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGroupPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImages([result, null, null]);
        setIsUploadTypeModalOpen(false);
        processGroupPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = useCallback(() => {
    if (mode === "personal") {
      onAnalyze(
        capturedImages as string[],
        [],
        {
          birthDate: "",
          birthTime: "00:00",
          gender: "male",
          calendarType: "solar",
          birthTimeUnknown: true,
        },
      );
    } else {
      if (isGroupPhotoConfirming) {
        processGroupPhoto(capturedImages[0] || "");
      } else {
        setIsGroupPhotoConfirming(true);
      }
    }
  }, [
    mode,
    currentStep,
    isGroupPhotoConfirming,
    capturedImages,
    processGroupPhoto,
    onAnalyze,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (mode === "personal" && isCapturing) {
          if (!capturedImages[currentStep]) {
            capture();
          } else {
            handleNextStep();
          }
        }
        if (mode === "group" && isCameraActive) {
          if (!capturedImages[0]) {
            capture();
          } else {
            // 촬영된 사진이 있으면 "선택하기" 버튼 동작
            setIsCameraActive(false);
            processGroupPhoto(capturedImages[0]);
          }
        }
        if (
          mode === "group" &&
          isGroupPhotoConfirming &&
          capturedImages[0]
        ) {
          setIsGroupPhotoConfirming(false);
          processGroupPhoto(capturedImages[0]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () =>
      window.removeEventListener("keydown", handleKeyDown);
  }, [
    capture,
    handleNextStep,
    mode,
    isCapturing,
    isCameraActive,
    capturedImages,
    currentStep,
    isGroupPhotoConfirming,
    processGroupPhoto,
  ]);

  const handleRetake = () => {
    if (mode === "personal") {
      setCapturedImages([null]);
      setCurrentStep(0);
      setIsCapturing(true);
    } else {
      setCapturedImages([null]);
      setGroupMembers([]);
      setIsCameraActive(true);
      setIsIndividualPhotoUpload(false);
      setCurrentStep(0);
    }
  };

  const removeGroupMember = (id: number) => {
    if (groupMembers.length <= 1) return;
    setGroupMembers(groupMembers.filter((m) => m.id !== id));
  };

  const updateGroupMember = (
    id: number,
    field: keyof GroupMember,
    value: any,
  ) => {
    setGroupMembers(
      groupMembers.map((m) =>
        m.id === id ? { ...m, [field]: value } : m,
      ),
    );
  };

  const addGroupMember = () => {
    const newMember: GroupMember = {
      id: Date.now(),
      name: "",
      birthDate: "",
      birthTime: "",
      gender: "male",
      avatar: "",
      birthTimeUnknown: false,
    };
    setGroupMembers([...groupMembers, newMember]);
  };

  const handleMemberAvatarUpload = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateGroupMember(
          id,
          "avatar",
          reader.result as string,
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const isReady =
    mode === "personal"
      ? capturedImages[0] !== null
      : groupMembers.length >= 2 &&
      groupMembers.every(
        (m) => m.name.trim() !== "" && m.avatar,
      );

  // --- Segmenting Animation Overlay ---
  if (isSegmenting) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[50vh]">
        <div className="relative w-48 h-48 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 border-4 border-dashed border-brand-green rounded-full"
          />
          <div className="absolute inset-4 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-clay-sm">
            <Users
              size={48}
              className="text-brand-green animate-pulse"
            />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 font-display">
          인원 분석 및 세그멘테이션 중...
        </h2>
        <p className="text-gray-500 mt-2">
          각 멤버의 얼굴을 개별적으로 추출하고 있습니다.
        </p>
      </div>
    );
  }

  // --- Individual Photo Upload View ---
  if (
    mode === "group" &&
    isIndividualPhotoUpload &&
    currentStep !== 3
  ) {
    const allPhotosUploaded =
      groupMembers.length >= 2 &&
      groupMembers.every((m) => m.avatar);

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-7xl mx-auto pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">
              멤버별 사진 등록
            </h2>
            <p className="text-lg text-gray-600 font-sans">
              각 멤버의 얼굴 사진을 업로드해주세요.
            </p>
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
                      className={`w-40 h-40 rounded-3xl overflow-hidden shadow-clay-md border-4 border-white bg-gray-50 transition-all flex items-center justify-center ${member.avatar
                        ? ""
                        : "cursor-pointer hover:bg-gray-100"
                        }`}
                      onClick={() =>
                        !member.avatar &&
                        document
                          .getElementById(
                            `individual-upload-${member.id}`,
                          )
                          ?.click()
                      }
                    >
                      {member.avatar ? (
                        <div className="relative w-full h-full group">
                          <img
                            src={member.avatar}
                            alt={`Member ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              document
                                .getElementById(
                                  `individual-upload-${member.id}`,
                                )
                                ?.click();
                            }}
                          >
                            <Camera size={32} />
                            <span className="text-sm font-bold mt-2">
                              사진 변경
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300 gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Camera size={32} />
                          </div>
                          <span className="text-sm font-bold text-center text-gray-400">
                            사진 업로드
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      id={`individual-upload-${member.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        handleMemberAvatarUpload(member.id, e)
                      }
                    />
                    {member.avatar && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        <Check
                          size={16}
                          className="text-white"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="bg-teal-50 px-4 py-2 rounded-full text-sm font-bold text-teal-700">
                      멤버 {index + 1}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <ActionButton
              variant="secondary"
              onClick={addGroupMember}
              className="w-full py-5 border-4 border-dashed border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-white hover:border-teal-200 hover:text-teal-600 transition-all flex items-center justify-center gap-3 rounded-2xl shadow-none"
            >
              <Users size={20} />
              <span className="font-bold">멤버 추가하기</span>
            </ActionButton>

            <ActionButton
              variant="orange-primary"
              onClick={() => {
                setIsIndividualPhotoUpload(false);
                setCurrentStep(3);
              }}
              disabled={!allPhotosUploaded}
              className={`w-full py-6 transition-all duration-300 text-base ${!allPhotosUploaded
                ? "opacity-50 grayscale cursor-not-allowed"
                : ""
                }`}
            >
              {allPhotosUploaded ? (
                <>
                  다음 단계로{" "}
                  <ArrowRight size={20} className="ml-2" />
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

  // --- Group Mode Initial View ---
  if (
    mode === "group" &&
    !isCameraActive &&
    capturedImages[0] === null
  ) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[60vh] px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
            모임 관상 확인하기
          </h2>
          <p className="text-lg text-gray-600 font-sans">
            사진 촬영 또는 업로드 방식을 선택해주세요.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-green shadow-clay-md"
            onClick={() => setIsCameraActive(true)}
          >
            <div className="w-24 h-24 bg-brand-green-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Camera className="w-12 h-12 text-brand-green" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">
                사진 촬영하기
              </h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                실시간 안면 인식 시스템으로
                <br />
                모임 관상을 확인합니다.
              </p>
            </div>
          </GlassCard>

          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-orange shadow-clay-md"
            onClick={() => setIsUploadTypeModalOpen(true)}
          >
            <div className="w-24 h-24 bg-brand-orange-muted rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-clay-sm">
              <Upload className="w-12 h-12 text-brand-orange" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-3 font-display">
                사진 업로드하기
              </h3>
              <p className="text-base text-gray-500 font-sans leading-relaxed">
                미리 촬영한 사진을 업로드하여
                <br />
                모임 관상을 확인합니다.
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Upload Mode Selection Modal */}
        <Modal
          isOpen={isUploadTypeModalOpen}
          onClose={() => setIsUploadTypeModalOpen(false)}
          size="md"
        >
          <ModalHeader description="업로드할 사진의 종류를 선택해주세요.">
            사진 선택 방식
          </ModalHeader>

          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() =>
                  groupFileInputRef.current?.click()
                }
                className="group relative w-full text-left"
              >
                <div className="p-6 bg-orange-50 rounded-2xl border-2 border-orange-100 hover:border-brand-orange transition-all flex items-center gap-6 hover:shadow-md">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-brand-orange shadow-sm">
                    <Users size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 font-display mb-1">
                      단체 사진 등록
                    </h4>
                    <p className="text-sm text-gray-500 font-sans">
                      한 장의 사진에서 인물들을 자동 추출합니다.
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setGroupMembers([
                    {
                      id: Date.now(),
                      name: "",
                      birthDate: "",
                      birthTime: "",
                      gender: "male",
                      avatar: "",
                    },
                    {
                      id: Date.now() + 1,
                      name: "",
                      birthDate: "",
                      birthTime: "",
                      gender: "female",
                      avatar: "",
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
                    <h4 className="text-lg font-bold text-gray-800 font-display mb-1">
                      멤버별 개인 사진 등록
                    </h4>
                    <p className="text-sm text-gray-500 font-sans">
                      각 멤버의 사진을 개별적으로 등록합니다.
                    </p>
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

  // --- Photo Confirmation View ---
  const isPersonalConfirming = mode === "personal" && capturedImages[currentStep] !== null;
  if (
    (mode === "group" &&
      isGroupPhotoConfirming &&
      capturedImages[0] !== null &&
      currentStep !== 3) ||
    isPersonalConfirming
  ) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center font-display">
            촬영된 사진 확인
          </h2>
          <p className="text-center text-gray-500 mb-8 font-sans">
            해당 사진 선택 또는 재촬영이 가능합니다.
          </p>

          <GlassCard className="w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-gray-900 shadow-clay-lg rounded-3xl border-8 border-white mb-8">
            <img
              src={
                mode === "personal"
                  ? capturedImages[currentStep]!
                  : capturedImages[0]!
              }
              alt="Captured Photo"
              className={`w-full h-full object-cover ${mode === "personal" ? "transform scale-x-[-1]" : ""
                }`}
            />

            {/* Detected Count Badge - Group Mode Only */}
            {mode === "group" && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#FF7043] rounded-full text-white text-sm font-bold shadow-lg flex items-center gap-2 backdrop-blur-md border-2 border-white/50">
                <Users size={18} />
                {detectedCount > 0
                  ? `${detectedCount}명 감지됨`
                  : "인원 감지 중..."}
              </div>
            )}

            {/* Completion Badge - Personal Mode Only */}
            {mode === "personal" && (
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#00897B] rounded-full text-white text-sm font-bold shadow-lg flex items-center gap-2 backdrop-blur-md border-2 border-white/50">
                <Check size={18} />
                촬영 완료
              </div>
            )}
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionButton
              variant="orange-secondary"
              onClick={handleRetake}
              className="py-6 text-base flex items-center justify-center gap-2"
            >
              <RefreshCcw size={20} />
              다시 촬영하기
            </ActionButton>

            <ActionButton
              variant="orange-primary"
              onClick={handleNextStep}
              className="py-6 text-base flex items-center justify-center gap-2"
            >
              <ArrowRight size={20} />
              이대로 사용하기
            </ActionButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Camera View ---
  if (
    (mode === "personal" && currentStep === 0 && !isPersonalConfirming) ||
    (mode === "group" && isCameraActive)
  ) {
    const stepInfo =
      mode === "personal"
        ? CAPTURE_STEPS[currentStep]
        : {
          title: "단체 사진 촬영",
          guide:
            "모든 인원이 잘 보이게 찍어주세요 (Enter로 촬영)",
          overlay: null,
        };

    const hasCapturedImage = false; // Always false here because captured state is handled by confirmation view

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto pb-20">
        <GlassCard className="w-full aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center bg-black shadow-clay-lg rounded-[40px] border-[10px] border-white">
          {!hasCapturedImage ? (
            <div className="absolute inset-0">
              <FaceMeshWebcam
                onCapture={(img) => {
                  setCapturedImages((prev) => {
                    const newImages = [...prev];
                    if (mode === "personal") {
                      newImages[currentStep] = img;
                    } else {
                      newImages[0] = img;
                    }
                    return newImages;
                  });
                  if (mode === "group") {
                    setIsGroupPhotoConfirming(true);
                  }
                }}
                onClose={() => {
                  setIsCapturing(false);
                  setIsCameraActive(false);
                }}
                onFaceCountChange={setDetectedCount}
                maxFaces={mode === "personal" ? 1 : 5}
                title={mode === "personal" ? "정면을 응시해 주세요" : "모두 정면 3초 유지!"}
              />
            </div>
          ) : (
            <img
              src={
                mode === "personal"
                  ? capturedImages[currentStep]!
                  : capturedImages[0]!
              }
              alt="Captured"
              className={`absolute inset-0 w-full h-full object-cover ${mode === "personal" ? "transform scale-x-[-1]" : ""}`}
            />
          )}

          {isScanning && !hasCapturedImage && mode === "group" && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute left-0 right-0 h-1 bg-brand-green shadow-[0_0_15px_var(--brand-green)] opacity-60"
              />
            </div>
          )}

          {!hasCapturedImage && stepInfo.overlay}

          {/* Top Overlay UI */}
          {!hasCapturedImage && mode === "group" && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent text-white text-center z-10 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF7043] rounded-full text-xs font-bold mb-2 shadow-sm">
                <Scan size={14} className="animate-pulse" />
                실시간 인원 감지: {detectedCount}명
              </div>
            </div>
          )}

          {hasCapturedImage && (
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent text-white text-center z-10 pointer-events-none">
              {mode === "personal" ? (
                <>
                  <div className="inline-block px-3 py-1 bg-[#00897B] rounded-full text-xs font-bold mb-2 shadow-sm">
                    단계 {currentStep + 1} / 3 | 촬영 완료
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-1">
                    {stepInfo.title}
                  </h3>
                  <p className="text-sm opacity-90">
                    촬영된 사진을 확인하세요
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-bold font-display mb-1">
                    촬영된 사진 확인
                  </h3>
                  <p className="text-sm opacity-90">
                    해당 사진 선택 또는 재촬영이 가능합니다.
                  </p>
                </>
              )}
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-10 pointer-events-auto">
            {hasCapturedImage && (
              <div className="flex gap-4 items-center">
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-full font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-teal-500/20"
                >
                  {mode === "personal" ? "다음 단계로" : "선택하기"}
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Top Right Controls */}
          <div className="absolute top-6 right-6 flex gap-2 pointer-events-auto">
            {!hasCapturedImage && mode === "group" && (
              <>
                <button
                  onClick={() => {
                    setIsCapturing(false);
                    setIsCameraActive(false);
                  }}
                  className="bg-black/40 text-white p-2.5 rounded-full backdrop-blur-md hover:bg-black/60 transition-colors"
                >
                  ✕
                </button>
              </>
            )}
            {hasCapturedImage && (
              <button
                onClick={handleRetake}
                className="bg-white text-gray-900 p-3 rounded-full hover:bg-white/90 transition-all shadow-lg border border-gray-100"
                title="다시 찍기"
              >
                <RefreshCcw size={24} />
              </button>
            )}
            
            {!hasCapturedImage && mode === "personal" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-white p-3 rounded-full backdrop-blur-md hover:bg-white/20 transition-all border border-white/20"
                title="사진 업로드"
              >
                <Upload size={24} />
              </button>
            )}
            
            <button
              onClick={() => {
                setIsCapturing(false);
                setIsCameraActive(false);
              }}
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={32} />
            </button>
          </div>
          
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

  // --- Camera View ---
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-4xl mx-auto pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="w-full">
          <div className="w-full p-10 bg-white/90 backdrop-blur-sm rounded-[32px] shadow-clay-md border-4 border-white overflow-hidden relative">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange-muted rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10">
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-2xl flex items-center gap-3 font-display">
                  <Users size={32} className="text-brand-orange" />
                  멤버별 인적 사항 등록
                </h3>
                <p className="text-gray-500 mt-2 font-sans text-base leading-relaxed break-keep">
                  각 멤버의 이름과 생년월일, 생시를
                  입력해주세요.
                </p>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto">
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-xl transition-all flex items-center gap-2 text-sm font-bold group"
                >
                  <RefreshCcw
                    size={16}
                    className="group-hover:rotate-180 transition-transform duration-500"
                  />
                  다시 촬영하기
                </button>
                <div className="px-5 py-2 bg-orange-50 text-brand-orange rounded-2xl text-sm font-bold border-2 border-orange-100 shadow-sm flex items-center gap-2">
                  <Sparkles size={16} />
                  {groupMembers.length}명의 기운 감지
                </div>
              </div>
            </div>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-3 scrollbar-hide mb-8 custom-scrollbar">
              <AnimatePresence>
                {groupMembers.map((member, index) => {
                  // AI가 감지한 이미지인지 확인 (MOCK_AVATARS에 포함되어 있으면 AI 감지)
                  const isAIDetected =
                    member.avatar &&
                    MOCK_AVATARS.includes(member.avatar);

                  return (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col sm:flex-row gap-6 bg-white/50 p-6 rounded-[24px] border-2 border-gray-100 shadow-clay-xs relative overflow-hidden group hover:border-brand-orange/30 transition-all"
                    >
                      {/* Member Avatar Upload */}
                      <div className="shrink-0 flex flex-col items-center gap-3">
                        <div
                          className={`w-24 h-24 rounded-[20px] overflow-hidden shadow-clay-sm border-4 border-white bg-gray-50 transition-all relative group/avatar flex items-center justify-center overflow-hidden ${isAIDetected
                            ? "cursor-default"
                            : "cursor-pointer group-hover:bg-gray-100"
                            }`}
                          onClick={() =>
                            !isAIDetected &&
                            document
                              .getElementById(
                                `avatar-upload-${member.id}`,
                              )
                              ?.click()
                          }
                        >
                          {member.avatar ? (
                            <>
                              <img
                                src={member.avatar}
                                alt="Face"
                                className="w-full h-full object-cover"
                              />
                              {!isAIDetected && (
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                  <Camera size={20} />
                                  <span className="text-[10px] font-bold mt-1">
                                    사진 변경
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <Camera size={24} />
                              </div>
                              <span className="text-[10px] font-bold text-center leading-tight">
                                얼굴 사진
                                <br />
                                비추기
                              </span>
                            </div>
                          )}
                          {!isAIDetected && (
                            <input
                              type="file"
                              id={`avatar-upload-${member.id}`}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) =>
                                handleMemberAvatarUpload(
                                  member.id,
                                  e,
                                )
                              }
                            />
                          )}
                        </div>
                        <div className="bg-brand-orange-muted px-3 py-1 rounded-full text-[11px] font-bold text-brand-orange-dark shadow-sm">
                          제 {index + 1} 인물
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex gap-3 items-center">
                          <div className="flex-1 relative">
                            <Input
                              placeholder="인물의 성함"
                              className="h-12 text-base bg-white/80 border-2 border-gray-100 focus:bg-white focus:border-brand-orange transition-all rounded-2xl font-bold px-4"
                              value={member.name}
                              onChange={(e) =>
                                updateGroupMember(
                                  member.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-bold text-gray-600 ml-1">
                              생년월일
                            </Label>
                            <div className="relative">
                              <Calendar
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-orange pointer-events-none z-10"
                              />
                              <Input
                                type="date"
                                value={member.birthDate}
                                onChange={(e) =>
                                  updateGroupMember(
                                    member.id,
                                    "birthDate",
                                    e.target.value,
                                  )
                                }
                                className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-12 rounded-xl transition-all cursor-pointer pl-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-3 [&::-webkit-calendar-picker-indicator]:w-5 [&::-webkit-calendar-picker-indicator]:h-5 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                style={{ colorScheme: 'light' }}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-bold text-gray-600 ml-1">
                                태어난 시간
                              </Label>
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <Checkbox
                                  checked={member.birthTimeUnknown || false}
                                  onCheckedChange={(checked) => {
                                    const isChecked = checked === true;
                                    setGroupMembers(
                                      groupMembers.map((m) =>
                                        m.id === member.id
                                          ? {
                                            ...m,
                                            birthTimeUnknown: isChecked,
                                            birthTime: isChecked ? "" : "00:00",
                                          }
                                          : m
                                      )
                                    );
                                  }}
                                />
                                <span className="text-sm font-medium text-gray-600 group-hover:text-brand-orange transition-colors">모름</span>
                              </label>
                            </div>
                            {!member.birthTimeUnknown ? (
                              <div className="flex gap-2">
                                <div className="relative w-28">
                                  <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-orange pointer-events-none z-10"
                                  />
                                  <Select
                                    value={(() => {
                                      if (!member.birthTime) return "";
                                      const [hours] = member.birthTime.split(":");
                                      return parseInt(hours) >= 12 ? "PM" : "AM";
                                    })()}
                                    onValueChange={(value) => {
                                      const currentTime = member.birthTime || "00:00";
                                      const [hours, minutes] = currentTime.split(":");
                                      let hour = parseInt(hours);

                                      if (value === "PM" && hour < 12) {
                                        hour += 12;
                                      } else if (value === "AM" && hour >= 12) {
                                        hour -= 12;
                                      }

                                      updateGroupMember(
                                        member.id,
                                        "birthTime",
                                        `${hour.toString().padStart(2, "0")}:${minutes}`
                                      );
                                    }}
                                  >
                                    <SelectTrigger className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-12 rounded-xl transition-all pl-11">
                                      <SelectValue placeholder="오전/오후" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AM">오전</SelectItem>
                                      <SelectItem value="PM">오후</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <Select
                                  value={(() => {
                                    if (!member.birthTime) return "";
                                    const [hours] = member.birthTime.split(":");
                                    let hour = parseInt(hours);
                                    if (hour === 0) return "12";
                                    if (hour > 12) hour -= 12;
                                    return hour.toString();
                                  })()}
                                  onValueChange={(value) => {
                                    const currentTime = member.birthTime || "00:00";
                                    const [hours, minutes] = currentTime.split(":");
                                    const currentHour = parseInt(hours);
                                    const isPM = currentHour >= 12;

                                    let newHour = parseInt(value);
                                    if (isPM && newHour !== 12) {
                                      newHour += 12;
                                    } else if (!isPM && newHour === 12) {
                                      newHour = 0;
                                    }

                                    updateGroupMember(
                                      member.id,
                                      "birthTime",
                                      `${newHour.toString().padStart(2, "0")}:${minutes}`
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-12 rounded-xl transition-all w-24">
                                    <SelectValue placeholder="시" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                                      <SelectItem key={hour} value={hour.toString()}>
                                        {hour}시
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Select
                                  value={(() => {
                                    if (!member.birthTime) return "";
                                    const [, minutes] = member.birthTime.split(":");
                                    return minutes;
                                  })()}
                                  onValueChange={(value) => {
                                    const currentTime = member.birthTime || "00:00";
                                    const [hours] = currentTime.split(":");
                                    updateGroupMember(
                                      member.id,
                                      "birthTime",
                                      `${hours}:${value}`
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-12 rounded-xl transition-all w-24">
                                    <SelectValue placeholder="분" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                                      <SelectItem key={minute} value={minute.toString().padStart(2, "0")}>
                                        {minute.toString().padStart(2, "0")}분
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="relative">
                                <Clock
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10"
                                />
                                <div className="bg-gray-100/50 border-2 border-gray-100 h-12 rounded-xl flex items-center pl-11 text-gray-400 text-sm">
                                  시간 정보 없음
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <ToggleGroup
                          type="single"
                          value={member.gender}
                          onValueChange={(val) =>
                            val &&
                            updateGroupMember(
                              member.id,
                              "gender",
                              val,
                            )
                          }
                          variant="outline"
                          className="w-full"
                        >
                          <ToggleGroupItem
                            value="male"
                            className="flex-1 text-xs font-bold"
                          >
                            남성
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="female"
                            className="flex-1 text-xs font-bold"
                          >
                            여성
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          <ActionButton
            variant="orange-primary"
            onClick={() =>
              onAnalyze(
                capturedImages as string[],
                [],
                {
                  birthDate: "",
                  birthTime: "00:00",
                  gender: "male",
                  calendarType: "solar",
                  birthTimeUnknown: true,
                },
                groupMembers,
              )
            }
            disabled={!isReady}
            className={`w-full py-6 mt-6 transition-all duration-300 text-base ${!isReady ? "opacity-50 grayscale cursor-not-allowed" : "animate-bounce-subtle"}`}
          >
            {isReady
              ? "모임 궁합 분석하기"
              : "모든 멤버의 이름과 얼굴 사진을 등록해주세요"}
          </ActionButton>
        </div>
      </motion.div>
    </div>
  );
};