import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser for admin auth
  app.use(cookieParser());

  // Frontend'den gelen istekleri kabul etmesi için CORS'u açıyoruz:
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // API prefix ekliyoruz (Frontend'in beklediği yapı)
  app.setGlobalPrefix('api');
  
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('=== ENV KONTROL ===');
  console.log('FOURSQUARE_API_KEY:', process.env.FOURSQUARE_API_KEY ? 'BAŞARIYLA OKUNDU' : 'UNDEFINED!');
  console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET!');
  console.log('===================');
}
bootstrap();

