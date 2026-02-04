import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "primary-soft" | "secondary" | "outline" | "clay" | "flat" | "orange-primary" | "orange-secondary";
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
    primary: "bg-brand-green hover:bg-brand-green-deep text-white shadow-pixel hover:shadow-pixel-lg border-2 border-brand-black",
    "primary-soft": "bg-brand-green hover:bg-brand-green-deep text-white border-0 shadow-md hover:shadow-lg",
    secondary: "bg-white hover:bg-gray-50 text-gray-800 border-2 border-brand-black shadow-pixel hover:shadow-pixel-lg",
    outline: "bg-transparent text-gray-800 border-2 border-brand-black hover:bg-black/5",
    clay: "bg-gradient-to-br from-brand-orange-light to-brand-orange text-white border-0 shadow-none",
    flat: "bg-brand-orange hover:bg-brand-orange-deep text-white border-0 shadow-none",
    "orange-primary": "bg-brand-orange-vibrant hover:bg-brand-yellow-dark text-white shadow-pixel hover:shadow-pixel-lg border-2 border-brand-black",
    "orange-secondary": "bg-white hover:bg-gray-50 text-gray-800 border-2 border-brand-black shadow-pixel hover:shadow-pixel-lg",
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
