import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  pathname?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const showGridBackground = true;

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-gray-50">
      {showGridBackground && (
        <div
          className="fixed inset-0 z-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      )}

      <div className="relative z-10 w-full min-h-screen flex flex-col font-sans">
        {children}
      </div>
    </div>
  );
};