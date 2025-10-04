import { prisma } from '../prisma';
import type { Expense, Approval, User } from '@prisma/client';

export async function buildApprovalChainForExpense(expense: Expense): Promise<Approval[]> {
  // Build chain by walking manager hierarchy up to ADMIN
  const chain: User[] = [];
  let submitter = await prisma.user.findUnique({ where: { id: expense.userId } });
  const seen = new Set<string>();
  while (submitter?.managerId) {
    if (seen.has(submitter.managerId)) break; // safety against cycles
    const manager = await prisma.user.findUnique({ where: { id: submitter.managerId } });
    if (!manager) break;
    chain.push(manager);
    if (manager.role === 'ADMIN') break;
    submitter = manager;
  }

  // persist Approval rows
  const approvals = await prisma.$transaction(
    chain.map((user, index) =>
      prisma.approval.create({
        data: {
          expenseId: expense.id,
          approverId: user.id,
          orderIndex: index,
        },
      })
    )
  );

  await prisma.expense.update({
    where: { id: expense.id },
    data: { totalApprovers: approvals.length, currentOrderIndex: approvals.length > 0 ? 0 : -1 },
  });

  return approvals;
}

export async function handlePostApprovalProgress(expenseId: string) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { approvals: true } });
  if (!expense) return;

  if (expense.status === 'REJECTED') return; // already terminal

  const approvedCount = expense.approvals.filter((a) => a.status === 'APPROVED').length;
  const total = expense.totalApprovers || expense.approvals.length;

  const rule = await prisma.approvalRule.findFirst({ where: { companyId: expense.companyId, isActive: true } });

  let approvedByRule = false;
  if (rule) {
    if (rule.type === 'PERCENTAGE' && rule.percentage) {
      approvedByRule = total > 0 && (approvedCount / total) * 100 >= rule.percentage;
    } else if (rule.type === 'SPECIFIC' && rule.specificApproverId) {
      approvedByRule = expense.approvals.some((a) => a.approverId === rule.specificApproverId && a.status === 'APPROVED');
    } else if (rule.type === 'HYBRID') {
      const pctOk = rule.percentage ? total > 0 && (approvedCount / total) * 100 >= rule.percentage : false;
      const specOk = rule.specificApproverId ? expense.approvals.some((a) => a.approverId === rule.specificApproverId && a.status === 'APPROVED') : false;
      approvedByRule = pctOk || specOk;
    }
  }

  // If not approved by rule, move to next approver
  const nextIndex = Math.max(...expense.approvals.map((a) => a.orderIndex).concat([-1])) + 1;
  const currentIndex = expense.currentOrderIndex;

  if (approvedByRule || approvedCount === total || total === 0) {
    await prisma.expense.update({ where: { id: expense.id }, data: { status: 'APPROVED' } });
    return;
  }

  if (currentIndex + 1 < total) {
    await prisma.expense.update({ where: { id: expense.id }, data: { currentOrderIndex: currentIndex + 1 } });
  } else {
    // End of chain but not approved by rule => still approved because all approved
    await prisma.expense.update({ where: { id: expense.id }, data: { status: 'APPROVED' } });
  }
}
