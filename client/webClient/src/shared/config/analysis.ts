/**
 * 분석(로딩) 구간 설정
 *
 * [실제 흐름]
 * 사진 → MediaPipe(랜드마크 좌표) + 생년월일시 → 백엔드 전송 → LLM 결과 생성 동안
 * 프론트는 /analyzing을 보여 주고, 대기 컨텐츠로 싸피네컷을 제공합니다.
 *
 * [개발 환경]
 * 백엔드 미연동이므로 결과 “나오는” 시점을 10초로 고정해 작업합니다.
 * API 연동 시: ANALYSIS_LOADING_MS 사용부를 실제 백엔드 응답 대기( then → /result )로 교체하고,
 * USE_MOCK_RESULTS를 false로 전환해 응답 데이터를 사용하세요.
 *
 * [싸피네컷 완료 시 이동]
 * - 다 찍었고 분석 안 끝남 → /analyzing
 * - 다 찍었고 분석 끝남 → /result
 * - 다 안 찍었는데 분석 끝남 → /result로 자동 이동하지 않음 (App의 setTimeout에서 pathname 감지)
 */

/** 로딩 애니메이션 스텝 전환용 기본 시간(ms). 실제 분석은 API 응답을 기다립니다. */
export const ANALYSIS_LOADING_MS = 30_000;

/**
 * [개발용] true: 단체(그룹) 모드에서 /analyzing 생략 후 바로 /result로 이동.
 * false: 그룹도 개인과 동일하게 /group/analyzing 이동 후 API 호출, 완료 시 /result.
 */
export const DEV_SKIP_ANALYZING_FOR_GROUP = false;

/** AnalyzingSection 스텝 수 (얼굴형·눈·코·입·턱·조합). */
export const ANALYSIS_STEP_COUNT = 6;

/** 스텝 전환 간격(ms). ANALYSIS_LOADING_MS에 맞춰 로딩 중 스텝이 순환합니다. */
export const ANALYSIS_STEP_INTERVAL_MS = Math.round(
  ANALYSIS_LOADING_MS / ANALYSIS_STEP_COUNT
);

/**
 * true: 결과 화면에 더미 데이터 사용 (AnalysisSection MOCK_DATA, GroupResult GROUP_MOCK_DATA 등)
 * false: API 응답 데이터 사용
 */
export const USE_MOCK_RESULTS = false;
