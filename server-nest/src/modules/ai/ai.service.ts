import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
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
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';
import { CalendarEvent } from '../../entities/calendar-event.entity';
import { Contact } from '../../entities/contact.entity';
import { Deal } from '../../entities/deal.entity';
import { Document } from '../../entities/document.entity';
import { Announcement } from '../../entities/announcement.entity';
import { Feature } from '../../entities/feature.entity';
import { Epic } from '../../entities/epic.entity';
import { Release } from '../../entities/release.entity';
import { CustomerFeedback } from '../../entities/customer-feedback.entity';
import { Employee } from '../../entities/employee.entity';
import { LeaveRequest } from '../../entities/leave-request.entity';
import { CodeReview } from '../../entities/code-review.entity';
import { Channel } from '../../entities/channel.entity';
import { Message } from '../../entities/message.entity';

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
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private messageRepository: Repository<AiMessage>,
    @InjectRepository(AiUsage)
    private usageRepository: Repository<AiUsage>,
    @InjectRepository(CalendarEvent)
    private calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
    @InjectRepository(Epic)
    private epicRepository: Repository<Epic>,
    @InjectRepository(Release)
    private releaseRepository: Repository<Release>,
    @InjectRepository(CustomerFeedback)
    private customerFeedbackRepository: Repository<CustomerFeedback>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(LeaveRequest)
    private leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(CodeReview)
    private codeReviewRepository: Repository<CodeReview>,
    @InjectRepository(Channel)
    private channelRepository: Repository<Channel>,
    @InjectRepository(Message)
    private messageChannelRepository: Repository<Message>,
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
    // Validate message
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // MOCK MODE: If no API keys are configured, return mock response
    const hasAnyProvider = this.openai || this.anthropic || this.gemini || this.grokApiKey;
    if (!hasAnyProvider) {
      console.log('⚠️  No AI providers configured. Returning mock response.');
      return {
        success: true,
        data: {
          message: `🤖 MOCK RESPONSE: I'm running in demo mode since no AI API keys are configured.\n\nYou asked: "${message}"\n\nTo enable real AI responses:\n1. Get an API key from https://platform.openai.com/api-keys\n2. Add it to your .env file as OPENAI_API_KEY=your-key\n3. Restart the backend\n\nFor now, I can tell you that based on your organization's data, everything looks great! 🎉`,
          provider: 'mock',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Check if provider is configured
    this.validateProviderConfiguration(provider);

    // Get user information for role-based context
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const userRole = user?.role || 'Unknown';
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User';

    // Gather system context
    const context = await this.gatherSystemContext(org_id);
    
    // Build system prompt with complete context including user role
    const systemPrompt = this.buildSystemPrompt(context, userRole, userName);
    
    // Call appropriate AI provider
    let response: string;
    
    try {
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
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`AI provider error: ${error.message}`);
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

  async chatInConversation(org_id: string, user_id: string, conversation_id: string, message: string) {
    // Validate message
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // Get conversation WITHOUT messages to avoid relationship issues
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversation_id, userId: user_id },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    // Get conversation history separately
    const messages = await this.messageRepository.find({
      where: { conversationId: conversation_id },
      order: { createdAt: 'ASC' },
      take: 10, // Last 10 messages
    });

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const userRole = user?.role || 'Unknown';
    const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'User';

    // Check usage limits
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get or create usage record
    let usage = await this.usageRepository.findOne({
      where: { userId: user_id },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId: user_id,
        orgId: org_id,
        periodStart,
        periodEnd,
        messagesSent: 0,
        conversationsCreated: 0,
        tokensUsed: 0,
      });
    }

    // Save user message
    const userMessage = this.messageRepository.create({
      conversationId: conversation_id,
      role: 'user',
      content: message,
      tokens: 0,
    });
    await this.messageRepository.save(userMessage);

    // Get conversation history for context
    const conversationHistory = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Gather system context
    const context = await this.gatherSystemContext(org_id);
    
    // Build system prompt with context and conversation history
    const systemPrompt = this.buildSystemPrompt(context, userRole, userName);
    const fullPrompt = conversationHistory 
      ? `${systemPrompt}\n\n# CONVERSATION HISTORY\n${conversationHistory}\n\n# CURRENT USER MESSAGE`
      : systemPrompt;

    // Call AI provider
    this.validateProviderConfiguration(conversation.provider as AIProvider);
    
    let response: string;
    try {
      switch (conversation.provider) {
        case 'openai':
          response = await this.callOpenAI(fullPrompt, message);
          break;
        case 'claude':
          response = await this.callClaude(fullPrompt, message);
          break;
        case 'gemini':
          response = await this.callGemini(fullPrompt, message);
          break;
        case 'grok':
          response = await this.callGrok(fullPrompt, message);
          break;
        default:
          response = await this.callGemini(fullPrompt, message);
      }
    } catch (error) {
      throw new BadRequestException(`AI provider error: ${error.message}`);
    }

    // Estimate tokens (rough estimate: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil((message.length + response.length) / 4);

    // Save assistant response
    const assistantMessage = this.messageRepository.create({
      conversationId: conversation_id,
      role: 'assistant',
      content: response,
      tokens: estimatedTokens,
    });
    await this.messageRepository.save(assistantMessage);

    // Update conversation stats using update() to avoid loading relationships
    await this.conversationRepository.update(conversation_id, {
      messageCount: conversation.messageCount + 2,
      tokensUsed: conversation.tokensUsed + estimatedTokens,
    });

    // Update usage stats
    usage.messagesSent += 1;
    usage.tokensUsed += estimatedTokens;
    await this.usageRepository.save(usage);

    return {
      success: true,
      data: {
        userMessage,
        assistantMessage,
        conversation: {
          id: conversation.id,
          title: conversation.title,
          messageCount: conversation.messageCount,
          tokensUsed: conversation.tokensUsed,
        },
      },
    };
  }

  private validateProviderConfiguration(provider: AIProvider): void {
    switch (provider) {
      case 'openai':
        if (!this.openai) {
          throw new BadRequestException('OpenAI is not configured. Please add OPENAI_API_KEY to your environment variables.');
        }
        break;
      case 'claude':
        if (!this.anthropic) {
          throw new BadRequestException('Claude is not configured. Please add ANTHROPIC_API_KEY to your environment variables.');
        }
        break;
      case 'gemini':
        if (!this.gemini) {
          throw new BadRequestException('Gemini is not configured. Please add GEMINI_API_KEY to your environment variables.');
        }
        break;
      case 'grok':
        if (!this.grokApiKey) {
          throw new BadRequestException('Grok is not configured. Please add GROK_API_KEY to your environment variables.');
        }
        break;
    }
  }

  private async gatherSystemContext(org_id: string) {
    // Get current date for calendar queries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      projects,
      tasks,
      bugs,
      users,
      invoices,
      expenses,
      goals,
      kpis,
      meetings,
      sprints,
      calendarEvents,
      contacts,
      deals,
      documents,
      announcements,
      features,
      epics,
      releases,
      customerFeedback,
      employees,
      leaveRequests,
      codeReviews,
      channels,
      channelMessages,
    ] = await Promise.all([
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
      this.calendarEventRepository.find({ where: { org_id }, take: 50, order: { start_datetime: 'ASC' } }),
      this.contactRepository.find({ where: { org_id }, take: 100 }),
      this.dealRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.documentRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.announcementRepository.find({ where: { org_id }, take: 20, order: { created_at: 'DESC' } }),
      this.featureRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.epicRepository.find({ where: { org_id }, take: 30, order: { created_at: 'DESC' } }),
      this.releaseRepository.find({ where: { org_id }, take: 20, order: { created_at: 'DESC' } }),
      this.customerFeedbackRepository.find({ where: { org_id }, take: 50, order: { created_at: 'DESC' } }),
      this.employeeRepository.find({ where: { org_id } }),
      this.leaveRequestRepository.find({ where: { org_id }, take: 30, order: { created_at: 'DESC' } }),
      this.codeReviewRepository.find({ where: { org_id }, take: 30, order: { created_at: 'DESC' } }),
      this.channelRepository.find({ where: { org_id }, take: 30 }),
      // Messages don't have org_id - skip for now or query by channel
      Promise.resolve([]),
    ]);

    // Filter upcoming calendar events (today and this week)
    const todayEvents = calendarEvents.filter(e => {
      const eventDate = new Date(e.start_datetime);
      return eventDate.toDateString() === today.toDateString();
    });

    const weekEvents = calendarEvents.filter(e => {
      const eventDate = new Date(e.start_datetime);
      return eventDate >= today && eventDate <= weekFromNow;
    });

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

    const crmStats = {
      total_contacts: contacts.length,
      total_deals: deals.length,
      deals_in_progress: deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length,
      deals_won: deals.filter(d => d.stage === 'won').length,
      pipeline_value: deals.filter(d => d.stage !== 'lost').reduce((sum, d) => sum + (d.value || 0), 0),
    };

    const hrStats = {
      total_employees: employees.length,
      pending_leave_requests: leaveRequests.filter(l => l.status === 'pending').length,
      approved_leave: leaveRequests.filter(l => l.status === 'approved').length,
    };

    const productStats = {
      total_features: features.length,
      features_in_progress: features.filter(f => f.status === 'in_progress').length,
      total_epics: epics.length,
      total_releases: releases.length,
      feedback_count: customerFeedback.length,
    };

    const devStats = {
      pending_reviews: codeReviews.filter(cr => cr.status === 'pending').length,
      approved_reviews: codeReviews.filter(cr => cr.status === 'approved').length,
    };

    return {
      projects: projects.slice(0, 10),
      tasks: tasks.slice(0, 20),
      bugs: bugs.slice(0, 10),
      users,
      invoices: invoices.slice(0, 10),
      expenses: expenses.slice(0, 10),
      goals,
      kpis,
      meetings: meetings.slice(0, 5),
      sprints: sprints.slice(0, 3),
      calendarEvents: {
        today: todayEvents,
        thisWeek: weekEvents.slice(0, 10),
        upcoming: calendarEvents.filter(e => new Date(e.start_datetime) > now).slice(0, 10),
      },
      crm: {
        contacts: contacts.slice(0, 20),
        deals: deals.slice(0, 20),
      },
      documents: documents.slice(0, 10),
      announcements: announcements.slice(0, 5),
      product: {
        features: features.slice(0, 20),
        epics: epics.slice(0, 10),
        releases: releases.slice(0, 5),
        feedback: customerFeedback.slice(0, 10),
      },
      hr: {
        employees: employees.slice(0, 50),
        leaveRequests: leaveRequests.filter(l => l.status === 'pending' || l.status === 'approved').slice(0, 10),
      },
      development: {
        codeReviews: codeReviews.slice(0, 10),
      },
      communications: {
        channels: channels.slice(0, 10),
        recentMessages: channelMessages.slice(0, 20),
      },
      statistics: {
        projects: projectStats,
        tasks: taskStats,
        bugs: bugStats,
        financial: financialStats,
        goals: goalStats,
        crm: crmStats,
        hr: hrStats,
        product: productStats,
        development: devStats,
        team_size: users.length,
      },
    };
  }

  private buildSystemPrompt(context: any, userRole: string = 'Unknown', userName: string = 'User'): string {
    // Role-specific context
    const roleContextMap: Record<string, string> = {
      'ceo': `You are speaking with the CEO. Focus on:
- High-level strategic insights and business metrics
- Overall company performance and growth trends
- Risk management and opportunity identification
- Resource allocation and team capacity
- Cross-functional coordination and alignment`,
      
      'cto': `You are speaking with the CTO. Focus on:
- Technology stack, architecture, and infrastructure
- Development velocity and engineering productivity
- Code quality, technical debt, and best practices
- Sprint performance and delivery timelines
- Bug severity and system reliability`,
      
      'ciso': `You are speaking with the CISO. Focus on:
- Security posture and vulnerability management
- Compliance status and audit requirements
- Incident response and threat analysis
- Access control and authentication systems
- Security risks across projects and infrastructure`,
      
      'finance': `You are speaking with the Finance Manager. Focus on:
- Financial performance: revenue, expenses, and profitability
- Budget tracking and cost optimization
- Invoice management and payment status
- Financial forecasting and cash flow analysis
- Resource costs and ROI metrics`,
      
      'software_engineer': `You are speaking with a Software Engineer. Focus on:
- Assigned tasks and bug fixes
- Sprint goals and development priorities
- Code reviews and technical implementation
- Project dependencies and blockers
- Personal productivity and workload`,
      
      'ui_ux_designer': `You are speaking with a UI/UX Designer. Focus on:
- Design tasks and deliverables
- User experience improvements
- Design system consistency
- Stakeholder feedback and iterations
- Design-related project milestones`,
    };

    const roleContext = roleContextMap[userRole.toLowerCase().replace(/\s+/g, '_')] || 
      `You are speaking with a team member (${userRole}). Provide relevant insights based on their role.`;

    return `You are an intelligent AI assistant for TechOS, a comprehensive operating system for software companies.

# USER CONTEXT
${roleContext}
User Name: ${userName}
User Role: ${userRole}

You have COMPLETE access to the following real-time data from the organization:

# SYSTEM CAPABILITIES & MODULES
✅ Project Management (${context.statistics.projects.total} projects)
✅ Task Management (${context.statistics.tasks.total} tasks)
✅ Bug Tracking (${context.statistics.bugs.total} bugs)
✅ CRM - Contacts & Deals (${context.statistics.crm.total_contacts} contacts, ${context.statistics.crm.total_deals} deals)
✅ Finance - Invoices & Expenses
✅ HR - Employees & Leave Management (${context.statistics.hr.total_employees} employees)
✅ Goals & OKRs (${context.goals.length} active goals)
✅ Calendar & Meetings (${context.calendarEvents.today.length} events today)
✅ Analytics & Reports
✅ Document Management (${context.documents.length} recent documents)
✅ Product - Features, Epics, Releases (${context.statistics.product.total_features} features)
✅ Customer Feedback (${context.statistics.product.feedback_count} feedback items)
✅ Code Reviews (${context.statistics.development.pending_reviews} pending)
✅ Team Communications (${context.communications.channels.length} channels)
✅ Announcements (${context.announcements.length} recent)

# CURRENT STATISTICS
📊 Projects: ${context.statistics.projects.active} active, ${context.statistics.projects.completed} completed
📋 Tasks: ${context.statistics.tasks.in_progress} in progress, ${context.statistics.tasks.done} done, ${context.statistics.tasks.todo} pending
🐛 Bugs: ${context.statistics.bugs.open} open, ${context.statistics.bugs.critical} critical
💰 Financial: Revenue $${context.statistics.financial.total_revenue}, Expenses $${context.statistics.financial.total_expenses}, Net $${context.statistics.financial.net_profit}
👥 Team: ${context.statistics.team_size} members
🎯 Goals: Average ${context.statistics.goals.average_progress.toFixed(1)}% progress
💼 CRM: ${context.statistics.crm.deals_in_progress} deals in pipeline ($${context.statistics.crm.pipeline_value}), ${context.statistics.crm.deals_won} won
🏖️ HR: ${context.statistics.hr.pending_leave_requests} pending leave requests
👨‍💻 Development: ${context.statistics.development.pending_reviews} code reviews pending

# CALENDAR - TODAY'S SCHEDULE
${context.calendarEvents.today.length > 0 
  ? context.calendarEvents.today.map(e => `🗓️ ${e.title} at ${new Date(e.start_datetime).toLocaleTimeString()} - ${e.description || 'No description'}`).join('\n')
  : '📅 No events scheduled for today'}

# CALENDAR - THIS WEEK
${context.calendarEvents.thisWeek.length > 0
  ? context.calendarEvents.thisWeek.slice(0, 5).map(e => `🗓️ ${e.title} on ${new Date(e.start_datetime).toLocaleDateString()} at ${new Date(e.start_datetime).toLocaleTimeString()} - ${e.description || 'No description'}`).join('\n')
  : '📅 No events this week'}

# RECENT PROJECTS
${context.projects.map(p => `- ${p.name} (${p.status}): ${p.description || 'No description'}`).join('\n')}

# RECENT TASKS (Top Priority)
${context.tasks.slice(0, 10).map(t => `- ${t.title} [${t.status}] - Priority: ${t.priority}`).join('\n')}

# ACTIVE GOALS & PROGRESS
${context.goals.map(g => `- ${g.title}: ${g.progress}% complete - ${g.description || ''}`).join('\n')}

# KEY PERFORMANCE INDICATORS
${context.kpis.map(k => `- ${k.name}: ${k.current}/${k.target} ${k.unit}`).join('\n')}

# CRITICAL BUGS
${context.bugs.slice(0, 5).map(b => `- ${b.title} [${b.severity}/${b.priority}] - ${b.status}`).join('\n')}

# ACTIVE SPRINTS
${context.sprints.filter(s => s.status === 'active').map(s => `- ${s.name} (${s.start_date} to ${s.end_date})`).join('\n')}

# CRM - ACTIVE DEALS
${context.crm.deals.slice(0, 5).map(d => `- ${d.name} [${d.stage}] - Value: $${d.value || 0} - Contact: ${d.contact_id}`).join('\n')}

# RECENT ANNOUNCEMENTS
${context.announcements.map(a => `📢 ${a.title}: ${a.content?.substring(0, 100) || ''}...`).join('\n')}

# PRODUCT ROADMAP - ACTIVE FEATURES
${context.product.features.slice(0, 10).map(f => `- ${f.name} [${f.status}] - Priority: ${f.priority}`).join('\n')}

# CUSTOMER FEEDBACK (Recent)
${context.product.feedback.slice(0, 5).map(f => `- ${f.title} [${f.category}] - Priority: ${f.priority}`).join('\n')}

# TEAM AVAILABILITY (Leave Requests)
${context.hr.leaveRequests.length > 0
  ? context.hr.leaveRequests.map(l => `- ${l.employee_id}: ${l.start_date} to ${l.end_date} (${l.status})`).join('\n')
  : 'No pending or approved leave requests'}

# PENDING CODE REVIEWS
${context.development.codeReviews.slice(0, 5).map(cr => `- ${cr.title} by ${cr.reviewer_id} [${cr.status}]`).join('\n')}

# RECENT DOCUMENTS
${context.documents.map(d => `- ${d.name} (${d.type}) - Created: ${new Date(d.created_at).toLocaleDateString()}`).join('\n')}

# TEAM CHANNELS
${context.communications.channels.map(c => `- #${c.name}: ${c.description || 'No description'}`).join('\n')}

INSTRUCTIONS:
- You have COMPLETE visibility into ALL system data: calendar, CRM, HR, documents, product roadmap, code reviews, communications, and more
- Tailor your responses to the user's role and responsibilities
- Answer questions accurately based on the real data above
- When asked about calendar, meetings, or schedule, reference the CALENDAR sections above
- When asked about deals, contacts, or sales pipeline, reference the CRM data
- When asked about team availability, reference the HR leave requests
- When asked about product features or roadmap, reference the PRODUCT ROADMAP section
- When asked about customer requests, reference the CUSTOMER FEEDBACK section
- Provide insights and recommendations relevant to their position
- Calculate and analyze data when asked
- Suggest actionable improvements within their domain
- Be concise but comprehensive
- When asked about specific data, reference actual numbers and names
- If data is not available, clearly state that

You can answer comprehensive questions like:
- "What's on my calendar today?" → Check CALENDAR - TODAY'S SCHEDULE
- "Do I have any meetings this week?" → Check CALENDAR - THIS WEEK
- "Who's on leave this week?" → Check TEAM AVAILABILITY
- "What deals are in the pipeline?" → Check CRM - ACTIVE DEALS
- "What features are we working on?" → Check PRODUCT ROADMAP
- "Any critical bugs?" → Check CRITICAL BUGS
- "What code reviews need attention?" → Check PENDING CODE REVIEWS
- "What are the recent announcements?" → Check RECENT ANNOUNCEMENTS
- "Show me recent documents" → Check RECENT DOCUMENTS`;
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

    const geminiApiKey = this.configService.get('GEMINI_API_KEY');
    
    try {
      // Use REST API directly with the correct v1 model name (gemini-3.6-flash is GA and production-ready)
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${userMessage}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response text from Gemini');
      }
      
      return text;
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      
      // If it's an axios error, get more details
      if (error.response) {
        throw new BadRequestException(
          `Gemini API error: ${error.response.data?.error?.message || error.message}`
        );
      }
      
      throw new BadRequestException(`Gemini API error: ${error.message}`);
    }
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
