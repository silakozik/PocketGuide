import { Controller, Get, Post, Put, Delete, Body, Param, Query, Sse, MessageEvent } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransferRouteDTO, TransportCardDTO } from '@pocketguide/types';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Controller('api/admin/transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get('routes')
  async getRoutes(
    @Query('cityId') cityId?: string,
    @Query('type') type?: string,
    @Query('mode') mode?: string,
  ) {
    return this.transfersService.findAllRoutes({ cityId, type, mode });
  }

  @Post('routes')
  async createRoute(@Body() data: Partial<TransferRouteDTO>) {
    return this.transfersService.createRoute(data);
  }

  @Put('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() data: Partial<TransferRouteDTO>) {
    return this.transfersService.updateRoute(id, data);
  }

  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    return this.transfersService.deleteRoute(id);
  }

  @Get('cards')
  async getCards(@Query('cityId') cityId?: string) {
    return this.transfersService.findAllCards(cityId);
  }

  @Sse('import-transit')
  importTransit(@Query('cityId') cityId: string): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    this.transfersService.importFromOSM(cityId, (progress) => {
      subject.next({ data: progress } as MessageEvent);
      if (progress.status === 'done') {
        subject.complete();
      }
    }).catch(err => {
      subject.next({ data: { status: 'error', message: err.message } } as MessageEvent);
      subject.complete();
    });

    return subject.asObservable();
  }
}
