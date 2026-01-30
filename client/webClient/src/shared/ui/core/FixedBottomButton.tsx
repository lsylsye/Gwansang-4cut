import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

interface FixedBottomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "orange-primary";
  className?: string;
}

export const FixedBottomButton: React.FC<FixedBottomButtonProps> = ({
  children,
  variant = "primary",
  className,
  ...props
}) => {
  const baseStyles = "fixed bottom-0 left-0 right-0 z-50 rounded-none font-bold text-sm sm:text-base md:text-lg py-6 px-6 flex items-center justify-center font-sans whitespace-nowrap shadow-md";
  
  const variants = {
    primary: "bg-brand-green text-white",
    secondary: "bg-white text-gray-800",
    "orange-primary": "bg-brand-orange-vibrant text-white",
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
