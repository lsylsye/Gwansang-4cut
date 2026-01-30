import type { AnalyzeMode } from "@/shared/types";

export const ROUTES = {
  HOME: "/",
  PERSONAL_UPLOAD: "/personal/upload",
  GROUP_UPLOAD: "/group/upload",
  PERSONAL_ANALYZING: "/personal/analyzing",
  GROUP_ANALYZING: "/group/analyzing",
  PERSONAL_RESULT: "/personal/result",
  GROUP_RESULT: "/group/result",
  PERSONAL_PHOTO_BOOTH: "/personal/photo-booth",
  GROUP_PHOTO_BOOTH: "/group/photo-booth",
  RANKING: "/ranking",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const getUploadPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_UPLOAD : ROUTES.GROUP_UPLOAD;

export const getAnalyzingPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_ANALYZING : ROUTES.GROUP_ANALYZING;

export const getResultPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_RESULT : ROUTES.GROUP_RESULT;

export const getPhotoBoothPath = (mode: AnalyzeMode) =>
  mode === "personal" ? ROUTES.PERSONAL_PHOTO_BOOTH : ROUTES.GROUP_PHOTO_BOOTH;

export const isPhotoBoothPath = (pathname: string) =>
  pathname === ROUTES.PERSONAL_PHOTO_BOOTH || pathname === ROUTES.GROUP_PHOTO_BOOTH;

export const isAnalyzingPath = (pathname: string) =>
  pathname === ROUTES.PERSONAL_ANALYZING || pathname === ROUTES.GROUP_ANALYZING;
