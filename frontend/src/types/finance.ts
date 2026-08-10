export interface Invoice {
  id: string;
  org_id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  items?: InvoiceItem[];
  notes?: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Expense {
  id: string;
  org_id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  receipt_url?: string;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approval_date?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  org_id: string;
  name: string;
  category: string;
  amount: number;
  spent: number;
  currency: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  created_at: string;
}
