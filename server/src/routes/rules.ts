import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { prisma } from '../prisma';
import { Role } from '../types';
import { z } from 'zod';

const router = Router();
router.use(authMiddleware);

const ruleSchema = z.object({
  type: z.enum(['PERCENTAGE','SPECIFIC','HYBRID']),
  percentage: z.number().int().min(1).max(100).optional(),
  specificApproverId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const input = ruleSchema.parse(req.body);
    const rule = await prisma.approvalRule.create({
      data: {
        companyId: req.user!.companyId,
        type: input.type,
        percentage: input.percentage,
        specificApproverId: input.specificApproverId,
        isActive: input.isActive,
      },
    });
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requireRole('ADMIN'), async (req, res) => {
  const rules = await prisma.approvalRule.findMany({ where: { companyId: req.user!.companyId } });
  res.json(rules);
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const input = ruleSchema.partial().parse(req.body);
    const rule = await prisma.approvalRule.update({ where: { id: req.params.id }, data: input });
    res.json(rule);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
