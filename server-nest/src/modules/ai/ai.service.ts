import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { AiConversation } from '../../entities/ai-conversation.entity';
import { AiMessage } from '../../entities/ai-message.entity';
import { AiUsage } from '../../entities/ai-usage.entity';
import { ContextualRetrievalService } from './contextual-retrieval.service';
import { RecommendationEngineService } from './recommendation-engine.service';

type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenerativeAI;
  private grokApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    private contextualRetrieval: ContextualRetrievalService,
    private recommendationEngine: RecommendationEngineService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AiConversation)
    private conversationRepository: Repository<AiConversation>,
    @InjectRepository(AiMessage)
    private messageRepository: Repository<AiMessage>,
    @InjectRepository(AiUsage)
    private usageRepository: Repository<AiUsage>,
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

  async chat(
    org_id: string,
    user_id: string,
    message: string,
    provider: AIProvider = 'openai',
  ) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // MOCK MODE: If no API keys are configured, return mock response
    const hasAnyProvider =
      this.openai || this.anthropic || this.gemini || this.grokApiKey;
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

    this.validateProviderConfiguration(provider);

    // Get user info for role-based context
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const userRole = user?.role || 'Unknown';
    const userName = user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : 'User';

    // Use contextual retrieval instead of full org snapshot
    const context = await this.contextualRetrieval.retrieveContext(org_id, message);
    const systemPrompt = this.buildSystemPrompt(context, userRole, userName);

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

  async chatInConversation(
    org_id: string,
    user_id: string,
    conversation_id: string,
    message: string,
  ) {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

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
      take: 10,
    });

    // Get user info
    const user = await this.userRepository.findOne({ where: { id: user_id } });
    const userRole = user?.role || 'Unknown';
    const userName = user
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
      : 'User';

    // Check usage limits
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

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
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    // Use contextual retrieval instead of full org snapshot
    const context = await this.contextualRetrieval.retrieveContext(org_id, message);
    const systemPrompt = this.buildSystemPrompt(context, userRole, userName);
    const fullPrompt = conversationHistory
      ? `${systemPrompt}\n\n# CONVERSATION HISTORY\n${conversationHistory}\n\n# CURRENT USER MESSAGE`
      : systemPrompt;

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

    // Update conversation stats
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
          throw new BadRequestException(
            'OpenAI is not configured. Please add OPENAI_API_KEY to your environment variables.',
          );
        }
        break;
      case 'claude':
        if (!this.anthropic) {
          throw new BadRequestException(
            'Claude is not configured. Please add ANTHROPIC_API_KEY to your environment variables.',
          );
        }
        break;
      case 'gemini':
        if (!this.gemini) {
          throw new BadRequestException(
            'Gemini is not configured. Please add GEMINI_API_KEY to your environment variables.',
          );
        }
        break;
      case 'grok':
        if (!this.grokApiKey) {
          throw new BadRequestException(
            'Grok is not configured. Please add GROK_API_KEY to your environment variables.',
          );
        }
        break;
    }
  }

  /**
   * Build system prompt from contextual retrieval results.
   * Uses only the relevant data retrieved by intent analysis,
   * instead of the full org snapshot.
   */
  private buildSystemPrompt(context: any, userRole: string, userName: string): string {
    const roleContextMap: Record<string, string> = {
      ceo: `You are speaking with the CEO. Focus on high-level strategic insights, business metrics, and resource allocation.`,
      cto: `You are speaking with the CTO. Focus on technology, architecture, development velocity, and sprint performance.`,
      ciso: `You are speaking with the CISO. Focus on security posture, compliance, incident response, and threat analysis.`,
      finance: `You are speaking with the Finance Manager. Focus on revenue, expenses, profitability, and budget tracking.`,
      software_engineer: `You are speaking with a Software Engineer. Focus on assigned tasks, sprint goals, code reviews, and blockers.`,
      ui_ux_designer: `You are speaking with a UI/UX Designer. Focus on design tasks, user experience, and design system.`,
    };

    const roleContext =
      roleContextMap[userRole.toLowerCase().replace(/\s+/g, '_')] ||
      `You are speaking with a team member (${userRole}).`;

    const contextPrompt = this.contextualRetrieval.buildContextPrompt(context);

    return `You are an intelligent AI assistant for TechOS, a comprehensive operating system for software companies.

# USER CONTEXT
${roleContext}
User Name: ${userName}
User Role: ${userRole}

# RELEVANT ORGANIZATION DATA
${contextPrompt}

# INSTRUCTIONS
- Answer questions accurately based on the real data above
- Tailor responses to the user's role and responsibilities
- When data is not available, clearly state that
- Be concise but comprehensive
- Provide actionable insights and recommendations
- Reference specific names, numbers, and dates from the data`;
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
      messages: [{ role: 'user', content: userMessage }],
    });

    return message.content[0].type === 'text' ? message.content[0].text : '';
  }

  private async callGemini(systemPrompt: string, userMessage: string): Promise<string> {
    if (!this.gemini) {
      throw new BadRequestException('Gemini API key not configured');
    }

    const geminiApiKey = this.configService.get('GEMINI_API_KEY');

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nUser Question: ${userMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No response text from Gemini');
      }

      return text;
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);

      if (error.response) {
        throw new BadRequestException(
          `Gemini API error: ${error.response.data?.error?.message || error.message}`,
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
          Authorization: `Bearer ${this.grokApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.choices[0].message.content;
  }

  async generateReport(org_id: string, reportType: string, provider: AIProvider = 'openai') {
    const prompts: Record<string, string> = {
      executive:
        'Generate a comprehensive executive summary report covering projects, financials, goals, and team performance.',
      financial:
        'Generate a detailed financial analysis including revenue, expenses, profitability trends, and recommendations.',
      project:
        'Generate a project status report covering all active projects, completion rates, and blockers.',
      sprint:
        'Generate a sprint analysis report covering velocity, completion rates, and team performance.',
      goals:
        'Generate a goals and OKRs progress report with risk analysis and recommendations.',
    };

    const prompt =
      prompts[reportType] ||
      'Generate a comprehensive status report of the entire system.';

    return this.chat(org_id, 'system', prompt, provider);
  }

  async analyzeRisk(org_id: string, provider: AIProvider = 'openai') {
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
