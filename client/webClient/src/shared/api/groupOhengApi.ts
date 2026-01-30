import { API_ENDPOINTS } from './config';
import type { FiveElements } from '@/shared/types';

export interface GroupOhengMemberPayload {
  name: string;
  fiveElements: FiveElements;
}

export interface SupplementPair {
  fromName: string;
  toName: string;
  element: string;
  elementLabel: string;
  explanation: string;
}

export interface ConflictPair {
  name1: string;
  name2: string;
  element: string;
  elementLabel: string;
  explanation: string;
}

export interface GroupOhengCombinationResponse {
  success: boolean;
  supplement: SupplementPair[];
  conflict: ConflictPair[];
  summary: string | null;
}

/**
 * 모임 관상 결과용 오행 조합 분석 (RAG 활용)
 * - 기운 채워줌: 한 사람은 해당 오행 많음, 다른 사람은 없음 → 채워 주는 관계
 * - 상충: 두 사람 모두 같은 오행 많음 → 같은 기운이라 상충
 */
export async function fetchGroupOhengCombination(
  members: GroupOhengMemberPayload[]
): Promise<GroupOhengCombinationResponse> {
  const res = await fetch(API_ENDPOINTS.GROUP_OHENG_COMBINATION, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ members }),
  });

  if (!res.ok) {
    throw new Error(`모임 오행 조합 요청 실패: ${res.status}`);
  }

  const data = (await res.json()) as GroupOhengCombinationResponse;
  return data;
}
