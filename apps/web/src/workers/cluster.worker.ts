/// <reference lib="webworker" />

import Supercluster from "supercluster";
import type { POIGeoJsonProperties } from "../lib/poiGeoJson";

type Inbound =
  | {
      type: "LOAD";
      payload: {
        features: GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>[];
        radius: number;
        maxZoom: number;
      };
    }
  | { type: "GET_CLUSTERS"; requestId: number; bbox: GeoJSON.BBox; zoom: number }
  | { type: "GET_LEAVES"; requestId: string; clusterId: number; limit?: number }
  | { type: "GET_EXPANSION_ZOOM"; requestId: string; clusterId: number };

let index: Supercluster<POIGeoJsonProperties> | null = null;

self.onmessage = (e: MessageEvent<Inbound>) => {
  const msg = e.data;

  if (msg.type === "LOAD") {
    index = new Supercluster<POIGeoJsonProperties>({
      radius: msg.payload.radius,
      maxZoom: msg.payload.maxZoom,
    }).load(msg.payload.features);
    self.postMessage({ type: "READY" });
    return;
  }

  if (!index) return;

  if (msg.type === "GET_CLUSTERS") {
    self.postMessage({
      type: "CLUSTERS",
      requestId: msg.requestId,
      clusters: index.getClusters(msg.bbox, msg.zoom),
    });
    return;
  }

  if (msg.type === "GET_LEAVES") {
    self.postMessage({
      type: "LEAVES",
      requestId: msg.requestId,
      leaves: index.getLeaves(msg.clusterId, msg.limit ?? 20),
    });
    return;
  }

  if (msg.type === "GET_EXPANSION_ZOOM") {
    self.postMessage({
      type: "EXPANSION_ZOOM",
      requestId: msg.requestId,
      zoom: index.getClusterExpansionZoom(msg.clusterId),
    });
  }
};

export {};
