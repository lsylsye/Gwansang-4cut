import React, { useState, useEffect, useRef } from "react";
import "../styles/fonts.css";
import "../styles/theme.css";
import { useNavigate, useLocation, useSearchParams, Routes, Route } from "react-router-dom";
import { Layout } from "./layout/Layout";
import { LandingSection } from "@/features/landing/components/LandingSection";
import { UploadSection } from "@/features/upload/components/UploadSection";
import { AnalyzingSection } from "@/features/upload/components/AnalyzingSection";
import { AnalysisSection } from "@/features/personal/AnalysisSection";
import { SharedAnalysisSection } from "@/features/personal/SharedAnalysisSection";
import { GroupAnalysisSection } from "@/features/group/GroupAnalysisSection";
import { SharedGroupAnalysisSection } from "@/features/group/SharedGroupAnalysisSection";
import { RankingSection } from "@/features/ranking/components/RankingSection";
import { PhotoBoothSection } from "@/features/photo/components/PhotoBoothSection";
import { TurtleGuide } from "@/shared/components/TurtleGuide";
import { HideTurtleGuideProvider, useHideTurtleGuide } from "@/shared/contexts/HideTurtleGuideContext";
import { Toast } from "@/shared/components/Toast";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { AnimatePresence, motion } from "motion/react";
import { Trophy } from "lucide-react";
import logoImage from "@/assets/film.png";
import {
  AnalyzeMode,
  SajuData,
  GroupMember,
} from "@/shared/types";
import {
  ROUTES,
  getUploadPath,
  getAnalyzingPath,
  getResultPath,
  isPhotoBoothPath,
  isAnalyzingPath,
  isResultPath,
  isPersonalSharePath,
  isGroupSharePath,
} from "@/shared/config/routes";
import { 
  analyzeFace, 
  analyzeFaceFirstInitial,
  analyzeFaceFirstRemaining,
  analyzeFaceSecond,
  FaceAnalysisApiResponse,
  TotalReview,
  analyzeGroupOverall,
  analyzeGroupPairs,
} from "@/shared/api/faceAnalysisApi";
import {
  createPersonalAnalysisPlaceholder,
  updatePersonalAnalysis,
  PersonalAnalysisData,
} from "@/shared/api/personalAnalysisApi";
import {
  createGroupAnalysisPlaceholder,
  updateGroupAnalysis,
  GroupAnalysisData,
} from "@/shared/api/groupAnalysisApi";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<AnalyzeMode>("personal");
  const [images, setImages] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [saju, setSaju] = useState<SajuData | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [userTeamName, setUserTeamName] = useState("");
  const [groupScore, setGroupScore] = useState(88);
  const [fromAnalysis, setFromAnalysis] = useState(false);
  /** 모임 결과에서 랭킹 등록 완료 여부 (돌아왔을 때 '랭킹 보기' 버튼 표시용) */
  const [hasRegisteredRanking, setHasRegisteredRanking] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [frameImageState, setFrameImageState] = useState<string | null>(null);
  const [fromPhotoBoothState, setFromPhotoBoothState] = useState(false);
  
  // API 응답 상태 관리
  const [faceAnalysisResult, setFaceAnalysisResult] = useState<FaceAnalysisApiResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  /** first-remaining(인생회고·방향성·만남) 로딩 중 */
  const [loadingRemaining, setLoadingRemaining] = useState(false);
  /** second(체질·웰스토리) 로딩 중 */
  const [loadingConstitution, setLoadingConstitution] = useState(false);
  const [showAnalysisCompleteToast, setShowAnalysisCompleteToast] = useState(false);
  const [isPhotoBoothCapturing, setIsPhotoBoothCapturing] = useState(false);
  // faceMeshMetadata를 App에서 관리
  const [faceMeshMetadata, setFaceMeshMetadata] = useState<any>(null);
  /** 현재 분석 중인 개인 분석 UUID */
  const [currentPersonalUuid, setCurrentPersonalUuid] = useState<string | null>(null);
  /** 현재 분석 중인 그룹 분석 UUID */
  const [currentGroupUuid, setCurrentGroupUuid] = useState<string | null>(null);
  /** 모임 궁합 API 응답 (members, overall, pairs). API 연결 후 결과 화면에서 렌더링용 */
  const [groupAnalysisResult, setGroupAnalysisResult] = useState<{
    success: boolean;
    timestamp?: string;
    members: Array<{ id?: number; name: string; sajuInfo?: unknown }>;
    groupCombination?: string;
    overall?: unknown;
    pairs?: unknown[];
  } | null>(null);
  /** 개인 결과 페이지에서 선택된 탭 (TurtleGuide 탭별 멘트용) */
  const [personalResultTab, setPersonalResultTab] = useState<string | null>(null);
  /** 개인 업로드 페이지에서 사주 정보 입력 단계 표시 여부 (TurtleGuide 멘트용) */
  const [personalUploadSajuStep, setPersonalUploadSajuStep] = useState(false);
  /** 개인 업로드 페이지에서 사진 확인 단계(촬영 후·사주 입력 전) 표시 여부 (TurtleGuide 멘트용) */
  const [personalUploadConfirmStep, setPersonalUploadConfirmStep] = useState(false);
  /** 개인 업로드 페이지에서 카메라 촬영 뷰 표시 여부 (TurtleGuide: 촬영할 때만 삼라만상 멘트) */
  const [personalUploadCameraVisible, setPersonalUploadCameraVisible] = useState(false);
  /** 모임 업로드 페이지에서 실시간 촬영 뷰 표시 여부 (TurtleGuide: 최대 7명 안내) */
  const [groupUploadCameraVisible, setGroupUploadCameraVisible] = useState(false);
  /** 모임 결과 페이지에서 선택된 탭 (TurtleGuide 멘트용: overall | pairs) */
  const [groupResultTab, setGroupResultTab] = useState<"overall" | "pairs" | null>(null);
  const pathnameRef = useRef(location.pathname);
  /** 개인 관상 분석 중복 실행 방지 (한 번에 12개 LLM 생성 방지) */
  const personalAnalyzingRef = useRef(false);
  /** 1차 DB 저장 Promise — 링크 공유 시 "저장 완료" 될 때까지 기다리기 위해 보관 */
  const firstSavePromiseRef = useRef<Promise<void> | null>(null);

  // 결과 페이지 벗어나면 탭 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.PERSONAL_RESULT) setPersonalResultTab(null);
  }, [location.pathname]);

  // 개인 업로드 페이지 벗어나면 사주/확인/카메라 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.PERSONAL_UPLOAD) {
      setPersonalUploadSajuStep(false);
      setPersonalUploadConfirmStep(false);
      setPersonalUploadCameraVisible(false);
    }
  }, [location.pathname]);

  // 모임 업로드 페이지 벗어나면 실시간 촬영 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.GROUP_UPLOAD && location.pathname !== ROUTES.GROUP_UPLOAD_MEMBERS) {
      setGroupUploadCameraVisible(false);
    }
  }, [location.pathname]);

  // 모임 결과 페이지 벗어나면 탭 플래그 초기화
  useEffect(() => {
    if (location.pathname !== ROUTES.GROUP_RESULT) setGroupResultTab(null);
  }, [location.pathname]);

  // URL 변경 시 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // location.state 변경 감지
  useEffect(() => {
    if (location.state?.frameImage) {
      setFrameImageState(location.state.frameImage);
    }
    if (location.state?.fromPhotoBooth) {
      setFromPhotoBoothState(location.state.fromPhotoBooth);
    }
  }, [location.state]);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // /upload 진입 시 URL의 mode path와 state 동기화
  useEffect(() => {
    if (location.pathname === ROUTES.PERSONAL_UPLOAD) {
      setMode("personal");
    } else if (location.pathname === ROUTES.GROUP_UPLOAD || location.pathname === ROUTES.GROUP_UPLOAD_MEMBERS) {
      setMode("group");
    }
  }, [location.pathname]);

  const handleStart = (selectedMode: AnalyzeMode) => {
    setMode(selectedMode);
    navigate(getUploadPath(selectedMode));
  };

  const handleAnalyze = async (
    capturedImages: string[],
    selectedFeatures: string[],
    sajuData: SajuData,
    members?: GroupMember[],
    metadata?: any,
  ) => {
    const isGroupFlow = Boolean(members && members.length > 0);

    // 개인 모드: 중복 실행 방지 (한 번에 12개 LLM 생성되지 않도록)
    if (!isGroupFlow) {
      if (personalAnalyzingRef.current) return;
      personalAnalyzingRef.current = true;
    }

    setAnalysisDone(false);
    setAnalysisError(null);
    setFaceAnalysisResult(null);
    setImages(capturedImages);
    setFeatures(selectedFeatures);
    setSaju(sajuData);
    if (members) {
      setGroupMembers(members);
      setUserTeamName("기운찬 도사님들의 모임");
    }
    if (!isGroupFlow && metadata) {
      setFaceMeshMetadata(metadata);
    }
    if (isGroupFlow) {
      setGroupAnalysisResult(null);
      setFaceMeshMetadata(metadata ?? null);
    }

    // 개인 모드: placeholder 생성 후 analyzing 페이지로 이동, 분석 완료 후 UUID URL로 이동
    if (!isGroupFlow) {
      setIsAnalyzing(true);
      try {
        // 1. placeholder 생성하여 UUID 획득
        const uuid = await createPersonalAnalysisPlaceholder();
        setCurrentPersonalUuid(uuid);
        
        // 2. /analyzing 페이지로 이동 (분석중)
        navigate(ROUTES.ANALYZING);
        
        // 3. 분석 시작
        if (metadata?.faces && metadata.faces.length > 0) {
          const birthTime =
            sajuData.birthTimeUnknown
              ? ""
              : (sajuData.birthTime && String(sajuData.birthTime).trim()) || "00:00";
          const requestData = {
            timestamp: new Date().toISOString(),
            faces: metadata.faces,
            sajuData: {
              gender: sajuData.gender as "male" | "female",
              calendarType: sajuData.calendarType as "solar" | "lunar",
              birthDate: sajuData.birthDate,
              birthTime,
              birthTimeUnknown: sajuData.birthTimeUnknown,
            },
          };

          // ★ 3개 API 동시 호출 — first-initial(총평)만 await 후 즉시 결과 페이지, 나머지는 백그라운드 병합
          setLoadingRemaining(true);
          setLoadingConstitution(true);

          const firstInitialPromise = analyzeFaceFirstInitial(requestData);
          const firstRemainingPromise = analyzeFaceFirstRemaining(requestData);
          const secondPromise = analyzeFaceSecond(requestData);

          // --- 총평(first-initial)만 완료 대기 → 즉시 결과 페이지 이동 ---
          const initialResult = await firstInitialPromise;
          if (initialResult.error) {
            setAnalysisError(initialResult.error);
            setLoadingRemaining(false);
            setLoadingConstitution(false);
            setIsAnalyzing(false);
            personalAnalyzingRef.current = false;
            return;
          }

          const initialTotalReview: TotalReview = {
            faceOverview: initialResult.totalReview?.faceOverview,
          };
          setFaceAnalysisResult({
            stage1: initialResult.stage1,
            totalReview: initialTotalReview,
          });

          // 1차 DB 저장 (총평 + stage1만) — 백그라운드로 보냄 (await 하지 않음)
          // [확인용] 결과 페이지가 ~24초에 뜨는지, ~36초에 뜨는지 비교하려면:
          // - 이전: await updatePersonalAnalysis → 총평(24초) + DB저장(수 초) 후에만 navigate → 36초대
          // - 현재: DB 저장은 기다리지 않고, 총평 도착 직후 바로 결과 페이지로 이동.
          //   → 결과 페이지가 ~24초에 뜨면, 36초 지연의 원인이 1차 DB 저장이었던 것으로 확인됨.
          const saveData: PersonalAnalysisData = {
            faceAnalysis: {
              faceShape: initialResult.stage1?.faceAnalysis?.faceShape,
              forehead: initialResult.stage1?.faceAnalysis?.forehead,
              eyes: initialResult.stage1?.faceAnalysis?.eyes,
              nose: initialResult.stage1?.faceAnalysis?.nose,
              mouth: initialResult.stage1?.faceAnalysis?.mouth,
              chin: initialResult.stage1?.faceAnalysis?.chin,
              faceOverview: initialResult.totalReview?.faceOverview,
            },
            constitutionAnalysis: {
              sajuInfo: initialResult.stage1?.sajuInfo,
              totalReview: initialTotalReview,
            },
          };
          const firstSavePromise = updatePersonalAnalysis(uuid, saveData).catch((saveError) => {
            console.error('1차(총평) 분석 결과 DB 저장 실패:', saveError);
          });
          firstSavePromiseRef.current = firstSavePromise;

          // 총평만 도착했으므로 즉시 결과 페이지로 이동 (DB 저장 완료를 기다리지 않음)
          setAnalysisDone(true);
          setIsAnalyzing(false);
          personalAnalyzingRef.current = false;
          if (isPhotoBoothPath(pathnameRef.current)) {
            setShowAnalysisCompleteToast(true);
          } else {
            navigate(`/personal/${uuid}`);
          }

          // --- first-remaining: 인생회고·방향성·만남 백그라운드 병합 ---
          firstRemainingPromise.then(async (remainingResult) => {
            setLoadingRemaining(false);
            if (!remainingResult.success) {
              console.warn('나머지 관상(first-remaining) 분석 실패:', remainingResult.error);
              return;
            }
            setFaceAnalysisResult((prev: FaceAnalysisApiResponse | null) => {
              if (!prev) return prev;
              const next = {
                ...prev,
                totalReview: {
                  ...prev.totalReview,
                  lifeReview: remainingResult.totalReview?.lifeReview,
                  careerFortune: remainingResult.totalReview?.careerFortune,
                  meetingCompatibility: remainingResult.totalReview?.meetingCompatibility,
                },
              };
              updatePersonalAnalysis(uuid, {
                faceAnalysis: {
                  faceShape: prev.stage1?.faceAnalysis?.faceShape,
                  forehead: prev.stage1?.faceAnalysis?.forehead,
                  eyes: prev.stage1?.faceAnalysis?.eyes,
                  nose: prev.stage1?.faceAnalysis?.nose,
                  mouth: prev.stage1?.faceAnalysis?.mouth,
                  chin: prev.stage1?.faceAnalysis?.chin,
                  faceOverview: prev.totalReview?.faceOverview,
                  careerFortune: remainingResult.totalReview?.careerFortune,
                  lifeReview: remainingResult.totalReview?.lifeReview,
                  meetingCompatibility: remainingResult.totalReview?.meetingCompatibility,
                },
                constitutionAnalysis: {
                  sajuInfo: prev.stage1?.sajuInfo,
                  totalReview: next.totalReview,
                },
              }).catch((err) => console.error('나머지 관상 DB 저장 실패:', err));
              return next;
            });
          }).catch((err) => {
            setLoadingRemaining(false);
            console.error('나머지 관상 처리 오류:', err);
          });

          // --- second: 체질 + 웰스토리 백그라운드 병합 ---
          secondPromise.then(async (secondResult) => {
            setLoadingConstitution(false);
            if (!secondResult.success) {
              console.warn('2차(체질/메뉴) 분석 실패:', secondResult.error);
              return;
            }
            setFaceAnalysisResult((prev: FaceAnalysisApiResponse | null) => {
              if (!prev) return prev;
              const next = {
                ...prev,
                totalReview: {
                  ...prev.totalReview,
                  constitutionSummary: secondResult.totalReview?.constitutionSummary,
                  welstoryMenus: secondResult.totalReview?.welstoryMenus,
                  recommendedMenu: secondResult.totalReview?.recommendedMenu,
                },
              };
              updatePersonalAnalysis(uuid, {
                faceAnalysis: {
                  faceShape: prev.stage1?.faceAnalysis?.faceShape,
                  forehead: prev.stage1?.faceAnalysis?.forehead,
                  eyes: prev.stage1?.faceAnalysis?.eyes,
                  nose: prev.stage1?.faceAnalysis?.nose,
                  mouth: prev.stage1?.faceAnalysis?.mouth,
                  chin: prev.stage1?.faceAnalysis?.chin,
                  faceOverview: prev.totalReview?.faceOverview,
                  careerFortune: prev.totalReview?.careerFortune,
                  lifeReview: prev.totalReview?.lifeReview,
                  meetingCompatibility: prev.totalReview?.meetingCompatibility,
                },
                constitutionAnalysis: {
                  sajuInfo: prev.stage1?.sajuInfo,
                  totalReview: next.totalReview,
                },
              }).catch((err) => console.error('체질/메뉴 DB 저장 실패:', err));
              return next;
            });
          }).catch((err) => {
            setLoadingConstitution(false);
            console.error('2차 분석 처리 오류:', err);
          });
        } else {
          setAnalysisError("얼굴 분석 데이터가 없습니다. 다시 촬영해주세요.");
          setIsAnalyzing(false);
          personalAnalyzingRef.current = false;
        }
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        setIsAnalyzing(false);
        personalAnalyzingRef.current = false;
      }
      return;
    }

    // 그룹 모드: placeholder 생성 후 analyzing 페이지로 이동, 분석 완료 후 UUID URL로 이동
    setIsAnalyzing(true);
    (async () => {
      if (!metadata || !metadata.groupMembers || (metadata.groupMembers as unknown[]).length < 2) {
        setAnalysisError("분석할 모임 데이터가 없습니다. 멤버 정보를 확인해 주세요.");
        setIsAnalyzing(false);
        return;
      }
      
      try {
        // 1. placeholder 생성하여 UUID 획득
        const uuid = await createGroupAnalysisPlaceholder();
        setCurrentGroupUuid(uuid);
        
        // 2. /analyzing 페이지로 이동 (분석중)
        navigate(ROUTES.ANALYZING);
        
        const payload = {
          ...metadata,
          timestamp: (metadata as { timestamp?: string }).timestamp ?? new Date().toISOString(),
        };

        // 개인 관상(analyzeFace)처럼 단일 API 함수로 병렬 호출
        const overallPromise = analyzeGroupOverall(payload);
        const pairsPromise = analyzeGroupPairs(payload);

        // pairs 결과를 보관 (overall 완료 시점에 이미 와 있으면 병합용, 나중에 오면 state만 갱신)
        const pairsResultRef: { current: unknown[] | undefined } = { current: undefined };

        // 1:1 궁합 완료 시 ref에 저장 + state 반영 (overall보다 먼저 와도 알림은 안 띄움)
        const pairsPromiseWithCallback = pairsPromise.then((pairsResult) => {
          console.log('📥 pairs 응답 수신:', pairsResult);
          if (pairsResult.success && "pairs" in pairsResult && Array.isArray(pairsResult.pairs)) {
            pairsResultRef.current = pairsResult.pairs;
            setGroupAnalysisResult((prev) =>
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
          console.error('❌ pairs 분석 실패:', err);
          return { success: false, error: err };
        });

        // overall만 도착하면 분석 완료로 간주 → 알림 표시 및 결과 페이지 이동 (pairs는 기다리지 않음)
        const overallResult = await overallPromise;
        console.log('📥 overall 응답 수신:', overallResult);
        if (!overallResult.success || !("overall" in overallResult)) {
          setAnalysisError("error" in overallResult ? overallResult.error : "전체 궁합 분석에 실패했습니다.");
          setIsAnalyzing(false);
          return;
        }

        const finalGroupResult = {
          success: true,
          timestamp: overallResult.timestamp ?? payload.timestamp ?? "",
          members: overallResult.members ?? [],
          overall: overallResult.overall,
          // pairs가 아직 안 왔으면 undefined → 결과 페이지에서 "1:1 궁합 분석 중..." 표시
          pairs: pairsResultRef.current ?? undefined,
        };
        
        setGroupAnalysisResult(finalGroupResult);
        
        // 먼저 UI 이동 처리 (pairs 기다리지 않음)
        setAnalysisDone(true);
        setIsAnalyzing(false);
        // 사진부스에 있으면 자동 이동하지 않고 토스트만 표시 (사진 선택·저장 후 결과 보기 가능)
        if (isPhotoBoothPath(pathnameRef.current)) {
          setShowAnalysisCompleteToast(true);
        } else {
          navigate(`/group/share/${uuid}`);
          if (!isResultPath(pathnameRef.current)) setShowAnalysisCompleteToast(true);
        }
        
        // 3. 분석 완료 - DB에 결과 업데이트 
        // overall 먼저 저장 (pairs 없이)
        const apiMembers = (finalGroupResult.overall as any)?.members || finalGroupResult.members || [];
        const mergedMembers = groupMembers.map((gm, idx) => {
          const apiMember = apiMembers[idx] || {};
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
        
        // overall만 먼저 저장
        try {
          const initialSaveData: GroupAnalysisData = {
            teamName: (finalGroupResult.overall as any)?.personality?.title || '모임 궁합 분석',
            memberCount: groupMembers.length,
            score: (finalGroupResult.overall as any)?.compatibility?.score,
            members: mergedMembers,
            overallAnalysis: finalGroupResult.overall as any,
            pairsAnalysis: [], // 일단 빈 배열
          };
          await updateGroupAnalysis(uuid, initialSaveData);
          console.log('✅ 그룹 분석 결과 DB 1차 저장 완료 (overall)');
        } catch (saveError) {
          console.error('그룹 분석 결과 DB 1차 저장 실패:', saveError);
        }
        
        // pairs 완료 후 DB 업데이트
        pairsPromiseWithCallback.then(async () => {
          const finalPairs = pairsResultRef.current;
          if (!finalPairs || !Array.isArray(finalPairs) || finalPairs.length === 0) {
            console.log('⚠️ pairs 데이터 없음, DB 업데이트 스킵');
            return;
          }
          
          try {
            const saveDataWithPairs: GroupAnalysisData = {
              teamName: (finalGroupResult.overall as any)?.personality?.title || '모임 궁합 분석',
              memberCount: groupMembers.length,
              score: (finalGroupResult.overall as any)?.compatibility?.score,
              members: mergedMembers,
              overallAnalysis: finalGroupResult.overall as any,
              pairsAnalysis: finalPairs.map((p: any) => ({
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
            console.log('✅ 그룹 분석 결과 DB 2차 저장 완료 (pairs 포함)');
          } catch (pairsSaveError) {
            console.error('그룹 분석 결과 DB pairs 저장 실패:', pairsSaveError);
          }
        });
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        setIsAnalyzing(false);
      }
    })();
  };

  const handleViewRanking = (score?: number, _name?: string) => {
    if (score !== undefined) setGroupScore(score);
    setUserTeamName(""); // 랭킹 등록 시 팀명은 빈 칸으로 (분석 결과 문구 안 불러옴)
    setFromAnalysis(true);
    navigate(ROUTES.RANKING);
  };

  /** 이미 랭킹 등록된 상태에서 '랭킹 보기' 클릭 시 — 등록 폼 없이 목록만 표시 */
  const handleViewRankingViewOnly = () => {
    setFromAnalysis(false);
    navigate(ROUTES.RANKING);
  };

  const handleRestart = () => {
    setImages([]);
    setFeatures([]);
    setSaju(null);
    setGroupMembers([]);
    setGroupAnalysisResult(null);
    setAnalysisDone(false);
    setHasRegisteredRanking(false);
    navigate(ROUTES.HOME);
  };

  const pathname = location.pathname;
  /** 네컷 페이지에서 사용할 모드 (진입 시 state로 전달, 없으면 personal) */
  const photoBoothMode: AnalyzeMode =
    (location.state as { mode?: AnalyzeMode } | null)?.mode ?? "personal";

  const getGuideMessage = () => {
    // 분석 중인 경우 (UUID 기반 URL에서 분석 진행 중)
    if (isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname))) {
      return "기다리는 동안 심심하지 않게 작은 선물을 준비했소. \n아래 버튼으로 가 보시게.";
    }
    // 공유 페이지인 경우
    if (isPersonalSharePath(pathname)) {
      return "허허, 누군가의 관상 분석 결과를 보러 왔구먼! \n자네도 한번 분석받아 보고 싶지 않은가?";
    }
    
    switch (pathname) {
      case ROUTES.HOME:
        return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
      case ROUTES.PERSONAL_UPLOAD:
        if (personalUploadSajuStep) return "태어난 시간을 안다면 더 정확하게 \n분석해 줄 수 있다네. 아는 대로 골라 넣어 주시게.";
        if (personalUploadCameraVisible) return "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다.";
        return "허허, 개인 관상을 보러오셨구먼. \n깨끗이 잘 나온 사진 하나 건네보시오.";
      case ROUTES.GROUP_UPLOAD:
        if (groupUploadCameraVisible) return "이 거울에는 최대 7명까지 비춰질 수 있네. \n모두가 잘 보이게 모여 보게.";
        return "허허, 모임 궁합을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
      case ROUTES.GROUP_UPLOAD_MEMBERS:
        return "이제 각 멤버의 이름과 생년월일을 입력해 주게. \n태어난 시간을 안다면 더 정확한 궁합을 알 수 있을 걸세.";
      case ROUTES.ANALYZING:
        return "기다리는 동안 심심하지 않게 작은 선물을 준비했소. \n아래 버튼으로 가 보시게.";
      case ROUTES.PERSONAL_RESULT: {
        const tab = personalResultTab ?? "physiognomy";
        if (tab === "constitution") return "자네의 체질과 오행을 살펴보는 구간이구먼. \n사주에 맞는 음식과 기운을 내가 짚어 보았네. \n꼭 챙겨 먹게나.";
        if (tab === "future") return "미래의 자네 모습을 그려 보는 구간이야. \n10년에서 50년 후까지, 얼굴이 어떻게 변할지 \n한번 구경해 보시게.";
        if (tab === "ssafy-cut") return "싸피네컷이구먼! \n사진을 찍어서 프레임에 담아 두었나? \n없다면 어서 찍으러 가 보시게.";
        return "허허! 관상이란 타고난 얼굴만 보는 것이 아니오. \n 자네가 걸어온 시간과 마음이 비춰지는 법이지. \n자, 이제 결과를 한 번 보세나.";
      }
      case ROUTES.GROUP_RESULT:
        if (groupResultTab === "pairs") return "원하는 상대를 클릭하면 세부 궁합을\n확인할 수 있다네. 어서 클릭해 보시게.";
        return "오호라, 이 모임의 기운이 보통이 아니구먼.\n모임 전체부터 일대일 궁합까지 정리해 두었네.\n자, 찬찬히 읽어보시게.";
      case ROUTES.RANKING:
        return "허허, 전국 방방곡곡의 인연들이 다 모였구먼! \n자네들의 모임은 과연 몇 번째 기운을 가졌을꼬?";
      case ROUTES.PHOTO_BOOTH:
        return "허허, 사진 네컷을 찍는구먼! \n기다리는 동안 즐거운 추억을 남기게나.";
      default:
        return "";
    }
  };

  const isPhotoBooth = isPhotoBoothPath(pathname);
  const shouldHideHeader = isPhotoBooth && isPhotoBoothCapturing;

  return (
    <Layout pathname={pathname}>
      <HideTurtleGuideProvider>
      {!shouldHideHeader && (
        <header className="w-full h-16 px-6 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div
          className="flex items-center gap-0.5 cursor-pointer"
          onClick={() => navigate(ROUTES.HOME)}
        >
          <img
            src={logoImage}
            alt="Logo"
            className="h-8 object-contain"
          />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight font-display">
            관상네컷
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Ranking Button */}
          <button
            onClick={() => {
              setFromAnalysis(false);
              navigate(ROUTES.RANKING);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-gray-50 transition-all font-bold text-gray-900 text-sm shadow-sm hover:shadow-md border border-gray-200"
          >
            <Trophy className="w-4 h-4" />
            모임 랭킹
          </button>
        </div>
      </header>
      )}

      <main className="flex-grow w-full relative">
        <div
          className={`container mx-auto py-8 min-h-[calc(100vh-64px)] ${pathname === ROUTES.GROUP_RESULT ? "px-0" : "px-4"}`}
        >
          <AnimatePresence mode="wait">
            {pathname === ROUTES.HOME && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <LandingSection onStart={handleStart} />
              </motion.div>
            )}

            {(pathname === ROUTES.PERSONAL_UPLOAD || pathname === ROUTES.GROUP_UPLOAD || pathname === ROUTES.GROUP_UPLOAD_MEMBERS) && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <UploadSection
                  mode={mode}
                  pathname={pathname}
                  onAnalyze={handleAnalyze}
                  isPersonalAnalyzing={isAnalyzing}
                  onNavigateToMembers={(state) => navigate(ROUTES.GROUP_UPLOAD_MEMBERS, { state: state ?? {} })}
                  onNavigateToUpload={() => navigate(ROUTES.GROUP_UPLOAD)}
                  onSajuInputVisible={setPersonalUploadSajuStep}
                  onPersonalConfirmStepVisible={setPersonalUploadConfirmStep}
                  onPersonalCameraVisible={setPersonalUploadCameraVisible}
                  onGroupCameraVisible={setGroupUploadCameraVisible}
                />
              </motion.div>
            )}

            {pathname === ROUTES.ANALYZING && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <AnalyzingSection
                  isAnalyzing={isAnalyzing}
                  analysisError={analysisError}
                  analysisComplete={analysisDone}
                  onRetry={() => {
                    // 재시도: upload 페이지로 돌아가기
                    setAnalysisError(null);
                    navigate(getUploadPath(mode));
                  }}
                />
              </motion.div>
            )}

            {/* 모임 궁합 분석하기 결과창: PERSONAL_RESULT뿐 아니라 GROUP_RESULT도 포함해야 /group/result에서 화면이 렌더됨 (git pull 후 조건이 PERSONAL_RESULT만 있으면 결과창 안 나옴) */}
            {(pathname === ROUTES.PERSONAL_RESULT || pathname === ROUTES.GROUP_RESULT) && (
              <motion.div
                key={pathname === ROUTES.GROUP_RESULT ? "group-result" : "personal-result"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {pathname === ROUTES.GROUP_RESULT ? (
                  <GroupAnalysisSection
                    groupMembers={groupMembers}
                    groupAnalysisResult={groupAnalysisResult}
                    isAnalyzing={isAnalyzing}
                    onViewRanking={handleViewRanking}
                    onViewRankingViewOnly={handleViewRankingViewOnly}
                    hasRegisteredRanking={hasRegisteredRanking}
                    onTabChange={setGroupResultTab}
                    onNavigateToPhotoBooth={() =>
                      navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "group" } })
                    }
                    analysisUuid={currentGroupUuid}
                  />
                ) : (
                  <AnalysisSection
                    images={images}
                    onRestart={handleRestart}
                    onTabChange={setPersonalResultTab}
                    onNavigateToPhotoBooth={() =>
                      navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode } })
                    }
                    frameImage={frameImageState || location.state?.frameImage}
                    fromPhotoBooth={fromPhotoBoothState || location.state?.fromPhotoBooth}
                    faceAnalysisResult={faceAnalysisResult?.stage1}
                    totalReview={faceAnalysisResult?.totalReview}
                    isLoading={isAnalyzing}
                    loadingRemaining={loadingRemaining}
                    loadingConstitution={loadingConstitution}
                    analysisUuid={currentPersonalUuid}
                    ensureSavedForShare={() => firstSavePromiseRef.current ?? Promise.resolve()}
                  />
                )}
              </motion.div>
            )}

            {pathname === ROUTES.RANKING && (
              <motion.div
                key="ranking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <RankingSection
                  onBack={() => navigate(ROUTES.GROUP_RESULT)}
                  userScore={groupScore}
                  initialTeamName={userTeamName}
                  fromAnalysis={fromAnalysis}
                  memberNames={groupMembers.map((m) => m.name).filter(Boolean)}
                  onRankingRegistered={() => setHasRegisteredRanking(true)}
                />
              </motion.div>
            )}

            {/* 개인 분석 공유 결과 페이지 */}
            {isPersonalSharePath(pathname) && (
              <motion.div
                key="shared-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {/* 현재 분석 중인 본인의 페이지인 경우 */}
                {currentPersonalUuid && pathname === `/personal/${currentPersonalUuid}` ? (
                  isAnalyzing ? (
                    <AnalyzingSection
                      isAnalyzing={isAnalyzing}
                      analysisError={analysisError}
                      analysisComplete={analysisDone}
                      onRetry={() => {
                        setAnalysisError(null);
                        setCurrentPersonalUuid(null);
                        navigate(getUploadPath("personal"));
                      }}
                    />
                  ) : analysisDone && faceAnalysisResult ? (
                    <AnalysisSection
                      images={images}
                      onRestart={handleRestart}
                      onTabChange={setPersonalResultTab}
                      onNavigateToPhotoBooth={() =>
                        navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "personal" } })
                      }
                      frameImage={frameImageState || location.state?.frameImage}
                      fromPhotoBooth={fromPhotoBoothState || location.state?.fromPhotoBooth}
                      faceAnalysisResult={faceAnalysisResult?.stage1}
                      totalReview={faceAnalysisResult?.totalReview}
                      isLoading={false}
                      loadingRemaining={loadingRemaining}
                      loadingConstitution={loadingConstitution}
                      analysisUuid={currentPersonalUuid}
                      ensureSavedForShare={() => firstSavePromiseRef.current ?? Promise.resolve()}
                    />
                  ) : (
                    <SharedAnalysisSection />
                  )
                ) : (
                  <SharedAnalysisSection />
                )}
              </motion.div>
            )}

            {/* 단체 분석 공유 결과 페이지 */}
            {isGroupSharePath(pathname) && (
              <motion.div
                key="shared-group-result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {/* 현재 분석 중인 본인의 페이지인 경우 */}
                {currentGroupUuid && pathname === `/group/share/${currentGroupUuid}` ? (
                  isAnalyzing ? (
                    <AnalyzingSection
                      isAnalyzing={isAnalyzing}
                      analysisError={analysisError}
                      analysisComplete={analysisDone}
                      onRetry={() => {
                        setAnalysisError(null);
                        setCurrentGroupUuid(null);
                        navigate(getUploadPath("group"));
                      }}
                    />
                  ) : analysisDone && groupAnalysisResult ? (
                    <GroupAnalysisSection
                      groupMembers={groupMembers}
                      groupAnalysisResult={groupAnalysisResult}
                      isAnalyzing={false}
                      onViewRanking={handleViewRanking}
                      onViewRankingViewOnly={handleViewRankingViewOnly}
                      hasRegisteredRanking={hasRegisteredRanking}
                      onTabChange={setGroupResultTab}
                      onNavigateToPhotoBooth={() =>
                        navigate(ROUTES.PHOTO_BOOTH, { state: { from: "result", mode: "group" } })
                      }
                      analysisUuid={currentGroupUuid}
                    />
                  ) : (
                    <SharedGroupAnalysisSection />
                  )
                ) : (
                  <SharedGroupAnalysisSection />
                )}
              </motion.div>
            )}

            {pathname === ROUTES.PHOTO_BOOTH && (
              <motion.div
                key="photo-booth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <PhotoBoothSection
                  mode={photoBoothMode}
                  analysisDone={analysisDone}
                  onNavigateToResult={() => navigate(getResultPath(photoBoothMode))}
                  onStepChange={(isCapturing) => setIsPhotoBoothCapturing(isCapturing)}
                  onBack={() => {
                    if (analysisDone) {
                      navigate(getResultPath(photoBoothMode));
                    } else {
                      navigate(getAnalyzingPath(photoBoothMode));
                    }
                  }}
                  onComplete={(photos) => {
                    const storageKey =
                      photoBoothMode === "personal"
                        ? "photoBoothSets_personal"
                        : "photoBoothSets_group";
                    const newSet = {
                      id: Date.now().toString(),
                      photos: photos,
                      createdAt: new Date().toISOString(),
                    };
                    const existing = JSON.parse(
                      localStorage.getItem(storageKey) || "[]"
                    );
                    existing.unshift(newSet);
                    const toSave = existing.slice(0, 1);
                    try {
                      localStorage.setItem(storageKey, JSON.stringify(toSave));
                    } catch {
                      // QuotaExceededError 등: 저장 실패해도 진행 (갤러리 미반영)
                    }
                    if (analysisDone) {
                      navigate(getResultPath(photoBoothMode));
                    } else {
                      navigate(getAnalyzingPath(photoBoothMode));
                    }
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Global Floating Turtle Guide (체질 분석 탭에서는 숨김) */}
      <TurtleGuideGate
        pathname={pathname}
        getGuideMessage={getGuideMessage}
        isPhotoBooth={isPhotoBooth}
        isAnalyzing={isAnalyzing}
        photoBoothAction={
          (pathname === ROUTES.ANALYZING || (isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname))))
            ? {
                label: "네컷 사진 찍기",
                onClick: () =>
                  navigate(ROUTES.PHOTO_BOOTH, {
                    state: { from: "analyzing", mode },
                  }),
              }
            : undefined
        }
      />

      {/* 관상 분석 완료 Toast - success 응답 시 photo booth 에서만 표시 */}
      <Toast
        message="관상 분석이 완료되었습니다. 결과를 확인하시겠어요?"
        isOpen={showAnalysisCompleteToast && isPhotoBoothPath(pathname)}
        onClose={() => setShowAnalysisCompleteToast(false)}
        onAction={() => {
          if (analysisDone) {
            navigate(getResultPath(photoBoothMode));
            setShowAnalysisCompleteToast(false);
          }
        }}
        type="success"
        variant="morphism"
        duration={10000}
      />
      </HideTurtleGuideProvider>
    </Layout>
  );
}

