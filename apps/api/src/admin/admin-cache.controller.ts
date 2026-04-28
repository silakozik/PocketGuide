import { Controller, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../config/redis.service';

@Controller('admin/cache')
export class AdminCacheController {
  constructor(private readonly redisService: RedisService) {}

  /**
   * DELETE /api/admin/cache/clear?pattern=pois:istanbul:*
   * 
   * Clears cache entries by matching pattern using the safe SCAN command.
   */
  @Delete('clear')
  async clearCache(@Query('pattern') pattern: string) {
    if (!pattern) {
      throw new HttpException('Pattern is required', HttpStatus.BAD_REQUEST);
    }

    const deletedCount = await this.redisService.clearCacheByPattern(pattern);
    
    return {
      message: `Successfully cleared ${deletedCount} cache entries matching '${pattern}'`,
      deletedCount,
    };
  }
}
