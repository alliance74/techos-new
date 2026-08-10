'use client';

import type { DetailViewProps } from '@/components/details/DetailShell';
import { ProjectDetail } from '@/components/details/ProjectDetail';
import { WorkItemDetail } from '@/components/details/WorkItemDetail';
import { InvoiceDetail } from '@/components/details/InvoiceDetail';
import { TicketDetail } from '@/components/details/TicketDetail';
import { CrmDetail } from '@/components/details/CrmDetail';
import { MarketingDetail } from '@/components/details/MarketingDetail';
import { OperationsDetail } from '@/components/details/OperationsDetail';
import { PeopleDetail } from '@/components/details/PeopleDetail';
import { CodeReviewDetail } from '@/components/details/CodeReviewDetail';
import { SprintDetail } from '@/components/details/SprintDetail';
import { ExpenseDetail } from '@/components/details/ExpenseDetail';
import { GoalDetail } from '@/components/details/GoalDetail';
import { DocumentDetail } from '@/components/details/DocumentDetail';
import { GenericRecordDetail } from '@/components/details/GenericRecordDetail';

/**
 * Routes each entity to a purpose-built detail layout instead of one generic template.
 */
export function EntityDetailView(props: DetailViewProps) {
  switch (props.entityKey) {
    case 'projects':
      return <ProjectDetail {...props} />;

    case 'tasks':
    case 'bugs':
      return <WorkItemDetail {...props} />;

    case 'sprints':
      return <SprintDetail {...props} />;

    case 'codeReviews':
    case 'commits':
      return <CodeReviewDetail {...props} />;

    case 'invoices':
      return <InvoiceDetail {...props} />;

    case 'expenses':
    case 'payments':
    case 'budgets':
      return <ExpenseDetail {...props} />;

    case 'tickets':
      return <TicketDetail {...props} />;

    case 'deals':
    case 'leads':
    case 'contacts':
    case 'customers':
    case 'opportunities':
      return <CrmDetail {...props} />;

    case 'campaigns':
      return <MarketingDetail {...props} />;

    case 'processes':
      return <OperationsDetail {...props} />;

    case 'employees':
    case 'candidates':
      return <PeopleDetail {...props} />;

    case 'goals':
      return <GoalDetail {...props} />;

    case 'documents':
      return <DocumentDetail {...props} />;

    default:
      return <GenericRecordDetail {...props} />;
  }
}
