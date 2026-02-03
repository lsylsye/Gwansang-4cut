export const API_BASE_URL = 'http://localhost:8080';

// AI 서버 URL (FastAPI 서버 - Gemini/사주 분석 API)
export const VITE_SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  FACEMESH_PERSONAL: `${API_BASE_URL}/test-api/facemesh/personal`,
  FACEMESH_GROUP: `${API_BASE_URL}/test-api/facemesh/group`,
  SAJU_ANALYZE: `${VITE_SERVER_URL}/api/saju/analyze`,
  GROUP_OHENG_COMBINATION: `${VITE_SERVER_URL}/api/group-oheng-combination`,
} as const;
