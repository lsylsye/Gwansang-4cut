import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { devError } from "@/utils/logger";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { Sparkles, Download, Upload, X, CheckCircle2 } from "lucide-react";
import { API_ENDPOINTS } from "@/services/config";
import profileImage from "@/assets/profile.png";
import selfieImage from "@/assets/selfie.png";
import futureFilmLogoSrc from "@/assets/future_film_logo.svg";

interface FutureImages {
    current: string | null;
    year_10: string | null;
    year_30: string | null;
    year_50: string | null;
}

export interface FutureTabProps {
    futureImage?: string | null;
    onFutureImageUpload?: (image: string | null) => void;
}

export function FutureTab({ futureImage = null, onFutureImageUpload }: FutureTabProps) {
    const [futureImages, setFutureImages] = useState<FutureImages>({
        current: null,
        year_10: null,
        year_30: null,
        year_50: null,
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const futureFileInputRef = useRef<HTMLInputElement>(null);
    const futureCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleFutureImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            onFutureImageUpload?.(reader.result as string);
        };
        reader.readAsDataURL(file);

        setIsGenerating(true);
        setGenerateError(null);

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("model", "gemini-2.5-flash-image");

            const response = await fetch(API_ENDPOINTS.IMAGE_UPLOAD, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

            const data = await response.json();
            if (data.success) {
                setFutureImages({
                    current: data.current?.data_uri || null,
                    year_10: data.year_10?.data_uri || null,
                    year_30: data.year_30?.data_uri || null,
                    year_50: data.year_50?.data_uri || null,
                });
            } else {
                throw new Error(data.message || "이미지 생성 실패");
            }
        } catch (error) {
            devError("미래 이미지 생성 오류:", error);
            setGenerateError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleResetFutureImages = () => {
        setFutureImages({ current: null, year_10: null, year_30: null, year_50: null });
        setGenerateError(null);
        onFutureImageUpload?.(null);
    };

    const handleDownload = () => {
        if (!futureCanvasRef.current) {
            toast.error("이미지를 생성할 수 없습니다.");
            return;
        }
        if (!isCanvasReady) {
            toast.error("이미지가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        try {
            futureCanvasRef.current.toBlob((blob) => {
                if (!blob) {
                    devError("Canvas blob 생성 실패");
                    toast.error("이미지 저장에 실패했습니다.");
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.download = `미래의나_${new Date().getTime()}.png`;
                link.href = url;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);
            }, "image/png", 1.0);
        } catch (error) {
            devError("이미지 저장 오류:", error);
            toast.error("이미지 저장에 실패했습니다.");
        }
    };

    // Canvas에 프레임과 이미지 그리기
    useEffect(() => {
        if (!futureCanvasRef.current || !futureImage) return;

        const canvas = futureCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const paddingTop = 28;
        const gap = 12;
        const paddingLeft = 24;
        const logoPadding = 32;

        const loadAndDrawImages = async () => {
            const futureImageList = [
                futureImage,
                futureImages.year_10 || futureImage,
                futureImages.year_30 || futureImage,
                futureImages.year_50 || futureImage,
            ];

            const photoImages: (HTMLImageElement | null)[] = [];
            const imagePromises: Promise<HTMLImageElement>[] = [];

            for (let i = 0; i < 4; i++) {
                const imgSrc = futureImageList[i];
                if (imgSrc) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = imgSrc;
                    });
                    imagePromises.push(promise);
                    photoImages[i] = img;
                } else {
                    photoImages[i] = null;
                }
            }

            await Promise.all(imagePromises);

            const firstImg = photoImages[0];
            const imageWidth = firstImg ? Math.min(firstImg.width, 600) : 500;

            const slotHeights: number[] = [];
            for (let i = 0; i < 4; i++) {
                const img = photoImages[i];
                slotHeights[i] = img
                    ? Math.round((imageWidth * img.height) / img.width)
                    : Math.round(imageWidth * 0.68);
            }

            const targetWidth = imageWidth + paddingLeft * 2;
            const logoDisplayWidth = (targetWidth - 120) * 0.7;
            const totalContentHeight =
                paddingTop +
                slotHeights[0] + gap + slotHeights[1] + gap + slotHeights[2] + gap + slotHeights[3] +
                Math.round((logoDisplayWidth * 93) / 272) + logoPadding * 2;

            const dpr = Math.max(2, window.devicePixelRatio || 2);
            canvas.width = targetWidth * dpr;
            canvas.height = totalContentHeight * dpr;
            canvas.style.width = "360px";
            canvas.style.height = `${360 * (totalContentHeight / targetWidth)}px`;
            ctx.scale(dpr, dpr);

            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, targetWidth, totalContentHeight);

            let y = paddingTop;
            for (let i = 0; i < 4; i++) {
                const img = photoImages[i];
                const slotHeight = slotHeights[i];
                if (img) {
                    const imgAspect = img.width / img.height;
                    const slotAspect = imageWidth / slotHeight;
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(paddingLeft, y, imageWidth, slotHeight);
                    ctx.clip();

                    let drawWidth = imageWidth;
                    let drawHeight = slotHeight;
                    let drawX = paddingLeft;
                    let drawY = y;

                    if (imgAspect > slotAspect) {
                        drawHeight = slotHeight;
                        drawWidth = drawHeight * imgAspect;
                        drawX = paddingLeft - (drawWidth - imageWidth) / 2;
                    } else {
                        drawWidth = imageWidth;
                        drawHeight = drawWidth / imgAspect;
                        drawY = y - (drawHeight - slotHeight) / 2;
                    }

                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                    ctx.restore();
                }
                y += slotHeight + gap;
            }

            const logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src =
                typeof futureFilmLogoSrc === "string"
                    ? futureFilmLogoSrc
                    : (futureFilmLogoSrc as { default?: string })?.default ?? "";
            await new Promise<void>((resolve, reject) => {
                logoImg.onload = () => resolve();
                logoImg.onerror = () => reject(new Error("Logo load failed"));
            });
            const logoX = (targetWidth - logoDisplayWidth) / 2;
            const logoH = logoDisplayWidth * (logoImg.naturalHeight / logoImg.naturalWidth);
            ctx.drawImage(logoImg, logoX, totalContentHeight - logoPadding - logoH, logoDisplayWidth, logoH);

            setIsCanvasReady(true);
        };

        loadAndDrawImages().catch((error) => {
            devError("이미지 로드 오류:", error);
            setIsCanvasReady(false);
        });
    }, [futureImage, futureImages]);

    if (!futureImage) {
        return (
            <div className="flex flex-col items-center">
                <div className="max-w-2xl w-full">
                    <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                        <button onClick={() => futureFileInputRef.current?.click()} className="relative group mb-8">
                            <div className="absolute -inset-4 bg-brand-orange/20 rounded-[40px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                            <div className="w-28 h-28 bg-white rounded-[32px] flex flex-col items-center justify-center text-brand-orange shadow-clay-md border-4 border-orange-50 group-hover:border-brand-orange/30 transition-all duration-300 relative overflow-hidden group-hover:shadow-clay-lg group-hover:-translate-y-1 active:translate-y-0 active:shadow-clay-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Upload size={40} className="group-hover:scale-110 transition-transform duration-300" />
                                <span className="text-[10px] font-bold mt-1 text-brand-orange/60 group-hover:text-brand-orange transition-colors">UPLOAD</span>
                            </div>
                        </button>
                        <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">미래의 모습을 확인해볼까요?</h4>
                        <p className="text-sm text-brand-orange font-bold mb-8 flex items-center gap-1.5 justify-center bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100 shadow-sm">
                            <Sparkles size={14} className="animate-pulse" />
                            10년부터 50년 후 까지의 미래를 그려드립니다
                        </p>

                        <div className="bg-gray-50/40 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row items-center gap-6 mb-2 w-full max-w-xl">
                            <div className="flex gap-4 shrink-0">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-green-200 flex flex-col items-center justify-center overflow-hidden p-0.5">
                                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-green rounded-full flex items-center justify-center z-10 shadow-sm">
                                            <CheckCircle2 size={7} className="text-white" />
                                        </div>
                                        <img src={profileImage} alt="권장 예시" className="w-[95%] h-[95%] object-contain rounded-md" />
                                    </div>
                                    <span className="text-[9px] font-bold text-brand-green">여권/증명</span>
                                </div>
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="relative w-12 h-16 bg-white rounded-lg shadow-sm border border-red-100 flex items-center justify-center overflow-hidden p-0.5">
                                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-sm">
                                            <X size={7} className="text-white" strokeWidth={3} />
                                        </div>
                                        <img src={selfieImage} alt="잘못된 예시" className="w-[95%] h-[95%] object-contain rounded-md opacity-60 grayscale blur-[0.5px]" />
                                    </div>
                                    <span className="text-[9px] font-bold text-red-400">잘못된 예시</span>
                                </div>
                            </div>
                            <div className="flex-1 text-left space-y-1.5 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                <p className="text-[12px] text-gray-700 leading-relaxed break-keep">
                                    정확한 관상 분석을 위해 <span className="text-brand-green font-bold">여권 사진이나 증명사진</span>처럼 이목구비가 뚜렷하게 나온 정면 사진을 업로드해 주세요. 배경이 깨끗하고 밝은 곳에서 촬영된 사진이 가장 좋습니다.
                                </p>
                                <p className="text-[10px] text-gray-400 leading-relaxed break-keep">
                                    다만, 흐릿한 저화질 사진이나 얼굴 일부가 가려진 사진, 조명이 너무 어두운 야외 사진은 인식이 원활하지 않을 수 있으니 주의해 주세요.
                                </p>
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={futureFileInputRef}
                            onChange={handleFutureImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                    </GlassCard>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center">
                <div className="max-w-2xl w-full">
                    <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                        <div className="relative mb-8">
                            <div className="w-36 h-36 rounded-full bg-white border-4 border-brand-orange/30 shadow-clay-md flex items-center justify-center relative">
                                {[...Array(12)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-1 h-3 bg-gray-300 rounded-full"
                                        style={{ transform: `rotate(${i * 30}deg) translateY(-60px)`, transformOrigin: "center center" }}
                                    />
                                ))}
                                <div className="absolute w-3 h-3 bg-brand-orange rounded-full z-20 shadow-sm" />
                                <div className="absolute w-1.5 h-10 bg-gray-600 rounded-full origin-bottom animate-spin" style={{ animationDuration: "12s", animationTimingFunction: "linear", bottom: "50%" }} />
                                <div className="absolute w-1 h-14 bg-brand-orange rounded-full origin-bottom animate-spin" style={{ animationDuration: "2s", animationTimingFunction: "linear", bottom: "50%" }} />
                                <div className="absolute w-0.5 h-14 bg-red-500 rounded-full origin-bottom animate-spin" style={{ animationDuration: "1s", animationTimingFunction: "linear", bottom: "50%" }} />
                            </div>
                            <div className="absolute -inset-4 rounded-full border-2 border-dashed border-brand-orange/20 animate-spin" style={{ animationDuration: "8s" }} />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">시간을 달려가는 중...</h4>
                        <p className="text-sm text-gray-500 mb-4">AI가 당신의 10년, 30년, 50년 후 모습을 상상하고 있습니다.</p>
                        <div className="flex items-center gap-3 text-sm font-bold">
                            <span className="text-gray-400">현재</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-brand-orange/60 animate-pulse">+10년</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-brand-orange/40 animate-pulse" style={{ animationDelay: "0.3s" }}>+30년</span>
                            <span className="text-gray-300">→</span>
                            <span className="text-brand-orange/20 animate-pulse" style={{ animationDelay: "0.6s" }}>+50년</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-6">이미지 생성에 1~2분 정도 소요될 수 있습니다.</p>
                    </GlassCard>
                </div>
            </div>
        );
    }

    if (generateError) {
        return (
            <div className="flex flex-col items-center">
                <div className="max-w-2xl w-full">
                    <GlassCard className="p-12 border-8 border-white rounded-[48px] shadow-clay-lg bg-white/60 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <X size={40} className="text-red-500" />
                        </div>
                        <h4 className="text-2xl font-bold text-gray-800 mb-2 font-display">이미지 생성에 실패했습니다</h4>
                        <p className="text-sm text-red-500 mb-6">{generateError}</p>
                        <ActionButton variant="secondary" onClick={handleResetFutureImages} className="flex items-center gap-2">
                            <Upload size={18} /> 다시 시도하기
                        </ActionButton>
                    </GlassCard>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col gap-6">
                <canvas ref={futureCanvasRef} style={{ width: "360px" }} />
                <ActionButton
                    variant="secondary"
                    onClick={handleDownload}
                    disabled={!isCanvasReady}
                    className="flex items-center gap-2 bg-white"
                >
                    <Download size={20} />
                    사진 저장하기
                </ActionButton>
            </div>
        </div>
    );
}
