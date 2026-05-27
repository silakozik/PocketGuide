import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "../components/map/MapView";

interface AIAssistantContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  coords: { lat: number; lng: number };
  setCoords: (lat: number, lng: number) => void;
}

const AIAssistantContext = createContext<AIAssistantContextValue | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoordsState] = useState({
    lat: MAP_INITIAL_LAT,
    lng: MAP_INITIAL_LNG,
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const setCoords = useCallback((lat: number, lng: number) => {
    setCoordsState({ lat, lng });
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{ isOpen, open, close, toggle, coords, setCoords }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return ctx;
}
