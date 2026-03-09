import React, { useState, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useIsMobile } from "@/hooks/use-mobile";

interface Tab {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    activeColor?: "green" | "orange";
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
    tabs,
    activeTab,
    onTabChange,
    activeColor = "green",
}) => {
    const [isSticky, setIsSticky] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);
    const isMobile = useIsMobile();

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;

            // 스크롤이 내려갔을 때 sticky 활성화
            const shouldBeSticky = scrollY > 0;
            setIsSticky(shouldBeSticky);
        };

        // 초기 상태 설정
        handleScroll();

        // 스크롤 이벤트 리스너 등록 (블로그 예제 방식)
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleScroll);
        
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    const activeBgColor = activeColor === "green" ? "bg-brand-green" : "bg-brand-orange";

    return (
        <>
            <div
                ref={navRef}
                className={`flex w-full min-w-0 ${isMobile ? 'justify-start' : 'justify-center'} mb-10 transition-all duration-300 ${
                    isSticky ? "fixed left-0 right-0 z-50 pt-4 pb-2" : ""
                }`}
                style={isSticky ? { 
                    top: -16,
                    left: 0,
                    right: 0,
                    position: 'fixed'
                } : {}}
            >
            <div className={`${isMobile ? 'w-full min-w-0' : 'w-fit'} ${isMobile ? 'bg-white' : 'bg-white/80 sm:backdrop-blur-md'} p-1.5 sm:p-2 rounded-none sm:rounded-3xl sm:shadow-clay-sm border sm:border-2 sm:border-4 border-gray-200 sm:border-white`}>
                {isMobile ? (
                    <Swiper
                        modules={[FreeMode]}
                        freeMode={true}
                        slidesPerView="auto"
                        spaceBetween={0}
                        className="!overflow-visible"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <SwiperSlide 
                                    key={tab.id} 
                                    style={{ 
                                        minWidth: 0,
                                        width: `${100 / tabs.length}%`,
                                        flexShrink: 0,
                                    }}
                                >
                                    <button
                                        data-tab={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={`
                                            w-full flex items-center justify-center gap-1 px-2 py-3 rounded-xl transition-all duration-300 font-bold font-display text-xs whitespace-nowrap
                                            ${isActive
                                                ? `${activeBgColor} text-white shadow-clay-xs scale-105`
                                                : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}
                                        `}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                ) : (
                    <div className="flex justify-center gap-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    data-tab={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-5 md:px-8 py-2.5 md:py-3.5 rounded-2xl transition-all duration-300 font-bold font-display text-sm md:text-base whitespace-nowrap
                                        ${isActive
                                            ? `${activeBgColor} text-white shadow-clay-xs scale-105`
                                            : "hover:bg-gray-100 text-gray-400 hover:text-gray-700"}
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
        </>
    );
};
