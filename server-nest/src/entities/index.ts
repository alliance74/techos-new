// Export all entities as array for TypeORM
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';
import { Task } from './task.entity';
import { Meeting } from './meeting.entity';
import { MeetingParticipant } from './meeting-participant.entity';
import { MeetingActionItem } from './meeting-action-item.entity';
import { Channel } from './channel.entity';
import { ChannelMember } from './channel-member.entity';
import { Message } from './message.entity';
import { Contact } from './contact.entity';
import { Deal } from './deal.entity';
import { Invoice } from './invoice.entity';
import { Expense } from './expense.entity';
import { Budget } from './budget.entity';
import { Employee } from './employee.entity';
import { LeaveRequest } from './leave-request.entity';
import { Document } from './document.entity';
import { CalendarEvent } from './calendar-event.entity';
import { Notification } from './notification.entity';
import { Goal } from './goal.entity';
import { Announcement } from './announcement.entity';
import { Feature } from './feature.entity';
import { Epic } from './epic.entity';
import { Release } from './release.entity';
import { Bug } from './bug.entity';
import { CustomerFeedback } from './customer-feedback.entity';
import { Integration } from './integration.entity';
import { AuditLog } from './audit-log.entity';
import { Roadmap } from './roadmap.entity';
import { KPI } from './kpi.entity';
import { Report } from './report.entity';
import { WorkspaceRecord } from './workspace-record.entity';
import { ActivityEvent } from './activity-event.entity';
import { RecordComment } from './record-comment.entity';
import { CodeReview } from './code-review.entity';

export const entities = [
  Organization,
  User,
  Project,
  Sprint,
  Task,
  Meeting,
  MeetingParticipant,
  MeetingActionItem,
  Channel,
  ChannelMember,
  Message,
  Contact,
  Deal,
  Invoice,
  Expense,
  Budget,
  Employee,
  LeaveRequest,
  Document,
  CalendarEvent,
  Notification,
  Goal,
  Announcement,
  Feature,
  Epic,
  Release,
  Bug,
  CustomerFeedback,
  Integration,
  AuditLog,
  Roadmap,
  KPI,
  Report,
  WorkspaceRecord,
  ActivityEvent,
  RecordComment,
  CodeReview,
];

// Export individual entities
export {
  Organization,
  User,
  Project,
  Sprint,
  Task,
  Meeting,
  MeetingParticipant,
  MeetingActionItem,
  Channel,
  ChannelMember,
  Message,
  Contact,
  Deal,
  Invoice,
  Expense,
  Budget,
  Employee,
  LeaveRequest,
  Document,
  CalendarEvent,
  Notification,
  Goal,
  Announcement,
  Feature,
  Epic,
  Release,
  Bug,
  CustomerFeedback,
  Integration,
  AuditLog,
  Roadmap,
  KPI,
  Report,
  WorkspaceRecord,
  ActivityEvent,
  RecordComment,
  CodeReview,
};
