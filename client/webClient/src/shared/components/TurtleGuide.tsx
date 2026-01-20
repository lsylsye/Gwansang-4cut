import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, MessageCircle } from "lucide-react";
import turtleImage from "@/assets/turtle.png";

interface TurtleGuideProps {
  message?: string;
  isThinking?: boolean;
}

export const TurtleGuide: React.FC<TurtleGuideProps> = ({ message, isThinking }) => {
  const [isOpen, setIsOpen] = useState(true);

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
                    <span className="flex items-center gap-2">
                      천기를 읽는 중이오...
                      <span className="animate-pulse">🐢</span>
                    </span>
                  ) : (
                    message
                  )}
                </p>
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
          <motion.button
            key="turtle-closed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 md:w-20 md:h-20 bg-[#00897B] hover:bg-[#00796B] text-white rounded-full flex items-center justify-center shadow-2xl transition-all pointer-events-auto"
            title="도사님 보기"
          >
            <MessageCircle size={32} className="md:w-10 md:h-10" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};