import { useState, useRef, useEffect } from "react";
import { devError } from "@/utils/logger";
import { useLocation } from "react-router-dom";
import type { GroupMember, AnalysisMetadata, SajuData } from "@/types";
import { ROUTES } from "@/routes/routes";
import { useTurtleGuideState } from "@/contexts/TurtleGuideStateContext";
import {
  detectFacesAndCrop,
  analyzePersonalImage,
  analyzeGroupPhotoForApi,
  type GroupFaceMeshPayload,
} from "../utils/groupPhotoFaceDetection";

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface UseGroupUploadFlowOptions {
  pathname: string;
  onAnalyze: (
    images: string[],
    features: string[],
    sajuData: SajuData | null,
    groupMembers: GroupMember[],
    faceMeshMetadata?: AnalysisMetadata,
  ) => void;
  onNavigateToMembers?: (state?: { initialGroupMembers?: GroupMember[] }) => void;
  onNavigateToUpload?: () => void;
}

export function useGroupUploadFlow(options: UseGroupUploadFlowOptions) {
  const location = useLocation();
  const { pathname, onAnalyze, onNavigateToMembers, onNavigateToUpload } = options;
  const { setGroupUploadCameraVisible } = useTurtleGuideState();

  const groupFileInputRef = useRef<HTMLInputElement>(null);
  const appliedInitialGroupMembersRef = useRef(false);

  const [capturedImages, setCapturedImages] = useState<(string | null)[]>([null]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGroupPhotoConfirming, setIsGroupPhotoConfirming] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState<string | null>(null);
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<AnalysisMetadata>(null);
  const [groupUploadFaceMetadata, setGroupUploadFaceMetadata] = useState<GroupFaceMeshPayload | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [memberIdAnalyzing, setMemberIdAnalyzing] = useState<number | null>(null);
  const [memberAvatarErrorId, setMemberAvatarErrorId] = useState<number | null>(null);
  const [isUploadTypeModalOpen, setIsUploadTypeModalOpen] = useState(false);
  const [isIndividualPhotoUpload, setIsIndividualPhotoUpload] = useState(false);

  const updateGroupMember = (id: number, field: keyof GroupMember, value: string | number | boolean | undefined) => {
    setGroupMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const updateGroupMemberPatch = (id: number, patch: Partial<GroupMember>) => {
    setGroupMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  async function processGroupPhoto(photo: string) {
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
        setFaceDetectionError("얼굴을 인식하지 못했습니다. 다른 사진을 시도해 주세요.");
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true);
        return;
      }
      if (count === 1) {
        setFaceDetectionError("2명 이상의 얼굴이 필요합니다. 다시 촬영하거나 다른 사진을 업로드해 주세요.");
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true);
        return;
      }
      if (count > 7) {
        setFaceDetectionError("최대 7명까지만 인식 가능합니다. 7명 이하의 사진을 업로드해 주세요.");
        setIsSegmenting(false);
        setIsGroupPhotoConfirming(true);
        return;
      }

      setDetectedCount(count);
      const members: GroupMember[] = Array.from({ length: count }).map((_, i) => ({
        id: Date.now() + i,
        name: `멤버${i + 1}`,
        birthDate: getTodayDateString(),
        birthTime: "",
        gender: "male",
        avatar: crops[i] ?? "",
        birthTimeUnknown: false,
      }));
      setGroupMembers(members);
      setIsSegmenting(false);
      if (onNavigateToMembers) onNavigateToMembers({ initialGroupMembers: members });
      else setCurrentStep(3);
      analyzeGroupPhotoForApi(photo).then(setGroupUploadFaceMetadata).catch(() => {});
    } catch {
      setFaceDetectionError("얼굴 분석 중 오류가 발생했습니다.");
      setIsSegmenting(false);
      setIsGroupPhotoConfirming(true);
    }
  }

  useEffect(() => {
    if (isCameraActive) {
      setIsScanning(true);
    } else {
      setIsScanning(false);
      setDetectedCount(0);
    }
  }, [isCameraActive]);

  const handleGroupPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCapturedImages([result, null, null]);
        setIsUploadTypeModalOpen(false);
        setFaceDetectionError(null);
        processGroupPhoto(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    if (isGroupPhotoConfirming) {
      processGroupPhoto(capturedImages[0] || "");
    } else {
      setIsGroupPhotoConfirming(true);
    }
  };

  useEffect(() => {
    if (pathname !== ROUTES.GROUP_UPLOAD_MEMBERS) {
      appliedInitialGroupMembersRef.current = false;
      return;
    }
    const initial = location.state?.initialGroupMembers;
    if (Array.isArray(initial) && initial.length >= 2 && !appliedInitialGroupMembersRef.current) {
      setGroupMembers(initial);
      appliedInitialGroupMembersRef.current = true;
    }
  }, [pathname, location.state]);

  useEffect(() => {
    if (pathname !== ROUTES.GROUP_UPLOAD_MEMBERS || groupMembers.length >= 2) return;
    if (location.state?.initialGroupMembers?.length >= 2) return;
    if (onNavigateToUpload) onNavigateToUpload();
  }, [pathname, groupMembers.length, onNavigateToUpload, location.state?.initialGroupMembers]);

  useEffect(() => {
    setGroupUploadCameraVisible(isCameraActive);
  }, [isCameraActive, setGroupUploadCameraVisible]);

  const handleRetake = () => {
    setCapturedImages([null]);
    setFaceMeshMetadata(null);
    setGroupUploadFaceMetadata(null);
    setGroupMembers([]);
    setIsCameraActive(false);
    setIsIndividualPhotoUpload(false);
    setIsGroupPhotoConfirming(false);
    setFaceDetectionError(null);
    setCurrentStep(0);
    if (pathname === ROUTES.GROUP_UPLOAD_MEMBERS && onNavigateToUpload) onNavigateToUpload();
    if (groupFileInputRef.current) groupFileInputRef.current.value = "";
  };

  const removeGroupMember = (id: number) => {
    if (groupMembers.length <= 1) return;
    setGroupMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const addGroupMember = () => {
    if (groupMembers.length >= 7) return;
    const newMember: GroupMember = {
      id: Date.now(),
      name: `멤버${groupMembers.length + 1}`,
      birthDate: getTodayDateString(),
      birthTime: "",
      gender: "male",
      avatar: "",
      birthTimeUnknown: false,
    };
    setGroupMembers((prev) => [...prev, newMember]);
  };

  const handleMemberAvatarUpload = (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
            updateGroupMemberPatch(id, { avatar: crops[0] });
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
  };

  const handleGroupAnalyze = async () => {
    try {
      localStorage.removeItem("photoBoothSets_group");
    } catch (err) {
      devError("이전 촬영 데이터 삭제 실패:", err);
    }

    const membersWithoutAvatar = groupMembers.map((m) => {
      const { avatar, ...rest } = m;
      return {
        ...rest,
        birthTime: m.birthTimeUnknown ? "00:00" : (rest.birthTime?.trim() || "00:00"),
      };
    });

    let finalPayload: (GroupFaceMeshPayload & { groupMembers: typeof membersWithoutAvatar }) | null = null;

    if (faceMeshMetadata) {
      finalPayload = { ...faceMeshMetadata, groupMembers: membersWithoutAvatar } as GroupFaceMeshPayload & { groupMembers: typeof membersWithoutAvatar };
    } else if (groupUploadFaceMetadata) {
      finalPayload = { ...groupUploadFaceMetadata, groupMembers: membersWithoutAvatar };
    } else if (groupMembers.length >= 2 && groupMembers.every((m) => m.avatar)) {
      try {
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
      } catch (err) {
        devError("멤버 얼굴 분석 실패, 결과창으로 이동:", err);
      }
    }

    const validImages = capturedImages.filter((img): img is string => img !== null);
    onAnalyze(
      validImages,
      [],
      {
        birthDate: "",
        birthTime: "00:00",
        gender: "male",
        calendarType: "solar",
        birthTimeUnknown: false,
      },
      groupMembers,
      finalPayload ?? undefined,
    );
  };

  const hasValidBirthTime = (m: { birthTimeUnknown?: boolean; birthTime?: string }) =>
    m.birthTimeUnknown === true ||
    (Boolean(m.birthTime?.trim()) && (m.birthTime?.split(":")[1] ?? "").trim() !== "");

  const isReady =
    groupMembers.length >= 2 &&
    groupMembers.every(
      (m) =>
        m.name.trim() !== "" &&
        m.avatar &&
        m.birthDate !== "" &&
        hasValidBirthTime(m),
    );

  return {
    groupFileInputRef,
    capturedImages,
    setCapturedImages,
    currentStep,
    setCurrentStep,
    isCameraActive,
    setIsCameraActive,
    isGroupPhotoConfirming,
    setIsGroupPhotoConfirming,
    detectedCount,
    setDetectedCount,
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
    processGroupPhoto,
    handleGroupPhotoUpload,
    handleNextStep,
    handleRetake,
    addGroupMember,
    removeGroupMember,
    updateGroupMember,
    updateGroupMemberPatch,
    handleMemberAvatarUpload,
    handleGroupAnalyze,
    isReady,
    pathname,
    isSegmenting,
  };
}
