import { createContext, useContext, useState, ReactNode } from 'react';
import { RouteState } from '../types/route';
import { POI } from '../types/poi';
import { fetchDirections } from '../lib/ors';
import { useNetworkStatus, useOfflineStorage } from '@pocketguide/hooks';
import type { OfflineRoute } from '@pocketguide/types';

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
const DEFAULT_CITY_ID = "elazig";

const buildRouteId = (pois: POI[]): string => pois.map((poi) => poi.id).join("__");

export const RouteProvider = ({ children }: { children: ReactNode }) => {
  const { isOnline } = useNetworkStatus();
  const { saveRoute, getRoute } = useOfflineStorage();
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

    const routeId = buildRouteId(state.draftPOIs);
    setState(prev => ({ ...prev, isFetching: true, error: null }));

    if (!isOnline) {
      try {
        const cachedRoute = await getRoute(routeId);
        if (cachedRoute) {
          setState(prev => ({
            ...prev,
            isActive: true,
            isFetching: false,
            routeData: JSON.parse(cachedRoute.routeData) as RouteState["routeData"],
            activeLegIndex: 0,
            activeStepIndex: 0,
            error: null,
          }));
          return;
        }
      } catch (error) {
        console.error("Failed to restore route from cache", error);
      }

      setState(prev => ({
        ...prev,
        isFetching: false,
        error: "Offline modda bu rota cache'de bulunamadi.",
      }));
      return;
    }

    try {
      const data = await fetchDirections(state.draftPOIs);
      const routeRecord: OfflineRoute = {
        id: routeId,
        cityId: DEFAULT_CITY_ID,
        pois: state.draftPOIs.map((poi) => poi.id),
        routeData: JSON.stringify(data),
        createdAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
      };
      await saveRoute(routeRecord);

      setState(prev => ({
        ...prev,
        isActive: true,
        isFetching: false,
        routeData: data,
        activeLegIndex: 0,
        activeStepIndex: 0,
        error: null,
      }));
    } catch (err: unknown) {
      setState(prev => ({
        ...prev,
        isFetching: false,
        error: err instanceof Error ? err.message : 'Rota olusturulamadi.',
      }));
    }
  };

  const resetRoute = () => {
    setState({
      isActive: false,
      isFetching: false,
      routeData: null,
      activeLegIndex: 0,
      activeStepIndex: 0,
      error: null,
      draftPOIs: [],
    });
  };

  const addToRouteDraft = (poi: POI) => {
    setState(prev => {
      if (prev.draftPOIs.some(p => p.id === poi.id)) return prev;
      return { ...prev, draftPOIs: [...prev.draftPOIs, poi] };
    });
  };

  const removeFromRouteDraft = (poiId: string) => {
    setState(prev => ({
      ...prev,
      draftPOIs: prev.draftPOIs.filter(p => p.id !== poiId)
    }));
  };

  const setActiveStep = (legIndex: number, stepIndex: number) => {
    setState(prev => ({ ...prev, activeLegIndex: legIndex, activeStepIndex: stepIndex }));
  };

  const nextStep = () => {
    setState(prev => {
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
    setState(prev => {
      if (!prev.routeData) return prev;
      if (prev.activeStepIndex > 0) {
        return { ...prev, activeStepIndex: prev.activeStepIndex - 1 };
      }
      if (prev.activeLegIndex > 0) {
        const prevLeg = prev.routeData.legs[prev.activeLegIndex - 1];
        return { ...prev, activeLegIndex: prev.activeLegIndex - 1, activeStepIndex: prevLeg.steps.length - 1 };
      }
      return prev;
    });
  };

  return (
    <RouteContext.Provider value={{ ...state, startRoute, resetRoute, nextStep, prevStep, setActiveStep, addToRouteDraft, removeFromRouteDraft }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};
