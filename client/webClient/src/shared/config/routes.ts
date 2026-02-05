import type { AnalyzeMode } from "@/shared/types";

export const ROUTES = {
  HOME: "/",
  PERSONAL_UPLOAD: "/personal/upload",
  GROUP_UPLOAD: "/group/upload",
  /** 모임 인적사항 등록 단계 (이름·사진·생년월일) — /group/upload에서 사진 등록 후 이동 */
  GROUP_UPLOAD_MEMBERS: "/group/upload/members",
  PERSONAL_ANALYZING: "/personal/analyzing",
  GROUP_ANALYZING: "/group/analyzing",
  PERSONAL_RESULT: "/personal/result",
  GROUP_RESULT: "/group/result",
  /** 싸피네컷(네컷) — 개인/모임 공통, mode는 location.state로 전달 */
  PHOTO_BOOTH: "/photo-booth",
  RANKING: "/ranking",
  /** 개인 분석 공유 결과 페이지 */
  PERSONAL_SHARE: "/personal/:uuid",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const getUploadPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_UPLOAD : ROUTES.GROUP_UPLOAD;

export const getAnalyzingPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_ANALYZING : ROUTES.GROUP_ANALYZING;

export const getResultPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_RESULT : ROUTES.GROUP_RESULT;

/** 네컷 페이지 경로 (개인/모임 동일). mode는 navigate 시 state로 전달 */
export const getPhotoBoothPath = (_mode?: AnalyzeMode) => ROUTES.PHOTO_BOOTH;

export const isPhotoBoothPath = (pathname: string) =>
  pathname === ROUTES.PHOTO_BOOTH;

export const isAnalyzingPath = (pathname: string) =>
  pathname === ROUTES.PERSONAL_ANALYZING || pathname === ROUTES.GROUP_ANALYZING;

export const isResultPath = (pathname: string) =>
  pathname === ROUTES.PERSONAL_RESULT || pathname === ROUTES.GROUP_RESULT;

/** 개인 분석 공유 페이지 여부 체크 (/personal/:uuid 형식) */
export const isPersonalSharePath = (pathname: string) =>
  /^\/personal\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pathname);