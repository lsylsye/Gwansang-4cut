"use strict";
/**
 * 이미지에서 RGB 픽셀 추출 모듈
 * MediaPipe 랜드마크 좌표를 이미지 픽셀 좌표로 변환하여 색상 추출
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractColorData = extractColorData;
exports.formatColorDataForPrompt = formatColorDataForPrompt;
const fs = __importStar(require("fs"));
/**
 * 이미지 로드 및 픽셀 추출 (sharp 사용)
 */
async function loadImagePixels(imagePath) {
    try {
        // sharp는 optional dependency로 처리
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const sharp = require("sharp");
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        const { data, info } = await image
            .raw()
            .removeAlpha()
            .toBuffer({ resolveWithObject: true });
        return {
            width: info.width,
            height: info.height,
            data: data,
        };
    }
    catch (error) {
        // 실제 에러 메시지 포함
        const errorMsg = error instanceof Error ? error.message : String(error);
        throw new Error(`❌ 이미지 로드 실패: ${imagePath}\n` +
            `   에러: ${errorMsg}\n` +
            `   sharp 패키지가 필요합니다: npm install sharp\n` +
            `   또는 이미지 없이 랜드마크만 사용하세요.`);
    }
}
/**
 * 정규화 좌표(0~1)를 픽셀 좌표로 변환
 */
function normalizedToPixel(normX, normY, width, height) {
    return {
        x: Math.floor(normX * width),
        y: Math.floor(normY * height),
    };
}
/**
 * 픽셀 좌표에서 RGB 값 추출
 */
function getPixelRGB(x, y, width, height, data) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
        return null;
    }
    const idx = (y * width + x) * 3; // RGB
    if (idx + 2 >= data.length) {
        return null;
    }
    return {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
    };
}
/**
 * ROI 영역의 평균 RGB 계산
 */
function getRegionRGB(landmarks, indices, width, height, data) {
    const pixels = [];
    for (const idx of indices) {
        const landmark = landmarks.find((l) => l.index === idx) || landmarks[idx];
        if (!landmark)
            continue;
        const pixel = normalizedToPixel(landmark.x, landmark.y, width, height);
        const rgb = getPixelRGB(pixel.x, pixel.y, width, height, data);
        if (rgb) {
            pixels.push(rgb);
        }
    }
    if (pixels.length === 0)
        return null;
    const avg = pixels.reduce((acc, p) => ({
        r: acc.r + p.r,
        g: acc.g + p.g,
        b: acc.b + p.b,
    }), { r: 0, g: 0, b: 0 });
    return {
        r: Math.floor(avg.r / pixels.length),
        g: Math.floor(avg.g / pixels.length),
        b: Math.floor(avg.b / pixels.length),
    };
}
/**
 * RGB를 HSV로 변환 (Hue 계산용)
 */
function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let h = 0;
    if (diff !== 0) {
        if (max === r) {
            h = ((g - b) / diff) % 6;
        }
        else if (max === g) {
            h = (b - r) / diff + 2;
        }
        else {
            h = (r - g) / diff + 4;
        }
    }
    h = Math.round(h * 60);
    if (h < 0)
        h += 360;
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    return { h, s, v };
}
/**
 * MediaPipe 랜드마크와 이미지에서 색상 데이터 추출
 */
