/**
 * API 엔드포인트 설정
 * - 모든 베이스 URL은 .env의 VITE_* 변수에서 로드 (미설정 시 기본값 사용).
 * - 경로 규칙:
 *   - /api/db   : DB 관련 (랭킹 저장·조회, 결과 저장·조회)
 *   - /api/face : 관상/사주 관련 (개인 관상, 모임 관상, 사주 분석, 오행 조합)
 *   - /api/image: 이미지 생성 관련
 *
 * .env 예시:
 *   VITE_API_BASE_URL=http://localhost:8080/api/db
 *   VITE_AI_SERVER_URL=http://localhost:8000/api/face
 *   VITE_IMAGE_SERVER_URL=http://localhost:8001/api/image
 */

// DB 서버 (랭킹 저장·조회, 결과 저장·조회) — 기본 /api/db
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/db";

// 관상/사주 서버 (개인·모임 관상, 사주 분석, 오행 조합) — 기본 /api/face
export const FACE_BASE_URL =
  import.meta.env.VITE_AI_SERVER_URL ?? "http://localhost:8000/api/face";

// 이미지 생성 서버 — 기본 /api/image
export const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_SERVER_URL ?? "http://localhost:8001/api/image";

/** DB 관련 (베이스: /api/db) — 랭킹 저장·조회, 결과 저장·조회 */
export const DB_ENDPOINTS = {
  BASE: API_BASE_URL,
  /** 랭킹 등록 POST /api/db/ranking */
  RANKING: `${API_BASE_URL}/ranking`,
} as const;

/** 관상/사주 관련 (베이스: /api/face) — 개인·모임 관상, 사주, 오행 조합 */
export const FACE_ENDPOINTS = {
  BASE: FACE_BASE_URL,
  /** 개인 관상 + 사주 통합 분석 (기존 단일 호환) */
  FACEMESH_PERSONAL: `${FACE_BASE_URL}/facemesh/personal`,
  /** 개인 관상 1차: 관상 + 취업만 빠르게 */
  FACEMESH_PERSONAL_FIRST: `${FACE_BASE_URL}/facemesh/personal/first`,
  /** 개인 관상 2차: 체질 + 웰스토리 메뉴 */
  FACEMESH_PERSONAL_SECOND: `${FACE_BASE_URL}/facemesh/personal/second`,
  /** 모임 관상 (단체 facemesh 전송·분석) */
  FACEMESH_GROUP: `${FACE_BASE_URL}/facemesh/group`,
  /** 모임 전체 궁합만 (전체 궁합 페이지 먼저 표시용) */
  FACEMESH_GROUP_OVERALL: `${FACE_BASE_URL}/facemesh/group/overall`,
  /** 모임 1:1 궁합만 (1:1 탭용, 별도 호출) */
  FACEMESH_GROUP_PAIRS: `${FACE_BASE_URL}/facemesh/group/pairs`,
  /** 사주 분석 (간단) */
  SAJU_ANALYZE: `${FACE_BASE_URL}/saju/analyze`,
  /** 모임 오행 조합 (RAG) */
  GROUP_OHENG_COMBINATION: `${FACE_BASE_URL}/group-oheng-combination`,
} as const;

/** 이미지 생성 관련 (베이스: /api/image) */
export const IMAGE_ENDPOINTS = {
  BASE: IMAGE_BASE_URL,
  UPLOAD: `${IMAGE_BASE_URL}/upload`,
} as const;

/** 통합 엔드포인트 (기존 호출부 호환용 — 코드에서는 API_ENDPOINTS 또는 도메인별 *_ENDPOINTS 사용) */
export const API_ENDPOINTS = {
  FACEMESH_PERSONAL: FACE_ENDPOINTS.FACEMESH_PERSONAL,
  FACEMESH_PERSONAL_FIRST: FACE_ENDPOINTS.FACEMESH_PERSONAL_FIRST,
  FACEMESH_PERSONAL_SECOND: FACE_ENDPOINTS.FACEMESH_PERSONAL_SECOND,
  FACEMESH_GROUP: FACE_ENDPOINTS.FACEMESH_GROUP,
  FACEMESH_GROUP_OVERALL: FACE_ENDPOINTS.FACEMESH_GROUP_OVERALL,
  FACEMESH_GROUP_PAIRS: FACE_ENDPOINTS.FACEMESH_GROUP_PAIRS,
  SAJU_ANALYZE: FACE_ENDPOINTS.SAJU_ANALYZE,
  GROUP_OHENG_COMBINATION: FACE_ENDPOINTS.GROUP_OHENG_COMBINATION,
  IMAGE_UPLOAD: IMAGE_ENDPOINTS.UPLOAD,
  RANKING: DB_ENDPOINTS.RANKING,
} as const;

/** .env VITE_AI_SERVER_URL과 1:1 대응 (기존명 호환) */
export const AI_SERVER_URL = FACE_BASE_URL;
/** .env VITE_IMAGE_SERVER_URL과 1:1 대응 (기존명 호환) */
export const IMAGE_SERVER_URL = IMAGE_BASE_URL;
