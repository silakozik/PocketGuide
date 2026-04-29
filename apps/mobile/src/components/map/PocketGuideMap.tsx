import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, View } from "react-native";

import { MOCK_POIS } from "@/src/data/mockPOIs";
import type { POI } from "@/src/types/poi";
import { useCluster } from "@/src/hooks/useCluster";

import { CustomPin } from "@/src/components/map/CustomPin";
import { ClusterPin } from "@/src/components/map/ClusterPin";
import { POIBottomSheet } from "@/src/components/map/POIBottomSheet";
import { LayerToggle } from "@/src/components/map/LayerToggle";

export function PocketGuideMap() {
  const mapRef = useRef<MapView>(null);

  const initialRegion = useMemo<Region>(
    () => ({
      latitude: 38.6736,
      longitude: 39.2214,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    []
  );

  const [region, setRegion] = useState<Region>(initialRegion);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [poiList, setPoiList] = useState<POI[] | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [layers, setLayers] = useState({ pins: true, route: false, heatmap: false });

  const { clusterFeatures, poiFeatures, getLeaves } = useCluster(MOCK_POIS, region);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!mounted) return;
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({});
      if (!mounted) return;

      const nextRegion: Region = {
        ...initialRegion,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 900);
    })();

    return () => {
      mounted = false;
    };
  }, [initialRegion]);

  const openSheet = useCallback((poi: POI, list?: POI[]) => {
    setSelectedPOI(poi);
    setPoiList(list);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  const handleClusterPress = useCallback(
    (clusterId: number, count: number, lat: number, lng: number) => {
      if (count <= 8) {
        const leaves = getLeaves(clusterId, 20);
        const limited = leaves.slice(0, 8);
        if (limited.length === 0) return;
        openSheet(limited[0], limited);
        return;
      }

      const nextLatitudeDelta = Math.max(region.latitudeDelta / 2.5, 0.00001);
      const nextLongitudeDelta = Math.max(region.longitudeDelta / 2.5, 0.00001);

      const nextRegion: Region = {
        ...region,
        latitude: lat,
        longitude: lng,
        latitudeDelta: nextLatitudeDelta,
        longitudeDelta: nextLongitudeDelta,
      };

      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 350);
    },
    [getLeaves, openSheet, region]
  );

  const handlePoiPress = useCallback(
    (poi: POI) => {
      openSheet(poi);
    },
    [openSheet]
  );

  const showPins = layers.pins;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {showPins &&
          poiFeatures.map((feature: any) => {
            const poi = feature.properties as POI;
            const [lng, lat] = feature.geometry.coordinates as [number, number];

            return (
              <Marker
                key={poi.id}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                <CustomPin
                  category={poi.category}
                  selected={selectedPOI?.id === poi.id}
                  onPress={() => handlePoiPress(poi)}
                />
              </Marker>
            );
          })}

        {showPins &&
          clusterFeatures.map((feature: any) => {
            const props = feature.properties as any;
            const clusterId = props.cluster_id as number;
            const count = props.point_count as number;
            const [lng, lat] = feature.geometry.coordinates as [number, number];

            return (
              <Marker
                key={`cluster-${clusterId}`}
                coordinate={{ latitude: lat, longitude: lng }}
                tracksViewChanges={false}
              >
                <ClusterPin
                  count={count}
                  onPress={() => handleClusterPress(clusterId, count, lat, lng)}
                />
              </Marker>
            );
          })}
      </MapView>

      <View pointerEvents="box-none" style={styles.overlay}>
        <LayerToggle layers={layers} onChange={setLayers} />
      </View>

      {isSheetOpen && selectedPOI && (
        <POIBottomSheet poi={selectedPOI} poiList={poiList} onClose={closeSheet} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 60,
  },
});

