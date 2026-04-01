import { Injectable } from '@nestjs/common';
import { RawGTFSStop } from '@pocketguide/types';

@Injectable()
export class GtfsService {
  async fetchStops(): Promise<RawGTFSStop[]> {
    const res = await fetch(
      'https://transfer.sh/gtfs/stops.txt' // bunu sonra gerçek GTFS URL ile değiştireceğiz
    );
    const text = await res.text();

    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => (obj[h.trim()] = values[i]?.trim()));

      return {
        stop_id: obj.stop_id,
        stop_name: obj.stop_name,
        stop_lat: parseFloat(obj.stop_lat),
        stop_lon: parseFloat(obj.stop_lon),
      };
    });
  }
}