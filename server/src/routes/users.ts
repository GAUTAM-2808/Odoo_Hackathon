import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware, requireRole } from '../middleware/auth';
import { z } from 'zod';
import { Role } from '../types';

const router = Router();

router.use(authMiddleware);

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN','MANAGER','EMPLOYEE']),
  managerId: z.string().optional(),
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const input = createUserSchema.parse(req.body);
    const passwordHash = await (await import('bcryptjs')).default.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        companyId: req.user!.companyId,
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        managerId: input.managerId || null,
      },
    });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN','MANAGER','EMPLOYEE']).optional(),
  managerId: z.string().nullable().optional(),
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const input = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({ where: { id }, data: input });
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requireRole('ADMIN'), async (req, res) => {
  const users = await prisma.user.findMany({ where: { companyId: req.user!.companyId } });
  res.json(users);
});

export default router;
