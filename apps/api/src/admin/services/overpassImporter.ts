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

@Injectable()
export class OverpassImporter {
  private readonly logger = new Logger(OverpassImporter.name);
  private readonly primaryOverpassUrl = 'https://overpass-api.de/api/interpreter';
  private readonly fallbackOverpassUrl = 'https://overpass.kumi.systems/api/interpreter';

  private readonly categoryQueries: Record<string, string[]> = {
    sim: ['node["shop"="mobile_phone"]', 'node["shop"="telecommunication"]'],
    transport: ['node["vending"="public_transport_tickets"]'],
    exchange: ['node["amenity"="bureau_de_change"]'],
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

    // Build query
    const filterString = filters.map(f => `${f}(area.searchArea);`).join('\n');
    const query = `
      [out:json][timeout:60];
      area[name="${cityName}"]->.searchArea;
      (
        ${filterString}
      );
      out body;
      >;
      out skel qt;
    `;

    try {
      this.logger.log(`Fetching ${category} for ${cityName}...`);
      let data = await this.doRequest(this.primaryOverpassUrl, query);
      
      if (!data || !data.elements || data.elements.length === 0) {
        this.logger.warn(`No results from primary Overpass for ${category}. Trying fallback...`);
        data = await this.doRequest(this.fallbackOverpassUrl, query);
      }

      return (data?.elements || [])
        .filter((el: any) => el.type === 'node')
        .map((el: any) => ({
          name: el.tags?.name || `${category} (${el.id})`,
          address: this.buildAddress(el.tags),
          latitude: el.lat,
          longitude: el.lon,
          opening_hours: el.tags?.opening_hours,
          category: category,
          source: 'openstreetmap',
          sourceId: `osm_${el.id}`,
        }));
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
      tags['addr:city']
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  }
}
