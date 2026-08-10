import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  // Invoices
  @Post('invoices')
  createInvoice(@CurrentUser() user: any, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.financeService.createInvoice(user.org_id, createInvoiceDto, user);
  }

  @Get('invoices')
  findAllInvoices(@CurrentUser() user: any, @Query() filters: any) {
    return this.financeService.findAllInvoices(user.org_id, filters);
  }

  @Get('invoices/:id')
  findOneInvoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.findOneInvoice(id, user.org_id);
  }

  @Put('invoices/:id')
  updateInvoice(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.financeService.updateInvoice(id, user.org_id, updateData, user);
  }

  @Delete('invoices/:id')
  deleteInvoice(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.deleteInvoice(id, user.org_id);
  }

  @Post('invoices/:id/send')
  sendInvoice(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { recipient_email: string },
  ) {
    return this.financeService.sendInvoice(id, user.org_id, body.recipient_email);
  }

  // Expenses
  @Post('expenses')
  createExpense(@CurrentUser() user: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.financeService.createExpense(user.org_id, user, createExpenseDto);
  }

  @Get('expenses')
  findAllExpenses(@CurrentUser() user: any, @Query() filters: any) {
    return this.financeService.findAllExpenses(user.org_id, filters);
  }

  @Get('expenses/:id')
  findOneExpense(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.findOneExpense(id, user.org_id);
  }

  @Put('expenses/:id')
  updateExpense(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.financeService.updateExpense(id, user.org_id, updateData);
  }

  @Delete('expenses/:id')
  deleteExpense(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.deleteExpense(id, user.org_id);
  }

  @Post('expenses/:id/approve')
  approveExpense(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.approveExpense(id, user.org_id, user.id, user.role);
  }

  @Post('expenses/:id/reject')
  rejectExpense(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.financeService.rejectExpense(id, user.org_id, user.id, user.role, body.reason);
  }

  // Budgets
  @Post('budgets')
  createBudget(@CurrentUser() user: any, @Body() createBudgetDto: CreateBudgetDto) {
    return this.financeService.createBudget(user.org_id, user.id, createBudgetDto);
  }

  @Get('budgets')
  findAllBudgets(@CurrentUser() user: any) {
    return this.financeService.findAllBudgets(user.org_id);
  }

  @Get('budgets/:id')
  findOneBudget(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.findOneBudget(id, user.org_id);
  }

  @Put('budgets/:id')
  updateBudget(@CurrentUser() user: any, @Param('id') id: string, @Body() updateData: any) {
    return this.financeService.updateBudget(id, user.org_id, updateData);
  }

  @Delete('budgets/:id')
  deleteBudget(@CurrentUser() user: any, @Param('id') id: string) {
    return this.financeService.deleteBudget(id, user.org_id);
  }

  // Reports
  @Get('summary')
  getFinancialSummary(
    @CurrentUser() user: any,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.financeService.getFinancialSummary(user.org_id, start_date, end_date);
  }
}
