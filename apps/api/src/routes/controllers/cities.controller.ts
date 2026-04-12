import { Controller, Get, Param, Inject, NotFoundException } from '@nestjs/common';
import { cities } from '@pocketguide/database';
import { eq } from 'drizzle-orm';

@Controller('cities')
export class CitiesController {
  constructor(@Inject('DB_CONNECTION') private readonly db: any) {}

  /**
   * GET /cities/:slug
   * Returns city metadata for the given slug.
   */
  @Get(':slug')
  async getCityBySlug(@Param('slug') slug: string) {
    const [city] = await this.db
      .select()
      .from(cities)
      .where(eq(cities.slug, slug))
      .limit(1);

    if (!city) {
      throw new NotFoundException(`City with slug ${slug} not found`);
    }

    return city;
  }
}
