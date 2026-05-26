import { Injectable, Logger } from '@nestjs/common';

export interface OverpassPOI {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  opening_hours?: string;
  category: string;
  source: 'openstreetmap';
  sourceId: string;
}

/** Overpass area adı → [south, west, north, east] bbox (area sorgusu boş dönerse kullanılır) */
const CITY_BBOXES: Record<string, [number, number, number, number]> = {
  Istanbul: [40.85, 28.50, 41.35, 29.50],
  London: [51.28, -0.51, 51.69, 0.33],
  Paris: [48.80, 2.25, 48.90, 2.42],
  Rome: [41.85, 12.45, 42.00, 12.55],
  Barcelona: [41.35, 2.05, 41.45, 2.25],
  Amsterdam: [52.33, 4.75, 52.40, 5.00],
  Tokyo: [35.60, 139.60, 35.75, 139.85],
  'New York': [40.68, -74.05, 40.82, -73.90],
  Dubai: [25.00, 55.00, 25.30, 55.50],
  Sydney: [-33.95, 151.05, -33.75, 151.30],
};

@Injectable()
export class OverpassImporter {
  private readonly logger = new Logger(OverpassImporter.name);
  private readonly primaryOverpassUrl = 'https://overpass-api.de/api/interpreter';
  private readonly fallbackOverpassUrl = 'https://overpass.kumi.systems/api/interpreter';

  private readonly categoryQueries: Record<string, string[]> = {
    sim: [
      'node["shop"="mobile_phone"]',
      'node["shop"="telecommunication"]',
      'node["shop"="phone"]',
      'way["shop"="mobile_phone"]',
    ],
    transport: [
      'node["vending"="public_transport_tickets"]',
      'node["amenity"="vending_machine"]["vending"="public_transport_tickets"]',
    ],
    exchange: [
      'node["amenity"="bureau_de_change"]',
      'node["shop"="currency_exchange"]',
      'way["amenity"="bureau_de_change"]',
    ],
  };

  /**
   * Fetches points for a given city and category from Overpass API.
   */
  async fetchCityPoints(cityName: string, category: string): Promise<OverpassPOI[]> {
    const filters = this.categoryQueries[category];
    if (!filters) {
      this.logger.warn(`Unknown category requested: ${category}`);
      return [];
    }

    const filterString = filters.map(f => `${f}(area.searchArea);`).join('\n');
    const areaQuery = `
      [out:json][timeout:60];
      area["name"="${cityName}"]["admin_level"~"6|7|8"]->.searchArea;
      (
        ${filterString}
      );
      out body;
    `;

    const bbox = CITY_BBOXES[cityName];
    let bboxQuery: string | null = null;
    if (bbox) {
      const [south, west, north, east] = bbox;
      const bboxFilters = filters.map(f => `${f}(${south},${west},${north},${east});`).join('\n');
      bboxQuery = `
        [out:json][timeout:60];
        (
          ${bboxFilters}
        );
        out body;
      `;
    }

    try {
      this.logger.log(`Fetching ${category} for ${cityName}...`);
      let data = await this.doRequest(this.primaryOverpassUrl, areaQuery);

      if (!data?.elements?.length && bboxQuery) {
        this.logger.warn(`Area query empty for ${cityName}/${category}, trying bbox...`);
        await this.wait(2000);
        data = await this.doRequest(this.primaryOverpassUrl, bboxQuery);
      }

      if (!data?.elements?.length) {
        this.logger.warn(`No results from primary Overpass for ${category}. Trying fallback...`);
        await this.wait(3000);
        data = await this.doRequest(this.fallbackOverpassUrl, bboxQuery ?? areaQuery);
      }

      return (data?.elements || [])
        .filter((el: any) => (el.type === 'node' || el.type === 'way') && el.tags?.name)
        .map((el: any) => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (!lat || !lon) return null;
          return {
            name: el.tags?.name || `${category} (${el.id})`,
            address: this.buildAddress(el.tags),
            latitude: lat,
            longitude: lon,
            opening_hours: el.tags?.opening_hours,
            category: category,
            source: 'openstreetmap' as const,
            sourceId: `osm_${el.id}`,
          };
        })
        .filter(Boolean) as OverpassPOI[];
    } catch (error) {
      this.logger.error(`Failed to fetch ${category} for ${cityName}: ${error.message}`);
      return [];
    }
  }

  /**
   * Helper to wait for a specified duration.
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async doRequest(url: string, query: string): Promise<any> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'PocketGuide/1.0 (admin import)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error(`Request to ${url} failed: ${error.message}`);
      return null;
    }
  }

  private buildAddress(tags: any): string | null {
    if (!tags) return null;
    const parts = [
      tags['addr:street'],
      tags['addr:housenumber'],
      tags['addr:postcode'],
      tags['addr:city'],
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  }
}
