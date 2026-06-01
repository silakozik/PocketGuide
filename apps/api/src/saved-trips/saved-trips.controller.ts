import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { savedTrips } from '@pocketguide/database';
import { eq, desc } from 'drizzle-orm';

type SavedStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

@Controller('saved-trips')
@UseGuards(JwtAuthGuard)
export class SavedTripsController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  @Get('my')
  async getMyTrips(@Req() req: AuthenticatedRequest) {
    const rows = await this.db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.userId as any, req.userId))
      .orderBy(desc(savedTrips.createdAt as any));
    return { data: rows };
  }

  @Get(':id')
  async getTrip(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const [row] = await this.db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.id as any, id))
      .limit(1);

    if (!row || row.userId !== req.userId) {
      throw new NotFoundException('Seyahat bulunamadı');
    }
    return { data: row };
  }

  @Post()
  async saveTrip(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      title?: string;
      cityName?: string;
      stops: SavedStop[];
      routeData?: unknown;
      durationMinutes?: number;
      distanceKm?: number;
    },
  ) {
    if (!body.stops?.length || body.stops.length < 2) {
      throw new BadRequestException('En az 2 durak gerekli');
    }

    const title =
      body.title?.trim() ||
      `${body.cityName?.trim() || 'Özel'} Rotası`;

    const [trip] = await this.db
      .insert(savedTrips)
      .values({
        userId: req.userId,
        title,
        cityName: body.cityName?.trim() || null,
        stops: body.stops,
        routeData: body.routeData ?? null,
        durationMinutes: body.durationMinutes ?? null,
        distanceKm: body.distanceKm ?? null,
        status: 'planned',
      } as any)
      .returning();

    return { success: true, data: trip };
  }

  @Delete(':id')
  async deleteTrip(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const [row] = await this.db
      .select()
      .from(savedTrips)
      .where(eq(savedTrips.id as any, id))
      .limit(1);

    if (!row) throw new NotFoundException('Seyahat bulunamadı');
    if (row.userId !== req.userId) {
      throw new BadRequestException('Bu seyahati silme yetkiniz yok');
    }

    await this.db
      .delete(savedTrips)
      .where(eq(savedTrips.id as any, id));

    return { success: true };
  }
}
