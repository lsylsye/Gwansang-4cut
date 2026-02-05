# 트러블슈팅 (git pull 후 참고)

**git pull 후 같은 오류가 반복되면** 원격 브랜치에 예전 코드가 있어서 그렇습니다. 아래 항목을 하나씩 확인한 뒤, **수정 사항을 커밋·푸시**해 두면 팀 전체가 pull 해도 오류 없이 동작합니다.

## pull 받은 직후 한 번 실행 (권장)

```bash
cd client/webClient
npm run check-after-pull
```

- **통과**: 현재 코드가 문서 기준을 만족합니다.
- **실패**: 터미널에 나온 항목을 이 문서의 해당 절(§1~§4)대로 수정한 뒤, **커밋·푸시**하면 팀원들이 pull 시 같은 오류를 겪지 않습니다.

---

## 1. 모임 궁합 분석하기 → 결과창이 안 나올 때

**확인 파일:** `src/app/App.tsx`

- **결과 섹션 조건**: `{(pathname === ROUTES.PERSONAL_RESULT || pathname === ROUTES.GROUP_RESULT) && (`  
  (PERSONAL_RESULT만 있으면 /group/result 에서 아무것도 안 보임)
- **분기**: `pathname === ROUTES.GROUP_RESULT ? <GroupAnalysisSection ... /> : <AnalysisSection ... />`
- **handleAnalyze**: `members` 있으면 `isGroupFlow`, `DEV_SKIP_ANALYZING_FOR_GROUP` 일 때 `navigate(ROUTES.GROUP_RESULT)` 호출

---

## 2. 모임 결과 화면 흰 화면 — "groupImage is not defined"

**확인 파일:** `src/features/group/result/components/GroupResult.tsx`

- **GroupResult** props 구조 분해에 **반드시 `groupImage` 포함**  
  예: `({ groupImage, groupMembers = [], onViewRanking }) => {`  
  (빼면 261번째 줄 근처에서 ReferenceError)

---

## 3. 모임 결과 화면 — "type is not defined" (DestinyStickRelations)

**확인 파일:** `src/features/group/result/components/DestinyStickRelations.tsx`

- **lines.map** 콜백에서 **`type`을 구조 분해**하고, JSX에서는 **다른 이름(예: relType)** 사용  
  예: `lines.map(({ key, d, config, rel, midY, type: relType }) => (`  
  `markerEnd={\`url(#arrowhead-${relType})\`}`  
  (type을 빼면 undefined → ReferenceError)

---

## 4. Vite/Babel — "Unexpected token, expected ':'" (OhengMatchingSection)

**확인 파일:** `src/features/group/result/components/OhengMatchingSection.tsx`

- **computeScoreExplanation** 함수가 존재하고, **useScoreExplanation** 안에서  
  `useMemo(() => computeScoreExplanation(ohengResult, totalMembers), [ohengResult, totalMembers])` 로만 호출되어야 함.  
  (useMemo 콜백 안에 직접 `<` / `>` 비교가 많으면 TSX 파서가 JSX로 해석해서 에러)
- **strLess(a, b)** 헬퍼로 문자열 비교 (`a < b`) 처리
- **useTeamOhengSummary** 훅이 **반드시 정의**되어 있어야 함.  
  (없으면 "useTeamOhengSummary is not defined" → 흰 화면)  
  반환 타입: `Array<{ element: string; supplement: number; conflict: number }>`

---

## 5. 한 번에 확인하는 체크리스트 (pull 후)

| 항목 | 파일 | 확인 내용 |
|------|------|------------|
| 결과창 렌더 | App.tsx | 결과 섹션 조건에 `ROUTES.GROUP_RESULT` 포함 |
| 그룹 결과 이미지 | GroupResult.tsx | props에 `groupImage` 구조 분해 |
| 관계선 화살표 | DestinyStickRelations.tsx | lines.map 에 `type: relType` 등으로 구조 분해 후 relType 사용 |
| 점수 해설 파싱 | OhengMatchingSection.tsx | `computeScoreExplanation` 함수 + useMemo에서 해당 함수만 호출 |
| 팀 오행 요약 | OhengMatchingSection.tsx | `useTeamOhengSummary` 훅 정의 존재 |

위가 모두 맞으면 **해당 내용 커밋 후 푸시**해 두면, 이후 pull 받을 때 동일 오류가 반복되지 않습니다.

---

## (선택) pull 할 때마다 자동 검사하기

프로젝트 **루트**에서 한 번만 실행해 두면, 이후 `git pull` 할 때마다 자동으로 `check-after-pull`이 실행됩니다.

```bash
# Windows (PowerShell 등)
copy client\webClient\scripts\post-merge-hook .git\hooks\post-merge
# macOS / Linux
cp client/webClient/scripts/post-merge-hook .git/hooks/post-merge
chmod +x .git/hooks/post-merge
```

훅 내용: `client/webClient`로 이동 후 `npm run check-after-pull` 실행. 실패 시 터미널에 안내가 출력됩니다.
