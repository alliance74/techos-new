import { Module } from '@nestjs/common';
import { FigmaController } from './figma.controller';
import { FigmaService } from './figma.service';

@Module({
  controllers: [FigmaController],
  providers: [FigmaService],
  exports: [FigmaService],
})
export class FigmaModule {}
