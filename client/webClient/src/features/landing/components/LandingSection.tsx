import React from "react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { Sparkles, Camera, ArrowRight, Star, Heart, User, Users, Upload, ShieldCheck, Utensils, Clock, Brain, Image } from "lucide-react";
import { motion } from "motion/react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { AnalyzeMode } from "@/shared/types";
import logoImage from "@/assets/film.png";

interface LandingSectionProps {
    onStart: (mode: AnalyzeMode) => void;
}

export const LandingSection: React.FC<LandingSectionProps> = ({ onStart }) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full max-w-6xl mx-auto min-h-[70vh]">

            {/* Left Content Area */}
            <div className="flex-1 text-center md:text-left space-y-6 z-10 w-full md:w-auto">


                <div className="space-y-2">
                    <motion.h1
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight drop-shadow-sm font-display"
                    >
                        <span className="block text-gray-800 mb-1">나의 운명,</span>
                        <span className="text-[#00897B] flex items-center justify-center md:justify-start gap-3">
                            관상네컷
                            <img
                                src={logoImage}
                                alt="Logo"
                                className="h-16 md:h-20 object-contain inline-block"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500 text-lg md:text-xl font-light pt-2"
                    >
                        100년 산 거북 도사가 당신과 모임의 운명을 찾아드립니다.
                    </motion.p>
                </div>

                {/* Feature Highlights (Horizontal Bar) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="hidden md:flex items-center w-full max-w-[540px] mt-10 bg-white/40 border border-white/50 rounded-2xl p-1.5 backdrop-blur-sm shadow-sm"
                >
                    {/* Label Area */}
                    <div className="shrink-0 px-4 py-2 flex items-center gap-2 border-r border-gray-400/20 mr-1">
                        <Sparkles className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">관상네컷만의 기능</span>
                    </div>

                    {/* Slider Area */}
                    <div className="flex-1 min-w-0">
                        <Slider
                            dots={false}
                            infinite={true}
                            speed={500}
                            slidesToShow={1}
                            slidesToScroll={1}
                            autoplay={true}
                            autoplaySpeed={3000}
                            arrows={false}
                            className="feature-slider-horizontal"
                            vertical={false}
                        >
                            <div className="px-2 outline-none">
                                <div className="flex items-center gap-3 py-1 cursor-default">
                                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200/50">
                                        <Brain className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-gray-800 leading-tight">정확도 중심의 관상 분석</span>
                                        <span className="text-[11px] text-gray-600 leading-tight mt-0.5">최신 AI 기술을 사용한 얼굴 인식 프로그램</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 outline-none">
                                <div className="flex items-center gap-3 py-1 cursor-default">
                                    <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 border border-yellow-200/50">
                                        <Image className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-gray-800 leading-tight">SSAFY 프레임 인생네컷</span>
                                        <span className="text-[11px] text-gray-600 leading-tight mt-0.5">우리들만의 특별한 프레임</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 outline-none">
                                <div className="flex items-center gap-3 py-1 cursor-default">
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200/50">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-gray-800 leading-tight">미래의 내 모습</span>
                                        <span className="text-[11px] text-gray-600 leading-tight mt-0.5">AI가 예측하는 미래 얼굴</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 outline-none">
                                <div className="flex items-center gap-3 py-1 cursor-default">
                                    <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0 border border-pink-200/50">
                                        <Users className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-gray-800 leading-tight">우리 모임 궁합</span>
                                        <span className="text-[11px] text-gray-600 leading-tight mt-0.5">친구들과의 관상 케미 점수</span>
                                    </div>
                                </div>
                            </div>
                            <div className="px-2 outline-none">
                                <div className="flex items-center gap-3 py-1 cursor-default">
                                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 border border-green-200/50">
                                        <Utensils className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <span className="text-sm font-bold text-gray-800 leading-tight">맞춤 식단 추천</span>
                                        <span className="text-[11px] text-gray-600 leading-tight mt-0.5">체질과 관상에 맞는 식단</span>
                                    </div>
                                </div>
                            </div>
                        </Slider>
                    </div>
                </motion.div>
            </div>

            {/* Right Content Area - Selection Cards */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="w-full md:w-[480px] z-10 flex flex-col gap-4"
            >
                {/* Security Disclaimer (Moved to top) */}
                <div className="mb-1 text-center">
                    <p className="text-xs text-gray-500/90 flex items-center justify-center gap-1.5 font-hand bg-white/40 py-1.5 px-3 rounded-full border border-white/50 backdrop-blur-sm inline-flex shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
                        <span>업로드된 사진은 분석 후 즉시 폐기되며 절대 저장되지 않습니다.</span>
                    </p>
                </div>

                {/* Option 1: Personal Face */}
                <div
                    className="relative group cursor-pointer"
                    onClick={() => onStart("personal")}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00897B] to-[#4DB6AC] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                    <GlassCard className="relative p-6 hover:bg-white/80 transition-all duration-300 border border-white/50 group-hover:border-[#00897B]/50 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-[#E0F2F1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <User className="w-8 h-8 text-[#00897B]" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                                <Camera className="w-3 h-3 text-gray-600" />
                            </div>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#00897B] font-display mb-1">
                                개인 관상
                            </h3>
                            <p className="text-gray-500 text-sm leading-tight font-hand">
                                카메라로 직접 촬영하여<br />나의 관상을 즉시 분석해보세요.
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#00897B] flex items-center justify-center transition-colors">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                    </GlassCard>
                    {/* Badge */}
                    <div className="absolute -top-2 right-4 bg-[#FF5252] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-red-400/50 flex items-center gap-1 z-20">
                        <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300" />
                        <span>추천</span>
                    </div>
                </div>

                {/* Option 2: Group Face */}
                <div
                    className="relative group cursor-pointer"
                    onClick={() => onStart("group")}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF7043] to-[#FFAB91] rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                    <GlassCard className="relative p-6 hover:bg-white/80 transition-all duration-300 border border-white/50 group-hover:border-[#FF7043]/50 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-[#FBE9E7] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-8 h-8 text-[#D84315]" />
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                                <Camera className="w-3 h-3 text-gray-600" />
                            </div>
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-[#D84315] font-display mb-1">
                                모임 관상
                            </h3>
                            <p className="text-gray-500 text-sm leading-tight font-hand">
                                친구들과 함께 촬영하여<br />우리 모임의 기운을 확인해보세요.
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#FF7043] flex items-center justify-center transition-colors">
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                    </GlassCard>
                    {/* Badge */}
                    <div className="absolute -top-2 right-4 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-gray-700/50 flex items-center gap-1 z-20">
                        <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                        <span>HOT</span>
                    </div>
                </div>

            </motion.div>

            {/* Background Decorative Elements */}
            <div className="absolute top-10 left-0 w-64 h-64 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
        </div>
    );
};
