📅 Weekly Retrospective: 2026.01 3rd Week
🚀 Project Overview

이번 주는 초기 기획(인테리어 SNS)에서 **AI 기반 관상 분석 서비스 ‘관상네컷’**으로 주제를 피벗했습니다.
피벗 이후 서비스 구현 가능성을 높이기 위해 다음을 병행했습니다.

3D 기술(3D Gaussian Splatting) 조사로 “3D 기반 서비스” 가능성을 검증

관상네컷을 목표로 한 AI 파이프라인 설계(landmark 기반 feature → 분류/회귀)

구현 역량 확보를 위해 React 기초(컴포넌트/상태/props), Figma 기초(오토레이아웃/컴포넌트) 학습

협업 및 일정 관리를 위해 Jira 이슈 체계(Epic/Story/Task/Bug) 구축 및 백로그 작성

🔍 1. 기술 탐색 및 주제 확정 (3D Tech & Pivot)
1-1. 3D Gaussian Splatting 리서치

목표: “웹/실시간” 관점에서 구현 가능한 3D 렌더링 기술인지 판단

✅ 핵심 개념 (NeRF 대비 차이)

NeRF는 장면을 연속 함수(신경망) 로 표현하고, 렌더링 시 ray marching으로 많은 샘플을 찍기 때문에 비용이 큼.

Gaussian Splatting은 장면을 수많은 3D Gaussian(점 구름 + 분산/방향성 + 색/불투명도 등) 로 표현하고,

카메라 뷰로 투영(project) 한 뒤

화면에서 splat(퍼짐) 형태로 누적 합성하여 렌더링

결과적으로 렌더링 속도가 빠르고, 학습 후 실시간 시각화에 유리한 구조로 이해.

✅ 성능/구현 관점 체크 포인트

정적 장면 복원은 강점이 뚜렷(실시간 뷰잉)

동적 객체는 추가 기법(시간축 모델링/동적 gaussian 업데이트 등)이 필요해 복잡도가 급증

웹 배포: WebGL/WebGPU 기반 뷰어/렌더러가 필요하고, 모델 크기(gaussian 수)가 크면 전송·메모리 병목 발생 가능
→ “MVP 단계에서 3D를 핵심 가치로 넣기엔 리스크가 크다”는 결론에 가까움

1-2. 주제 피벗: 인테리어 SNS → ‘관상네컷’
✅ 피벗 이유(기술/일정 관점)

인테리어 SNS의 핵심 기능(3D 공간/자산 관리/렌더링/추천 등)은 구현 범위가 넓고 불확실성이 큼

반면, 관상네컷은

입력(얼굴 이미지) → 처리(landmark/feature) → 출력(결과/설명) 흐름이 명확하고

프로토타입을 빠르게 만들 수 있는 기술 스택(MediaPipe 등) 이 존재함

재미 요소(“네컷” 포맷 + 분석 결과 + 공유)로 사용자 경험을 설계하기 쉬움

🤖 2. AI 모델링 및 데이터셋 설계
2-1. 목표 파이프라인(초기 설계)

입력: 사용자 얼굴 사진(정면/반정면)
전처리: 얼굴 검출 → 정렬(alignment) → 랜드마크 추출
Feature 추출: landmark 기반 기하학 특징(거리/각도/비율) + 선택적으로 texture 기반 특징
모델: 분류(Classification) 또는 점수 회귀(Regression)
출력: 관상 결과(유형/점수) + 근거(어떤 특징이 영향을 줬는지)

2-2. 데이터셋 조사 방향
✅ 공개 얼굴 데이터셋 활용 포인트

CelebA 같은 데이터셋은 얼굴 이미지가 많고 attribute 라벨이 있으나,

“관상학적 라벨”은 없기 때문에 그대로 supervised 학습은 어렵고

대체 전략이 필요 (예: 관상 결과를 임의 생성/룰 기반 라벨링/설문 기반 라벨 수집 등)

✅ landmark 데이터의 필요성

관상처럼 “형태/비율”을 다루려면 픽셀 전체보다는

랜드마크 기반 기하(feature engineering) 가 명확하고 설명 가능성이 높음

예시 feature(구현 가능 형태로 정의)

얼굴 폭/높이 비율

턱 끝(Chin) 각도 및 하관 길이

눈 사이 거리, 눈꼬리 기울기(eye tilt)

코 길이/콧볼 폭 비율

입 폭/인중 길이 비율 등

2-3. 모델링 접근(검토안)
A안) 룰 기반 + 가중치 점수화 (MVP 친화)

landmark 기반 feature를 계산하고

“눈꼬리 상승/하강”, “하관 비율” 같은 규칙을 정의해 점수를 부여

장점: 데이터 라벨 없이도 가능, 빠른 MVP

단점: 규칙 설계 품질에 의존, 일반화 한계

B안) 약지도/가짜 라벨로 분류 모델

처음엔 룰 기반으로 라벨을 만들고(teacher)

그 라벨을 기반으로 모델(student)을 학습

장점: 반복 개선 가능

단점: 초기에 만든 룰의 편향이 모델에 전이

C안) 회귀(점수) + 설명가능성 강화

“관상 유형”을 딱 잘라 분류하기보다,

여러 축(예: 인상 강도/부드러움/선명함 등) 점수를 회귀로 예측

결과 표현이 유연하고, UX 측면에서 “네컷 결과 카드”로 설계하기 좋음

