import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private smtp: Transporter | null = null;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@techos.local');

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey && !apiKey.startsWith('your_')) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email provider: Resend');
      return;
    }

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      this.smtp = nodemailer.createTransport({
        host: smtpHost,
        port: Number(this.configService.get<string>('SMTP_PORT') || 1025),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: this.configService.get<string>('SMTP_USER')
          ? {
              user: this.configService.get<string>('SMTP_USER'),
              pass: this.configService.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
      this.logger.log(`Email provider: SMTP (${smtpHost})`);
    } else {
      this.logger.warn('No email provider configured');
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<any> {
    const to = Array.isArray(options.to) ? options.to : [options.to];
    const from = options.from || this.fromEmail;

    if (this.resend) {
      try {
        const { data, error } = await this.resend.emails.send({
          from,
          to,
          subject: options.subject,
          html: options.html,
          replyTo: options.replyTo,
        });
        if (error) {
          this.logger.error(`Resend error: ${JSON.stringify(error)}`);
          return null;
        }
        return data;
      } catch (error) {
        this.logger.error('Failed to send email via Resend', error as Error);
        return null;
      }
    }

    if (this.smtp) {
      try {
        return await this.smtp.sendMail({
          from,
          to,
          subject: options.subject,
          html: options.html,
          replyTo: options.replyTo,
        });
      } catch (error) {
        this.logger.error('Failed to send email via SMTP', error as Error);
        return null;
      }
    }

    this.logger.warn('Email not sent — no provider configured');
    return null;
  }

  async sendWelcomeEmail(to: string, firstName: string, organizationName: string): Promise<any> {
    return this.sendEmail({
      to,
      subject: `Welcome to ${organizationName} on TechOS`,
      html: `
        <h1>Welcome to TechOS, ${firstName}!</h1>
        <p>Your organization <strong>${organizationName}</strong> has been successfully created.</p>
        <p>You can now start managing your projects, tasks, and team collaboration all in one place.</p>
        <p>Best regards,<br>The TechOS Team</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<any> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendTaskAssignedEmail(
    to: string,
    assigneeName: string,
    taskTitle: string,
    projectName: string,
  ): Promise<any> {
    return this.sendEmail({
      to,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <h1>New Task Assigned</h1>
        <p>Hi ${assigneeName},</p>
        <p>You have been assigned a new task:</p>
        <p><strong>${taskTitle}</strong> in project <strong>${projectName}</strong></p>
        <p>Log in to TechOS to view details and start working on it.</p>
      `,
    });
  }

  async sendMeetingInviteEmail(
    to: string[],
    meetingTitle: string,
    startTime: string,
    meetingLink?: string,
  ): Promise<any> {
    return this.sendEmail({
      to,
      subject: `Meeting Invitation: ${meetingTitle}`,
      html: `
        <h1>You're Invited to a Meeting</h1>
        <p><strong>Meeting:</strong> ${meetingTitle}</p>
        <p><strong>Time:</strong> ${new Date(startTime).toLocaleString()}</p>
        ${meetingLink ? `<p><a href="${meetingLink}">Join Meeting</a></p>` : ''}
        <p>See you there!</p>
      `,
    });
  }

  async sendNotificationEmail(to: string, title: string, message: string): Promise<any> {
    return this.sendEmail({
      to,
      subject: title,
      html: `
        <h2>${title}</h2>
        <p>${message}</p>
        <p>Log in to TechOS for more details.</p>
      `,
    });
  }
}
