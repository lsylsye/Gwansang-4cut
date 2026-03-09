import { useState, useRef, useCallback, type MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import type { GroupMember } from "@/types";
import type { SajuData } from "@/types";
import { analyzeGroupOverall, analyzeGroupPairs } from "@/services/faceAnalysisApi";
import {
  createGroupAnalysisPlaceholder,
  updateGroupAnalysis,
  type GroupAnalysisData,
} from "@/services/groupAnalysisApi";

/** overall API 응답과 저장용 overallAnalysis 호환 타입 */
type GroupOverallLike = NonNullable<GroupAnalysisData["overallAnalysis"]>;
/** pairs API 응답 항목 (name1/name2 또는 member1/member2, romance_lines 등) */
interface GroupPairInput {
  name1?: string;
  name2?: string;
  member1?: string;
  member2?: string;
  score?: number;
  reason?: string;
  summary?: string;
  strengths?: string[];
  cautions?: string[];
  tips?: string[];
  romanceLines?: string[];
  romance_lines?: string[];
}
import { ROUTES, isPhotoBoothPath, isResultPath } from "@/routes/routes";
import { devLog, devError } from "@/utils/logger";

/** 모임 궁합 API 응답 (members, overall, pairs). 결과 화면 렌더링용 */
export interface GroupAnalysisResultState {
  success: boolean;
  timestamp?: string;
  members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
  groupCombination?: string;
  overall?: unknown;
  pairs?: unknown[];
}

export interface UseGroupAnalysisFlowOptions {
  setIsAnalyzing: (v: boolean) => void;
  setAnalysisError: (v: string | null) => void;
  setAnalysisDone: (v: boolean) => void;
  setImages: (v: string[]) => void;
  setFeatures: (v: string[]) => void;
  setSaju: (v: SajuData) => void;
  setFaceMeshMetadata: (v: import("@/types").AnalysisMetadata) => void;
  setShowAnalysisCompleteToast: (v: boolean) => void;
  pathnameRef: MutableRefObject<string>;
}

/**
 * 모임 궁합 분석 플로우 전용 상태·ref·로직.
 * isAnalyzing, analysisError는 App과 공유하므로 options로 setter만 받음.
 */
export function useGroupAnalysisFlow(options: UseGroupAnalysisFlowOptions) {
  const navigate = useNavigate();
  const {
    setIsAnalyzing,
    setAnalysisError,
    setAnalysisDone,
    setImages,
    setFeatures,
    setSaju,
    setFaceMeshMetadata,
    setShowAnalysisCompleteToast,
    pathnameRef,
  } = options;

  /** 현재 분석 중인 그룹 분석 UUID */
  const [currentGroupUuid, setCurrentGroupUuid] = useState<string | null>(null);
  /** 모임 궁합 API 응답 */
  const [groupAnalysisResult, setGroupAnalysisResult] =
    useState<GroupAnalysisResultState | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userTeamName, setUserTeamName] = useState("");

  /** pairs API 결과를 overall 완료 전에 보관 (overall 도착 시 병합용) */
  const pairsResultRef = useRef<unknown[] | undefined>(undefined);

  const startGroupAnalysis = useCallback(
    async (
      capturedImages: string[],
      selectedFeatures: string[],
      sajuData: SajuData,
      members: GroupMember[],
      metadata?: import("@/types").AnalysisMetadata
    ) => {
      setAnalysisDone(false);
      setAnalysisError(null);
      setImages(capturedImages);
      setFeatures(selectedFeatures);
      setSaju(sajuData);
      setGroupMembers(members);
      setUserTeamName("기운찬 도사님들의 모임");
      setGroupAnalysisResult(null);
      if (metadata != null) setFaceMeshMetadata(metadata);
      setIsAnalyzing(true);

      if (!metadata || !metadata.groupMembers || (metadata.groupMembers as unknown[]).length < 2) {
        setAnalysisError("분석할 모임 데이터가 없습니다. 멤버 정보를 확인해 주세요.");
        setIsAnalyzing(false);
        return;
      }

      try {
        const uuid = await createGroupAnalysisPlaceholder();
        setCurrentGroupUuid(uuid);
        navigate(ROUTES.ANALYZING);

        const payload = {
          ...metadata,
          timestamp: (metadata as { timestamp?: string }).timestamp ?? new Date().toISOString(),
          groupMembers: metadata.groupMembers as unknown[],
        };

        const overallPromise = analyzeGroupOverall(payload);
        const pairsPromise = analyzeGroupPairs(payload);

        pairsResultRef.current = undefined;

        const pairsPromiseWithCallback = pairsPromise.then((pairsResult) => {
          devLog("📥 pairs 응답 수신:", pairsResult);
          if (pairsResult.success && "pairs" in pairsResult && Array.isArray(pairsResult.pairs)) {
            pairsResultRef.current = pairsResult.pairs;
            setGroupAnalysisResult((prev: GroupAnalysisResultState | null) =>
              prev
                ? { ...prev, pairs: pairsResult.pairs }
                : {
                    success: true,
                    timestamp: pairsResult.timestamp ?? "",
                    members: pairsResult.members ?? [],
                    pairs: pairsResult.pairs,
                  }
            );
          }
          return pairsResult;
        }).catch((err) => {
          devError("❌ pairs 분석 실패:", err);
          return { success: false, error: err };
        });

        const overallResult = await overallPromise;
        devLog("📥 overall 응답 수신:", overallResult);
        if (!overallResult.success || !("overall" in overallResult)) {
          setAnalysisError(
            "error" in overallResult ? overallResult.error : "전체 궁합 분석에 실패했습니다."
          );
          setIsAnalyzing(false);
          return;
        }

        const finalGroupResult: GroupAnalysisResultState = {
          success: true,
          timestamp: overallResult.timestamp ?? payload.timestamp ?? "",
          members: overallResult.members ?? [],
          overall: overallResult.overall,
          pairs: pairsResultRef.current ?? undefined,
        };
        setGroupAnalysisResult(finalGroupResult);

        setAnalysisDone(true);
        setIsAnalyzing(false);
        if (isPhotoBoothPath(pathnameRef.current)) {
          setShowAnalysisCompleteToast(true);
        } else {
          navigate(`/group/share/${uuid}`);
          if (!isResultPath(pathnameRef.current)) setShowAnalysisCompleteToast(true);
        }

        const apiMembers =
          (finalGroupResult.overall as GroupOverallLike)?.members || finalGroupResult.members || [];
        type ApiMemberWithRole = {
          role?: string;
          keywords?: string[];
          description?: string;
          strengths?: string[];
          warnings?: string[];
        };
        const mergedMembers = members.map((gm, idx) => {
          const apiMember = (apiMembers[idx] || {}) as ApiMemberWithRole;
          return {
            id: gm.id || idx + 1,
            name: gm.name,
            birthDate: gm.birthDate || "",
            birthTime: gm.birthTime || "",
            gender: gm.gender || "male",
            avatar: gm.avatar || "",
            role: apiMember.role || "",
            keywords: apiMember.keywords || [],
            description: apiMember.description || "",
            strengths: apiMember.strengths || [],
            warnings: apiMember.warnings || [],
          };
        });

        try {
          const initialSaveData: GroupAnalysisData = {
            teamName:
              (finalGroupResult.overall as GroupOverallLike)?.personality?.title || "모임 궁합 분석",
            memberCount: members.length,
            score: (finalGroupResult.overall as GroupOverallLike)?.compatibility?.score,
            members: mergedMembers,
            overallAnalysis: finalGroupResult.overall as GroupOverallLike,
            pairsAnalysis: [],
          };
          await updateGroupAnalysis(uuid, initialSaveData);
          devLog("✅ 그룹 분석 결과 DB 1차 저장 완료 (overall)");
        } catch (saveError) {
          devError("그룹 분석 결과 DB 1차 저장 실패:", saveError);
        }

        pairsPromiseWithCallback.then(async () => {
          const finalPairs = pairsResultRef.current;
          if (!finalPairs || !Array.isArray(finalPairs) || finalPairs.length === 0) {
            devLog("⚠️ pairs 데이터 없음, DB 업데이트 스킵");
            return;
          }
          try {
            const saveDataWithPairs: GroupAnalysisData = {
              teamName:
                (finalGroupResult.overall as GroupOverallLike)?.personality?.title || "모임 궁합 분석",
              memberCount: members.length,
              score: (finalGroupResult.overall as GroupOverallLike)?.compatibility?.score,
              members: mergedMembers,
              overallAnalysis: finalGroupResult.overall as GroupOverallLike,
              pairsAnalysis: (finalPairs as GroupPairInput[]).map((p) => ({
                name1: p.name1 || p.member1,
                name2: p.name2 || p.member2,
                score: p.score,
                reason: p.reason || "",
                summary: p.summary || "",
                strengths: p.strengths || [],
                cautions: p.cautions || [],
                tips: p.tips || [],
                romanceLines: p.romanceLines || p.romance_lines || [],
              })),
            };
            await updateGroupAnalysis(uuid, saveDataWithPairs);
            devLog("✅ 그룹 분석 결과 DB 2차 저장 완료 (pairs 포함)");
          } catch (pairsSaveError) {
            devError("그룹 분석 결과 DB pairs 저장 실패:", pairsSaveError);
          }
        });
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
        );
        setIsAnalyzing(false);
      }
    },
    [
      setAnalysisDone,
      setAnalysisError,
      setImages,
      setFeatures,
      setSaju,
      setFaceMeshMetadata,
      setIsAnalyzing,
      setShowAnalysisCompleteToast,
      pathnameRef,
      navigate,
    ]
  );

  return {
    currentGroupUuid,
    setCurrentGroupUuid,
    groupAnalysisResult,
    setGroupAnalysisResult,
    groupMembers,
    setGroupMembers,
    userTeamName,
    setUserTeamName,
    pairsResultRef,
    startGroupAnalysis,
  };
}
