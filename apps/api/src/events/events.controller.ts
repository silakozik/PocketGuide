import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cities, events } from '@pocketguide/database';
import { eq, and, gte, lte } from 'drizzle-orm';
import { resolveCitySlug } from '../utils/city-slug';

const CITY_TO_TM: Record<string, { city: string; countryCode: string }> = {
  istanbul: { city: 'Istanbul', countryCode: 'TR' },
  londra: { city: 'London', countryCode: 'GB' },
  paris: { city: 'Paris', countryCode: 'FR' },
  roma: { city: 'Rome', countryCode: 'IT' },
  barcelona: { city: 'Barcelona', countryCode: 'ES' },
  tokyo: { city: 'Tokyo', countryCode: 'JP' },
  'new-york': { city: 'New York', countryCode: 'US' },
  dubai: { city: 'Dubai', countryCode: 'AE' },
  amsterdam: { city: 'Amsterdam', countryCode: 'NL' },
  sydney: { city: 'Sydney', countryCode: 'AU' },
};

function addCalendarDays(base: Date, offset: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** universe.com hotlink engelliyor; ticketm.net + en geniş 16:9 tercih edilir */
function pickEventImageUrl(images: any[] | undefined): string | null {
  if (!images?.length) return null;

  const withUrl = images.filter(
    (img) => typeof img.url === 'string' && img.url.length > 0,
  );
  if (!withUrl.length) return null;

  const ticketm = withUrl.filter((img) =>
    /ticketm\.net|ticketmaster\.com/i.test(img.url),
  );
  const candidates = ticketm.length > 0 ? ticketm : withUrl;

  const wide = candidates.filter((img) => img.ratio === '16_9');
  const pool = wide.length > 0 ? wide : candidates;

  return pool.reduce((best, img) =>
    (img.width ?? 0) > (best.width ?? 0) ? img : best,
  ).url;
}

@Controller('events')
export class EventsController {
  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /api/events/city/:slug?date=2026-05-27&days=2
   * days: kaç günlük pencere (varsayılan 2 = bugün + yarın)
   */
  @Get('city/:slug')
  async getByCity(
    @Param('slug') rawSlug: string,
    @Query('date') dateStr?: string,
    @Query('days') daysStr?: string,
  ) {
    const slug = resolveCitySlug(rawSlug);
    const baseDate = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
    const dayCount = Math.min(Math.max(parseInt(daysStr ?? '2', 10) || 2, 1), 7);

    const apiKey = this.configService.get<string>('TICKETMASTER_API_KEY');
    const tmConfig = CITY_TO_TM[slug];

    let cityRow: any = null;
    try {
      const [city] = await this.db
        .select()
        .from(cities)
        .where(eq(cities.slug as any, slug))
        .limit(1);
      cityRow = city ?? null;
    } catch (err) {
      console.error('DB city lookup error:', err);
    }

    const days: { date: string; total: number; data: any[] }[] = [];

    for (let i = 0; i < dayCount; i++) {
      const targetDate = addCalendarDays(baseDate, i);
      const dateFormatted = toDateKey(targetDate);
      const dayData = await this.fetchEventsForDay(
        targetDate,
        dateFormatted,
        tmConfig,
        apiKey,
        cityRow,
      );
      days.push({ date: dateFormatted, total: dayData.length, data: dayData });
    }

    const total = days.reduce((sum, d) => sum + d.total, 0);

    return {
      city: slug,
      total,
      days,
    };
  }

  private async fetchEventsForDay(
    targetDate: Date,
    dateFormatted: string,
    tmConfig: { city: string; countryCode: string } | undefined,
    apiKey: string | undefined,
    cityRow: any,
  ): Promise<any[]> {
    const results: any[] = [];

    if (tmConfig && apiKey) {
      try {
        const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
        url.searchParams.set('apikey', apiKey);
        url.searchParams.set('city', tmConfig.city);
        url.searchParams.set('countryCode', tmConfig.countryCode);
        url.searchParams.set('startDateTime', `${dateFormatted}T00:00:00Z`);
        url.searchParams.set('endDateTime', `${dateFormatted}T23:59:59Z`);
        url.searchParams.set('size', '10');
        url.searchParams.set('sort', 'date,asc');

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          const tmEvents = json?._embedded?.events ?? [];

          for (const ev of tmEvents) {
            const venue = ev._embedded?.venues?.[0];
            const startDate = ev.dates?.start?.localDate;
            const startTime = ev.dates?.start?.localTime ?? '00:00:00';

            results.push({
              id: `tm_${ev.id}`,
              name: ev.name,
              description: ev.info ?? ev.pleaseNote ?? null,
              location: venue?.name ?? null,
              address: venue?.address?.line1 ?? null,
              startDate: startDate ? new Date(`${startDate}T${startTime}`) : null,
              endDate: startDate ? new Date(`${startDate}T23:59:59`) : null,
              category: ev.classifications?.[0]?.segment?.name ?? 'Etkinlik',
              imageUrl: pickEventImageUrl(ev.images),
              ticketUrl: ev.url ?? null,
              priceMin: ev.priceRanges?.[0]?.min ?? null,
              priceMax: ev.priceRanges?.[0]?.max ?? null,
              currency: ev.priceRanges?.[0]?.currency ?? null,
              source: 'ticketmaster',
              eventDate: dateFormatted,
            });
          }
        }
      } catch (err) {
        console.error('Ticketmaster fetch error:', err);
      }
    }

    if (cityRow) {
      try {
        const dayStart = new Date(targetDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        const dbEvents = await this.db
          .select()
          .from(events)
          .where(
            and(
              eq(events.cityId as any, cityRow.id),
              lte(events.startDate as any, dayEnd),
              gte(events.endDate as any, dayStart),
            ),
          )
          .orderBy(events.startDate);

        for (const ev of dbEvents) {
          results.push({
            id: ev.id,
            name: ev.name,
            description: ev.description,
            location: ev.location,
            address: null,
            startDate: ev.startDate,
            endDate: ev.endDate,
            category: 'Etkinlik',
            imageUrl: null,
            ticketUrl: null,
            priceMin: null,
            priceMax: null,
            currency: null,
            source: 'manual',
            eventDate: dateFormatted,
          });
        }
      } catch (err) {
        console.error('DB events fetch error:', err);
      }
    }

    return results;
  }
}
