import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Frontend'den gelen istekleri kabul etmesi için CORS'u açıyoruz:
  app.enableCors();
  
  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log('=== ENV KONTROL ===');
  console.log('FOURSQUARE_API_KEY:', process.env.FOURSQUARE_API_KEY ? 'BAŞARIYLA OKUNDU' : 'UNDEFINED!');
  console.log('===================');
}
bootstrap();
