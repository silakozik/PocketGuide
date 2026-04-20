import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDb } from '@pocketguide/database';

@Global()
@Module({
  providers: [
    {
      provide: 'DB_CONNECTION',
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/pocketguide',
        );
        return createDb(connectionString);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DB_CONNECTION'],
})
export class DatabaseModule {}
