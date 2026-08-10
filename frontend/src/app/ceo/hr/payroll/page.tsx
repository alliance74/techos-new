'use client';

import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  FileText
} from 'lucide-react';
import { EmptyState } from '@/components/UI/EmptyState';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { useEmployees } from '@/hooks/useHR';
import { useCreateEntity, useEntityList } from '@/hooks/useEntityApi';
import { Button } from '@/components/UI/Button';

export default function PayrollPage() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: payrollRuns = [], isLoading: payrollLoading } = useEntityList('payroll');
  const createPayroll = useCreateEntity('payroll');
  const salariedEmployees = employees.filter((employee) => Number(employee.salary) > 0);
  const annualSalaryTotal = salariedEmployees.reduce((total, employee) => total + Number(employee.salary), 0);
  const monthlySalaryTotal = annualSalaryTotal / 12;
  const averageSalary = salariedEmployees.length ? annualSalaryTotal / salariedEmployees.length : 0;

  if (employeesLoading || payrollLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Paid</Badge>;
      case 'scheduled': return <Badge variant="info">Scheduled</Badge>;
      case 'processing': return <Badge variant="warning">Processing</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Payroll</h1>
          <p className="text-ink-muted mt-2">Salary and compensation management</p>
        </div>
        <Button
          size="sm"
          onClick={() =>
            void createPayroll.mutateAsync({
              title: `Payroll · ${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
              status: 'scheduled',
              amount: Math.round(monthlySalaryTotal),
              dueDate: new Date().toISOString().slice(0, 10),
              employeeCount: salariedEmployees.length,
            })
          }
          loading={createPayroll.isPending}
        >
          Create payroll run
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <DollarSign className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Estimated Monthly Salary</p>
          <p className="text-3xl font-bold text-ink mt-1">${monthlySalaryTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Users className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Salaried Employees</p>
          <p className="text-3xl font-bold text-ink mt-1">{salariedEmployees.length}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <CreditCard className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Average Annual Salary</p>
          <p className="text-3xl font-bold text-ink mt-1">${averageSalary.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </Card>
        <Card className="p-6 bg-surface border border-border">
          <Calendar className="h-8 w-8 text-ink mb-3" />
          <p className="text-sm text-ink-muted">Payroll Runs</p>
          <p className="text-3xl font-bold text-ink mt-1">{payrollRuns.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-surface border border-border">
          <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Upcoming & Recent Runs
          </h2>
          {payrollRuns.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-12 w-12" />}
              title="No payroll runs yet"
              description="Create a payroll run from salaried employees to get started."
              action={{
                label: 'Create payroll run',
                onClick: () =>
                  void createPayroll.mutateAsync({
                    title: `Payroll · ${new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}`,
                    status: 'scheduled',
                    amount: Math.round(monthlySalaryTotal),
                    dueDate: new Date().toISOString().slice(0, 10),
                    employeeCount: salariedEmployees.length,
                  }),
              }}
            />
          ) : <div className="space-y-4">
            {payrollRuns.map(run => (
              <div key={run.id} className="flex items-center justify-between p-4 bg-bg-muted border border-border rounded-lg">
                <div>
                  <p className="font-medium text-ink">{run.title}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-ink-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Run: {run.dueDate ? new Date(run.dueDate).toLocaleDateString() : 'Not scheduled'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {run.metadata?.employeeCount ?? salariedEmployees.length} employees
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-ink font-semibold">${Number(run.amount || 0).toLocaleString()}</p>
                  <div className="mt-1">{getStatusBadge(run.status)}</div>
                </div>
              </div>
            ))}
          </div>}
        </Card>

        <Card className="p-6 bg-surface border border-border">
          <h2 className="text-lg font-semibold text-ink mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5" /> Payroll Breakdown
          </h2>
          {salariedEmployees.length === 0 ? (
            <EmptyState icon={<FileText className="h-12 w-12" />} title="No salary data available" description="Add salaries to employee records to calculate the payroll summary." />
          ) : <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-ink-secondary">Annual base salaries</span>
                  <span className="text-sm text-ink font-medium">${annualSalaryTotal.toLocaleString()}</span>
                </div>
                <div className="w-full bg-bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-brand-mist" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-ink-muted mt-1">Based on {salariedEmployees.length} employee records with salary data</p>
              </div>
          </div>}
        </Card>
      </div>
    </div>
  );
}
