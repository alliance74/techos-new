import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Feature } from '../../entities/feature.entity';
import { Epic } from '../../entities/epic.entity';
import { Bug } from '../../entities/bug.entity';
import { Release } from '../../entities/release.entity';
import { CustomerFeedback } from '../../entities/customer-feedback.entity';
import { Roadmap } from '../../entities/roadmap.entity';
import { Project } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Feature,
      Epic,
      Bug,
      Release,
      CustomerFeedback,
      Roadmap,
      Project,
      User,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
