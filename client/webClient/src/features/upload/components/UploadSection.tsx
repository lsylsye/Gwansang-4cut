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
  UserCheck,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { Checkbox } from "@/shared/ui/forms/checkbox";
import { Label } from "@/shared/ui/forms/label";
import { Input } from "@/shared/ui/forms/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/shared/ui/forms/toggle-group";
import { DatePicker } from "@/shared/ui/forms/date-picker";
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
import { ConsentModal } from "./ConsentModal";
import { FaceMeshWebcam } from "./FaceMeshWebcam";
import { detectFacesAndCrop, analyzePersonalImage, analyzeGroupPhotoForApi, type GroupFaceMeshPayload } from "../utils/groupPhotoFaceDetection";
import { API_ENDPOINTS } from "@/shared/api/config";
import profileImage from "@/assets/profile.png";
import selfieImage from "@/assets/selfie.png";

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
    guide: "얼굴 정면을 가이드에 맞춰주세요",
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

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGroupPhotoConfirming, setIsGroupPhotoConfirming] =
    useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState<
    string | null
  >(null);
  /** 멤버별 개인 사진 업로드 시 MediaPipe 분석 중인 멤버 id (null이면 비표시) */
  const [memberIdAnalyzing, setMemberIdAnalyzing] = useState<number | null>(null);
  /** 멤버별 사진 업로드에서 얼굴 인식 실패한 멤버 id */
  const [memberAvatarErrorId, setMemberAvatarErrorId] = useState<number | null>(null);
  const [isUploadTypeModalOpen, setIsUploadTypeModalOpen] =
    useState(false);
  const [isPersonalUploadModalOpen, setIsPersonalUploadModalOpen] =
    useState(false);
  const [isIndividualPhotoUpload, setIsIndividualPhotoUpload] =
    useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(true);
  const [hasConsented, setHasConsented] = useState(false);
  const [sajuData, setSajuData] = useState<SajuData>({
    birthDate: "",
    birthTime: "00:00",
    gender: "male",
    calendarType: "solar",
    birthTimeUnknown: false,
  });
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<any>(null);
  /** 단체 사진 업로드 시 추출한 timestamp+faces (백엔드 전송 형식) */
  const [groupUploadFaceMetadata, setGroupUploadFaceMetadata] = useState<GroupFaceMeshPayload | null>(null);
  const [showSajuInput, setShowSajuInput] = useState(false);
  const [isPersonalUploadAnalyzing, setIsPersonalUploadAnalyzing] = useState(false);
  /** 개인 모드에서 사진 업로드(파일 선택)로 이미지가 들어온 경우 → 확인 화면 건너뛰고 사주 입력으로만 이동 */
  const [cameFromPersonalFileUpload, setCameFromPersonalFileUpload] = useState(false);

  const [groupMembers, setGroupMembers] = useState<
    GroupMember[]
  >([]);

  // MediaPipe로 얼굴 검출 및 크롭 후 groupMembers 초기화 (단체 사진 등록 시 바로 호출 → 분석 후 step 3)
  const processGroupPhoto = useCallback(async (photo: string) => {
    setFaceDetectionError(null);
    setIsSegmenting(true);
    const delayMs = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      const [faceResult] = await Promise.all([
        detectFacesAndCrop(photo),
        delayMs(3000),
      ]);
      const { count, crops } = faceResult;

      if (count === 0) {
        setFaceDetectionError(
          "얼굴을 인식하지 못했습니다. 다른 사진을 시도해 주세요."
        );
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true); // 실패 시 확인 화면에서 에러 표시·재시도 가능
        return;
      }
      if (count === 1) {
        setFaceDetectionError(
          "2명 이상의 얼굴이 필요합니다. 다시 촬영하거나 다른 사진을 업로드해 주세요."
        );
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true);
        return;
      }
      if (count > 7) {
        setFaceDetectionError(
          "최대 7명까지만 인식 가능합니다. 7명 이하의 사진을 업로드해 주세요."
        );
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true);
        return;
      }

      // 2명 이상 7명 이하: detectedCount, groupMembers(avatar: crops[i]), step 3
      setDetectedCount(count);
      const members: GroupMember[] = Array.from({ length: count }).map(
        (_, i) => ({
          id: Date.now() + i,
          name: `멤버 ${i + 1}`,
          birthDate: getTodayDateString(),
          birthTime: "",
          gender: "male",
          avatar: crops[i] ?? "",
          birthTimeUnknown: false,
        })
      );
      setGroupMembers(members);
      setIsSegmenting(false);
      setCurrentStep(3);
      analyzeGroupPhotoForApi(photo).then(setGroupUploadFaceMetadata).catch(() => {});
    } catch {
      setFaceDetectionError("얼굴 분석 중 오류가 발생했습니다.");
      setIsSegmenting(false);
      setIsGroupPhotoConfirming(true);
    }
  }, []);

  useEffect(() => {
    if (isCapturing || isCameraActive) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
      setDetectedCount(0);
    }
  }, [isCapturing, isCameraActive]);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (mode === "personal") {
          setIsPersonalUploadAnalyzing(true);
          (async () => {
            const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
            const metadataPromise = analyzePersonalImage(result);
            await Promise.all([metadataPromise, delay(3000)]);
            const metadata = await metadataPromise;
            setCapturedImages([result]);
            setFaceMeshMetadata(metadata);
            setIsCapturing(false);
            setIsPersonalUploadAnalyzing(false);
            setCameFromPersonalFileUpload(true); // 확인 화면 건너뛰고 모달에서 "다음" 시 사주 입력으로만 이동
          })();
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
        setFaceDetectionError(null);
        // 단체 사진 등록: 확인 화면 건너뛰고 바로 MediaPipe 분석 → 개인정보 입력(step 3)으로
        processGroupPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = useCallback(() => {
    if (mode === "personal") {
      if (capturedImages[0] && !showSajuInput) {
        // 촬영 완료 후 사주 정보 입력 화면으로
        setShowSajuInput(true);
      } else if (showSajuInput) {
        // 사주 정보 입력 완료 후 분석 시작
        // 이전 싸피네컷 사진 캐시 삭제 (백엔드 POST 전에 삭제)
        try {
          localStorage.removeItem("photoBoothSets");
        } catch (error) {
          console.error("이전 촬영 데이터 삭제 실패:", error);
        }

        if (faceMeshMetadata) {
          const finalPayload = {
            ...faceMeshMetadata,
            sajuData: sajuData,
          };

          console.log("🚀 백엔드 전송 데이터 (Personal):", finalPayload);

          fetch(API_ENDPOINTS.FACEMESH_PERSONAL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(finalPayload),
          }).catch((err) => {
            console.error("최종 데이터 전송 실패:", err);
          });
        }

        onAnalyze(
          capturedImages as string[],
          [],
          sajuData,
        );
      }
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
    showSajuInput,
    sajuData,
    faceMeshMetadata,
  ]);

  const handleRetake = () => {
    if (mode === "personal") {
      setCapturedImages([null]);
      setFaceMeshMetadata(null);
      setCurrentStep(0);
      setIsCapturing(true);
      setShowSajuInput(false);
      setCameFromPersonalFileUpload(false);
    } else {
      setCapturedImages([null]);
      setFaceMeshMetadata(null);
      setGroupUploadFaceMetadata(null);
      setGroupMembers([]);
      setIsCameraActive(false);
      setIsIndividualPhotoUpload(false);
      setIsGroupPhotoConfirming(false);
      setFaceDetectionError(null);
      setCurrentStep(0);
      if (groupFileInputRef.current) groupFileInputRef.current.value = "";
      // 모임: 다시 촬영하기 → 모임 관상 확인하기(촬영/업로드 선택) 섹션으로
    }
  };

  const handleConsentAgree = () => {
    setHasConsented(true);
    setIsConsentModalOpen(false);
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
    if (groupMembers.length >= 7) {
      return; // 최대 7명까지만 추가 가능
    }
    const newMember: GroupMember = {
      id: Date.now(),
      name: "",
      birthDate: getTodayDateString(),
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
      setMemberAvatarErrorId(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMemberIdAnalyzing(id);
        const delayMs = (ms: number) => new Promise((r) => setTimeout(r, ms));
        (async () => {
          try {
            const [faceResult] = await Promise.all([
              detectFacesAndCrop(result),
              delayMs(3000),
            ]);
            const { count, crops } = faceResult;
            setMemberIdAnalyzing(null);
            if (count >= 1) {
              updateGroupMember(id, "avatar", crops[0]);
            } else {
              setMemberAvatarErrorId(id);
            }
          } catch {
            setMemberIdAnalyzing(null);
            setMemberAvatarErrorId(id);
          }
        })();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGroupAnalyze = async () => {
    // 이전 싸피네컷 사진 캐시 삭제 (백엔드 POST 전에 삭제)
    try {
      localStorage.removeItem("photoBoothSets");
    } catch (error) {
      console.error("이전 촬영 데이터 삭제 실패:", error);
    }

    const membersWithoutAvatar = groupMembers.map(({ avatar, ...rest }) => rest);

    // 백엔드 형식: { timestamp, faces, groupMembers } (groupMembers는 avatar 제외)
    let finalPayload: (GroupFaceMeshPayload & { groupMembers: typeof membersWithoutAvatar }) | null = null;

    if (faceMeshMetadata) {
      // 촬영: FaceMeshWebcam에서 받은 timestamp + faces + groupMembers
      finalPayload = {
        ...faceMeshMetadata,
        groupMembers: membersWithoutAvatar,
      };
    } else if (groupUploadFaceMetadata) {
      // 단체 사진 업로드: analyzeGroupPhotoForApi로 저장해 둔 timestamp + faces + groupMembers
      finalPayload = {
        ...groupUploadFaceMetadata,
        groupMembers: membersWithoutAvatar,
      };
    } else if (groupMembers.length >= 2 && groupMembers.every((m) => m.avatar)) {
      // 멤버별 개인 사진 업로드: 각 멤버 avatar로 landmarks 추출 후 faces 조합
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      const timestamp = new Date(now.getTime() - offset).toISOString().slice(0, -1);
      const faceResults = await Promise.all(
        groupMembers.map((m) => (m.avatar ? analyzePersonalImage(m.avatar) : Promise.resolve(null)))
      );
      const faces = faceResults
        .map((meta, i) => (meta?.faces?.[0] ? { ...meta.faces[0], faceIndex: i + 1 } : null))
        .filter((f) => f != null) as Array<{ faceIndex: number; duration: number; landmarks: Array<{ index: number; x: number; y: number; z: number }> }>;
      finalPayload = { timestamp, faces, groupMembers: membersWithoutAvatar };
    }

    if (finalPayload) {
      console.log("🚀 백엔드 전송 데이터 (Group):", finalPayload);
      fetch(API_ENDPOINTS.FACEMESH_GROUP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload),
      }).catch((err) => {
        console.error("모임 데이터 전송 실패:", err);
      });
    }

    onAnalyze(
      capturedImages as string[],
      [],
      {
        birthDate: "",
        birthTime: "00:00",
        gender: "male",
        calendarType: "solar",
        birthTimeUnknown: false,
      },
      groupMembers,
    );
  };

  const isReady =
    mode === "personal"
      ? capturedImages[0] !== null && sajuData.birthDate !== ""
      : groupMembers.length >= 2 &&
      groupMembers.every(
        (m) => m.name.trim() !== "" && m.avatar && m.birthDate !== "",
      );

  // --- Consent Modal ---
  if (!hasConsented) {
    return (
      <>
        <ConsentModal
          isOpen={isConsentModalOpen}
          onClose={() => {
            window.location.href = "/";
          }}
          onAgree={handleConsentAgree}
        />
      </>
    );
  }

  // --- Personal Mode: Saju Input Screen ---
  if (mode === "personal" && showSajuInput && capturedImages[0]) {
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">
              사주 정보 입력
            </h2>
            <p className="text-lg text-gray-600 font-sans">
              더 정확한 관상 분석을 위해 사주 정보를 입력해주세요
            </p>
          </div>

          <div className="w-full max-w-lg mx-auto">
            {/* Saju Input Form */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-brand-orange" />
                <h3 className="text-xl font-bold text-gray-800 font-display">
                  사주 정보 입력 (필수)
                </h3>
              </div>

              <div className="space-y-6">
                {/* Gender Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-600">
                    성별
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={sajuData.gender}
                    onValueChange={(val) =>
                      val &&
                      setSajuData({ ...sajuData, gender: val as "male" | "female" })
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="male"
                      className="flex-1 text-sm font-bold"
                    >
                      남성
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="female"
                      className="flex-1 text-sm font-bold"
                    >
                      여성
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Calendar Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-600">
                    양력/음력
                  </Label>
                  <ToggleGroup
                    type="single"
                    value={sajuData.calendarType}
                    onValueChange={(val) =>
                      val &&
                      setSajuData({
                        ...sajuData,
                        calendarType: val as "solar" | "lunar",
                      })
                    }
                    variant="outline"
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="solar"
                      className="flex-1 text-sm font-bold"
                    >
                      양력
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="lunar"
                      className="flex-1 text-sm font-bold"
                    >
                      음력
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* Birth Date */}
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-600">
                    생년월일
                  </Label>
                  <DatePicker
                    value={sajuData.birthDate}
                    onChange={(value) => setSajuData({ ...sajuData, birthDate: value })}
                    placeholder="YYYY.MM.DD"
                    themeColor="orange"
                  />
                </div>

                {/* Birth Time */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold text-gray-600">
                      태어난 시간
                    </Label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <Checkbox
                        checked={sajuData.birthTimeUnknown || false}
                        onCheckedChange={(checked) => {
                          setSajuData({
                            ...sajuData,
                            birthTimeUnknown: checked === true,
                            birthTime: checked === true ? "" : "00:00",
                          });
                        }}
                      />
                      <span className="text-sm font-medium text-gray-600 group-hover:text-brand-orange transition-colors">
                        모름
                      </span>
                    </label>
                  </div>
                  {!sajuData.birthTimeUnknown ? (
                    <div className="grid grid-cols-2 gap-2 w-full max-w-[50%]">
                      <div className="relative min-w-0">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange pointer-events-none z-10" />
                        <Select
                          value={
                            sajuData.birthTime
                              ? parseInt(sajuData.birthTime.split(":")[0], 10).toString()
                              : "0"
                          }
                          onValueChange={(value) => {
                            const currentTime = sajuData.birthTime || "00:00";
                            const [, minutes] = currentTime.split(":");
                            const h = value.padStart(2, "0");
                            setSajuData({
                              ...sajuData,
                              birthTime: `${h}:${minutes}`,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white/80 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-10 rounded-lg transition-all pl-9 pr-3 text-sm w-full min-w-0">
                            <SelectValue placeholder="시" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour}시
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative w-full min-w-0">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          maxLength={2}
                          value={
                            sajuData.birthTime
                              ? sajuData.birthTime.split(":")[1]
                              : ""
                          }
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                            const currentTime = sajuData.birthTime || "00:00";
                            const [hours] = currentTime.split(":");
                            const num = v === "" ? 0 : parseInt(v, 10);
                            const clamped = num > 59 ? "59" : v === "" ? "00" : v;
                            setSajuData({
                              ...sajuData,
                              birthTime: `${hours}:${clamped}`,
                            });
                          }}
                          onBlur={() => {
                            const currentTime = sajuData.birthTime || "00:00";
                            const [hours, min] = currentTime.split(":");
                            const parsed = parseInt(min || "0", 10);
                            const clamped = Math.min(59, Math.max(0, isNaN(parsed) ? 0 : parsed)).toString().padStart(2, "0");
                            if (min !== clamped) {
                              setSajuData({
                                ...sajuData,
                                birthTime: `${hours}:${clamped}`,
                              });
                            }
                          }}
                          className="bg-white/80 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-10 rounded-lg transition-all w-full min-w-0 text-sm pl-3 pr-9"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                          분
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full min-w-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <div className="bg-gray-100/50 border-2 border-gray-100 h-10 rounded-lg flex items-center pl-9 text-gray-400 text-sm">
                        시간 정보 없음
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="mt-8 flex justify-center">
            <ActionButton
              variant="primary"
              onClick={handleNextStep}
              disabled={!sajuData.birthDate}
              className={`px-12 py-5 text-lg font-bold flex items-center gap-2 transition-all duration-300 ${
                !sajuData.birthDate ? "opacity-50 grayscale cursor-not-allowed" : "animate-bounce-subtle"
              }`}
            >
              <Sparkles size={20} />
              거북 도사님께 풀이 받기
            </ActionButton>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Segmenting Animation Overlay (모임 관상 단체 사진 MediaPipe 분석 중) ---
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
            className="absolute inset-0 border-4 border-dashed border-brand-orange rounded-full"
          />
          <div className="absolute inset-4 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center shadow-clay-sm">
            <Users
              size={48}
              className="text-brand-orange animate-pulse"
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
                        <img
                          src={member.avatar}
                          alt={`Member ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
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
                    {memberAvatarErrorId === member.id && (
                      <p className="mt-2 text-xs text-red-500 font-medium text-center">
                        얼굴을 인식하지 못했습니다.
                      </p>
                    )}
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
                        <CheckCircle2
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
              disabled={groupMembers.length >= 7}
              className={`w-full py-5 border-4 border-dashed transition-all flex items-center justify-center gap-3 rounded-2xl shadow-none ${
                groupMembers.length >= 7
                  ? "border-gray-100 bg-gray-50/30 text-gray-400 cursor-not-allowed opacity-50"
                  : "border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-white hover:border-teal-200 hover:text-teal-600"
              }`}
            >
              <Users size={20} />
              <span className="font-bold">
                {groupMembers.length >= 7 ? "최대 7명까지만 가능합니다" : "멤버 추가하기"}
              </span>
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

  // --- Initial View (Personal or Group) ---
  if (
    !isCameraActive &&
    !isCapturing &&
    (capturedImages[0] === null || isPersonalUploadModalOpen) &&
    !showSajuInput
  ) {
    const isPersonal = mode === "personal";

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[60vh] px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
            {isPersonal ? "개인 관상 확인하기" : "모임 관상 확인하기"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-green hover:shadow-md shadow-clay-md"
            onClick={() => {
              if (isPersonal) {
                setCameFromPersonalFileUpload(false);
                setIsCapturing(true);
              } else {
                setIsCameraActive(true);
              }
            }}
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
                {isPersonal ? "나의 관상을 확인합니다." : "모임 관상을 확인합니다."}
              </p>
            </div>
          </GlassCard>

          <GlassCard
            className="p-10 flex flex-col items-center justify-center gap-6 hover:bg-white/90 transition-all cursor-pointer group border-2 border-transparent hover:border-brand-orange hover:shadow-md shadow-clay-md"
            onClick={() => {
              if (isPersonal) {
                setIsPersonalUploadModalOpen(true);
              } else {
                setIsUploadTypeModalOpen(true);
              }
            }}
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
                {isPersonal ? "나의 관상을 확인합니다." : "모임 관상을 확인합니다."}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Personal Upload Guidance Modal */}
        {isPersonal && (
          <Modal
            isOpen={isPersonalUploadModalOpen}
            onClose={() => {
              setIsPersonalUploadModalOpen(false);
              // 모달만 닫으면 capturedImages[0]가 있어서 Initial View 조건이 false가 되어 다른 뷰로 넘어감 → 개인 업로드 상태 초기화로 촬영/업로드 선택 화면 유지
              setCapturedImages([null]);
              setFaceMeshMetadata(null);
              setCameFromPersonalFileUpload(false);
              // 파일 input 값 초기화 → 같은 파일 다시 선택해도 onChange 발생 (안 하면 재진입 시 업로드 안 됨)
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
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute inset-0 border-3 border-dashed border-brand-green rounded-full"
                        />
                        <div className="absolute inset-1.5 bg-white/80 rounded-full flex items-center justify-center">
                          <Camera size={24} className="text-brand-green animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-gray-800 font-display">
                        얼굴 분석 중...
                      </h3>
                      <p className="text-gray-500 text-sm">
                        MediaPipe로 얼굴 특징점을 추출하고 있습니다.
                      </p>
                    </div>
                  </div>
                )}
                <div className="space-y-6">
                  {/* Prominent Upload Area */}
                  <button
                    onClick={() => {
                      if (!isPersonalUploadAnalyzing) fileInputRef.current?.click();
                    }}
                    className="w-full group"
                    disabled={isPersonalUploadAnalyzing}
                  >
                  <div className={`p-10 flex flex-col items-center justify-center gap-4 ${capturedImages[0] ? 'bg-green-50/50 border-brand-green/30' : 'bg-orange-50/50 border-brand-orange/30'} rounded-[32px] border-2 border-dashed group-hover:border-brand-orange group-hover:bg-orange-50 transition-all relative overflow-hidden min-h-[240px] ${isPersonalUploadAnalyzing ? "pointer-events-none opacity-60" : ""}`}>
                    {capturedImages[0] ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-clay-sm border-4 border-white">
                            <img 
                              src={capturedImages[0]} 
                              alt="Selected" 
                              className="w-full h-full object-cover"
                            />
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

                {/* Compact Guidance with Examples - Horizontal Layout */}
                <div className="bg-gray-50/40 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex gap-4 shrink-0">
                    {/* Recommended Example */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-green-200 flex flex-col items-center justify-center overflow-hidden p-0.5">
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-green rounded-full flex items-center justify-center z-10 shadow-sm">
                          <CheckCircle2 size={7} className="text-white" />
                        </div>
                        <img 
                          src={profileImage} 
                          alt="권장 예시" 
                          className="w-[95%] h-[95%] object-contain rounded-md"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-brand-green">여권/증명</span>
                    </div>

                    {/* Not Good Example */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-red-100 flex items-center justify-center overflow-hidden p-0.5">
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                          <X size={7} className="text-white" strokeWidth={3} />
                        </div>
                        <img 
                          src={selfieImage} 
                          alt="잘못된 예시" 
                          className="w-[95%] h-[95%] object-contain rounded-md opacity-60 grayscale blur-[0.5px]"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-red-400">잘못된 예시</span>
                    </div>
                  </div>

                  {/* Running Text Guidance */}
                  <div className="flex-1 text-left space-y-1.5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                    <p className="text-[12px] text-gray-700 leading-relaxed break-keep">
                      정확한 관상 분석을 위해 <span className="text-brand-green font-bold">여권 사진이나 증명사진</span>처럼 이목구비가 뚜렷하게 나온 정면 사진을 업로드해 주세요. 배경이 깨끗하고 밝은 곳에서 촬영된 사진이 가장 좋습니다.
                    </p>
                    <p className="text-[10px] text-gray-400 leading-relaxed break-keep">
                      다만, 흐릿한 저화질 사진이나 얼굴 일부가 가려진 사진, 조명이 너무 어두운 야외 사진은 인식이 원활하지 않을 수 있으니 주의해 주세요.
                    </p>
                  </div>
                </div>

                <ActionButton
                  variant="clay"
                  onClick={() => {
                    setIsPersonalUploadModalOpen(false);
                    setShowSajuInput(true); // 업로드 시 확인 단계 없이 바로 사주 입력으로 이동
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
        )}

        {/* Group Upload Mode Selection Modal */}
        {mode === "group" && (
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
                        birthDate: getTodayDateString(),
                        birthTime: "",
                        gender: "male",
                        avatar: "",
                        birthTimeUnknown: false,
                      },
                      {
                        id: Date.now() + 1,
                        name: "",
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
        )}

        <input
          type="file"
          ref={groupFileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleGroupPhotoUpload}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  // --- Group Mode Initial View (Legacy - now handled above) ---
  if (
    mode === "group" &&
    !isCameraActive &&
    capturedImages[0] === null
  ) {
    return null; // Should not reach here
  }

  // --- Photo Confirmation View ---
  // 개인 모드에서 "사진 업로드"로 들어온 경우(cameFromPersonalFileUpload)는 확인 화면 생략 → 모달 "다음" 시 사주 입력으로 직행
  const isPersonalConfirming =
    mode === "personal" &&
    capturedImages[currentStep] !== null &&
    !isPersonalUploadModalOpen &&
    !cameFromPersonalFileUpload;
  if (
    (mode === "group" &&
      isGroupPhotoConfirming &&
      capturedImages[0] !== null &&
      currentStep !== 3) ||
    isPersonalConfirming
  ) {
    const accentColor = mode === "personal" ? "bg-brand-green" : "bg-brand-orange";
    const titleText = mode === "personal" ? "정면 촬영" : "단체 촬영";
    
    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <GlassCard className="p-0 w-full aspect-[4/3] relative overflow-hidden flex items-center justify-center bg-gray-900 shadow-clay-lg rounded-[32px] border-8 border-white">
            {/* Background Image */}
            <img
              src={
                mode === "personal"
                  ? capturedImages[currentStep]!
                  : capturedImages[0]!
              }
              alt="Captured Photo"
              className={`w-full h-full object-cover ${mode === "personal" ? "transform scale-x-[-1]" : ""}`}
            />

            {/* Top Overlay - Title & Description */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 via-black/40 to-transparent text-white text-center pointer-events-none">
              <div className={`inline-block px-4 py-1.5 ${accentColor} rounded-full text-xs font-bold mb-3 shadow-sm`}>
                {mode === "personal" ? "촬영 완료" : `${detectedCount > 0 ? detectedCount : "?"}명 감지됨`}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold font-display mb-1 drop-shadow-lg">
                {titleText}
              </h3>
              <p className="text-sm opacity-90 drop-shadow-md">
                촬영된 사진을 확인하세요
              </p>
              {mode === "group" && faceDetectionError && (
                <p className="mt-3 text-sm text-red-200 bg-red-900/60 px-3 py-2 rounded-lg">
                  {faceDetectionError}
                </p>
              )}
            </div>

            {/* Top Right Controls */}
            <div className="absolute top-5 right-5 flex gap-2 pointer-events-auto">
              <button
                onClick={handleRetake}
                className={`${mode === "personal" ? "bg-brand-green hover:bg-brand-green/80" : "bg-brand-orange hover:bg-brand-orange/80"} text-white p-2.5 rounded-full backdrop-blur-md transition-colors`}
                title="다시 찍기"
              >
                <RefreshCcw size={20} />
              </button>
            </div>

            {/* Bottom Center Button: 모임에서 얼굴 인식 실패 시 다음 버튼 숨김 */}
            {!(mode === "group" && faceDetectionError) && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
                <ActionButton
                  variant={mode === "personal" ? "primary" : "orange-primary"}
                  onClick={handleNextStep}
                  className="px-8 py-4"
                  disabled={!capturedImages[0]}
                >
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
  // 개인 모드에서 사주 정보 입력 화면이 아니고, 촬영 중일 때만 카메라 뷰 표시
  if (
    (mode === "personal" && currentStep === 0 && !showSajuInput && isCapturing) ||
    (mode === "group" && isCameraActive)
  ) {
    const stepInfo =
      mode === "personal"
        ? CAPTURE_STEPS[currentStep]
        : {
          title: "단체 사진 촬영",
          guide: "모든 인원이 잘 보이게 찍어주세요",
          overlay: null,
        };

    const hasCapturedImage = false; // Always false here because captured state is handled by confirmation view

    return (
      <div className="flex flex-col items-center justify-center w-full max-w-[95%] sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <GlassCard className="w-full aspect-[4/3] relative overflow-hidden flex flex-col items-center justify-center bg-black shadow-clay-lg rounded-[40px] border-[10px] border-white">
          {!hasCapturedImage ? (
            <div className="absolute inset-0">
              <FaceMeshWebcam
                onCapture={(img, metadata) => {
                  setCapturedImages((prev) => {
                    const newImages = [...prev];
                    if (mode === "personal") {
                      newImages[currentStep] = img;
                    } else {
                      newImages[0] = img;
                    }
                    return newImages;
                  });
                  if (metadata) {
                    setFaceMeshMetadata(metadata);
                  }
                  if (mode === "group") {
                    setIsGroupPhotoConfirming(true);
                  }
                }}
                onClose={() => {
                  setIsCapturing(false);
                  setIsCameraActive(false);
                }}
                onFaceCountChange={setDetectedCount}
                maxFaces={mode === "personal" ? 1 : 7}
                title="카메라를 3초간 응시해 주세요"
                themeColor={mode === "personal" ? "green" : "orange"}
                showFaceCount={mode === "group"}
                useEllipseGuide={mode === "personal"}
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

          {/* 개인/모임 공통: 움직이는 스캔 라인 (개인=green, 모임=orange) */}
          {isScanning && !hasCapturedImage && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className={`absolute left-0 right-0 h-1 opacity-60 ${
                  mode === "personal"
                    ? "bg-brand-green shadow-[0_0_15px_var(--brand-green)]"
                    : "bg-brand-orange shadow-[0_0_15px_var(--brand-orange)]"
                }`}
              />
            </div>
          )}

          {!hasCapturedImage && stepInfo.overlay && (
            <>{stepInfo.overlay}</>
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


          {/* Top Right Controls */}
          <div className="absolute top-6 right-6 flex gap-2 pointer-events-auto">
            {hasCapturedImage && (
              <button
                onClick={handleRetake}
                className={`${mode === "personal" ? "bg-brand-green hover:bg-brand-green/80" : "bg-brand-orange hover:bg-brand-orange/80"} text-white p-3 rounded-full transition-all shadow-lg`}
                title="다시 찍기"
              >
                <RefreshCcw size={24} />
              </button>
            )}
            
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
    <div className="flex flex-col items-center justify-center gap-4 w-full max-w-4xl mx-auto pb-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="w-full">
          <div className="w-full p-5 sm:p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-clay-md border-4 border-white relative">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange-muted rounded-full -mr-12 -mt-12 opacity-50 blur-2xl"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-3 relative z-10">
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-xl sm:text-2xl flex items-center gap-2 font-display">
                  <Users size={26} className="text-brand-orange shrink-0" />
                  멤버별 인적 사항 등록
                </h3>
                <p className="text-gray-500 mt-1 font-sans text-sm leading-relaxed break-keep">
                  각 멤버의 이름과 생년월일, 생시를
                  입력해주세요.
                </p>
              </div>
              <div className="flex items-center gap-3 self-end md:self-auto flex-wrap justify-end">
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

            <div className="space-y-4 relative z-10">
              <AnimatePresence>
                {groupMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start bg-white/60 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border-2 border-gray-100 shadow-md hover:shadow-lg hover:border-brand-orange/40 transition-all duration-300 relative group"
                    >
                      {/* Member Avatar Upload */}
                      <div className="shrink-0 flex flex-col items-center sm:items-start">
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-gray-50 transition-all duration-300 relative flex items-center justify-center ${member.avatar ? '' : 'cursor-pointer hover:scale-105 hover:shadow-xl'}`}
                          onClick={() => {
                            if (!member.avatar) {
                              document
                                .getElementById(`avatar-upload-${member.id}`)
                                ?.click();
                            }
                          }}
                        >
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt="Face"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5">
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                                <Camera size={20} />
                              </div>
                              <span className="text-[10px] font-bold text-center leading-tight">
                                얼굴 사진
                                <br />
                                비추기
                              </span>
                            </div>
                          )}
                          <input
                            type="file"
                            id={`avatar-upload-${member.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              handleMemberAvatarUpload(member.id, e)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
                        <div className="w-full">
                          <Input
                            placeholder="성함을 입력하세요."
                            className="h-10 w-full text-sm bg-white/90 border-2 border-gray-200 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all rounded-xl font-semibold px-3 placeholder:text-gray-400 shadow-sm"
                            value={member.name && !member.name.startsWith('멤버 ') ? member.name : ''}
                            onChange={(e) =>
                              updateGroupMember(
                                member.id,
                                "name",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start w-full min-w-0">
                          <div className="flex flex-col gap-1 w-full min-w-0">
                            <div className="min-h-[1.25rem] flex items-center">
                              <Label className="text-xs font-bold text-gray-700 ml-1">
                                생년월일
                              </Label>
                            </div>
                            <DatePicker
                              value={member.birthDate}
                              onChange={(value) => updateGroupMember(member.id, "birthDate", value)}
                              placeholder="YYYY.MM.DD"
                              themeColor="orange"
                              className="w-full"
                              maxDate={new Date()}
                            />
                          </div>
                          <div className="flex flex-col gap-1 w-full min-w-0">
                            <div className="min-h-[1.25rem] flex items-center">
                              <Label className="text-xs font-bold text-gray-700 ml-1">
                                성별
                              </Label>
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
                              className="w-full [&>button]:h-10"
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
                        </div>

                        <div className="flex flex-col gap-1 w-full min-w-0">
                          <div className="flex justify-between items-center min-h-[1.25rem]">
                            <Label className="text-xs font-bold text-gray-700 ml-1">
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
                            <div className="grid grid-cols-2 gap-2 w-full min-w-0 max-w-[50%]">
                              <div className="relative min-w-0">
                                <Clock
                                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange pointer-events-none z-10"
                                />
                                <Select
                                  value={
                                    member.birthTime
                                      ? parseInt(member.birthTime.split(":")[0], 10).toString()
                                      : "0"
                                  }
                                  onValueChange={(value) => {
                                    const currentTime = member.birthTime || "00:00";
                                    const [, minutes] = currentTime.split(":");
                                    const h = value.padStart(2, "0");
                                    updateGroupMember(
                                      member.id,
                                      "birthTime",
                                      `${h}:${minutes}`
                                    );
                                  }}
                                >
                                  <SelectTrigger className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-9 rounded-lg transition-all pl-8 pr-3 text-sm w-full min-w-0 [&>span]:!line-clamp-none">
                                    <SelectValue placeholder="시" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                      <SelectItem key={hour} value={hour.toString()}>
                                        {hour}시
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="relative min-w-0 flex-1">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="0"
                                  maxLength={2}
                                  value={(() => {
                                    if (!member.birthTime) return "";
                                    const [, minutes] = member.birthTime.split(":");
                                    return minutes;
                                  })()}
                                  onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                    const currentTime = member.birthTime || "00:00";
                                    const [hours] = currentTime.split(":");
                                    const num = v === "" ? 0 : parseInt(v, 10);
                                    const clamped = num > 59 ? "59" : v === "" ? "00" : v;
                                    updateGroupMember(
                                      member.id,
                                      "birthTime",
                                      `${hours}:${clamped}`
                                    );
                                  }}
                                  onBlur={() => {
                                    const currentTime = member.birthTime || "00:00";
                                    const [hours, min] = currentTime.split(":");
                                    const parsed = parseInt(min || "0", 10);
                                    const clamped = Math.min(59, Math.max(0, isNaN(parsed) ? 0 : parsed)).toString().padStart(2, "0");
                                    if (min !== clamped) {
                                      updateGroupMember(member.id, "birthTime", `${hours}:${clamped}`);
                                    }
                                  }}
                                  className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-9 rounded-lg transition-all w-full min-w-0 text-sm pl-3 pr-9"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                                  분
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full min-w-0">
                              <Clock
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10"
                              />
                              <div className="bg-gray-100/50 border-2 border-gray-100 h-9 rounded-lg flex items-center pl-9 text-gray-400 text-sm w-full">
                                시간 정보 없음
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <ActionButton
            variant="orange-primary"
            onClick={handleGroupAnalyze}
            disabled={!isReady}
            className={`w-full py-5 mt-4 transition-all duration-300 text-sm sm:text-base ${!isReady ? "opacity-50 grayscale cursor-not-allowed" : "animate-bounce-subtle"}`}
          >
            {isReady
              ? "모임 궁합 분석하기"
              : "모든 멤버의 정보(이름, 사진, 생년월일)를 입력해주세요"}
          </ActionButton>
        </div>
      </motion.div>
    </div>
  );
};