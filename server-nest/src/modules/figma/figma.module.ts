import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FigmaController } from './figma.controller';
import { FigmaService } from './figma.service';
import { FigmaWebhookEvent } from '../../entities/figma-webhook-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FigmaWebhookEvent])],
  controllers: [FigmaController],
  providers: [FigmaService],
  exports: [FigmaService],
})
export class FigmaModule {}
