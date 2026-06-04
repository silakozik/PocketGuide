import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export type FirstDayMapMarker = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  color?: string;
  emoji?: string;
  order?: number;
};

type Props = {
  center: { lat: number; lng: number };
  markers: FirstDayMapMarker[];
  height?: number;
};

const buildMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .fd-pin {
      width: 32px; height: 32px; border-radius: 50%;
      border: 2.5px solid #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
    .fd-pin-route {
      background: #0f1f3d; color: #fff; font-size: 12px; font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OSM'
    }).addTo(map);
    var markerLayer = [];

    function clearMarkers() {
      markerLayer.forEach(function(m) { map.removeLayer(m); });
      markerLayer = [];
    }

    function addMarker(m) {
      var isRoute = m.order != null;
      var html = isRoute
        ? '<div class="fd-pin fd-pin-route">' + m.order + '</div>'
        : '<div class="fd-pin" style="background:' + (m.color || '#3b82f6') + '">' + (m.emoji || '📍') + '</div>';
      var icon = L.divIcon({ className: '', html: html, iconSize: [32, 32], iconAnchor: [16, 32] });
      var mk = L.marker([m.lat, m.lng], { icon: icon }).addTo(map).bindPopup(m.name);
      markerLayer.push(mk);
    }

    function syncMarkers(markers) {
      clearMarkers();
      if (!markers || !markers.length) return;
      markers.forEach(addMarker);
      var group = L.featureGroup(markerLayer);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    document.addEventListener('message', function(e) {
      try {
        var data = JSON.parse(e.data);
        if (data.type === 'sync') syncMarkers(data.markers || []);
        if (data.type === 'flyTo') map.setView([data.lat, data.lng], data.zoom || 13);
      } catch (err) {}
    });
    window.addEventListener('message', function(e) {
      document.dispatchEvent(new MessageEvent('message', { data: e.data }));
    });
  </script>
</body>
</html>
`;

export function FirstDayMiniMap({ center, markers, height = 220 }: Props) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const mapHtml = useMemo(
    () => buildMapHtml(center.lat, center.lng),
    [center.lat, center.lng],
  );

  const post = useCallback((payload: object) => {
    webRef.current?.postMessage(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    if (!ready) return;
    post({
      type: "sync",
      markers: markers.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        name: m.name,
        color: m.color,
        emoji: m.emoji,
        order: m.order,
      })),
    });
  }, [ready, markers, post]);

  useEffect(() => {
    if (!ready) return;
    post({ type: "flyTo", lat: center.lat, lng: center.lng, zoom: 13 });
  }, [ready, center.lat, center.lng, post]);

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        source={{ html: mapHtml }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        scrollEnabled={false}
        onLoadEnd={() => setReady(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf2",
  },
  map: {
    flex: 1,
    width: "100%",
  },
});
