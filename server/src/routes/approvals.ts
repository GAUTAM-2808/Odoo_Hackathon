import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { Role } from '../types';
import { handlePostApprovalProgress } from '../services/approvalEngine';

const router = Router();
router.use(authMiddleware);

router.get('/pending', requireRole('MANAGER', 'ADMIN' as Role), async (req, res) => {
  const approvals = await prisma.approval.findMany({
    where: {
      approverId: req.user!.id,
      status: 'PENDING',
      expense: { companyId: req.user!.companyId, status: { in: ['SUBMITTED'] } },
    },
    include: { expense: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(approvals);
});

router.post('/:id/approve', requireRole('MANAGER', 'ADMIN' as Role), async (req, res) => {
  const { id } = req.params; // approval id
  const approval = await prisma.approval.update({
    where: { id },
    data: { status: 'APPROVED', decidedAt: new Date(), comment: req.body?.comment ?? null },
  });
  await handlePostApprovalProgress(approval.expenseId);
  res.json(approval);
});

router.post('/:id/reject', requireRole('MANAGER', 'ADMIN' as Role), async (req, res) => {
  const { id } = req.params;
  const approval = await prisma.approval.update({
    where: { id },
    data: { status: 'REJECTED', decidedAt: new Date(), comment: req.body?.comment ?? null },
  });
  await prisma.expense.update({ where: { id: approval.expenseId }, data: { status: 'REJECTED' } });
  res.json(approval);
});

// Admin override
router.post('/expense/:expenseId/override', requireRole('ADMIN' as Role), async (req, res) => {
  const { expenseId } = req.params;
  const { status } = req.body as { status: 'APPROVED' | 'REJECTED' };
  if (!['APPROVED','REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status for override' });
  }
  const exp = await prisma.expense.update({ where: { id: expenseId }, data: { status } });
  res.json(exp);
});

export default router;
