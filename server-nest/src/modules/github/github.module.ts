import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GithubController } from './github.controller';
import { GithubApiService } from './github-api.service';
import { GithubInstallationService } from './github-installation.service';
import { GithubWebhookService } from './github-webhook.service';
import { GithubInstallation } from '../../entities/github-installation.entity';
import { GithubRepository } from '../../entities/github-repository.entity';
import { GithubEvent } from '../../entities/github-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GithubInstallation, GithubRepository, GithubEvent]),
  ],
  controllers: [GithubController],
  providers: [GithubApiService, GithubInstallationService, GithubWebhookService],
  exports: [GithubApiService, GithubInstallationService, GithubWebhookService],
})
export class GithubModule {}
