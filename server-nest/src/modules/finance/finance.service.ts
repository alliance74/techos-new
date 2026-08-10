import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Invoice } from '../../entities/invoice.entity';
import { Expense } from '../../entities/expense.entity';
import { Budget } from '../../entities/budget.entity';
import { User, UserRole } from '../../entities/user.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../../common/services/email.service';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
    private activityLogService: ActivityLogService,
  ) {}

  // Invoices
  async createInvoice(org_id: string, createInvoiceDto: CreateInvoiceDto, actor?: any) {
    const amount = Number(createInvoiceDto.amount || 0);
    const tax = Number(createInvoiceDto.tax || 0);
    const total = Number(createInvoiceDto.total ?? amount + tax);
    const today = new Date().toISOString().slice(0, 10);
    const invoice = this.invoicesRepository.create({
      id: randomUUID(),
      org_id,
      contact_id: createInvoiceDto.contact_id,
      invoice_number:
        createInvoiceDto.invoice_number || `INV-${Date.now().toString().slice(-8)}`,
      client_name: createInvoiceDto.client_name || undefined,
      amount,
      tax,
      total,
      due_date: createInvoiceDto.due_date || today,
      issued_date: createInvoiceDto.issued_date || today,
      items: createInvoiceDto.items || [
        {
          description: createInvoiceDto.description || createInvoiceDto.notes || createInvoiceDto.client_name || 'Service',
          quantity: 1,
          unit_price: amount,
          total: amount,
        },
      ],
      notes: createInvoiceDto.notes || createInvoiceDto.description,
      status: createInvoiceDto.status || 'draft',
    });

    await this.invoicesRepository.save(invoice);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'invoices',
      resource_id: invoice.id,
      summary: `created invoice "${invoice.invoice_number}"`,
    });

    return {
      success: true,
      data: invoice,
    };
  }

  async findAllInvoices(org_id: string, filters?: any) {
    const where: any = { org_id };

    if (filters?.status) {
      where.status = filters.status;
    }

    const invoices = await this.invoicesRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    const data = invoices.map((invoice) => ({
      ...invoice,
      client_name:
        invoice.client_name ||
        invoice.items?.[0]?.description ||
        invoice.notes ||
        null,
      amount: invoice.amount ?? invoice.total ?? 0,
    }));

    return {
      success: true,
      data,
    };
  }

  async findOneInvoice(id: string, org_id: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, org_id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return {
      success: true,
      data: invoice,
    };
  }

  async updateInvoice(id: string, org_id: string, updateData: Partial<Invoice>, actor?: any) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, org_id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    Object.assign(invoice, updateData);
    await this.invoicesRepository.save(invoice);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'updated',
      resource_type: 'invoices',
      resource_id: invoice.id,
      summary: `updated invoice "${invoice.invoice_number}"`,
      changes: updateData as any,
    });

    return {
      success: true,
      data: invoice,
    };
  }

  async deleteInvoice(id: string, org_id: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, org_id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.invoicesRepository.remove(invoice);

    return {
      success: true,
      message: 'Invoice deleted successfully',
    };
  }

  async sendInvoice(id: string, org_id: string, recipient_email: string) {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, org_id },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Update status to sent
    invoice.status = 'sent';
    await this.invoicesRepository.save(invoice);

    // Send email
    await this.emailService.sendEmail({
      to: recipient_email,
      subject: `Invoice ${invoice.invoice_number}`,
      html: `
        <h1>Invoice ${invoice.invoice_number}</h1>
        <p>Amount: $${invoice.total}</p>
        <p>Due Date: ${invoice.due_date}</p>
        <p>Please review the attached invoice.</p>
      `,
    });

    return {
      success: true,
      message: 'Invoice sent successfully',
    };
  }

  // Expenses
  async createExpense(org_id: string, actor: any, createExpenseDto: CreateExpenseDto) {
    const expense = this.expensesRepository.create({
      id: randomUUID(),
      org_id,
      ...createExpenseDto,
      submitted_by: actor?.id,
      status: 'pending',
    });

    await this.expensesRepository.save(expense);
    await this.activityLogService.log({
      org_id,
      actor,
      action: 'created',
      resource_type: 'expenses',
      resource_id: expense.id,
      summary: `submitted expense $${expense.amount} (${expense.category || 'general'})`,
    });

    // Notify finance team
    await this.notifyFinanceTeam(
      org_id,
      'New Expense Submitted',
      `Expense of $${expense.amount} submitted for ${expense.category}`,
    );

    return {
      success: true,
      data: expense,
    };
  }

  async findAllExpenses(org_id: string, filters?: any) {
    const where: any = { org_id };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.submitted_by) {
      where.submitted_by = filters.submitted_by;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    const expenses = await this.expensesRepository.find({
      where,
      order: { created_at: 'DESC' },
    });

    return {
      success: true,
      data: expenses,
    };
  }

  async findOneExpense(id: string, org_id: string) {
    const expense = await this.expensesRepository.findOne({
      where: { id, org_id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return {
      success: true,
      data: expense,
    };
  }

  async updateExpense(id: string, org_id: string, updateData: Partial<Expense>) {
    const expense = await this.expensesRepository.findOne({
      where: { id, org_id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    Object.assign(expense, updateData);
    await this.expensesRepository.save(expense);

    return {
      success: true,
      data: expense,
    };
  }

  async approveExpense(id: string, org_id: string, user_id: string, user_role: string) {
    // Check if user has permission (CEO, CFO, Finance Manager)
    if (![UserRole.CEO, UserRole.FINANCE].includes(user_role as UserRole)) {
      throw new ForbiddenException('You do not have permission to approve expenses');
    }

    const expense = await this.expensesRepository.findOne({
      where: { id, org_id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    expense.status = 'approved';
    expense.approved_by = user_id;
    await this.expensesRepository.save(expense);

    // Notify submitter
    await this.notificationsService.create(org_id, {
      user_id: expense.submitted_by,
      type: 'expense_approved',
      title: 'Expense Approved',
      message: `Your expense of $${expense.amount} has been approved`,
      send_email: true,
    });

    // Update budget if exists
    await this.updateBudgetSpent(org_id, expense.category, expense.amount);

    return {
      success: true,
      data: expense,
    };
  }

  async rejectExpense(id: string, org_id: string, user_id: string, user_role: string, reason?: string) {
    // Check permission
    if (![UserRole.CEO, UserRole.FINANCE].includes(user_role as UserRole)) {
      throw new ForbiddenException('You do not have permission to reject expenses');
    }

    const expense = await this.expensesRepository.findOne({
      where: { id, org_id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    expense.status = 'rejected';
    await this.expensesRepository.save(expense);

    // Notify submitter
    await this.notificationsService.create(org_id, {
      user_id: expense.submitted_by,
      type: 'expense_rejected',
      title: 'Expense Rejected',
      message: `Your expense of $${expense.amount} was rejected${reason ? ': ' + reason : ''}`,
      send_email: true,
    });

    return {
      success: true,
      data: expense,
    };
  }

  async deleteExpense(id: string, org_id: string) {
    const expense = await this.expensesRepository.findOne({
      where: { id, org_id },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.expensesRepository.remove(expense);

    return {
      success: true,
      message: 'Expense deleted successfully',
    };
  }

  // Budgets
  async createBudget(org_id: string, user_id: string, createBudgetDto: CreateBudgetDto) {
    const budget = this.budgetsRepository.create({
      id: randomUUID(),
      org_id,
      ...createBudgetDto,
      spent: 0,
      owner_id: user_id,
    });

    await this.budgetsRepository.save(budget);

    return {
      success: true,
      data: budget,
    };
  }

  async findAllBudgets(org_id: string) {
    const budgets = await this.budgetsRepository.find({
      where: { org_id },
      order: { created_at: 'DESC' },
    });

    // Calculate utilization percentage
    const budgetsWithUtilization = budgets.map((budget) => ({
      ...budget,
      utilization: budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0,
      remaining: budget.allocated - budget.spent,
    }));

    return {
      success: true,
      data: budgetsWithUtilization,
    };
  }

  async findOneBudget(id: string, org_id: string) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, org_id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const utilization = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;

    return {
      success: true,
      data: {
        ...budget,
        utilization,
        remaining: budget.allocated - budget.spent,
      },
    };
  }

  async updateBudget(id: string, org_id: string, updateData: Partial<Budget>) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, org_id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    Object.assign(budget, updateData);
    await this.budgetsRepository.save(budget);

    return {
      success: true,
      data: budget,
    };
  }

  async deleteBudget(id: string, org_id: string) {
    const budget = await this.budgetsRepository.findOne({
      where: { id, org_id },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.budgetsRepository.remove(budget);

    return {
      success: true,
      message: 'Budget deleted successfully',
    };
  }

  // Financial Reports
  async getFinancialSummary(org_id: string, start_date?: string, end_date?: string) {
    // Total income from invoices
    const invoiceQuery = this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('SUM(invoice.total)', 'total')
      .where('invoice.org_id = :org_id', { org_id })
      .andWhere('invoice.status IN (:...statuses)', { statuses: ['paid', 'sent'] });

    if (start_date) {
      invoiceQuery.andWhere('invoice.issued_date >= :start_date', { start_date });
    }
    if (end_date) {
      invoiceQuery.andWhere('invoice.issued_date <= :end_date', { end_date });
    }

    const income = await invoiceQuery.getRawOne();

    // Total expenses
    const expenseQuery = this.expensesRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.org_id = :org_id', { org_id })
      .andWhere('expense.status = :status', { status: 'approved' });

    if (start_date) {
      expenseQuery.andWhere('expense.date >= :start_date', { start_date });
    }
    if (end_date) {
      expenseQuery.andWhere('expense.date <= :end_date', { end_date });
    }

    const expenses = await expenseQuery.getRawOne();

    const totalIncome = parseFloat(income.total) || 0;
    const totalExpenses = parseFloat(expenses.total) || 0;
    const netProfit = totalIncome - totalExpenses;

    return {
      success: true,
      data: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0,
      },
    };
  }

  // Helper methods
  private async updateBudgetSpent(org_id: string, category: string, amount: number) {
    const budget = await this.budgetsRepository.findOne({
      where: { org_id, category },
    });

    if (budget) {
      budget.spent += amount;
      await this.budgetsRepository.save(budget);

      // Check if budget is exceeded
      if (budget.spent > budget.allocated) {
        await this.notifyFinanceTeam(
          org_id,
          'Budget Exceeded',
          `Budget for ${category} has been exceeded. Allocated: $${budget.allocated}, Spent: $${budget.spent}`,
        );
      }
    }
  }

  private async notifyFinanceTeam(org_id: string, title: string, message: string) {
    // Find all finance team members
    const financeUsers = await this.usersRepository.find({
      where: { org_id, role: UserRole.FINANCE },
    });

    // Send notifications to each
    for (const user of financeUsers) {
      await this.notificationsService.create(org_id, {
        user_id: user.id,
        type: 'finance_alert',
        title,
        message,
        send_email: true,
      });
    }
  }
}
