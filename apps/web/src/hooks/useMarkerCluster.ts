import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Supercluster from "supercluster";

import {
  MARKER_CLUSTER_DEBOUNCE_MS,
  MARKER_CLUSTER_WORKER_THRESHOLD,
  prioritizeAndCapMarkers,
  SUPERCLUSTER_CLUSTER_OPTIONS,
} from "../constants/markerCluster";
import type { POIPointFeature, POIGeoJsonProperties } from "../lib/poiGeoJson";

/** Mapbox clustering örneğinde olduğu gibi tıklama / genişletme için async API */
export interface MarkerClusterSuperclusterInstance {
  getLeaves(
    clusterId: number,
    limit?: number,
  ): Promise<GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>[]>;
  getClusterExpansionZoom(clusterId: number): Promise<number>;
}

/** Supercluster küme özeti (varsayılan cluster props) */
export interface ClusterAggProperties {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string | number;
}

export type MarkerClusterFeature =
  | GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>
  | GeoJSON.Feature<GeoJSON.Point, ClusterAggProperties>;

export function useMarkerCluster(pointFeatures: POIPointFeature[]): {
  clusters: MarkerClusterFeature[];
  /** Supercluster ile aynı yüzey (getLeaves / getClusterExpansionZoom); Promise uyumlu. */
  superclusterInstance: MarkerClusterSuperclusterInstance;
  /** react-map-gl `move` / zoom sonrasında çağırın; küme güncellemesi 300ms debounce ile gelir */
  notifyViewportChanged: (bbox: GeoJSON.BBox, zoom: number) => void;
  /** İlk yüklemede küme görünümü için gecikme olmadan (debounce sıfır) güncelle */
  primeViewportImmediate: (bbox: GeoJSON.BBox, zoom: number) => void;
} {
  const [clusters, setClusters] = useState<MarkerClusterFeature[]>([]);

  const useWorker = pointFeatures.length >= MARKER_CLUSTER_WORKER_THRESHOLD;

  const mainIndex = useMemo(() => {
    if (useWorker || pointFeatures.length === 0) return null;
    return new Supercluster<POIGeoJsonProperties>({
      radius: SUPERCLUSTER_CLUSTER_OPTIONS.radius,
      maxZoom: SUPERCLUSTER_CLUSTER_OPTIONS.maxZoom,
    }).load(pointFeatures);
  }, [useWorker, pointFeatures]);

  const mainIndexRef = useRef(mainIndex);
  mainIndexRef.current = mainIndex;

  const workerRef = useRef<Worker | null>(null);
  const pendingLeavesRef = useRef<Map<string, (v: GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>[]) => void>>(new Map());
  const pendingZoomRef = useRef<Map<string, (z: number) => void>>(new Map());

  const clusterRequestIdRef = useRef(0);
  const activeClusterFetchIdRef = useRef<number | null>(null);

  const effectiveViewportRef = useRef<{ bbox: GeoJSON.BBox; zoom: number } | null>(
    null,
  );

  const runClusterComputation = useCallback(() => {
    const vp = effectiveViewportRef.current;
    if (!vp || pointFeatures.length === 0) {
      setClusters([]);
      return;
    }
    const local = mainIndexRef.current;
    const { bbox, zoom } = vp;

    if (local) {
      const next = prioritizeAndCapMarkers(
        local.getClusters(bbox, zoom) as MarkerClusterFeature[],
      );
      setClusters(next);
      return;
    }

    const w = workerRef.current;
    if (w) {
      clusterRequestIdRef.current += 1;
      const rid = clusterRequestIdRef.current;
      activeClusterFetchIdRef.current = rid;
      w.postMessage({
        type: "GET_CLUSTERS",
        requestId: rid,
        bbox,
        zoom,
      });
    }
  }, [pointFeatures.length]);

  const runClusterRef = useRef(runClusterComputation);
  runClusterRef.current = runClusterComputation;

  useEffect(() => {
    if (!useWorker) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      return;
    }

    const url = new URL("../workers/cluster.worker.ts", import.meta.url);
    const worker = new Worker(url, { type: "module" });
    workerRef.current = worker;

    const onMsg = (
      msg: MessageEvent<{
        type: string;
        requestId?: number | string;
        clusters?: MarkerClusterFeature[];
        leaves?: GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>[];
        zoom?: number;
      }>,
    ) => {
      const d = msg.data;
      if (d.type === "READY") {
        queueMicrotask(() => runClusterRef.current());
        return;
      }
      if (d.type === "CLUSTERS" && typeof d.requestId === "number" && Array.isArray(d.clusters)) {
        if (d.requestId !== activeClusterFetchIdRef.current) return;
        setClusters(prioritizeAndCapMarkers(d.clusters as MarkerClusterFeature[]));
        return;
      }
      if (d.type === "LEAVES" && typeof d.requestId === "string" && Array.isArray(d.leaves)) {
        const resolve = pendingLeavesRef.current.get(d.requestId);
        if (resolve) {
          pendingLeavesRef.current.delete(d.requestId);
          resolve(d.leaves);
        }
        return;
      }
      if (
        d.type === "EXPANSION_ZOOM" &&
        typeof d.requestId === "string" &&
        typeof d.zoom === "number"
      ) {
        const resolve = pendingZoomRef.current.get(d.requestId);
        if (resolve) {
          pendingZoomRef.current.delete(d.requestId);
          resolve(d.zoom);
        }
      }
    };

    worker.addEventListener("message", onMsg as EventListener);

    worker.postMessage({
      type: "LOAD",
      payload: {
        features: pointFeatures,
        radius: SUPERCLUSTER_CLUSTER_OPTIONS.radius,
        maxZoom: SUPERCLUSTER_CLUSTER_OPTIONS.maxZoom,
      },
    });

    return () => {
      worker.removeEventListener("message", onMsg as EventListener);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [useWorker, pointFeatures]);

  useEffect(() => {
    if (pointFeatures.length === 0) {
      setClusters([]);
      return;
    }
    if (effectiveViewportRef.current && !useWorker) {
      runClusterComputation();
    }
  }, [pointFeatures.length, mainIndex, useWorker, runClusterComputation]);

  /** DOM ortamında setTimeout kimliği; Node.js Timeout ile karışmasın diye `number`. */
  const debounceTimerRef = useRef<number | null>(null);

  const notifyViewportChanged = useCallback(
    (bbox: GeoJSON.BBox, zoom: number) => {
      effectiveViewportRef.current = { bbox, zoom };

      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null;
        runClusterComputation();
      }, MARKER_CLUSTER_DEBOUNCE_MS);
    },
    [runClusterComputation],
  );

  const primeViewportImmediate = useCallback(
    (bbox: GeoJSON.BBox, zoom: number) => {
      effectiveViewportRef.current = { bbox, zoom };
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      runClusterComputation();
    },
    [runClusterComputation],
  );

  useEffect(
    () => () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    },
    [],
  );

  const workerLeaves = useCallback(async (clusterId: number, limit?: number) => {
    const w = workerRef.current;
    if (!w) return [];
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `leaves-${clusterId}-${Date.now()}-${Math.random()}`;
    return await new Promise<GeoJSON.Feature<GeoJSON.Point, POIGeoJsonProperties>[]>(
      (resolve) => {
        pendingLeavesRef.current.set(requestId, resolve);
        w.postMessage({ type: "GET_LEAVES", requestId, clusterId, limit });
      },
    );
  }, []);

  const workerExpansionZoom = useCallback(async (clusterId: number) => {
    const w = workerRef.current;
    if (!w) return 16;
    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ex-${clusterId}-${Date.now()}-${Math.random()}`;
    return await new Promise<number>((resolve) => {
      pendingZoomRef.current.set(requestId, resolve);
      w.postMessage({ type: "GET_EXPANSION_ZOOM", requestId, clusterId });
    });
  }, []);

  const superclusterInstance = useMemo<MarkerClusterSuperclusterInstance>(
    () => ({
      getLeaves(clusterId: number, limit?: number) {
        const idx = mainIndexRef.current;
        if (idx) {
          return Promise.resolve(idx.getLeaves(clusterId, limit ?? 50));
        }
        return workerLeaves(clusterId, limit);
      },
      getClusterExpansionZoom(clusterId: number) {
        const idx = mainIndexRef.current;
        if (idx) {
          return Promise.resolve(idx.getClusterExpansionZoom(clusterId));
        }
        return workerExpansionZoom(clusterId);
      },
    }),
    [workerLeaves, workerExpansionZoom],
  );

  return {
    clusters,
    superclusterInstance,
    notifyViewportChanged,
    primeViewportImmediate,
  };
}
