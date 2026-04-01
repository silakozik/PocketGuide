import { Injectable } from "@nestjs/common";
import { RawOSMPlace } from "@pocketguide/types";

@Injectable()
export class OSMService {
    async searchNearby(lat: number, lng: number, radius = 1500): Promise<RawOSMPlace[]> {
        const query = `[out:json];node["amenity"](around:${radius},${lat},${lng});out body;`;

        const res = await fetch(
            `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`
        );

        const text = await res.text();

        try {
            const data = JSON.parse(text);
            return data.elements as RawOSMPlace[];
        } catch {
            console.error('OSM parse error:', text.slice(0, 200));
            return [];
        }
    }
}