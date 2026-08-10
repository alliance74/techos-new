'use client';

import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types/roles';
import {  FolderKanban, CheckSquare, AlertCircle, DollarSign, Users, Briefcase,
  TrendingUp, Package, Lightbulb, Target, UserCircle, FileText
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';

interface RoleDashboardProps {
  dashboardData: any;
}

export function RoleDashboard({ dashboardData }: RoleDashboardProps) {
  const user = useAuthStore((state) => state.user);
  const userRole = user?.role as UserRole;

  // Render dashboard based on role
  switch (userRole) {
    case UserRole.CEO:
      return <ExecutiveDashboard dashboardData={dashboardData} />;

    case UserRole.CTO:
      return <TechLeadershipDashboard dashboardData={dashboardData} />;

    case UserRole.SOFTWARE_ENGINEER:
    case UserRole.UI_UX_DESIGNER:
      return <EngineerDashboard dashboardData={dashboardData} />;

    case UserRole.FINANCE:
      return <FinanceDashboard dashboardData={dashboardData} />;

    case UserRole.CUSTOMER_SUPPORT:
      return <SupportDashboard dashboardData={dashboardData} />;

    default:
      return <GenericDashboard dashboardData={dashboardData} />;
  }
}

// Executive Dashboard (CEO, COO, Admin)
function ExecutiveDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={DollarSign} title="Revenue" value="$1.2M" change="+12.5%" />
        <StatsCard icon={Users} title="Total Employees" value="248" change="+8 this month" />
        <StatsCard icon={FolderKanban} title="Active Projects" value={dashboardData?.projects?.active || 0} change="Running" />
        <StatsCard icon={TrendingUp} title="Growth Rate" value="24.3%" change="+3.2%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Financial Overview"
          description="Revenue, expenses, and profitability"
          icon={DollarSign}
          link="/dashboard/finance"
        />
        <QuickAccessCard
          title="Company Analytics"
          description="Key metrics and performance indicators"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
        <QuickAccessCard
          title="Team Overview"
          description="Employee management and HR"
          icon={Users}
          link="/dashboard/hr"
        />
        <QuickAccessCard
          title="Strategic Goals"
          description="OKRs and company objectives"
          icon={Target}
          link="/dashboard/goals"
        />
      </div>
    </div>
  );
}

// Tech Leadership Dashboard (CTO, Engineering Manager)
function TechLeadershipDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={FolderKanban} title="Active Projects" value={dashboardData?.projects?.active || 0} change="In progress" />
        <StatsCard icon={CheckSquare} title="Sprint Tasks" value={dashboardData?.team_productivity?.in_progress || 0} change="This sprint" />
        <StatsCard icon={AlertCircle} title="Critical Bugs" value="12" change="Need attention" />
        <StatsCard icon={Users} title="Team Size" value="42" change="Engineers" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Active Projects"
          description="View and manage engineering projects"
          icon={FolderKanban}
          link="/dashboard/projects"
        />
        <QuickAccessCard
          title="Product Features"
          description="Feature roadmap and releases"
          icon={Package}
          link="/dashboard/product/features"
        />
        <QuickAccessCard
          title="Bug Tracking"
          description="Critical and high priority bugs"
          icon={AlertCircle}
          link="/dashboard/product/bugs"
        />
        <QuickAccessCard
          title="Team Analytics"
          description="Team performance and productivity"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
      </div>
    </div>
  );
}

// Engineer Dashboard (Software Engineer, UI/UX Designer)
function EngineerDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={CheckSquare} title="My Tasks" value={dashboardData?.my_tasks?.length || 0} change="Active" />
        <StatsCard icon={AlertCircle} title="Assigned Bugs" value={dashboardData?.my_bugs?.length || 0} change="To fix" />
        <StatsCard icon={FolderKanban} title="Active Projects" value={dashboardData?.projects?.active || 0} change="Contributing" />
        <StatsCard icon={Package} title="Code Reviews" value="6" change="Pending" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="My Tasks"
          description="Tasks assigned to you"
          icon={CheckSquare}
          link="/dashboard/projects"
        />
        <QuickAccessCard
          title="Bugs to Fix"
          description="Bugs assigned to you"
          icon={AlertCircle}
          link="/dashboard/product/bugs"
        />
        <QuickAccessCard
          title="Documentation"
          description="Technical docs and resources"
          icon={FileText}
          link="/dashboard/documents"
        />
        <QuickAccessCard
          title="AI Assistant"
          description="Get help with coding tasks"
          icon={Lightbulb}
          link="/dashboard/ai"
        />
      </div>
    </div>
  );
}

