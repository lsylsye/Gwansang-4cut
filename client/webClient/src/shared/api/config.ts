export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://i14e208.p.ssafy.io/test-api';

export const API_ENDPOINTS = {
  FACEMESH_PERSONAL: `${API_BASE_URL}/test-api/facemesh/personal`,
  FACEMESH_GROUP: `${API_BASE_URL}/test-api/facemesh/group`,
} as const;
