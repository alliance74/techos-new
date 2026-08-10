export interface Contact {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: string[];
  notes?: string;
  lead_score?: number;
  created_at: string;
}

export interface Deal {
  id: string;
  org_id: string;
  contact_id: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string;
  assigned_to?: string;
  created_at: string;
  contact?: Contact;
}

export interface Pipeline {
  id: string;
  org_id: string;
  name: string;
  stages: string[];
  is_default: boolean;
  created_at: string;
}

export interface LeadScore {
  contact_id: string;
  score: number;
  rating: 'hot' | 'warm' | 'cold' | string;
  factors?: Record<string, number>;
  last_calculated?: string;
  contact?: Contact;
}
