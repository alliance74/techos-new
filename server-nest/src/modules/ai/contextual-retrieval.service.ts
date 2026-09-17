import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Sprint } from '../../entities/sprint.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';
import { CodeReview } from '../../entities/code-review.entity';

export interface RetrievalContext {
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  bugs: Bug[];
  users: User[];
  codeReviews: CodeReview[];
  statistics: Record<string, any>;
  relevant_entities: string[];
}

@Injectable()
export class ContextualRetrievalService {
  private readonly logger = new Logger(ContextualRetrievalService.name);

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CodeReview)
    private codeReviewRepository: Repository<CodeReview>,
  ) {}

  /**
   * Extract intent keywords from user message to determine what to retrieve.
   * Order matters: more specific patterns are checked first to avoid overlap.
   */
  extractIntent(message: string): {
    domains: string[];
    entities: string[];
    timeScope: 'today' | 'week' | 'month' | 'all';
    actionType: string;
  } {
    const lower = message.toLowerCase();
    const domains: string[] = [];
    const entities: string[] = [];
    let timeScope: 'today' | 'week' | 'month' | 'all' = 'all';
    let actionType = 'query';

    // Domain detection — check specific terms first to avoid overlap
    // "sprint" alone → sprints; "sprint backlog/board" → projects+sprints
    const hasSprintWord = /\bsprint(s)?\b|\biteration\b|\bvelocity\b/.test(lower);
    const hasBacklogWord = /\bbacklog\b|\bboard\b/.test(lower);

    if (/\bproject(s)?\b|\broadmap\b|\bepic\b/.test(lower) || (hasSprintWord && hasBacklogWord)) {
      domains.push('projects');
    }
    if (hasSprintWord) {
      domains.push('sprints');
    }
    if (/\btask(s)?\b|\bticket(s)?\b|\bstory\b|\btodo\b|\bassignment\b/.test(lower)) {
      domains.push('tasks');
    }
    if (/\bbug(s)?\b|\bissue(s)?\b|\bdefect(s)?\b|\bcrash(es)?\b/.test(lower)) {
      domains.push('bugs');
    }
    if (/\bteam\b|\bmember(s)?\b|\bpeople\b|\bstaff\b|\bemployee(s)?\b/.test(lower)) {
      domains.push('team');
    }
    if (/\breview(s)?\b|\bpr(s|s\b)?\b|\bpull request(s)?\b|\bmerge(d|s)?\b/.test(lower)) {
      domains.push('code_reviews');
    }

    // Entity extraction (UUIDs, quoted names)
    const idMatch = message.match(/\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\b/);
    if (idMatch) entities.push(idMatch[1]);

    const quotedEntities = message.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedEntities) {
      entities.push(...quotedEntities.map((e) => e.replace(/['"]/g, '')));
    }

    // Time scope
    if (/\btoday\b|\bnow\b|\bcurrent\b/.test(lower)) timeScope = 'today';
    else if (/\bthis week\b|\bcurrent sprint\b|\bupcoming\b/.test(lower)) timeScope = 'week';
    else if (/\bthis month\b|\bmonthly\b/.test(lower)) timeScope = 'month';

    // Action type
    if (/\bcreate\b|\badd\b|\bnew\b|\bmake\b/.test(lower)) actionType = 'create';
    else if (/\bupdate\b|\bchange\b|\bmodify\b|\bedit\b/.test(lower)) actionType = 'update';
    else if (/\bdelete\b|\bremove\b|\bclose\b/.test(lower)) actionType = 'delete';
    else if (/\bassign\b|\bdelegate\b|\bgive\b/.test(lower)) actionType = 'assign';
    else if (/\banalyze\b|\breport\b|\bsummary\b|\bshow\b/.test(lower)) actionType = 'analyze';

    if (!domains.length) {
      // Default: include projects and tasks for general queries
      domains.push('projects', 'tasks');
    }

    return { domains, entities, timeScope, actionType };
  }

  /**
   * Perform contextual retrieval based on extracted intent.
   * Only queries the databases relevant to the detected domains.
   */
  async retrieveContext(org_id: string, message: string): Promise<RetrievalContext> {
    const intent = this.extractIntent(message);
    this.logger.log(
      `Retrieval intent: domains=[${intent.domains}], timeScope=${intent.timeScope}, action=${intent.actionType}`,
    );

    const context: RetrievalContext = {
      projects: [],
      tasks: [],
      sprints: [],
      bugs: [],
      users: [],
      codeReviews: [],
      statistics: {},
      relevant_entities: intent.entities,
    };

    const limit = 20;

    // Retrieve only relevant domains in parallel
    const queries: Promise<void>[] = [];

    if (intent.domains.includes('projects')) {
      queries.push(
        this.projectRepository
          .find({ where: { org_id }, take: limit, order: { created_at: 'DESC' } })
          .then((r) => { context.projects = r; }),
      );
    }

    if (intent.domains.includes('tasks')) {
      queries.push(
        this.taskRepository
          .find({ where: { org_id }, take: limit, order: { created_at: 'DESC' } })
          .then((r) => { context.tasks = r; }),
      );
    }

    if (intent.domains.includes('sprints')) {
      queries.push(
        this.sprintRepository
          .find({ where: { org_id }, take: 10, order: { created_at: 'DESC' } })
          .then((r) => { context.sprints = r; }),
      );
    }

    if (intent.domains.includes('bugs')) {
      queries.push(
        this.bugRepository
          .find({ where: { org_id }, take: limit, order: { created_at: 'DESC' } })
          .then((r) => { context.bugs = r; }),
      );
    }

    if (intent.domains.includes('team')) {
      queries.push(
        this.userRepository
          .find({ where: { org_id }, take: 50 })
          .then((r) => { context.users = r; }),
      );
    }

    if (intent.domains.includes('code_reviews')) {
      queries.push(
        this.codeReviewRepository
          .find({ where: { org_id }, take: limit, order: { created_at: 'DESC' } })
          .then((r) => { context.codeReviews = r; }),
      );
    }

    await Promise.all(queries);

    // Build statistics for retrieved context
    context.statistics = {
      projects: context.projects.length,
      tasks: {
        total: context.tasks.length,
        todo: context.tasks.filter((t) => t.status === 'todo').length,
        in_progress: context.tasks.filter((t) => t.status === 'in_progress').length,
        done: context.tasks.filter((t) => t.status === 'done').length,
      },
      bugs: {
        total: context.bugs.length,
        open: context.bugs.filter((b) => b.status === 'open').length,
        critical: context.bugs.filter((b) => b.severity === 'critical').length,
      },
      sprints: context.sprints.length,
      team: context.users.length,
      code_reviews: context.codeReviews.length,
    };

    return context;
  }

  /**
   * Build a focused prompt from contextual retrieval results
   */
  buildContextPrompt(context: RetrievalContext): string {
    const parts: string[] = [];

    if (context.projects.length) {
      parts.push(`# PROJECTS (${context.projects.length})`);
      context.projects.forEach((p) => {
        parts.push(`- ${p.name} [${p.status}] (ID: ${p.id})`);
      });
    }

    if (context.tasks.length) {
      parts.push(`\n# TASKS (${context.statistics.tasks.total} total, ${context.statistics.tasks.in_progress} in progress, ${context.statistics.tasks.done} done)`);
      context.tasks.slice(0, 15).forEach((t) => {
        parts.push(`- "${t.title}" [${t.status}] priority=${t.priority} project=${t.project_id} (ID: ${t.id})`);
      });
    }

    if (context.sprints.length) {
      parts.push(`\n# SPRINTS (${context.sprints.length})`);
      context.sprints.forEach((s) => {
        parts.push(`- "${s.name}" [${s.status}] ${s.start_date} → ${s.end_date}`);
      });
    }

    if (context.bugs.length) {
      parts.push(`\n# BUGS (${context.statistics.bugs.total} total, ${context.statistics.bugs.open} open)`);
      context.bugs.slice(0, 10).forEach((b) => {
        parts.push(`- "${b.title}" [${b.status}] severity=${b.severity}`);
      });
    }

    if (context.users.length) {
      parts.push(`\n# TEAM (${context.users.length} members)`);
      context.users.slice(0, 10).forEach((u) => {
        parts.push(`- ${u.name || u.email} [${u.role}] (ID: ${u.id})`);
      });
    }

    if (context.codeReviews.length) {
      parts.push(`\n# CODE REVIEWS (${context.codeReviews.length})`);
      context.codeReviews.slice(0, 5).forEach((cr) => {
        parts.push(`- "${cr.title}" [${cr.status}] (ID: ${cr.id})`);
      });
    }

    return parts.join('\n');
  }
}
