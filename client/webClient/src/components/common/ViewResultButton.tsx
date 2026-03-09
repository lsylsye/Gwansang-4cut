import React from "react";
import { Button } from "@/components/ui/core/button";
import { cn } from "@/utils";

interface ViewResultButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export const ViewResultButton: React.FC<ViewResultButtonProps> = ({
  label = "결과 보기",
  size = "default",
  className,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    default: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  return (
    <Button
      variant="pixel-primary"
      size={size}
      className={cn(
        "font-sans font-medium",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {label}
    </Button>
  );
};
