export const API_BASE_URL = 'http://localhost:8080';

export const API_ENDPOINTS = {
  FACEMESH_PERSONAL: `${API_BASE_URL}/test-api/facemesh/personal`,
  FACEMESH_GROUP: `${API_BASE_URL}/test-api/facemesh/group`,
} as const;
