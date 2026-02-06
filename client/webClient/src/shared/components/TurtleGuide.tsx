import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Camera } from "lucide-react";
import turtleImage from "@/assets/turtle.png";
import turtleShellImage from "@/assets/turtle_shell.png";
import { ROUTES } from "@/shared/config/routes";

const AUTO_CLOSE_MS = 10000; // 멘트 표시 후 10초 뒤 말풍선 자동 닫기

interface TurtleGuideProps {
  message?: string;
  isThinking?: boolean;
  thinkingMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** 경로가 바뀌어 가이드가 다시 보일 때 말풍선 열기 (hideTurtleGuide → 표시로 전환 시) */
  pathname?: string;
  /** true면 10초 후 자동 닫기 없이 사용자가 닫을 때까지 유지 (예: 분석 중 페이지) */
  disableAutoClose?: boolean;
}

export const TurtleGuide: React.FC<TurtleGuideProps> = ({ message, isThinking, thinkingMessage, actionLabel, onAction, pathname, disableAutoClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // hideTurtleGuide 상태에서 다른 페이지로 이동해 가이드가 다시 보이면 말풍선 열기
  useEffect(() => {
    if (pathname != null) setIsOpen(true);
  }, [pathname]);

  // 멘트가 바뀔 때마다 말풍선 열고, disableAutoClose가 아니면 10초 후 자동 닫기
  useEffect(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setIsOpen(true);
    if (disableAutoClose) return;
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      autoCloseTimerRef.current = null;
    }, AUTO_CLOSE_MS);
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [message, thinkingMessage, isThinking, disableAutoClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end md:bottom-8 md:right-8">
      <AnimatePresence>
        {message && isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="mb-6 mr-6 max-w-[280px] md:max-w-sm pointer-events-auto origin-bottom-right relative"
          >
            {/* Toggle button on speech bubble */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 z-30 w-7 h-7 bg-white border-2 border-border text-muted-foreground hover:text-foreground rounded-full flex items-center justify-center shadow-md transition-all hover:scale-110 active:scale-95"
              title="도사님 접기"
            >
              <ChevronDown size={16} />
            </button>

            {/* 3D Claymorphism Bubble Container with Drop Shadow Filter */}
            <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]">

              {/* Main Bubble Body with Glassmorphism */}
              <div className="bg-white backdrop-blur-md rounded-[24px] px-6 py-5 relative z-10 text-gray-800 border border-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
                <p className="relative z-20 font-medium text-base md:text-lg leading-relaxed whitespace-pre-line font-hand break-keep">
                  {isThinking ? (
                    thinkingMessage ?? (
                      <span className="flex items-center gap-2">
                        천기를 읽는 중이오...
                        <span className="animate-pulse">🐢</span>
                      </span>
                    )
                  ) : (
                    message
                  )}
                </p>
                {actionLabel && onAction && (!isThinking || thinkingMessage) && (
                  <div className="mt-4 relative overflow-hidden rounded-xl">
                    {/* Shimmer: 다채로운 빛줄기 (청록→민트→골드→흰색) 왼쪽 → 오른쪽 */}
                    <motion.div
                      className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                      style={{
                        width: "70%",
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(100,255,255,0.5) 15%, rgba(160,255,230,0.75) 32%, rgba(255,255,180,0.7) 50%, rgba(255,255,255,0.9) 65%, rgba(180,255,220,0.6) 82%, transparent 100%)",
                      }}
                      animate={{ x: ["-100%", "250%"] }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        repeatDelay: 0.8,
                      }}
                    />
                    <motion.button
                      type="button"
                      onClick={onAction}
                      className={`relative z-0 w-full py-2 px-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-pixel flex items-center justify-center gap-2 text-white ${
                        pathname === ROUTES.ANALYZING
                          ? "bg-brand-green hover:bg-brand-green-deep shadow-[0_2px_8px_rgba(0,137,123,0.3)]"
                          : "bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-500 hover:from-pink-500 hover:via-fuchsia-500 hover:to-violet-600"
                      }`}
                      animate={{ scale: [1, 1.03, 1] }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Camera size={18} strokeWidth={2.5} />
                      {actionLabel}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Triangle Tail using border trick with Glassmorphism */}
              <div className="absolute -bottom-4 right-12">
                <svg width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 16C16 16 4 4 2 2C1 1 0 0 0 0H32C32 0 31 1 30 2C28 4 16 16 16 16Z" fill="white" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="turtle-open"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -8, 0],
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative pointer-events-auto"
          >
            <div
              className="w-[100px] h-[100px] relative drop-shadow-2xl cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <img
                src={turtleImage}
                alt="Turtle Fortune Teller"
                className="w-full h-full object-contain filter drop-shadow-lg"
              />
            </div>
          </motion.div>
        ) : (
          <div className="relative flex flex-col items-end">
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  className="mb-3 px-4 py-2 bg-white text-gray-600 rounded-2xl shadow-xl border border-white/40 text-sm font-bold font-hand whitespace-nowrap z-50 pointer-events-none relative"
                >
                  도사님을 두드려보세요!
                  <div className="absolute -bottom-1 right-8 w-2 h-2 bg-white rotate-45 border-r border-b border-white/40" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button
              key="turtle-closed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsOpen(true);
                setIsHovered(false);
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-16 h-16 md:w-20 md:h-20 bg-white hover:bg-gray-50 text-brand-green rounded-full flex items-center justify-center shadow-2xl transition-all pointer-events-auto overflow-hidden border-4 border-brand-green/20"
              title="도사님 보기"
            >
              <img
                src={turtleShellImage}
                alt="도사님 보기"
                className="w-full h-full object-contain p-2"
              />
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};