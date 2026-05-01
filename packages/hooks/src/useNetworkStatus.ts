import { useEffect, useState } from "react";

export interface NetworkStatusState {
  isOnline: boolean;
  lastChangedAt: string;
}

export function useNetworkStatus(): NetworkStatusState {
  const [state, setState] = useState<NetworkStatusState>({
    isOnline: navigator.onLine,
    lastChangedAt: new Date().toISOString(),
  });

  useEffect(() => {
    const handleOnline = () => {
      setState({
        isOnline: true,
        lastChangedAt: new Date().toISOString(),
      });
    };

    const handleOffline = () => {
      setState({
        isOnline: false,
        lastChangedAt: new Date().toISOString(),
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return state;
}