// Product Manager Dashboard
function ProductManagerDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={Lightbulb} title="Active Features" value="47" change="In development" />
        <StatsCard icon={AlertCircle} title="Open Bugs" value="23" change="12 critical" />
        <StatsCard icon={Package} title="Releases" value="4" change="Planned" />
        <StatsCard icon={TrendingUp} title="User Satisfaction" value="4.6/5" change="+0.2" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Feature Management"
          description="Product features and roadmap"
          icon={Lightbulb}
          link="/dashboard/product/features"
        />
        <QuickAccessCard
          title="Bug Tracking"
          description="Issues and bug reports"
          icon={AlertCircle}
          link="/dashboard/product/bugs"
        />
        <QuickAccessCard
          title="Release Planning"
          description="Version releases and deployments"
          icon={Package}
          link="/dashboard/product/releases"
        />
        <QuickAccessCard
          title="Product Analytics"
          description="Usage metrics and insights"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
      </div>
    </div>
  );
}

// HR Dashboard
function HRDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={Users} title="Total Employees" value="248" change="+12 this month" />
        <StatsCard icon={Briefcase} title="Leave Requests" value={dashboardData?.leave_requests?.pending || 0} change="Pending" />
        <StatsCard icon={TrendingUp} title="Attendance" value="96.5%" change="+2.3%" />
        <StatsCard icon={UserCircle} title="Open Positions" value="7" change="3 urgent" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Employee Management"
          description="View and manage employees"
          icon={Users}
          link="/dashboard/hr/employees"
        />
        <QuickAccessCard
          title="Leave Requests"
          description="Approve time-off requests"
          icon={Briefcase}
          link="/dashboard/hr/leave-requests"
        />
        <QuickAccessCard
          title="HR Analytics"
          description="Workforce insights and trends"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
        <QuickAccessCard
          title="Documents"
          description="HR policies and documents"
          icon={FileText}
          link="/dashboard/documents"
        />
      </div>
    </div>
  );
}

// Sales/Marketing Dashboard
function SalesMarketingDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={UserCircle} title="Total Contacts" value="2,847" change="+12.3%" />
        <StatsCard icon={DollarSign} title="Active Deals" value="156" change="+8.1%" />
        <StatsCard icon={TrendingUp} title="Pipeline Value" value="$1.2M" change="+15.7%" />
        <StatsCard icon={Target} title="Conversion Rate" value="24.5%" change="+3.2%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Contacts"
          description="Manage customers and leads"
          icon={UserCircle}
          link="/dashboard/crm/contacts"
        />
        <QuickAccessCard
          title="Deals Pipeline"
          description="Track sales opportunities"
          icon={DollarSign}
          link="/dashboard/crm/deals"
        />
        <QuickAccessCard
          title="Sales Analytics"
          description="Performance metrics and insights"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
        <QuickAccessCard
          title="AI Assistant"
          description="Get sales insights and suggestions"
          icon={Lightbulb}
          link="/dashboard/ai"
        />
      </div>
    </div>
  );
}

// Finance Dashboard
function FinanceDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={DollarSign} title="Total Revenue" value="$124,500" change="+12.5%" />
        <StatsCard icon={TrendingUp} title="Net Profit" value="$76,270" change="+18.7%" />
        <StatsCard icon={FileText} title="Pending Invoices" value="24" change="$54.2K" />
        <StatsCard icon={AlertCircle} title="Expense Approvals" value="18" change="Pending" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Invoices"
          description="Manage customer invoices"
          icon={FileText}
          link="/dashboard/finance/invoices"
        />
        <QuickAccessCard
          title="Expenses"
          description="Track and approve expenses"
          icon={DollarSign}
          link="/dashboard/finance/expenses"
        />
        <QuickAccessCard
          title="Financial Reports"
          description="Revenue and profitability analysis"
          icon={TrendingUp}
          link="/dashboard/reports"
        />
        <QuickAccessCard
          title="Analytics"
          description="Financial metrics and trends"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
      </div>
    </div>
  );
}

