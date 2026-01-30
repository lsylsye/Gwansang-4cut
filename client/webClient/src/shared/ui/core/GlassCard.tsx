import { HTMLMotionProps, motion } from "motion/react";
import { cn } from "@/shared/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white/60 backdrop-blur-md border-2 border-black rounded-xl p-3 sm:p-6 shadow-pixel",
        hoverEffect && "hover:-translate-y-1 hover:shadow-pixel-lg transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