2-4. MediaPipe / Dlib 검토(기술 선택 근거)

MediaPipe Face Mesh

장점: 모바일/실시간에 강함, landmark 수가 많아(정교함), 웹 적용 사례가 많음

리스크: 조명/가림/각도에 취약할 수 있음 → 정면 유도 UX 필요

Dlib

장점: 고전적이고 가벼운 landmark(68 points)로 시작하기 쉬움

리스크: 정확도/유연성은 최신 접근 대비 제한될 수 있음

결론(이번 주): 빠른 프로토타입은 MediaPipe 기반 landmark 추출로 시작하는 게 합리적.

💻 3. Frontend & Design 기초 학습
3-1. React (Frontend)

목표: “빠르게 MVP를 만들 수 있는 기본기” 확보

✅ 학습한 핵심 개념(구현 관점)

Component Architecture

UI를 Header / Layout / Card / ResultModal 같은 단위로 쪼개서 재사용성을 확보

페이지 단위(라우팅)와 UI 컴포넌트 단위를 구분할 준비

JSX & Props

부모→자식 데이터 전달: props로 UI를 “데이터 기반 렌더링”하도록 구성

예: 결과 카드 컴포넌트에 {title, score, description} 전달

State Management(useState)

로컬 상태: 업로드 이미지, 처리 중 로딩, 결과 데이터 등

상태 흐름 설계:

idle(업로드 전) → processing(추출/분석 중) → done(결과 표시) → reset

✅ 다음 단계에서 필요한 기술(실제 구현에 바로 필요한 것)

라우팅(예: React Router)

API 호출(fetch/axios) + 비동기 상태 관리

파일 업로드(FormData), 이미지 미리보기(URL.createObjectURL)

결과 UI(모달/카드) 컴포넌트 설계

3-2. Figma (Design)

목표: 개발과 디자인 연결(Hand-off)을 전제로 와이어프레임을 “구현 가능한 형태”로 만들기

✅ 학습한 핵심 기능(협업 관점)

Frame

화면 단위를 명확히 분리(모바일/웹 기준)

뷰포트 기준으로 레이아웃 설계

Auto Layout

버튼/카드/리스트에 적용하여

텍스트 길이 변화, 반응형에서 UI가 무너지지 않도록 구조화

컴포넌트화

공통 요소(Button, NavBar, ResultCard)를 컴포넌트로 등록

variant(Primary/Secondary/Disabled)로 관리하면 구현 시도 쉬움

✅ 실제로 와이어프레임에 포함되어야 하는 최소 UX 요구사항

얼굴 촬영/업로드 가이드(정면, 조명, 안경/마스크 안내)

처리 중 로딩(“랜드마크 추출 중…/분석 중…”)

결과 공유(이미지로 저장/링크 공유) 흐름

⚙️ 4. Project Management (Jira)
4-1. 이슈 체계 설계(운영 룰 포함)

Epic: 큰 목표 단위
예) MVP - Face Landmark Pipeline, Frontend UI, Design System

Story: 사용자 관점 요구
예) “사용자는 얼굴 사진을 업로드하고 분석 결과를 카드로 볼 수 있다”

Task: 실제 작업 단위
예) “Upload 컴포넌트 구현”, “MediaPipe landmark 추출 코드 작성”

Bug: 결함/예외 처리
예) “측면 얼굴에서 landmark 실패 시 앱 크래시”

4-2. Naming Convention(예시)

[FE], [AI], [DES], [PM] prefix로 구분

[FE] Implement Layout/Header/Footer

[AI] MediaPipe FaceMesh Prototype

[DES] Wireframe - Home/Result Page

4-3. 이번 주 실무 적용

피벗에 맞춰 초기 백로그 생성

스프린트 준비를 위해 스토리→태스크로 분해하여 일정 가시화

📈 Summary

Technical Research: 3D Gaussian Splatting의 원리 및 웹/실시간 적용 리스크를 파악

Service Planning: 구현 범위/재미 요소를 고려해 ‘관상네컷’으로 피벗 확정

AI Pipeline: landmark 기반 feature 추출 + 분류/회귀 모델 방향성 수립

Basic Skills: React/Figma 기초 학습으로 MVP 구현 준비

Agile Workflow: Jira 이슈 체계 설계 및 초기 백로그 작성

✅ Next Steps (내일 할 일)
1) Figma 와이어프레임(필수 화면)

 Home(업로드/촬영) 화면: 가이드 + 업로드 버튼 + 예시 이미지

 Processing 화면: 로딩/진행 상태 표시

 Result 화면: 네컷 카드 + 분석 요약 + 공유 버튼

 Error 케이스: 얼굴 미검출/다중 얼굴/측면/조명 부족 대응

2) React 기본 레이아웃 구현

 Layout 컴포넌트(헤더/푸터/컨테이너)

 Home 페이지: 업로드 UI + 미리보기

 상태 흐름 설계: idle/processing/done/reset

 ResultCard 컴포넌트(더미 데이터로 먼저 UI 완성)

3) MediaPipe 얼굴 특징점 추출 프로토타입

 단일 이미지 입력 → FaceMesh landmark 추출 성공 확인

 landmark 좌표 저장(JSON) 및 시각화(점 찍기)로 검증

 feature 계산 함수(거리/비율) 5~10개 먼저 정의