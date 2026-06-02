import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "../components/map/MapView";

export interface AIAssistantPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface AIAssistantContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  coords: { lat: number; lng: number };
  setCoords: (lat: number, lng: number) => void;
  recommendationPins: AIAssistantPin[];
  setRecommendationPins: (pins: AIAssistantPin[]) => void;
  clearRecommendationPins: () => void;
}

const AIAssistantContext = createContext<AIAssistantContextValue | undefined>(undefined);

export function AIAssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoordsState] = useState({
    lat: MAP_INITIAL_LAT,
    lng: MAP_INITIAL_LNG,
  });
  const [recommendationPins, setRecommendationPinsState] = useState<AIAssistantPin[]>([]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setRecommendationPinsState([]);
  }, []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setRecommendationPinsState([]);
      }
      return next;
    });
  }, []);
  const setCoords = useCallback((lat: number, lng: number) => {
    setCoordsState({ lat, lng });
  }, []);
  const setRecommendationPins = useCallback((pins: AIAssistantPin[]) => {
    setRecommendationPinsState(pins);
  }, []);
  const clearRecommendationPins = useCallback(() => {
    setRecommendationPinsState([]);
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{
        isOpen,
        open,
        close,
        toggle,
        coords,
        setCoords,
        recommendationPins,
        setRecommendationPins,
        clearRecommendationPins,
      }}
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
