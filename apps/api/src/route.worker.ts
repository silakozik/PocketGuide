import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RouteGenerationWorkerModule } from './routes/queue/route-generation-worker.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('RouteWorkerBootstrap');
  const ctx = await NestFactory.createApplicationContext(
    RouteGenerationWorkerModule,
    { logger: ['error', 'warn', 'log'] },
  );

  logger.log(
    `Route-generation BullMQ worker started (queue: route-generation, concurrency: 3)`,
  );

  const shutdown = async () => {
    await ctx.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