async function extractColorData(imagePath, landmarks) {
    // 상대 경로를 절대 경로로 변환
    const path = require("path");
    const absolutePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.resolve(process.cwd(), imagePath);
    if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️ 이미지 파일 없음: ${absolutePath} - 색상 분석 건너뜀`);
        return {};
    }
    try {
        const { width, height, data } = await loadImagePixels(absolutePath);
        const colorData = {};
        // 1) 눈 흰자 영역 (sclera_redness)
        // 좌측 눈: 33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246
        // 우측 눈: 263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466
        const eyeLeftIndices = [33, 7, 133, 144, 145, 153, 154, 155, 157, 158, 159, 160, 161];
        const eyeRightIndices = [263, 249, 362, 373, 374, 380, 381, 382, 384, 385, 386, 387, 388];
        const eyeLeftRGB = getRegionRGB(landmarks, eyeLeftIndices, width, height, data);
        if (eyeLeftRGB) {
            colorData.eye_region_rgb = eyeLeftRGB;
            // R-G 차이로 붉음 판정
            colorData.sclera_redness = eyeLeftRGB.r - eyeLeftRGB.g;
        }
        // 2) 코끝 영역 (nose_tip_redness)
        const noseTipIndices = [4, 5, 6, 19, 20, 94, 125, 141, 235, 236, 3, 51, 48, 115, 131, 134, 102, 49, 220, 305, 281, 363, 360, 279, 358, 429, 420, 456, 248, 281];
        const noseTipRGB = getRegionRGB(landmarks, noseTipIndices, width, height, data);
        if (noseTipRGB) {
            colorData.nose_tip_rgb = noseTipRGB;
            colorData.nose_tip_redness = noseTipRGB.r - (noseTipRGB.g + noseTipRGB.b) / 2;
        }
        // 3) 입술 영역 (lip_redness)
        const lipIndices = [
            61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 13, 82, 81, 80, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 12, 268, 271, 272, 407, 408, 409, 415, 310, 311, 312, 13, 82, 81, 80, 78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308
        ];
        const lipRGB = getRegionRGB(landmarks, lipIndices, width, height, data);
        if (lipRGB) {
            colorData.lip_region_rgb = lipRGB;
            const hsv = rgbToHsv(lipRGB.r, lipRGB.g, lipRGB.b);
            // Hue가 빨강 계열(0~30, 330~360)이면 붉음, 어두우면 검푸름
            if ((hsv.h < 30 || hsv.h > 330) && hsv.s > 0.3) {
                colorData.lip_redness = hsv.h < 30 ? hsv.h : 360 - hsv.h; // 빨강 정도
            }
            else if (hsv.v < 0.3) {
                colorData.lip_redness = -1; // 검푸름
            }
        }
        // 4) 관자 영역 (temple_spot_score) - 간단히 명도 분산으로 근사
        const templeLeftIndices = [234, 127, 162, 21, 54, 103, 67, 109];
        const templeRightIndices = [454, 356, 389, 251, 284, 332, 297, 338];
        const templeLeftRGB = getRegionRGB(landmarks, templeLeftIndices, width, height, data);
        const templeRightRGB = getRegionRGB(landmarks, templeRightIndices, width, height, data);
        if (templeLeftRGB && templeRightRGB) {
            const brightnessL = (templeLeftRGB.r + templeLeftRGB.g + templeLeftRGB.b) / 3;
            const brightnessR = (templeRightRGB.r + templeRightRGB.g + templeRightRGB.b) / 3;
            const brightnessVar = Math.abs(brightnessL - brightnessR);
            colorData.temple_spot_score = brightnessVar; // 차이가 크면 잡티 가능성
        }
        // 5) 이마 주름 (forehead_wrinkle_score) - 간단히 명도 분산으로 근사
        const foreheadIndices = [10, 151, 337, 299, 333, 298, 301, 368, 264, 447, 366, 401, 435, 410, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
        const foreheadRGB = getRegionRGB(landmarks, foreheadIndices, width, height, data);
        if (foreheadRGB) {
            // 여러 점의 명도 분산 계산 (간단 버전)
            const brightness = (foreheadRGB.r + foreheadRGB.g + foreheadRGB.b) / 3;
            // 실제로는 여러 점의 분산을 계산해야 하지만, 여기선 평균 명도로 근사
            colorData.forehead_wrinkle_score = 255 - brightness; // 어두울수록 주름 가능성
        }
        return colorData;
    }
    catch (error) {
        console.warn(`⚠️ 색상 추출 실패: ${error}`);
        return {};
    }
}
/**
 * 색상 데이터를 텍스트로 포맷팅
 */
function formatColorDataForPrompt(colorData) {
    if (Object.keys(colorData).length === 0) {
        return "### 기색/색상 데이터: 없음 (이미지 미제공)";
    }
    let text = "### 기색/색상 데이터 (ROI 픽셀 분석)\n\n";
    if (colorData.eye_region_rgb) {
        const { r, g, b } = colorData.eye_region_rgb;
        text += `- **눈 기색**: RGB(${r}, ${g}, ${b})`;
        if (colorData.sclera_redness !== undefined) {
            text += `, 붉음 지수: ${colorData.sclera_redness.toFixed(1)} ${colorData.sclera_redness > 10 ? "(눈 핏발 가능)" : "(정상)"}`;
        }
        text += "\n";
    }
    if (colorData.nose_tip_rgb) {
        const { r, g, b } = colorData.nose_tip_rgb;
        text += `- **코끝 기색**: RGB(${r}, ${g}, ${b})`;
        if (colorData.nose_tip_redness !== undefined) {
            text += `, 붉음 지수: ${colorData.nose_tip_redness.toFixed(1)} ${colorData.nose_tip_redness > 15 ? "(붉음)" : "(정상)"}`;
        }
        text += "\n";
    }
    if (colorData.lip_region_rgb) {
        const { r, g, b } = colorData.lip_region_rgb;
        text += `- **입술 기색**: RGB(${r}, ${g}, ${b})`;
        if (colorData.lip_redness !== undefined) {
            if (colorData.lip_redness > 0) {
                text += `, 붉음 정도: ${colorData.lip_redness.toFixed(1)}° (붉은 입술)`;
            }
            else {
                text += `, 검푸름 (어두운 기색)`;
            }
        }
        text += "\n";
    }
    if (colorData.temple_spot_score !== undefined) {
        text += `- **관자 잡티 점수**: ${colorData.temple_spot_score.toFixed(1)} ${colorData.temple_spot_score > 20 ? "(잡티 가능)" : "(깨끗)"}\n`;
    }
    if (colorData.forehead_wrinkle_score !== undefined) {
        text += `- **이마 주름 점수**: ${colorData.forehead_wrinkle_score.toFixed(1)} ${colorData.forehead_wrinkle_score > 100 ? "(주름 가능)" : "(매끄러움)"}\n`;
    }
    return text;
}
//# sourceMappingURL=color.js.map