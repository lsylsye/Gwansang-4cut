import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "clay" | "flat" | "orange-primary" | "orange-secondary";
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const baseStyles = "rounded-2xl font-bold text-base py-6 px-8 transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center font-sans";
  const variants = {
    primary: "bg-[#00897B] hover:bg-[#00796B] text-white shadow-pixel hover:shadow-pixel-lg border-2 border-black",
    secondary: "bg-white hover:bg-gray-50 text-gray-800 border-2 border-black shadow-pixel hover:shadow-pixel-lg",
    outline: "bg-transparent text-gray-800 border-2 border-black hover:bg-black/5",
    clay: "bg-gradient-to-br from-[#FF8A65] to-[#FF7043] text-white border-0 shadow-none",
    flat: "bg-[#FF7043] hover:bg-[#FF5722] text-white border-0 shadow-none",
    "orange-primary": "bg-[#FF9800] hover:bg-[#F57C00] text-white shadow-pixel hover:shadow-pixel-lg border-2 border-black",
    "orange-secondary": "bg-white hover:bg-gray-50 text-gray-800 border-2 border-black shadow-pixel hover:shadow-pixel-lg",
  };

  return (
    <Button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </Button>
  );
};
