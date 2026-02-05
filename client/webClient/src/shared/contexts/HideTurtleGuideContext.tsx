import React, { createContext, useContext, useState, useCallback } from "react";

interface HideTurtleGuideContextValue {
  hideTurtleGuide: boolean;
  setHideTurtleGuide: (hide: boolean) => void;
}

const HideTurtleGuideContext = createContext<HideTurtleGuideContextValue | null>(null);

export function HideTurtleGuideProvider({ children }: { children: React.ReactNode }) {
  const [hideTurtleGuide, setHideTurtleGuide] = useState(false);
  const setter = useCallback((hide: boolean) => setHideTurtleGuide(hide), []);
  return (
    <HideTurtleGuideContext.Provider value={{ hideTurtleGuide, setHideTurtleGuide: setter }}>
      {children}
    </HideTurtleGuideContext.Provider>
  );
}

export function useHideTurtleGuide() {
  const ctx = useContext(HideTurtleGuideContext);
  return ctx ?? { hideTurtleGuide: false, setHideTurtleGuide: () => {} };
}
