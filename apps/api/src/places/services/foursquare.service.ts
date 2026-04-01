import { Injectable } from '@nestjs/common';
import { RawFoursquareVenue } from '@pocketguide/types';
import axios from 'axios';

@Injectable()
export class FoursquareService {
    async searchNearby(lat: number, lng: number, radius = 1500): Promise<RawFoursquareVenue[]> {
        try {
            const res = await axios.get(
                'https://api.foursquare.com/v3/places/search',
                {
                    params: {
                        ll: `${lat},${lng}`,
                        radius,
                        limit: 20
                    },
                    headers: {
                        Authorization: process.env.FOURSQUARE_API_KEY!,
                        Accept: 'application/json',
                    },
                    timeout: 10000, // 10 saniye zaman aşımı
                }
            );

            console.log('FSQ response:', JSON.stringify(res.data).slice(0, 300));
            return res.data.results ?? [];
        } catch (err) {
            console.error('Foursquare error:', err.message);
            return [];
        }
    }
}