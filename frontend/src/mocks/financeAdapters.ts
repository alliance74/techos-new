import { Invoice, Expense, Budget } from '@/types/finance';

export function getMockInvoices(): Invoice[] {
  return [];
}

export function getMockExpenses(): Expense[] {
  return [];
}

export function getMockBudgets(): Budget[] {
  return [];
}

export function getMockFinancialSummary() {
  return {
    total_revenue: 0,
    total_expenses: 0,
    net: 0,
    pending_invoices: 0,
    pending_expenses: 0,
  };
}
