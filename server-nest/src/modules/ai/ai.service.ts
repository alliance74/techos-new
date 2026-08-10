import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { Project } from '../../entities/project.entity';
import { Task } from '../../entities/task.entity';
import { Bug } from '../../entities/bug.entity';
import { User } from '../../entities/user.entity';
import { Invoice } from '../../entities/invoice.entity';
import { Expense } from '../../entities/expense.entity';
import { Goal } from '../../entities/goal.entity';
import { KPI } from '../../entities/kpi.entity';
import { Meeting } from '../../entities/meeting.entity';
import { Sprint } from '../../entities/sprint.entity';

type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private grokApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Bug)
    private bugRepository: Repository<Bug>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(KPI)
    private kpiRepository: Repository<KPI>,
    @InjectRepository(Meeting)
    private meetingRepository: Repository<Meeting>,
    @InjectRepository(Sprint)
    private sprintRepository: Repository<Sprint>,
  ) {
    // Initialize AI providers
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');
    const geminiKey = this.configService.get('GEMINI_API_KEY');
    this.grokApiKey = this.configService.get('GROK_API_KEY');

    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    }
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }
  }

  async chat(org_id: string, user_id: string, message: string, provider: AIProvider = 'openai') {
    // Gather system context
    const context = await this.gatherSystemContext(org_id);
    
    // Build system prompt with complete context
    const systemPrompt = this.buildSystemPrompt(context);
    
    // Call appropriate AI provider
    let response: string;
    
    switch (provider) {
      case 'openai':
        response = await this.callOpenAI(systemPrompt, message);
        break;
      case 'claude':
        response = await this.callClaude(systemPrompt, message);
        break;
      case 'gemini':
        response = await this.callGemini(systemPrompt, message);
        break;
      case 'grok':
        response = await this.callGrok(systemPrompt, message);
        break;
      default:
        throw new BadRequestException('Invalid AI provider');
    }

    return {
      success: true,
      data: {
        message: response,
        provider,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async gatherSystemContext(org_id: string) {
    const [projects, tasks, bugs, users, invoices, expenses, goals, kpis, meetings, sprints] = await Promise.all([
      this.projectRepository.find({ where: { org_id }, take: 100 }),
      this.taskRepository.find({ where: { org_id }, take: 100, order: { created_at: 'DESC' } }),
      this.bugRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.userRepository.find({ where: { org_id } }),
      this.invoiceRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.expenseRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.goalRepository.find({ where: { org_id, status: 'active' } }),
      this.kpiRepository.find({ where: { org_id } }),
      this.meetingRepository.find({ where: { org_id }, take: 20, order: { scheduled_at: 'DESC' } }),
      this.sprintRepository.find({ where: { org_id }, take: 10, order: { created_at: 'DESC' } }),
    ]);

    // Calculate statistics
    const projectStats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
    };

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    const bugStats = {
      total: bugs.length,
      open: bugs.filter(b => b.status === 'open').length,
      critical: bugs.filter(b => b.severity === 'critical').length,
    };

    const financialStats = {
      total_revenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
      total_expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      net_profit: invoices.reduce((sum, inv) => sum + inv.amount, 0) - expenses.reduce((sum, exp) => sum + exp.amount, 0),
    };

    const goalStats = {
      total: goals.length,
      average_progress: goals.reduce((sum, g) => sum + g.progress, 0) / goals.length || 0,
    };

    return {
      projects: projects.slice(0, 10), // Top 10 recent
      tasks: tasks.slice(0, 20), // Top 20 recent
      bugs: bugs.slice(0, 10), // Top 10 recent
      users,
      invoices: invoices.slice(0, 10),
      expenses: expenses.slice(0, 10),
      goals,
      kpis,
      meetings: meetings.slice(0, 5),
      sprints: sprints.slice(0, 3),
      statistics: {
        projects: projectStats,
        tasks: taskStats,
        bugs: bugStats,
        financial: financialStats,
        goals: goalStats,
        team_size: users.length,
      },
    };
  }

  private buildSystemPrompt(context: any): string {
    return `You are an intelligent AI assistant for TechOS, a comprehensive operating system for software companies.

You have COMPLETE access to the following real-time data from the organization:

# SYSTEM CAPABILITIES
- Project Management (${context.statistics.projects.total} projects)
- Task Management (${context.statistics.tasks.total} tasks)
- Bug Tracking (${context.statistics.bugs.total} bugs)
- CRM (Contacts & Deals)
- Finance (Invoices & Expenses)
- HR (Employees & Leave)
- Goals & OKRs (${context.goals.length} active goals)
- Meetings & Collaboration
- Analytics & Reports
- Document Management

# CURRENT STATISTICS
Projects: ${context.statistics.projects.active} active, ${context.statistics.projects.completed} completed
Tasks: ${context.statistics.tasks.in_progress} in progress, ${context.statistics.tasks.done} done, ${context.statistics.tasks.todo} pending
Bugs: ${context.statistics.bugs.open} open, ${context.statistics.bugs.critical} critical
Financial: Revenue $${context.statistics.financial.total_revenue}, Expenses $${context.statistics.financial.total_expenses}, Net $${context.statistics.financial.net_profit}
Team: ${context.statistics.team_size} members
Goals: Average ${context.statistics.goals.average_progress.toFixed(1)}% progress

# RECENT PROJECTS
${context.projects.map(p => `- ${p.name} (${p.status}): ${p.description || 'No description'}`).join('\n')}

# RECENT TASKS (Sample)
${context.tasks.slice(0, 10).map(t => `- ${t.title} [${t.status}] - Priority: ${t.priority}`).join('\n')}

# ACTIVE GOALS
${context.goals.map(g => `- ${g.title}: ${g.progress}% complete`).join('\n')}

# KEY PERFORMANCE INDICATORS
${context.kpis.map(k => `- ${k.name}: ${k.current}/${k.target} ${k.unit}`).join('\n')}

# RECENT BUGS
${context.bugs.slice(0, 5).map(b => `- ${b.title} [${b.severity}/${b.priority}]`).join('\n')}

# ACTIVE SPRINTS
${context.sprints.filter(s => s.status === 'active').map(s => `- ${s.name} (${s.start_date} to ${s.end_date})`).join('\n')}

INSTRUCTIONS:
- Answer questions accurately based on the real data above
- Provide insights and recommendations based on patterns you see
- Calculate and analyze data when asked
- Suggest actionable improvements
- Be concise but comprehensive
- When asked about specific data, reference actual numbers
- If data is not available, clearly state that

You can answer questions like:
- "What's our project completion rate?"
- "Which bugs are most critical?"
- "How is our financial performance?"
- "What are our team's top priorities?"
- "Generate a status report"
- "What goals are at risk?"
- "Analyze our sprint velocity"
- And many more...`;
  }

  private async callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.openai) {
      throw new BadRequestException('OpenAI API key not configured');
    }

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content || 'No response generated';
  }

  private async callClaude(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.anthropic) {
      throw new BadRequestException('Claude API key not configured');
    }

    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.gemini) {
      throw new BadRequestException('Gemini API key not configured');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I am your TechOS AI assistant with complete system context.' }],
        },
      ],
    });

    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  }

  private async callGrok(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.grokApiKey) {
      throw new BadRequestException('Grok API key not configured');
    }

    const response = await axios.post(
      'https://api.x.ai/v1/chat/completions',
      {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  async generateReport(org_id: string, reportType: string, provider: AIProvider = 'openai') {
    const context = await this.gatherSystemContext(org_id);
    
    const prompts = {
      executive: 'Generate a comprehensive executive summary report covering projects, financials, goals, and team performance.',
      financial: 'Generate a detailed financial analysis including revenue, expenses, profitability trends, and recommendations.',
      project: 'Generate a project status report covering all active projects, completion rates, and blockers.',
      sprint: 'Generate a sprint analysis report covering velocity, completion rates, and team performance.',
      goals: 'Generate a goals and OKRs progress report with risk analysis and recommendations.',
    };

    const prompt = prompts[reportType] || 'Generate a comprehensive status report of the entire system.';
    
    return this.chat(org_id, 'system', prompt, provider);
  }

  async analyzeRisk(org_id: string, provider: AIProvider = 'openai') {
    const context = await this.gatherSystemContext(org_id);
    
    const prompt = `Analyze all current data and identify:
1. Projects at risk of delay
2. Financial concerns or budget overruns
3. Goals that might not be achieved
4. Critical bugs that need immediate attention
5. Team capacity or productivity issues

Provide specific, actionable recommendations for each risk identified.`;

    return this.chat(org_id, 'system', prompt, provider);
  }

  async suggestPriorities(org_id: string, provider: AIProvider = 'openai') {
    const context = await this.gatherSystemContext(org_id);
    
    const prompt = `Based on all current data, suggest:
1. Top 5 tasks that should be prioritized
2. Critical bugs that need immediate attention
3. Goals that need more focus
4. Projects that need additional resources
5. Team members who might need support

Explain your reasoning for each suggestion.`;

    return this.chat(org_id, 'system', prompt, provider);
  }
}
