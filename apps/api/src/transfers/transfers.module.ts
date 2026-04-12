import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { TransitImporter } from './transit-importer.service';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService, TransitImporter],
  exports: [TransfersService],
})
export class TransfersModule {}
