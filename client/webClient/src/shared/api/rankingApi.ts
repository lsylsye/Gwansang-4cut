/**
 * 랭킹 API — POST /api/db/ranking (등록), GET /api/db/ranking (조회)
 */

import { API_ENDPOINTS } from './config';

// ============================================================
// Types
// ============================================================

/** 랭킹 등록 요청 (단일 객체) */
export interface RankingRegisterRequest {
  score: number; // Long
  title: string; // 모임명
  numberOfMembers: number; // Long
  memberNames: { name: string }[];
}

/** 랭킹 조회 응답 한 건 (백엔드 DTO) */
export interface RankingResponseItem {
  id?: string | number;
  score: number;
  title: string;
  numberOfMembers: number;
  memberNames: { name: string }[];
  rank?: number;
}

// ============================================================
// API
// ============================================================

/**
 * 랭킹 등록
 * POST /api/db/ranking
 * @param payload 랭킹 등록 데이터 (단일 객체)
 */
export async function registerRanking(
  payload: RankingRegisterRequest
): Promise<void> {
  const response = await fetch(API_ENDPOINTS.RANKING, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`랭킹 등록 실패: ${response.status} - ${errorText}`);
  }
}

/**
 * 랭킹 조회
 * GET /api/db/ranking
 * @returns 랭킹 목록 (점수 순 정렬은 백엔드 기준)
 */
export async function getRankings(): Promise<RankingResponseItem[]> {
  const response = await fetch(API_ENDPOINTS.RANKING, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`랭킹 조회 실패: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
