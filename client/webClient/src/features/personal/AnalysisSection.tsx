import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Heart, Camera, RotateCcw, Download, QrCode, Images } from "lucide-react";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { FaceAnalysis } from "./face/components/FaceAnalysis";
import { StatsAnalysis, type ConstitutionPhase } from "./stats/components/StatsAnalysis";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { SajuAnalysisResponse } from "@/shared/api/sajuApi";
import { USE_MOCK_RESULTS } from "@/shared/config/analysis";
import html2canvas from "html2canvas";
import { useHideTurtleGuide } from "@/shared/contexts/HideTurtleGuideContext";

// --- Types ---
interface AnalysisSectionProps {
    images?: string[];
    onRestart: () => void;
    onNavigateToPhotoBooth?: () => void;
    frameImage?: string;
    fromPhotoBooth?: boolean;
}

// --- Mock Data (부위별 상세: values, criteria, interpretation, advice) ---
const MOCK_DATA = {
    scores: [
        { subject: "재물운", A: 85, fullMark: 100 },
        { subject: "애정운", A: 92, fullMark: 100 },
        { subject: "건강운", A: 70, fullMark: 100 },
        { subject: "직업운", A: 88, fullMark: 100 },
        { subject: "사회운", A: 65, fullMark: 100 },
    ],
    features: {
        // 공통·얼굴형: 1) 사진 품질 2) 얼굴형 게이지+해석 3)~5) 성향·운용
        common: {
            qualityScore: 95,
            qualityLabel: "관상 분석에 적합한 촬영 상태",
            headRoll: { value: -4.81, min: -10, max: 10, unit: "°", summary: "정면에 가까운 얼굴 — 본성 기반 해석 가능" },
            meanings: ["좌우 왜곡이 없으며, 감정과 성향이 평균값에 가깝게 드러납니다.", "연출보다 본질이 잘 보이는 정면 촬영으로, 관상 분석에 적합한 상태로 판단됩니다."],
        },
        faceShape: {
            type: "광대형",
            typeSub: "넓은 그릇",
            gauge: { value: 6.31, rangeMin: 0, rangeMax: 8, segments: [{ label: "세장형", max: 0.70 }, { label: "균형형", min: 0.70, max: 0.80 }, { label: "광대형", min: 0.80 }] },
            measures: { w: "0.1592", h: "0.0252", wh: "6.31" },
            summary: "넓은 얼굴형은 큰 무대를 감당하는 구조로 해석됩니다. 대외 활동과 리더십에 유리한 그릇입니다.",
            oneLineSummary: "넓은 그릇은 큰 무대를 감당하는 구조입니다.",
            coreMeaning: "관상에서 얼굴형(그릇)은 타고난 활동 범위와 리더십·대외적 성향을 나타냅니다. W/H 비율이 크면 광대형으로, 넓은 그릇은 사람을 모으고 책임을 지는 구조로 해석됩니다.",
            strengths: ["리더십과 조정력이 뛰어나며, 대외 활동·발표·협상에 강점을 보입니다.", "장기전에서 체력과 지속력이 좋은 편입니다."],
            cautions: ["책임이 과다해질 경우 번아웃 위험이 있으므로, 역할을 분산하는 것이 좋습니다.", "주변의 기대와 압박으로 인한 스트레스 관리에 유의할 필요가 있습니다."],
            patterns: { behavior: ["일이 몰릴수록 오히려 집중력이 상승하는 경향이 있으며, 자연스럽게 중심 역할을 맡게 됩니다."], life: ["인생 초반에는 부담이 많은 시기가 올 수 있으며, 중·후반으로 갈수록 책임이 자산으로 전환되는 흐름을 보입니다."] },
            guide: [{ from: "혼자 감당", to: "역할 분산" }, { from: "단기 성과 중심", to: "중·대형 판으로의 전환" }, { from: "체력 관리 선택적", to: "체력 관리 필수" }],
        },
        forehead: {
            title: "이마 분석 · 초년운과 판단력",
            valuesLabel: "값",
            values: "이마 높이 0.0495, 얼굴 대비 이마 높이 비율 1.96, 이마 폭 0.0377, 얼굴 대비 이마 폭 비율 23.7%",
            criteria: "이마 높이 비율 기준: < 1.0 낮음, 1.0~1.5 단정, > 1.5 높음",
            interpretation: "관상에서 이마는 출생부터 약 30세 전후까지의 운 흐름과 판단력·사고 방식·기획 능력을 담당합니다. 얼굴 대비 이마 높이 비율(1.96)은 적용 기준에 비추어 \"높음\" 구간에 해당하며, 이마 폭은 얼굴폭 대비 23.7%로 균형 잡힌 편입니다. 이마가 높다는 것은 생각을 먼저 하고, 계산과 구조를 그린 뒤 움직이려는 성향이 강하다는 뜻으로, 학문·기획·전략 분야에 적합한 특성으로 해석됩니다.",
            adviceLabel: "",
            advice: "초년에는 아이디어와 판단력으로 기회를 잡을 가능성이 큽니다. 다만 \"이마가 높으면, 발이 늦어질 수 있다\"는 관상적 경계처럼, 생각이 과다해지면 실행이 지연되고, 혼자 머리로 해결하려는 경향으로 실무 네트워크가 약해질 수 있습니다. 실무 네트워크를 강화하고 아이디어를 실행으로 옮기는 노력이 도움이 됩니다.",
            gauge: { value: 1.96, rangeMin: 0, rangeMax: 2.5, unit: "", segments: [{ label: "낮음", max: 1.0 }, { label: "단정", min: 1.0, max: 1.5 }, { label: "높음", min: 1.5 }] },
            // 이마 전용 확장 (renderForeheadBlock)
            analysisTrust: "높음",
            analysisTrustNote: "정면 각도 · 얼굴형 안정 → 이마 비율 판독 정확",
            measures: { height: "0.0495", heightRatio: "1.96", width: "0.0377", widthRatio: "23.7%" },
            typeSub: "사고 중심형",
            oneLineSummary: "몸보다 머리가 먼저 움직였던 초년의 상.",
            coreMeaning: "관상에서 이마는 출생 ~ 약 30세 전후까지의 운 흐름과 판단력·사고 방식·기획 능력을 담당합니다. 이마가 높다는 것은 단순히 ‘똑똑해 보인다’가 아니라, 생각을 먼저 하고 계산과 구조를 그린 뒤 움직이려는 성향이 강하다는 뜻입니다.",
            strengths: [
                "판단력·기획력: 상황을 한 번 더 해석하고 움직이며, 즉흥성보다 구조와 논리를 우선합니다.",
                "아이디어 기반 초년운: 초년기에 사람보다 아이디어·머리로 기회를 잡는 흐름이 있고, 공부·기획·전략·분석 분야에 적합합니다.",
                "위기 회피 능력: 무작정 돌파하기보다 계산 후 선택하는 편이라, 큰 실패를 피하는 이마로 해석됩니다.",
            ],
            cautions: [
                "생각 과다 → 실행 지연: 아이디어는 많으나 ‘조금만 더 준비하자’가 반복될 수 있습니다.",
                "실무 네트워크 약화 가능성: 혼자 머리로 해결하려는 경향이 있어, 사람을 활용하는 감각은 의식적 학습이 필요합니다.",
            ],
            boundarySentence: "이마가 높으면, 발이 늦어질 수 있다.",
        },
        eyes: {
            title: "눈(성격/직업운/대인관계)",
            valuesLabel: "값",
            values: "eye_asymmetry ≈ 0.0013, inter_eye_dist ≈ 0.1566, eye_size_mean ≈ 0.0134",
            criteria: "비대칭 기준: < 0.002 균형, 0.002~0.003 보통, > 0.003 불균형",
            interpretation: "좌우 눈 개방도 차이(0.0013)는 기준상 \"균형\"에 해당합니다. 두 눈의 너비에 다소 차이가 있으나 전체 균형과 대칭도(94.2%)는 안정적입니다. 눈 간격이 얼굴폭과 비슷해 눈이 넓게 벌어진 인상으로 보입니다.",
            adviceLabel: "",
            advice: "눈의 균형이 좋아 감정 표현이 비교적 안정적인 편이며, 넓은 눈 간격은 개방적이고 솔직한 대인 스타일과 잘 맞습니다. 대인관계에서 신뢰를 쌓기 쉽고, 발표·설득 등 공개적 역할에 강점이 있습니다. 다만 눈 기색(붉음 지수 44.0)이 피로·과로에 의한 긴장을 시사하므로, 대인 피로 관리에 주의하는 것이 좋습니다.",
            gauge: { value: 0.0013, rangeMin: 0, rangeMax: 0.005, unit: "", segments: [{ label: "균형", max: 0.002 }, { label: "보통", min: 0.002, max: 0.003 }, { label: "불균형", min: 0.003 }] },
            // 눈 전용 확장 (renderEyesBlock)
            analysisTrust: "매우 높음",
            analysisTrustNote: "정면 각도 · 좌우 균형 안정 → 눈 해석 최적",
            measures: { openL: "0.0141", openR: "0.0128", asymmetry: "0.0013", asymmetryCriteria: "< 0.002 → 균형", interDist: "0.1566", widthRatio: "매우 넓음", symmetry: "94.2%" },
            typeSub: "균형형 눈 (안정 성향)",
            oneLineSummary: "감정은 절제되어 있고, 관계는 열려 있는 눈.",
            coreMeaning: "관상에서 눈은 성격의 표면, 사람을 대하는 태도, 직업에서 맡는 역할을 가장 직접적으로 드러내는 부위입니다. 이 눈의 핵심은 감정 과잉이나 냉담이 아니라, 안정적인 감정 흐름입니다.",
            strengths: [
                "감정 균형이 좋은 타입: 좌우 눈 차이가 거의 없고, 감정 기복이 적으며 표정이 안정적입니다. 사람 앞에서 태도가 쉽게 흔들리지 않아 \"기분에 따라 사람을 대하지 않는 눈\"으로 해석됩니다.",
                "넓은 시야·개방형 대인관계: 눈 사이 거리가 얼굴 폭에 가깝다는 것은 사람을 판단할 때 여지를 남기는 성향을 의미합니다. 타인에 대한 수용 범위가 넓고, 다른 의견을 듣는 데 거부감이 적으며, 공개적 자리·다수 상대에 강합니다.",
                "직업적 역할 운: 독단적 리더나 감정 노동 중심이 아니라, 조율자·설명자·발표·설득 담당·중간 관리자에 매우 적합한 구조입니다.",
            ],
            cautions: [
                "눈 기색(붉음 지수 44.0)이 피로·과로에 의한 긴장을 시사하므로, 대인 피로 관리에 주의하는 것이 좋습니다.",
            ],
        },
        nose: {
            title: "코(재물운/현실감)",
            valuesLabel: "값",
            values: "nose_length ≈ 0.0512, nose_length / H_face ≈ 2.030, nose_width ≈ 0.0410",
            criteria: "길이 기준: < 0.05 짧은 코, 0.05~0.06 균형형, > 0.06 긴 코",
            interpretation: "코 길이(약 0.0512)는 기준상 \"균형\" 구간에 해당합니다. 코 길이 대비 얼굴 높이 비율(약 2.03)이 높게 나와, 장기적 재물 축적 능력이 있다는 해석과 맞닿아 있습니다. 코 폭도 적당하여 현실감이 있는 편으로 보입니다.",
            adviceLabel: "",
            advice: "장기적·체계적인 재물 축적에 강점이 있으며, 인내를 바탕으로 성과를 내는 경향이 있습니다. 다만 코끝의 붉음(붉음 지수 55.5)은 지출 성향이나 스트레스에 따른 과소비·건강 리스크를 시사할 수 있으므로, 재무 계획을 엄격히 하고 큰 투자 전에 냉정한 검토를 하는 것이 좋습니다.",
            gauge: { value: 2.03, rangeMin: 0, rangeMax: 2.5, unit: "", segments: [{ label: "단기형", max: 1.5 }, { label: "균형형", min: 1.5, max: 2.0 }, { label: "장기형", min: 2.0 }] },
            // 코 전용 확장 (renderNoseBlock)
            analysisTrust: "높음",
            analysisTrustNote: "정면 각도 · 얼굴형 안정 → 코 비율 해석 정확",
            measures: { length: "0.0512", lengthRatio: "2.03", width: "0.0410", lengthCriteria: "< 0.05 → 짧은 코, 0.05 ~ 0.06 → 균형형, > 0.06 → 긴 코" },
            judgementResult: "균형형에 가까운 '축적 강화형 코'",
            typeSub: "장기 축적형 재물 운",
            oneLineSummary: "빠르게 버는 운은 아니나, 사라지지 않는 돈의 상.",
            coreMeaning: "관상에서 코는 👉 돈을 버는 방식, 👉 돈을 지키는 힘, 👉 현실 판단력을 동시에 봅니다. 이 코의 핵심은 한 번에 크게 ❌ 여러 번 안정적으로 ⭕ 즉, 시간을 편으로 만드는 재물 구조입니다.",
            strengths: [
                "① 장기 축적 능력: 계획 기반 수입 구조이며, 급등락보다는 완만한 상승 곡선을 보입니다. 투자·사업·직장 모두 \"늦게 빛나도 오래 가는\" 타입으로 해석됩니다.",
                "② 현실 감각이 있는 소비 성향: 코 폭이 과하지 않아 허세 소비보다 필요·효율 기준 소비에 가깝습니다. 돈을 쓰더라도 \"의미 없는 지출\"에 대한 거부감이 큽니다.",
                "③ 인내형 재물 운: 당장 성과가 없어도 중간에 포기하지 않는 구조입니다. 관상에서는 \"코가 길면, 기다림이 자산이 된다\"고 봅니다.",
            ],
            cautions: [
                "코끝의 붉음(붉음 지수 55.5)은 지출 성향이나 스트레스에 따른 과소비·건강 리스크를 시사할 수 있으므로, 재무 계획을 엄격히 하고 큰 투자 전에 냉정한 검토를 하는 것이 좋습니다.",
            ],
        },
        mouth: {
            title: "입(말·신뢰·애정운)",
            valuesLabel: "값",
            values: "mouth_width ≈ 0.0181, lip_thickness ≈ 0.0036, mouth_corner_slope ≈ -6.21°",
            criteria: "입꼬리 기준: > 5° 상향(밝음), -5°~5° 수평(중립), < -5° 하향(진중)",
            interpretation: "입꼬리 기울기(약 -6.21°)는 기준상 \"하향\"에 해당하며, 첫인상이 다소 진중하고 엄격하게 보일 수 있습니다. 입술 두께가 얇은 편이라 감정 표현이 과하지 않은 인상입니다.",
            adviceLabel: "",
            advice: "말수는 많지 않으나 한마디 한마디 무게가 있는 스타일입니다. 연애와 신뢰 관계에서는 신중하고 안정적인 관계를 선호하는 편인데, 초반에 다정함을 잘 드러내지 못해 오해가 생길 수 있습니다. 미소 연습과 목소리 톤을 부드럽게 하는 것이 애정운에 도움이 됩니다.",
            gauge: { value: -6.21, rangeMin: -15, rangeMax: 15, unit: "°", segments: [{ label: "진중", max: -5 }, { label: "중립", min: -5, max: 5 }, { label: "밝음", min: 5 }] },
            // 입 전용 확장 (renderMouthBlock)
            analysisTrust: "높음",
            analysisTrustNote: "정면 각도 · 입 비대칭 적음 → 인상 해석 안정",
            measures: { width: "0.0181", lipThickness: "0.0036 (얇은 편)", cornerSlope: "-6.21°", cornerCriteria: "상향(+): 밝음·친화, 수평(0): 중립, 하향(-): 진중·절제" },
            judgementResult: "진중형 입 (말의 무게 중심형)",
            typeSub: "신중 발화형",
            oneLineSummary: "말은 적지만, 한마디의 신뢰도가 높은 입.",
            coreMeaning: "관상에서 입은 👉 말의 힘, 👉 신뢰 형성 방식, 👉 애정 표현 스타일을 동시에 봅니다. 이 입의 핵심은 많이 말해 얻는 신뢰 ❌ 지켜낸 말로 쌓는 신뢰 ⭕ 입니다.",
            strengths: [
                "① 말의 무게가 실리는 타입: 불필요한 말 적음, 약속을 쉽게 하지 않음, 한 번 한 말은 지키려는 성향. 회의·계약·중요한 대화에서 발언 자체가 신뢰 자산이 됩니다.",
                "② 감정 절제형 애정 스타일: 입술이 얇은 편 → 감정 과시 적음, 표현보다는 행동으로 증명. 연애·관계에서 \"말보다 행동\"을 중요하게 여깁니다.",
                "③ 갈등 확산을 막는 구조: 감정이 올라와도 즉각적인 언쟁으로 번지지 않음. 관상에서는 \"입이 무거우면, 싸움이 늦게 온다\"고 봅니다.",
            ],
            cautions: [
                "😐 첫인상에서의 거리감: 입꼬리 하향 → 무표정 시 차갑거나 엄격해 보일 수 있음.",
                "💔 애정 표현 부족 오해: 마음은 깊으나 표현 빈도가 낮아 상대가 불안해질 수 있음. 특히 초반 관계에서 \"관심 없는 것 같다\"는 오해 주의.",
            ],
            relationTips: ["✔ 중요한 관계일수록 말로 확인", "✔ 감정 표현은 의식적으로 +1단계", "✔ 미소·톤·짧은 공감 멘트 활용"],
            relationTipsNote: "말의 양이 아니라 신호의 빈도를 늘리는 것이 핵심입니다.",
            interestingPoint: "이런 입을 가진 사람은 초반엔 \"조용한 사람\"으로 보이다가, 시간이 지나면 \"이 사람 말은 믿을 수 있다\"는 평가를 받습니다. 즉, 즉각적인 호감 < 누적 신뢰로 작동하는 입입니다.",
            summaryTable: [
                { item: "말의 스타일", value: "신중 · 절제" },
                { item: "신뢰 형성", value: "말보다 행동" },
                { item: "애정 표현", value: "깊지만 적음" },
                { item: "주의", value: "차가운 인상 오해" },
            ],
            oneLineConclusion: "말을 아끼는 대신, 신뢰를 잃지 않는 입입니다.",
        },
        chin: {
            title: "턱/하관(지구력·노년운)",
            valuesLabel: "값",
            values: "chin_length ≈ 0.1602, jaw_width ≈ 0.1431, jaw_angle ≈ 58.5°",
            criteria: "각도 기준: < 65° 각진, 65~75° 완만, > 75° 둥근",
            interpretation: "턱 각도(약 58.5°)는 기준상 \"각진 턱\"에 해당합니다. 턱 폭과 길이가 탄탄하여 지구력과 끈기가 강한 형태로 해석됩니다.",
            adviceLabel: "",
            advice: "끈기와 결단력이 있어 장기적 사업·직무에 강점이 있습니다. 다만 각진 턱은 고집으로 이어질 여지가 있으므로, 타협과 소통을 의식적으로 키우는 것이 좋습니다. 노년에도 자기 주관이 뚜렷해 사회적 영향력을 유지할 가능성이 큽니다.",
            gauge: { value: 58.5, rangeMin: 50, rangeMax: 90, unit: "°", segments: [{ label: "강함", max: 65 }, { label: "보통", min: 65, max: 75 }, { label: "약함", min: 75 }] },
            // 턱 전용 확장 (renderChinBlock)
            analysisTrust: "매우 높음",
            analysisTrustNote: "정면 각도 · 하관 노출 명확 → 턱 판독 최적",
            measures: { length: "0.1602", width: "0.1431", angle: "58.5°", angleCriteria: "< 65° → 각진 턱, 65° ~ 75° → 완만형, > 75° → 둥근 턱" },
            judgementResult: "각진 턱 (지구력·결단 중심형)",
            typeSub: "끝까지 가는 사람",
            oneLineSummary: "버티는 힘이 타고난 얼굴.",
            coreMeaning: "관상에서 턱과 하관은 👉 인생의 후반부, 👉 위기 상황에서의 선택, 👉 끝까지 남는 힘을 상징합니다. 턱이 각지고 단단하다는 것은 감정에 흔들려 중도 포기 ❌ 손해를 보더라도 끝을 보는 성향 ⭕ 즉, 결승선까지 도달하는 타입입니다.",
            strengths: [
                "① 강한 지구력과 책임감: 힘들수록 도망치지 않음, 맡은 일은 마무리하려는 성향. 조직·사업·관계에서 \"마지막까지 남는 사람\"으로 기억됩니다.",
                "② 위기 대응 능력: 상황이 나빠질수록 감정보다 결단이 먼저. 관상에서는 \"턱이 단단하면, 위기에서 방향이 선다\"고 말합니다.",
                "③ 노년운 안정형: 젊을 때 쌓은 선택들이 후반으로 갈수록 자산으로 전환. 노년기에 생활 안정, 사회적 영향력, 자기 주관 유지가 가능한 구조입니다.",
            ],
            cautions: [
                "🪨 고집으로 변질될 가능성: 옳다고 생각하면 쉽게 꺾지 않음, 타인의 조언을 늦게 수용할 수 있음.",
                "😤 몸보다 의지가 먼저 버팀: 체력 신호를 무시하는 경향, 참고 버티다 한 번에 무너질 위험.",
            ],
            boundarySentence: "턱이 강한 자는, 쉬는 날을 정해야 한다.",
            guide: ["✔ 버틸 일과 내려놓을 일 구분", "✔ 고집 ⭕ / 타협 ❌ 가 아니라 결단 ⭕ / 소통 ⭕", "✔ 체력 관리 = 장기 생존 전략"],
            interestingPoint: "각진 턱을 가진 사람은 중간에 사라지는 경우가 거의 없고, 시간이 지날수록 \"아직도 저 자리에 있네\"라는 말을 듣습니다. 즉, 화려함보다 존재 자체가 신뢰가 되는 얼굴입니다.",
        },
    },
    // 거북 도사의 총평: Ch1 사주 | Ch2 관상+사주 | Ch3 취업운 | Ch4 연애운 (버튼 클릭 시 해당 패널만 표시)
    totalAnalysis: [
        {
            id: "saju",
            label: "사주",
            title: "Ch1 사주",
            content: `당신의 타고난 기운은 '부드러운 불'에 가깝습니다.
태양처럼 눈에 띄기보다, 등불·촛불처럼 주변을 비추는 스타일이에요.
혼자 튀기보다는, 환경과 사람, 맡은 역할 속에서 가치가 커지는 타입입니다.

사주 구조를 쉽게 보면

• 땅(흙) 기운이 많아서 → 책임감, 버티는 힘, 맡은 일을 끝까지 가져가는 성향이 강해요.
• 규칙과 안정을 중요하게 여기는 구조라 → 갑자기 튀거나 한 방에 바꾸기보다, 정해진 틀 안에서 꾸준히 나아가는 편이에요.

한 줄로 풀면

"감정은 섬세한데, 선택은 가볍지 않고,
한 번 맡은 일은 끝까지 가는 사람"

✔ 즉흥보다는 책임
✔ 속도보다는 지속
✔ 단기 성과보다는 누적 성과

그래서 젊을 때보다, 중반 이후에 평가가 올라가는 구조예요.
시작한 일을 중도에 놓지 않고, 나이와 경험이 쌓일수록 인정받기 쉬운 흐름입니다.

💡 보완 팁
녹색(식물, 자연)을 가까이 하면 마음이 풀리고 융통성이 커져요. 쉬는 날을 정해서 기운을 채우는 것도 좋습니다.`
        },
        {
            id: "integration",
            label: "관상+사주",
            title: "Ch2 관상+사주",
            content: `이제 관상을 "부위별 분석"이 아니라,
사주를 현실에서 어떻게 쓰는 얼굴인지로 묶어볼게요.

🔥 사주에서 보이는 기질

• 부드러운 불 기운 → 따뜻하지만 조심스러움
• 땅(흙) 기운이 많아 → 책임감, 버팀, 관리 능력
• 규칙·안정을 중시하는 구조 → 정해진 틀 안에서 꾸준히 나아감

👤 관상에서 보이는 작동 방식

• 얼굴형 넓고 턱이 단단 → 맡은 역할을 내려놓지 않음
• 이마 높음 → 생각·기획 먼저
• 눈 균형 좋음 → 감정 컨트롤
• 입 표현 적음 → 말보다 행동
• 코 장기형 → 빠른 재물보다 축적·인내

🔗 종합하면

이 사람은

"머리로 먼저 설계하고,
결정하면 묵묵히 오래 가는 타입"

• 튀는 선택 ❌  • 한 방 인생 ❌  • 가벼운 관계 ❌

대신

✔ 신뢰 쌓이는 속도는 느리지만, 한 번 쌓이면 잘 무너지지 않습니다.

거북 도사의 한 줄: '천천히 하지만 쉼 없이 바다를 건너는' 끈기로, 중반 이후에 빛이 나는 구조입니다. 쉬는 날을 정하고, 말과 행동으로 신뢰를 쌓아가면 좋아요.`
        },
        {
            id: "job",
            label: "취업운",
            title: "Ch3 취업운",
            content: `이마가 높고 이마 중심이 맑은 편이라,
머리 쓰는 일·기획·분석·전략에 강합니다.

조직에서는 승진과 인정을 받는 흐름이 있어요.
논리와 구조를 살린 분야가 잘 맞습니다.

✔ 잘 맞는 방향
전문직, 연구·기획, 관리직, 공직, 회계·법률, 장기 프로젝트처럼 설계하고 끝까지 가져가는 일

✔ 취업·이직할 때
면접이나 중요한 자리에서는 자신감을 갖고, 실무 경험과 네트워크를 꾸준히 쌓으면 좋아요. 본인 역량을 인정해 줄 귀인이 생기는 때가 있으니, 새로운 만남을 소홀히 하지 마세요.`
        },
        {
            id: "love",
            label: "연애운",
            title: "Ch4 연애운",
            content: `마음은 깊지만 표현이 적어서, 처음엔 차가워 보일 수 있어요.
말보다 행동으로 보여주는 스타일이라, 시간이 지나면 "이 사람 말은 믿을 수 있다"는 인상을 줍니다.

연애는 느리게 시작해서 깊게 가는 편이에요.
즉각적인 호감보다, 누적된 신뢰로 관계가 굳어지는 타입입니다.

✔ 관계에서
• 중요한 일일수록 말로 확인해 주는 게 좋아요.
• 감정 표현은 의식적으로 한 단계씩 더해 보세요.
• 미소, 톤, 짧은 공감 멘트를 쓰면 오해가 줄어들어요.

💡 연애에서
"관심 없는 것 같다"는 오해가 생기기 쉬우니, 특히 초반에 마음을 전하는 말과 행동을 조금만 더해 보세요.`
        },
    ],
};

