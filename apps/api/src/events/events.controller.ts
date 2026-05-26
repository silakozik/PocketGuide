import { Controller, Get, Param, Query, Inject } from '@nestjs/common';
import { cities, events } from '@pocketguide/database';
import { eq, and, gte, lte } from 'drizzle-orm';

@Controller('events')
export class EventsController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  /**
   * GET /api/events/city/:slug?date=2026-05-26
   * date parametresi verilmezse bugünün tarihi kullanılır.
   * O güne ait (startDate <= date <= endDate) etkinlikleri döner.
   */
  @Get('city/:slug')
  async getByCity(
    @Param('slug') slug: string,
    @Query('date') dateStr?: string,
  ) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const [city] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.slug as any, slug))
      .limit(1);

    if (!city) return { city: null, data: [] };

    const rows = await this.db
      .select()
      .from(events)
      .where(
        and(
          eq(events.cityId as any, city.id),
          lte(events.startDate as any, dayEnd),
          gte(events.endDate as any, dayStart),
        ),
      )
      .orderBy(events.startDate);

    return {
      city: { id: city.id, nameEn: city.nameEn, nameTr: city.nameTr, slug: city.slug },
      data: rows.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
    };
  }
}
