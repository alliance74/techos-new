import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubController } from './github.controller';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubPrService } from './github-pr.service';
import { GithubInstallation } from '../../entities/github-installation.entity';
import { GithubRepository } from '../../entities/github-repository.entity';
import { GithubEvent } from '../../entities/github-event.entity';
import { Task } from '../../entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GithubInstallation, GithubRepository, GithubEvent, Task]),
  ],
  controllers: [GithubController],
  providers: [
    GithubApiService,
    GithubInstallationService,
    GithubWebhookService,
    GithubPrService,
  ],
  exports: [GithubApiService, GithubInstallationService, GithubWebhookService, GithubPrService],
})
export class GithubModule {}
