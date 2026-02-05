/**
 * git pull 후 같은 오류가 다시 발생하지 않았는지 검사합니다.
 * client/webClient 디렉터리에서 실행: node scripts/check-after-pull.mjs
 * 실패 시 exit 1, 성공 시 exit 0.
 */
import fs from "fs";
import path from "path";

const SRC = "src";
const ROOT = path.resolve(process.cwd());

function readFile(relativePath) {
  const full = path.join(ROOT, relativePath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function* walkTsxTs(dir) {
  if (!fs.existsSync(path.join(ROOT, dir))) return;
  const entries = fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "node_modules") {
      yield* walkTsxTs(rel);
    } else if (e.isFile() && (rel.endsWith(".tsx") || rel.endsWith(".ts"))) {
      yield rel;
    }
  }
}

const errors = [];

// 1) Git 머지 충돌 마커 검사 (실제 충돌만: 줄 시작이 <<<<<<< / ======= / >>>>>>>)
for (const rel of walkTsxTs(SRC)) {
  const content = readFile(rel);
  if (!content) continue;
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith("<<<<<<<") || trimmed === "=======" || trimmed.startsWith(">>>>>>>")) {
      errors.push(`머지 충돌 마커 발견: ${rel}:${i + 1}`);
      break;
    }
  }
}

// 2) App.tsx — 결과창 조건에 GROUP_RESULT 포함
const appContent = readFile(path.join(SRC, "app", "App.tsx"));
if (appContent) {
  const hasGroupResultCondition =
    appContent.includes("ROUTES.GROUP_RESULT") &&
    /pathname\s*===\s*ROUTES\.(PERSONAL_RESULT|GROUP_RESULT)/.test(appContent);
  if (!hasGroupResultCondition) {
    errors.push(
      "App.tsx: 결과 섹션 조건에 pathname === ROUTES.GROUP_RESULT 가 포함되어야 합니다. (TROUBLESHOOTING.md §1)"
    );
  }
}

// 3) GroupResult.tsx — props에 groupImage 구조 분해
const groupResultPath = path.join(
  SRC,
  "features",
  "group",
  "result",
  "components",
  "GroupResult.tsx"
);
const groupResultContent = readFile(groupResultPath);
if (groupResultContent) {
  if (!/groupImage\s*[,\}]|\{\s*[^}]*groupImage/.test(groupResultContent)) {
    errors.push(
      "GroupResult.tsx: props 구조 분해에 groupImage 가 포함되어야 합니다. (TROUBLESHOOTING.md §2)"
    );
  }
}

// 4) DestinyStickRelations.tsx — lines.map 콜백에서 관계 타입 구조 분해 후 markerEnd에 사용 (type 또는 type: relType)
const destinyPath = path.join(
  SRC,
  "features",
  "group",
  "result",
  "components",
  "DestinyStickRelations.tsx"
);
const destinyContent = readFile(destinyPath);
if (destinyContent) {
  const hasTypeInDestructure = /\.map\s*\(\s*\(\s*\{[^}]*\btype\b/.test(destinyContent);
  const hasMarkerEndWithType = /markerEnd=\{[^}]*#(arrow|list-arrow)/.test(destinyContent);
  if (!hasTypeInDestructure || !hasMarkerEndWithType) {
    errors.push(
      "DestinyStickRelations.tsx: lines.map 콜백에서 type( 또는 type: relType) 구조 분해 후 markerEnd에 사용 필요. (TROUBLESHOOTING.md §3)"
    );
  }
}

// 5) OhengMatchingSection.tsx — computeScoreExplanation, useTeamOhengSummary
const ohengPath = path.join(
  SRC,
  "features",
  "group",
  "result",
  "components",
  "OhengMatchingSection.tsx"
);
const ohengContent = readFile(ohengPath);
if (ohengContent) {
  if (!ohengContent.includes("computeScoreExplanation")) {
    errors.push(
      "OhengMatchingSection.tsx: computeScoreExplanation 함수가 있어야 합니다. (TROUBLESHOOTING.md §4)"
    );
  }
  if (!ohengContent.includes("useTeamOhengSummary")) {
    errors.push(
      "OhengMatchingSection.tsx: useTeamOhengSummary 훅이 정의되어 있어야 합니다. (TROUBLESHOOTING.md §4)"
    );
  }
}

if (errors.length > 0) {
  console.error("[check-after-pull] pull 후 수정이 필요한 항목이 있습니다.\n");
  errors.forEach((e) => console.error("  •", e));
  console.error("\n자세한 수정 방법: client/webClient/TROUBLESHOOTING.md");
  process.exit(1);
}

console.log("[check-after-pull] 검사 통과. 현재 코드는 TROUBLESHOOTING 문서 기준을 만족합니다.");
