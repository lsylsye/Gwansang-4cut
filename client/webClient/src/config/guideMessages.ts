import {
  ROUTES,
  isPersonalSharePath,
  isGroupSharePath,
} from "@/routes/routes";

export interface GetGuideMessageParams {
  pathname: string;
  isAnalyzing: boolean;
  personalUploadSajuStep?: boolean;
  personalUploadCameraVisible?: boolean;
  groupUploadCameraVisible?: boolean;
  personalResultTab?: string | null;
  groupResultTab?: "overall" | "pairs" | null;
}

/**
 * 거북도사 가이드 멘트. 경로·분석 여부·업로드/결과 단계에 따라 반환 문자열 결정.
 */
export function getGuideMessage(params: GetGuideMessageParams): string {
  const {
    pathname,
    isAnalyzing,
    personalUploadSajuStep = false,
    personalUploadCameraVisible = false,
    groupUploadCameraVisible = false,
    personalResultTab = null,
    groupResultTab = null,
  } = params;

  if (isAnalyzing && (isPersonalSharePath(pathname) || isGroupSharePath(pathname))) {
    return "기다리는 동안 심심하지 않게 작은 선물을 준비했소. \n아래 버튼으로 가 보시게.";
  }
  if (isPersonalSharePath(pathname)) {
    return "허허, 누군가의 관상 분석 결과를 보러 왔구먼! \n자네도 한번 분석받아 보고 싶지 않은가?";
  }

  switch (pathname) {
    case ROUTES.HOME:
      return "허허, 어서 오시게! \n천기를 읽는 거북도사가 자네를 기다리고 있었다네. \n어떤 관상이 궁금하여 나를 찾아왔는가?";
    case ROUTES.PERSONAL_UPLOAD:
      if (personalUploadSajuStep)
        return "태어난 시간을 안다면 더 정확하게 \n분석해 줄 수 있다네. 아는 대로 골라 넣어 주시게.";
      if (personalUploadCameraVisible)
        return "자네의 얼굴에 삼라만상이 담겨 있구먼. \n내 신통한 거울에 얼굴을 비추어 보게나. \n숨겨진 운명을 내가 낱낱이 읽어보리다.";
      return "허허, 개인 관상을 보러오셨구먼. \n깨끗이 잘 나온 사진 하나 건네보시오.";
    case ROUTES.GROUP_UPLOAD:
      if (groupUploadCameraVisible)
        return "이 거울에는 최대 7명까지 비춰질 수 있네. \n모두가 잘 보이게 모여 보게.";
      return "허허, 모임 궁합을 보러 왔구먼! \n사진을 주거나, 직접 한 자리에 모여 보게. \n자네들 사이의 기운을 내가 한 번 짚어보리다.";
    case ROUTES.GROUP_UPLOAD_MEMBERS:
      return "이제 각 멤버의 이름과 생년월일을 입력해 주게. \n태어난 시간을 안다면 더 정확한 궁합을 알 수 있을 걸세.";
    case ROUTES.ANALYZING:
      return "기다리는 동안 심심하지 않게 작은 선물을 준비했소. \n아래 버튼으로 가 보시게.";
    case ROUTES.PERSONAL_RESULT: {
      const tab = personalResultTab ?? "physiognomy";
      if (tab === "constitution")
        return "자네의 체질과 오행을 살펴보는 구간이구먼. \n사주에 맞는 음식과 기운을 내가 짚어 보았네. \n꼭 챙겨 먹게나.";
      if (tab === "future")
        return "미래의 자네 모습을 그려 보는 구간이야. \n10년에서 50년 후까지, 얼굴이 어떻게 변할지 \n한번 구경해 보시게.";
      if (tab === "ssafy-cut")
        return "싸피네컷이구먼! \n사진을 찍어서 프레임에 담아 두었나? \n없다면 어서 찍으러 가 보시게.";
      return "허허! 관상이란 타고난 얼굴만 보는 것이 아니오. \n 자네가 걸어온 시간과 마음이 비춰지는 법이지. \n자, 이제 결과를 한 번 보세나.";
    }
    case ROUTES.GROUP_RESULT:
      if (groupResultTab === "pairs")
        return "원하는 상대를 클릭하면 세부 궁합을\n확인할 수 있다네. 어서 클릭해 보시게.";
      return "오호라, 이 모임의 기운이 보통이 아니구먼.\n모임 전체부터 일대일 궁합까지 정리해 두었네.\n자, 찬찬히 읽어보시게.";
    case ROUTES.RANKING:
      return "허허, 전국 방방곡곡의 인연들이 다 모였구먼! \n자네들의 모임은 과연 몇 번째 기운을 가졌을꼬?";
    case ROUTES.PHOTO_BOOTH:
      return "허허, 사진 네컷을 찍는구먼! \n기다리는 동안 즐거운 추억을 남기게나.";
    default:
      return "";
  }
}
