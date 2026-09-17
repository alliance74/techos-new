import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface GithubAppConfig {
  appId: number;
  privateKey: string;
  webhookSecret: string;
}

export interface InstallationAccessToken {
  token: string;
  expires_at: string;
  permissions: any;
  repository_selection: string;
}

@Injectable()
export class GithubApiService {
  private readonly logger = new Logger(GithubApiService.name);
  private appConfig: GithubAppConfig | null = null;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig() {
    const appId = this.configService.get<number>('GITHUB_APP_ID');
    const privateKey = this.configService.get<string>('GITHUB_PRIVATE_KEY');
    const webhookSecret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');

    if (appId && privateKey && webhookSecret) {
      this.appConfig = { appId, privateKey, webhookSecret };
      this.logger.log('GitHub App configuration loaded');
    } else {
      this.logger.warn('GitHub App not configured - missing env vars');
    }
  }

  isConfigured(): boolean {
    return this.appConfig !== null;
  }

  /**
   * Generate JWT for GitHub App authentication
   */
  generateJwt(): string {
    if (!this.appConfig) {
      throw new Error('GitHub App not configured');
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued at (60 seconds in the past)
      exp: now + (10 * 60), // Expiration (10 minutes)
      iss: this.appConfig.appId, // GitHub App ID
    };

    return crypto
      .createSign('RSA-SHA256')
      .update(JSON.stringify(payload))
      .sign(this.appConfig.privateKey, 'base64');
  }

  /**
   * Get installation access token for API calls
   */
  async getInstallationAccessToken(installationId: number): Promise<InstallationAccessToken> {
    if (!this.appConfig) {
      throw new Error('GitHub App not configured');
    }

    const jwt = this.generateJwt();
    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get installation token: ${error}`);
    }

    return response.json();
  }

  /**
   * Make authenticated API call as installation
   */
  async requestAsInstallation(
    installationId: number,
    method: string,
    path: string,
    body?: any,
  ): Promise<any> {
    const token = await this.getInstallationAccessToken(installationId);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`https://api.github.com${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * List repositories accessible by installation
   */
  async listInstallationRepositories(installationId: number) {
    return this.requestAsInstallation(
      installationId,
      'GET',
      '/installation/repositories',
    );
  }

  /**
   * Get repository details
   */
  async getRepository(installationId: number, owner: string, repo: string) {
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}`,
    );
  }

  /**
   * List issues for a repository
   */
  async listIssues(
    installationId: number,
    owner: string,
    repo: string,
    params?: { state?: string; per_page?: number; page?: number },
  ) {
    const query = new URLSearchParams(params as any).toString();
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/issues${query ? `?${query}` : ''}`,
    );
  }

  /**
   * List pull requests for a repository
   */
  async listPullRequests(
    installationId: number,
    owner: string,
    repo: string,
    params?: { state?: string; per_page?: number; page?: number },
  ) {
    const query = new URLSearchParams(params as any).toString();
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/pulls${query ? `?${query}` : ''}`,
    );
  }

  /**
   * Get pull request details
   */
  async getPullRequest(installationId: number, owner: string, repo: string, pullNumber: number) {
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/pulls/${pullNumber}`,
    );
  }

  /**
   * Get commit details
   */
  async getCommit(installationId: number, owner: string, repo: string, sha: string) {
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/commits/${sha}`,
    );
  }

  /**
   * List commit statuses
   */
  async listCommitStatuses(installationId: number, owner: string, repo: string, sha: string) {
    return this.requestAsInstallation(
      installationId,
      'GET',
      `/repos/${owner}/${repo}/commits/${sha}/status`,
    );
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.appConfig) {
      throw new Error('GitHub App not configured');
    }

    const hmac = crypto.createHmac('sha256', this.appConfig.webhookSecret);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }
}
