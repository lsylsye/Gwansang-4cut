import React from "react";
import { motion } from "motion/react";
import { Camera, ArrowRight, LucideIcon } from "lucide-react";
import { GlassCard } from "@/shared/ui/core/GlassCard";
import { cva, type VariantProps } from "class-variance-authority";
import { AnalyzeMode } from "@/shared/types";

const cardVariants = cva(
  "relative group cursor-pointer",
  {
    variants: {
      mode: {
        personal: "",
        group: "",
      },
    },
    defaultVariants: {
      mode: "personal",
    },
  }
);

const glowVariants = cva(
  "absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500",
  {
    variants: {
      mode: {
        personal: "bg-gradient-to-r from-brand-green to-brand-teal",
        group: "bg-gradient-to-r from-brand-orange to-brand-orange-light",
      },
    },
  }
);

const iconWrapperVariants = cva(
  "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300",
  {
    variants: {
      mode: {
        personal: "bg-brand-green-muted",
        group: "bg-brand-orange-soft",
      },
    },
  }
);

const badgeVariants = cva(
  "absolute -top-2 right-4 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20",
  {
    variants: {
      mode: {
        personal: "bg-brand-red border border-red-400/50",
        group: "bg-gray-900 border border-gray-700/50",
      },
    },
  }
);

interface ModeSelectionCardProps extends VariantProps<typeof cardVariants> {
  title: string;
  description: React.ReactNode;
  icon: LucideIcon;
  badgeText?: string;
  badgeIcon?: LucideIcon;
  onClick: () => void;
}

export const ModeSelectionCard: React.FC<ModeSelectionCardProps> = ({
  mode = "personal",
  title,
  description,
  icon: Icon,
  badgeText,
  badgeIcon: BadgeIcon,
  onClick,
}) => {
  const isPersonal = mode === "personal";

  return (
    <div className={cardVariants({ mode })} onClick={onClick}>
      {badgeText && (
        <div className={badgeVariants({ mode })}>
          {BadgeIcon && <BadgeIcon size={10} className={isPersonal ? "text-yellow-300 fill-yellow-300" : "text-yellow-400"} />}
          <span>{badgeText}</span>
        </div>
      )}
      
      <div className={glowVariants({ mode })} />
      
      <GlassCard 
        className={`relative p-6 hover:bg-white/80 transition-all duration-300 border border-white/50 flex items-center gap-5 ${
          isPersonal ? "group-hover:border-brand-green/50" : "group-hover:border-brand-orange/50"
        }`}
      >
        <div className={iconWrapperVariants({ mode })}>
          <Icon className={`w-8 h-8 ${isPersonal ? "text-brand-green" : "text-brand-orange-dark"}`} />
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
            <Camera className="w-3 h-3 text-gray-600" />
          </div>
        </div>
        
        <div className="flex-1 text-left">
          <h3 className={`text-xl font-bold font-display mb-1 transition-colors ${
            isPersonal ? "text-gray-800 group-hover:text-brand-green" : "text-gray-800 group-hover:text-brand-orange-dark"
          }`}>
            {title}
          </h3>
          <div className="text-gray-500 text-sm leading-tight font-hand">
            {description}
          </div>
        </div>
        
        <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors ${
          isPersonal ? "group-hover:bg-brand-green" : "group-hover:bg-brand-orange"
        }`}>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
        </div>
      </GlassCard>
    </div>
  );
};