function TurtleGuideGate({
  pathname,
  getGuideMessage,
  isPhotoBooth,
  isAnalyzing,
  photoBoothAction,
}: {
  pathname: string;
  getGuideMessage: () => string;
  isPhotoBooth: boolean;
  isAnalyzing?: boolean;
  photoBoothAction?: { label: string; onClick: () => void };
}) {
  const { hideTurtleGuide } = useHideTurtleGuide();
  if (isPhotoBooth) return null;
  // /analyzing 또는 분석 중인 UUID 페이지에서는 토글 닫아둔 상태여도 무조건 TurtleGuide 표시
  const isAnalyzingOnSharePath = isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname));
  if (hideTurtleGuide && pathname !== ROUTES.ANALYZING && !isAnalyzingOnSharePath) return null;
  return (
    <TurtleGuide
      pathname={pathname}
      message={getGuideMessage()}
      isThinking={isAnalyzingPath(pathname) || isAnalyzingOnSharePath}
      thinkingMessage={
        (pathname === ROUTES.ANALYZING || isAnalyzingOnSharePath)
          ? "기다리는 동안 심심하지 않게 작은 선물을 준비했소.\n아래 버튼으로 가 보시게."
          : undefined
      }
      actionLabel={photoBoothAction?.label}
      onAction={photoBoothAction?.onClick}
      disableAutoClose={pathname === ROUTES.ANALYZING || isAnalyzingOnSharePath}
    />
  );
}