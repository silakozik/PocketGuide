import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getBullmqRedisOptions } from './bullmq-connection.util';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: getBullmqRedisOptions(config),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class BullmqRootModule {}
