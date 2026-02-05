import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, X } from "lucide-react";
import { ViewResultButton } from "./ViewResultButton";

interface ToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  type?: "success" | "info" | "error";
  onAction?: () => void;
  actionLabel?: string;
  variant?: "default" | "morphism";
}

export const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  duration = 3000,
  type = "success",
  onAction,
  actionLabel = "결과 보기",
  variant = "default",
}) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-brand-green" />,
      textColor: "text-gray-900",
    },
    info: {
      icon: <CheckCircle2 className="w-5 h-5 text-blue-500" />,
      textColor: "text-gray-900",
    },
    error: {
      icon: <X className="w-5 h-5 text-red-500" />,
      textColor: "text-gray-900",
    },
  };

  const config = typeConfig[type];

  // 스타일 variant 설정
  const variantStyles = {
    default: "bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-lg",
    morphism: "bg-white backdrop-blur-md border-2 border-black rounded-xl px-5 py-4 shadow-pixel",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed top-1/2 -translate-y-[60%] right-4 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`${variantStyles[variant]} flex flex-col gap-3 min-w-[320px] max-w-[90vw] pointer-events-auto`}
          >
            <div className="flex items-center gap-3">
              {/* 아이콘 */}
              <div className="flex-shrink-0">
                {config.icon}
              </div>
              
              {/* 메시지 */}
              <div className="flex-1 min-w-0">
                <p className={`${config.textColor} font-semibold text-sm font-sans leading-tight`}>
                  {message}
                </p>
              </div>

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 액션 버튼 */}
            {onAction && (
              <div className="flex justify-center">
                <ViewResultButton
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  label={actionLabel}
                  size="sm"
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
