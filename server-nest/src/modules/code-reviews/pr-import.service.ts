import { Injectable, Logger } from '@nestjs/common';

export type ImportedReviewFile = {
  path: string;
  additions: number;
  deletions: number;
  patch?: string;
  status?: string;
};

@Injectable()
export class PrImportService {
  private readonly logger = new Logger(PrImportService.name);

  parseGithubPrUrl(url: string): { owner: string; repo: string; number: string } | null {
    const match = String(url || '').match(
      /github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?\/pull\/(\d+)/i,
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/i, ''), number: match[3] };
  }

  parseGitlabMrUrl(url: string): { projectPath: string; number: string; host: string } | null {
    const match = String(url || '').match(
      /https?:\/\/([^/]+)\/(.+?)\/-\/merge_requests\/(\d+)/i,
    );
    if (!match) return null;
    return { host: match[1], projectPath: match[2], number: match[3] };
  }

  async importFiles(
    prUrl: string,
    tokens?: { github?: string | null; gitlab?: string | null },
  ): Promise<{ files: ImportedReviewFile[]; provider: string | null; message?: string }> {
    const github = this.parseGithubPrUrl(prUrl);
    if (github) {
      return this.fetchGithubFiles(github, tokens?.github || process.env.GITHUB_TOKEN);
    }

    const gitlab = this.parseGitlabMrUrl(prUrl);
    if (gitlab) {
      return this.fetchGitlabFiles(gitlab, tokens?.gitlab || process.env.GITLAB_TOKEN);
    }

    return {
      files: [],
      provider: null,
      message: 'PR URL must be a GitHub pull request or GitLab merge request link',
    };
  }

  private async fetchGithubFiles(
    ref: { owner: string; repo: string; number: string },
    token?: string | null,
  ) {
    const url = `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}/files`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'TechOS',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(`GitHub PR import failed (${res.status}): ${body.slice(0, 200)}`);
        return {
          files: [] as ImportedReviewFile[],
          provider: 'github',
          message:
            res.status === 401 || res.status === 403
              ? 'GitHub rejected the request — set GITHUB_TOKEN or connect GitHub in Integrations'
              : `GitHub returned ${res.status}. Check the PR URL and token permissions.`,
        };
      }
      const data = (await res.json()) as any[];
      const files = (Array.isArray(data) ? data : []).map((f) => ({
        path: String(f.filename || f.path || 'unknown'),
        additions: Number(f.additions || 0),
        deletions: Number(f.deletions || 0),
        patch: typeof f.patch === 'string' ? f.patch : undefined,
        status: f.status || 'modified',
      }));
      return { files, provider: 'github' as const };
    } catch (err: any) {
      this.logger.warn(`GitHub fetch error: ${err?.message || err}`);
      return {
        files: [] as ImportedReviewFile[],
        provider: 'github',
        message: 'Could not reach GitHub API',
      };
    }
  }

  private async fetchGitlabFiles(
    ref: { projectPath: string; number: string; host: string },
    token?: string | null,
  ) {
    const encoded = encodeURIComponent(ref.projectPath);
    const url = `https://${ref.host}/api/v4/projects/${encoded}/merge_requests/${ref.number}/changes`;
    const headers: Record<string, string> = { 'User-Agent': 'TechOS' };
    if (token) headers['PRIVATE-TOKEN'] = token;

    try {
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return {
          files: [] as ImportedReviewFile[],
          provider: 'gitlab',
          message:
            res.status === 401 || res.status === 403
              ? 'GitLab rejected the request — set GITLAB_TOKEN or connect GitLab in Integrations'
              : `GitLab returned ${res.status}`,
        };
      }
      const data = (await res.json()) as any;
      const changes = Array.isArray(data?.changes) ? data.changes : [];
      const files = changes.map((c: any) => {
        const patch = String(c.diff || '');
        const additions = (patch.match(/^\+[^+]/gm) || []).length;
        const deletions = (patch.match(/^-[^-]/gm) || []).length;
        return {
          path: String(c.new_path || c.old_path || 'unknown'),
          additions,
          deletions,
          patch: patch || undefined,
          status: c.new_file ? 'added' : c.deleted_file ? 'removed' : 'modified',
        };
      });
      return { files, provider: 'gitlab' as const };
    } catch (err: any) {
      this.logger.warn(`GitLab fetch error: ${err?.message || err}`);
      return {
        files: [] as ImportedReviewFile[],
        provider: 'gitlab',
        message: 'Could not reach GitLab API',
      };
    }
  }
}
