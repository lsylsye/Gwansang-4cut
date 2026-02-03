// Spring Boot 서버 URL (환경변수 또는 기본값)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/db';

// 관상/사주 분석용 AI 서버 URL (FastAPI 서버 - Gemini/사주 분석 API)
export const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000/api/face';

// Image 서버 URL (Gemini 이미지 생성 API)
export const IMAGE_SERVER_URL = import.meta.env.VITE_IMAGE_SERVER_URL || 'http://localhost:8001/api/image';

// welstory 는 자체적으로 처리하고 face 컨테이너와 통신하므로 엔드포인트 없음

export const API_ENDPOINTS = {
  FACEMESH_PERSONAL: `${AI_SERVER_URL}/facemesh/personal`,
  FACEMESH_GROUP: `${AI_SERVER_URL}/facemesh/group`,
  SAJU_ANALYZE: `${AI_SERVER_URL}/saju/analyze`,
  GROUP_OHENG_COMBINATION: `${AI_SERVER_URL}/group-oheng-combination`,
  IMAGE_UPLOAD: `${IMAGE_SERVER_URL}/upload`,
} as const;
