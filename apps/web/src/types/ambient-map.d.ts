declare module "mapbox-gl";

declare module "react-map-gl/mapbox" {
  import type { ComponentType } from "react";

  export type MapRef = {
    getMap: () => unknown;
  };

  const Map: ComponentType<any>;
  export default Map;

  export const Marker: ComponentType<any>;
  export const Source: ComponentType<any>;
  export const Layer: ComponentType<any>;

  export function useMap(): { current?: MapRef | undefined };
}
