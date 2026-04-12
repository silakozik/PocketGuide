import { Injectable, Logger } from '@nestjs/common';

export interface OSMRoute {
  name: string;
  from: string;
  to: string;
  mode: string;
  frequency?: string;
  operatingHours?: string;
  sourceId: string;
}

@Injectable()
export class TransitImporter {
  private readonly logger = new Logger(TransitImporter.name);
  private readonly primaryOverpassUrl = 'https://overpass-api.de/api/interpreter';
  private readonly fallbackOverpassUrl = 'https://overpass.kumi.systems/api/interpreter';

  private readonly modeQueries: Record<string, string> = {
    metro: 'relation["route"="subway"]',
    bus: 'relation["route"="bus"]',
    rail: 'relation["route"="train"]',
    ferry: 'relation["route"="ferry"]',
    tram: 'relation["route"="tram"]',
    cable_car: 'relation["route"="share_taxi"]', // or cable_car
  };

  async fetchCityRoutes(cityName: string): Promise<OSMRoute[]> {
    const allRoutes: OSMRoute[] = [];

    for (const [mode, queryPart] of Object.entries(this.modeQueries)) {
      this.logger.log(`Fetching ${mode} routes for ${cityName}...`);
      
      const query = `
        [out:json][timeout:60];
        area[name="${cityName}"]->.searchArea;
        (
          ${queryPart}(area.searchArea);
        );
        out body;
      `;

      try {
        let data = await this.doRequest(this.primaryOverpassUrl, query);
        
        if (!data || !data.elements || data.elements.length === 0) {
          this.logger.warn(`No results from primary Overpass for ${mode}. Trying fallback...`);
          data = await this.doRequest(this.fallbackOverpassUrl, query);
        }

        const modeRoutes = (data?.elements || []).map((el: any) => ({
          name: el.tags?.name || el.tags?.ref || `${mode} (${el.id})`,
          from: el.tags?.from || 'Unknown',
          to: el.tags?.to || 'Unknown',
          mode: mode,
          frequency: el.tags?.interval,
          operatingHours: el.tags?.opening_hours,
          sourceId: `osm_${el.id}`,
        }));

        allRoutes.push(...modeRoutes);
        
        // Rate limiting: wait 1s between requests
        await this.wait(1000);
      } catch (error) {
        this.logger.error(`Failed to fetch ${mode} for ${cityName}: ${error.message}`);
      }
    }

    return allRoutes;
  }

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
}
