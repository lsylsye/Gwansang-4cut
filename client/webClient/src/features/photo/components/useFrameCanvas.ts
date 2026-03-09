import { useEffect, type RefObject } from "react";
import { devError } from "@/utils/logger";
import frame01 from "@/assets/frame_01.png";
import frame02 from "@/assets/frame_02.png";
import type { FrameType } from "./FrameSelectorView";

export function useFrameCanvas(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  frameType: FrameType | null,
  frameColor: string,
  selectedPhotoIndices: number[],
  photos: (string | null)[],
  customText: string
) {
  useEffect(() => {
    if (!canvasRef.current || !frameType) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetWidth = frameType === "vertical" ? 579 : 1800;
    const targetHeight = frameType === "vertical" ? 1740 : 1200;
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const loadAndDraw = async () => {
      const frameImg = new Image();
      frameImg.crossOrigin = "anonymous";
      const framePromise = new Promise<HTMLImageElement>((resolve, reject) => {
        frameImg.onload = () => resolve(frameImg);
        frameImg.onerror = reject;
        frameImg.src = frameType === "vertical" ? frame01 : frame02;
      });

      const photoImages: (HTMLImageElement | null)[] = [];
      const photoPromises: Promise<HTMLImageElement>[] = [];
      for (let i = 0; i < 4; i++) {
        const photoIdx = selectedPhotoIndices[i];
        if (photoIdx !== undefined && photos[photoIdx]) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const p = new Promise<HTMLImageElement>((resolve, reject) => {
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = photos[photoIdx]!;
          });
          photoPromises.push(p);
          photoImages[i] = img;
        } else {
          photoImages[i] = null;
        }
      }

      await Promise.all([framePromise, ...photoPromises]);
      ctx.fillStyle = frameColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      if (frameType === "vertical") {
        const paddingTop = targetHeight * 0.03;
        const gap = targetHeight * 0.024;
        const imageWidth = targetWidth * 0.85;
        const imageHeight = targetHeight * 0.187;
        for (let i = 0; i < 4; i++) {
          const img = photoImages[i];
          if (img) {
            const x = (targetWidth - imageWidth) / 2;
            const y = paddingTop + i * (imageHeight + gap);
            const imgAspect = img.width / img.height;
            const targetAspect = imageWidth / imageHeight;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, imageWidth, imageHeight);
            ctx.clip();
            let drawWidth = imageWidth;
            let drawHeight = imageHeight;
            let drawX = x;
            let drawY = y;
            if (imgAspect > targetAspect) {
              drawHeight = imageHeight;
              drawWidth = drawHeight * imgAspect;
              drawX = x - (drawWidth - imageWidth) / 2;
            } else {
              drawWidth = imageWidth;
              drawHeight = drawWidth / imgAspect;
              drawY = y - (drawHeight - imageHeight) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
          }
        }
      } else {
        const paddingTop = targetHeight * 0.06;
        const paddingLeft = targetWidth * 0.04;
        const paddingRight = targetWidth * 0.225;
        const paddingBottom = targetHeight * 0.065;
        const gap = targetWidth * 0.015;
        const contentWidth = targetWidth - paddingLeft - paddingRight;
        const contentHeight = targetHeight - paddingTop - paddingBottom;
        const imageWidth = (contentWidth - gap) / 2;
        const imageHeight = (contentHeight - gap) / 2;
        const imageAspect = 652 / 521;
        const actualImageHeight = imageWidth / imageAspect;
        const positions = [
          { x: paddingLeft, y: paddingTop },
          { x: paddingLeft + imageWidth + gap, y: paddingTop },
          { x: paddingLeft, y: paddingTop + imageHeight + gap },
          { x: paddingLeft + imageWidth + gap, y: paddingTop + imageHeight + gap },
        ];
        for (let i = 0; i < 4; i++) {
          const img = photoImages[i];
          if (img) {
            const { x, y } = positions[i];
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, imageWidth, actualImageHeight);
            ctx.clip();
            const imgAspect = img.width / img.height;
            let drawWidth = imageWidth;
            let drawHeight = actualImageHeight;
            let drawX = x;
            let drawY = y;
            if (imgAspect > imageAspect) {
              drawHeight = actualImageHeight;
              drawWidth = drawHeight * imgAspect;
              drawX = x - (drawWidth - imageWidth) / 2;
            } else {
              drawWidth = imageWidth;
              drawHeight = drawWidth / imgAspect;
              drawY = y - (drawHeight - actualImageHeight) / 2;
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
          }
        }
      }

      ctx.drawImage(frameImg, 0, 0, targetWidth, targetHeight);

      if (frameType === "horizontal" && customText) {
        ctx.save();
        const fontSize = Math.floor(targetWidth * 0.02);
        ctx.font = `${fontSize}px 'IsYun', cursive`;
        ctx.fillStyle = "#1F2937";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const textX = targetWidth * 0.883;
        const textY = targetHeight * 0.428;
        const textWidth = targetWidth * 0.065;
        const words = customText.split("");
        const lines: string[] = [];
        let currentLine = "";
        for (const char of words) {
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > textWidth && currentLine !== "") {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        const lineHeight = Math.floor(targetWidth * 0.02);
        const startY = textY - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, index) => {
          ctx.fillText(line, textX, startY + index * lineHeight, textWidth);
        });
        ctx.restore();
      }
    };

    loadAndDraw().catch(devError);
  }, [frameType, frameColor, selectedPhotoIndices, photos, customText]);
}
