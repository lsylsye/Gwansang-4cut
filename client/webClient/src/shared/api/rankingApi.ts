/**
 * 랭킹 API — POST /api/db/ranking (등록), GET /api/db/ranking (조회)
 */

import { API_ENDPOINTS } from './config';

// ============================================================
// Types
// ============================================================

/** 랭킹 등록 요청 (단일 객체) */
export interface RankingRegisterRequest {
  score: number; // Long — 점수
  title: string; // 모임명
  numberOfMembers: number; // Long — 모임 인원수
  memberNames: { name: string }[];
}

/**
 * 랭킹 조회 응답 한 건 (GET /api/db/ranking 응답 배열 요소)
 * 리스트용 id/rank는 프론트에서 인덱스로 부여
 */
export interface RankingResponseItem {
  score: number;
  title: string;
  numberOfMembers: number;
  memberNames: { name: string }[];
}

// ============================================================
// API
// ============================================================

/**
 * 랭킹 등록
 * POST /api/db/ranking
 * Body: { score, title, numberOfMembers, memberNames: [{ name }] }
 */
export async function registerRanking(
  payload: RankingRegisterRequest
): Promise<void> {
  const url = API_ENDPOINTS.RANKING;
  if (import.meta.env.DEV) {
    console.log('[랭킹 등록] POST', url);
  }
  const response = await fetch(url, {
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
 * Response: [{ score, title, numberOfMembers, memberNames: [{ name }] }, ...]
 * @returns 랭킹 목록 배열 (점수 순 정렬은 백엔드 기준)
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
