# 트러블슈팅 (git pull 후 참고)

## 모임 궁합 분석하기 → 결과창이 안 나올 때

`git pull` 후에 **모임 궁합 분석하기**를 눌러도 결과 화면이 안 나오면, 원격에 예전 코드가 있어서 결과 페이지 렌더 조건이 빠진 상태일 수 있습니다.

### 확인할 파일

`src/app/App.tsx`

### 수정할 부분

**1. 결과 섹션 표시 조건 (pathname 조건)**

- **잘못된 예** (결과창 안 나옴):  
  `{pathname === ROUTES.PERSONAL_RESULT && (`
- **올바른 예**:  
  `{(pathname === ROUTES.PERSONAL_RESULT || pathname === ROUTES.GROUP_RESULT) && (`

`/group/result` 경로에서도 결과 섹션이 렌더되려면 **반드시 `ROUTES.GROUP_RESULT` 조건이 포함**되어 있어야 합니다.

**2. 어떤 컴포넌트를 보여줄지 (pathname 기준 분기)**

- **올바른 예**:  
  `{pathname === ROUTES.GROUP_RESULT ? ( <GroupAnalysisSection ... /> ) : ( <AnalysisSection ... /> )}`

개인 결과(`/personal/result`)일 때는 `AnalysisSection`, 모임 결과(`/group/result`)일 때는 `GroupAnalysisSection`이 나와야 합니다.

**3. handleAnalyze에서 그룹 모드일 때 이동**

- `members`가 있으면 그룹 플로우로 보고, `DEV_SKIP_ANALYZING_FOR_GROUP === true`일 때  
  `navigate(ROUTES.GROUP_RESULT)` 로 바로 이동하는 분기가 있어야 합니다.
- `isGroupFlow`는 `Boolean(members && members.length > 0)` 로 판단하는 것이 안전합니다 (URL 직접 접근 시 `mode` 지연 반영 대비).

위 세 가지가 맞는지 확인한 뒤 **수정 사항을 커밋·푸시**해 두면, 이후 `git pull` 해도 모임 결과창이 정상적으로 나옵니다.
