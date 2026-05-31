import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PhotosController } from './photos.controller';

@Module({
  imports: [AuthModule],
  controllers: [PhotosController],
})
export class PhotosModule {}
