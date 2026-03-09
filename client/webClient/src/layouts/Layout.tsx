import React from "react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden bg-gray-50">
      <div
        className="fixed inset-0 z-0 opacity-40 pointer-events-none hidden sm:block"
        style={{
          backgroundImage: `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(to right, #ccc 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-10 w-full min-h-screen flex flex-col font-sans">
        {children}
      </div>
    </div>
  );
};