// Customer Support Dashboard
function SupportDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={UserCircle} title="Active Tickets" value="42" change="Open" />
        <StatsCard icon={AlertCircle} title="Urgent Issues" value="8" change="High priority" />
        <StatsCard icon={TrendingUp} title="Response Time" value="2.4h" change="Avg" />
        <StatsCard icon={Target} title="Satisfaction" value="4.7/5" change="+0.3" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Customer Contacts"
          description="View customer information"
          icon={UserCircle}
          link="/dashboard/crm/contacts"
        />
        <QuickAccessCard
          title="Bug Reports"
          description="Customer-reported issues"
          icon={AlertCircle}
          link="/dashboard/product/bugs"
        />
        <QuickAccessCard
          title="Messages"
          description="Customer communications"
          icon={FileText}
          link="/dashboard/messages"
        />
        <QuickAccessCard
          title="Documents"
          description="Support resources and guides"
          icon={FileText}
          link="/dashboard/documents"
        />
      </div>
    </div>
  );
}

// Operations Dashboard
function OperationsDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={FolderKanban} title="Active Projects" value={dashboardData?.projects?.active || 0} change="Running" />
        <StatsCard icon={Users} title="Team Members" value="248" change="Active" />
        <StatsCard icon={TrendingUp} title="Efficiency" value="87%" change="+4.2%" />
        <StatsCard icon={DollarSign} title="Monthly Expenses" value="$48K" change="-3.2%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Projects"
          description="View all active projects"
          icon={FolderKanban}
          link="/dashboard/projects"
        />
        <QuickAccessCard
          title="Team Overview"
          description="Employee and team management"
          icon={Users}
          link="/dashboard/hr/employees"
        />
        <QuickAccessCard
          title="Expenses"
          description="Operational expenses tracking"
          icon={DollarSign}
          link="/dashboard/finance/expenses"
        />
        <QuickAccessCard
          title="Analytics"
          description="Operational metrics and KPIs"
          icon={TrendingUp}
          link="/dashboard/analytics"
        />
      </div>
    </div>
  );
}

// Generic Dashboard for MEMBER role
function GenericDashboard({ dashboardData }: any) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={CheckSquare} title="My Tasks" value={dashboardData?.my_tasks?.length || 0} change="Active" />
        <StatsCard icon={FolderKanban} title="Projects" value={dashboardData?.projects?.active || 0} change="Active" />
        <StatsCard icon={FileText} title="Documents" value="124" change="Available" />
        <StatsCard icon={Users} title="Meetings" value="3" change="This week" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <QuickAccessCard
          title="Projects"
          description="View your projects"
          icon={FolderKanban}
          link="/dashboard/projects"
        />
        <QuickAccessCard
          title="Documents"
          description="Access shared documents"
          icon={FileText}
          link="/dashboard/documents"
        />
        <QuickAccessCard
          title="Messages"
          description="Team communications"
          icon={FileText}
          link="/dashboard/messages"
        />
        <QuickAccessCard
          title="Calendar"
          description="Your schedule and events"
          icon={Target}
          link="/dashboard/calendar"
        />
      </div>
    </div>
  );
}

// Reusable Components
function StatsCard({ icon: Icon, title, value, change }: any) {
  return (
    <Card className="border border-gray-200" hover>
      <div className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-black">{value}</div>
      <p className="text-xs text-gray-500 mt-1">{change}</p>
    </Card>
  );
}

function QuickAccessCard({ title, description, icon: Icon, link }: any) {
  return (
    <Card className="border border-gray-200" hover>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-5 w-5 text-black" />
          <h3 className="text-lg font-semibold text-black">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <Link href={link}>
        <Button variant="primary" className="w-full">View</Button>
      </Link>
    </Card>
  );
}
