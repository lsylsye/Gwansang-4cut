import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let cachedFaceLandmarker: FaceLandmarker | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (cachedFaceLandmarker) return cachedFaceLandmarker;
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  const base = {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  };
  try {
    cachedFaceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: { ...base, delegate: "GPU" },
        runningMode: "IMAGE",
        numFaces: 10,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
      }
    );
  } catch {
    cachedFaceLandmarker = await FaceLandmarker.createFromOptions(
      filesetResolver,
      {
        baseOptions: { ...base, delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: 10,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
      }
    );
  }
  return cachedFaceLandmarker;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * 단체 사진(data URL)에서 얼굴을 검출하고, 각 얼굴을 15~20% 패딩으로 크롭해
 * { count, crops }를 반환합니다.
 */
export async function detectFacesAndCrop(
  dataUrl: string
): Promise<{ count: number; crops: string[] }> {
  const faceLandmarker = await getFaceLandmarker();
  const img = await loadImage(dataUrl);
  if (img.decode) await img.decode();
  const result = faceLandmarker.detect(img);
  const count = result.faceLandmarks?.length ?? 0;
  const crops: string[] = [];
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const PADDING = 0.2; // 20% 패딩

  for (let i = 0; i < count; i++) {
    const landmarks = result.faceLandmarks![i];
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    for (const pt of landmarks) {
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
    const w = maxX - minX;
    const h = maxY - minY;
    const padX = w * PADDING;
    const padY = h * PADDING;
    let x0 = minX - padX;
    let y0 = minY - padY;
    let x1 = maxX + padX;
    let y1 = maxY + padY;
    x0 = Math.max(0, x0);
    y0 = Math.max(0, y0);
    x1 = Math.min(1, x1);
    y1 = Math.min(1, y1);

    const sw = (x1 - x0) * W;
    const sh = (y1 - y0) * H;
    const cw = Math.max(1, Math.round(sw));
    const ch = Math.max(1, Math.round(sh));
    const sx = x0 * W;
    const sy = y0 * H;

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    crops.push(canvas.toDataURL("image/jpeg"));
  }

  return { count, crops };
}
