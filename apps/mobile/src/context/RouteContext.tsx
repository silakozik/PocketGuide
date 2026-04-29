import { createContext, ReactNode, useContext, useState } from "react";

import { fetchDirections } from "@/src/lib/ors";
import type { POI } from "@/src/types/poi";
import type { RouteState } from "@/src/types/route";

interface RouteContextProps extends RouteState {
  startRoute: () => Promise<void>;
  resetRoute: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setActiveStep: (legIndex: number, stepIndex: number) => void;
  addToRouteDraft: (poi: POI) => void;
  removeFromRouteDraft: (poiId: string) => void;
}

const RouteContext = createContext<RouteContextProps | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RouteState>({
    isActive: false,
    isFetching: false,
    routeData: null,
    activeLegIndex: 0,
    activeStepIndex: 0,
    error: null,
    draftPOIs: [],
  });

  const startRoute = async () => {
    if (state.draftPOIs.length < 2) return;
    setState((prev) => ({ ...prev, isFetching: true, error: null }));
    try {
      const data = await fetchDirections(state.draftPOIs);
      setState((prev) => ({
        ...prev,
        isActive: true,
        isFetching: false,
        routeData: data,
        activeLegIndex: 0,
        activeStepIndex: 0,
        error: null,
      }));
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isFetching: false,
        error: err?.message ?? "Rota oluşturulamadı.",
      }));
    }
  };

  const resetRoute = () => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      routeData: null,
      activeLegIndex: 0,
      activeStepIndex: 0,
      error: null,
      draftPOIs: [],
    }));
  };

  const addToRouteDraft = (poi: POI) => {
    setState((prev) => {
      if (prev.draftPOIs.some((p) => p.id === poi.id)) return prev;
      return { ...prev, draftPOIs: [...prev.draftPOIs, poi] };
    });
  };

  const removeFromRouteDraft = (poiId: string) => {
    setState((prev) => ({
      ...prev,
      draftPOIs: prev.draftPOIs.filter((p) => p.id !== poiId),
    }));
  };

  const setActiveStep = (legIndex: number, stepIndex: number) => {
    setState((prev) => ({ ...prev, activeLegIndex: legIndex, activeStepIndex: stepIndex }));
  };

  const nextStep = () => {
    setState((prev) => {
      if (!prev.routeData) return prev;
      const currentLeg = prev.routeData.legs[prev.activeLegIndex];
      if (prev.activeStepIndex < currentLeg.steps.length - 1) {
        return { ...prev, activeStepIndex: prev.activeStepIndex + 1 };
      }
      if (prev.activeLegIndex < prev.routeData.legs.length - 1) {
        return { ...prev, activeLegIndex: prev.activeLegIndex + 1, activeStepIndex: 0 };
      }
      return prev;
    });
  };

  const prevStep = () => {
    setState((prev) => {
      if (!prev.routeData) return prev;
      if (prev.activeStepIndex > 0) {
        return { ...prev, activeStepIndex: prev.activeStepIndex - 1 };
      }
      if (prev.activeLegIndex > 0) {
        const prevLeg = prev.routeData.legs[prev.activeLegIndex - 1];
        return {
          ...prev,
          activeLegIndex: prev.activeLegIndex - 1,
          activeStepIndex: prevLeg.steps.length - 1,
        };
      }
      return prev;
    });
  };

  return (
    <RouteContext.Provider
      value={{
        ...state,
        startRoute,
        resetRoute,
        nextStep,
        prevStep,
        setActiveStep,
        addToRouteDraft,
        removeFromRouteDraft,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRoute must be used within a RouteProvider");
  }
  return context;
}