// --- Main Component ---
export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ images = [], onRestart, onNavigateToPhotoBooth, frameImage, fromPhotoBooth }) => {
    const [currentTab, setCurrentTab] = useState<"physiognomy" | "constitution" | "future" | "ssafy-cut">(
        "physiognomy"
    );
    const { setHideTurtleGuide } = useHideTurtleGuide();

    // 체질 분석 탭일 때만 플로팅 거북 도사 숨김
    useEffect(() => {
        setHideTurtleGuide(currentTab === "constitution");
        return () => setHideTurtleGuide(false);
    }, [currentTab, setHideTurtleGuide]);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [futureImage, setFutureImage] = useState<string | null>(null);
    const [savedFrameImage, setSavedFrameImage] = useState<string | null>(null);

    // 체질 분석 상태 (다른 탭 갔다 와도 마지막 결과 뷰 유지)
    const [constitutionPhase, setConstitutionPhase] = useState<ConstitutionPhase>("intro");
    const [constitutionSelectedMenuIdx, setConstitutionSelectedMenuIdx] = useState<number | null>(null);

    // localStorage에서 프레임 이미지 로드
    useEffect(() => {
        const loadFrameImage = () => {
            try {
                const saved = localStorage.getItem("photoBoothSets");
                if (saved) {
                    const sets = JSON.parse(saved);
                    if (sets.length > 0 && sets[0].frameImage) {
                        setSavedFrameImage(sets[0].frameImage);
                    }
                }
            } catch (error) {
                console.error("Failed to load frame image:", error);
            }
        };
        loadFrameImage();
        
        // frameImage prop이 변경될 때도 업데이트
        if (frameImage) {
            setSavedFrameImage(frameImage);
        }
    }, [frameImage]);

    // fromPhotoBooth가 true이고 frameImage가 있으면 싸피네컷 탭으로 이동
    useEffect(() => {
        if (fromPhotoBooth && (frameImage || savedFrameImage)) {
            setCurrentTab("ssafy-cut");
            // 탭으로 스크롤
            setTimeout(() => {
                const tabElement = document.querySelector('[data-tab="ssafy-cut"]');
                if (tabElement) {
                    tabElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
        }
    }, [fromPhotoBooth, frameImage, savedFrameImage]);

    // Mock QR code URL
    const shareUrl = `${window.location.origin}/result/abc123`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    const handleShare = () => {
        setIsShareModalOpen(true);
    };

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        const element = document.getElementById("analysis-result-container");
        if (!element) {
            setIsDownloading(false);
            return;
        }

        try {
            // --- 캡처 전 스타일 조정 ---
            // 1. 스크롤 영역을 찾아서 강제로 확장
            const scrollArea = element.querySelector(".overflow-y-auto");
            const originalMaxHeight = (scrollArea as HTMLElement)?.style.maxHeight;
            const originalOverflow = (scrollArea as HTMLElement)?.style.overflowY;
            
            if (scrollArea) {
                (scrollArea as HTMLElement).style.maxHeight = "none";
                (scrollArea as HTMLElement).style.overflowY = "visible";
            }

            // 2. 캡처 실행
            const canvas = await html2canvas(element, {
                useCORS: true,
                allowTaint: true,
                backgroundColor: "#f8fafc", // 배경색 지정
                scale: 2, // 고해상도
                logging: false,
            });

            // 3. 스타일 원상 복구
            if (scrollArea) {
                (scrollArea as HTMLElement).style.maxHeight = originalMaxHeight;
                (scrollArea as HTMLElement).style.overflowY = originalOverflow;
            }

            // 4. 다운로드
            const link = document.createElement('a');
            link.download = `관상분석결과_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error("다운로드 중 오류 발생:", error);
            alert("이미지 저장 중 오류가 발생했습니다.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        alert('링크가 복사되었습니다!');
    };

    return (
        <div className="w-full max-w-7xl mx-auto pb-20" id="analysis-result-container">
            {/* Tab Navigation */}
            <div className="flex justify-center mb-10 no-capture">
                <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl flex gap-1.5 shadow-clay-sm border-4 border-white">
                    {[
                        { id: "physiognomy", label: "관상 분석", icon: Brain },
                        { id: "constitution", label: "체질 분석", icon: Heart },
                        { id: "future", label: "미래의 나", icon: Camera },
                        { id: "ssafy-cut", label: "싸피네컷", icon: Images },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                data-tab={tab.id}
                                onClick={() => {
                                    setCurrentTab(tab.id as any);
                                }}
                                className={`
                            flex items-center gap-2 px-8 py-3.5 rounded-2xl transition-all duration-300 font-bold font-display
                            ${isActive
                                        ? "bg-brand-green text-white shadow-clay-xs scale-105"
                                        : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}
                        `}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* --- Tab 1: Physiognomy Analysis --- */}
                    {currentTab === "physiognomy" && (
                        <FaceAnalysis
                            image={images[0] || ""}
                            scores={MOCK_DATA.scores}
                            features={MOCK_DATA.features}
                        />
                    )}

                    {/* --- Tab 2 & 3: Constitution & Future --- */}
                    {(currentTab === "constitution" || currentTab === "future") && (
                        <StatsAnalysis
                            tab={currentTab}
                            images={images}
                            futureImage={futureImage}
                            onFutureImageUpload={setFutureImage}
                            constitutionPhase={constitutionPhase}
                            onConstitutionPhaseChange={setConstitutionPhase}
                            constitutionSelectedMenuIdx={constitutionSelectedMenuIdx}
                            onConstitutionSelectedMenuIdxChange={setConstitutionSelectedMenuIdx}
                        />
                    )}

                    {/* --- Tab 4: 싸피네컷 --- */}
                    {currentTab === "ssafy-cut" && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
                            {(frameImage || savedFrameImage) ? (
                                <div className="w-full max-w-4xl space-y-8">
                                    <div className="flex justify-center">
                                        <div className="relative w-full max-w-2xl">
                                            <img
                                                src={frameImage || savedFrameImage || ""}
                                                alt="싸피네컷"
                                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-center gap-4">
                                        <ActionButton
                                            variant="primary"
                                            onClick={() => {
                                                const link = document.createElement("a");
                                                link.download = "싸피네컷.png";
                                                link.href = frameImage || savedFrameImage || "";
                                                link.click();
                                            }}
                                        >
                                            <Download size={20} className="mr-2" />
                                            이미지 다운로드
                                        </ActionButton>
                                        {onNavigateToPhotoBooth && (
                                            <ActionButton
                                                variant="secondary"
                                                onClick={onNavigateToPhotoBooth}
                                            >
                                                <RotateCcw size={20} className="mr-2" />
                                                다시 찍기
                                            </ActionButton>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <p className="text-gray-500 text-lg">아직 싸피네컷이 없습니다.</p>
                                    {onNavigateToPhotoBooth && (
                                        <ActionButton
                                            variant="primary"
                                            onClick={onNavigateToPhotoBooth}
                                        >
                                            <Images size={20} className="mr-2" />
                                            싸피네컷 찍으러 가기
                                        </ActionButton>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-16 pb-10 no-capture">
                <ActionButton variant="secondary" onClick={onRestart} className="flex items-center gap-2">
                    <RotateCcw size={20} /> 처음으로
                </ActionButton>
                <ActionButton 
                    variant="secondary" 
                    onClick={handleDownload} 
                    className="flex items-center gap-2"
                    disabled={isDownloading}
                >
                    <Download size={20} /> {isDownloading ? "저장 중..." : "결과 다운로드"}
                </ActionButton>
                <ActionButton variant="primary" onClick={handleShare} className="flex items-center gap-2">
                    <QrCode size={20} /> QR로 공유하기
                </ActionButton>
            </div>

            {/* QR 공유 모달 */}
            <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} size="md">
                <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
                    결과 공유하기
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-4 rounded-2xl shadow-clay-sm border-4 border-brand-green-muted">
                            <img 
                                src={qrCodeUrl} 
                                alt="QR Code" 
                                className="w-48 h-48"
                            />
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            QR 코드를 스캔하면 결과 페이지로 이동합니다
                        </p>
                        <div className="flex gap-3 w-full">
                            <ActionButton 
                                variant="secondary" 
                                onClick={handleCopyLink}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                링크 복사
                            </ActionButton>
                            <ActionButton 
                                variant="primary" 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.download = 'qr-code.png';
                                    link.href = qrCodeUrl;
                                    link.click();
                                }}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> QR 저장
                            </ActionButton>
                        </div>
                    </div>
                </ModalBody>
            </Modal>
        </div>
    );
};
