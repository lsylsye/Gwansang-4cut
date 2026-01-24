import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  size = "md"
}) => {
  const sizeClasses = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl"
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full h-full sm:h-auto ${sizeClasses[size]} bg-white 
              sm:rounded-3xl shadow-2xl 
              sm:max-h-[85vh] overflow-hidden flex flex-col
              ${className}`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all z-50 bg-white/80"
            >
              <X size={20} />
            </button>

            {/* Scrollable Content - 패딩을 안쪽에서 처리 */}
            <div className="overflow-y-auto flex-1 pt-14 sm:pt-16 modal-scrollbar">
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ModalHeaderProps {
  children: React.ReactNode;
  description?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, description }) => (
  <div className="text-center mb-6 sm:mb-8">
    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 font-display">{children}</h3>
    {description && <p className="text-gray-500 font-sans text-sm">{description}</p>}
  </div>
);

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className = "", sticky = true }) => (
  <div className={`
    ${sticky ? 'sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 sm:p-0 sm:border-0 sm:bg-transparent sm:static sm:mt-6' : 'mt-6'}
    flex flex-col sm:flex-row gap-3 ${className}
  `}>
    {children}
  </div>
);
