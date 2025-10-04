import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../prisma';
import { z } from 'zod';
import { Role, ExpenseStatus } from '../types';
import { config, resolveUploadPath } from '../config';
import { convertToBaseCurrency } from '../services/currencyService';
import { extractTextFromImage, parseOcrForExpense } from '../services/ocrService';
import { buildApprovalChainForExpense } from '../services/approvalEngine';

const router = Router();
router.use(authMiddleware);

// Ensure upload directory exists
fs.mkdirSync(resolveUploadPath(), { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resolveUploadPath()),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const submitSchema = z.object({
  description: z.string().min(2),
  category: z.string().min(1),
  expenseDate: z.string(),
  amount: z.number(),
  currency: z.string().min(3).max(3),
  submit: z.boolean().optional().default(true),
});

router.post('/', upload.single('receipt'), async (req, res) => {
  try {
    const parsed = submitSchema.parse({
      ...req.body,
      amount: Number(req.body.amount),
      submit: req.body.submit === 'false' ? false : true,
    });

    // OCR extraction if receipt uploaded
    let receiptUrl: string | undefined;
    let ocrText: string | undefined;
    let ocrVendor: string | undefined;
    let ocrDate: Date | undefined;
    let ocrAmountCents: number | undefined;
    if (req.file) {
      receiptUrl = path.relative(process.cwd(), req.file.path);
      try {
        const text = await extractTextFromImage(req.file.path);
        const parsedOcr = parseOcrForExpense(text);
        ocrText = text;
        ocrVendor = parsedOcr.vendor;
        ocrDate = parsedOcr.date ? new Date(parsedOcr.date) : undefined;
        ocrAmountCents = parsedOcr.amount ? Math.round(parsedOcr.amount * 100) : undefined;
      } catch (err) {
        console.warn('OCR failed:', (err as any)?.message);
      }
    }

    const company = await prisma.company.findUnique({ where: { id: req.user!.companyId } });
    if (!company) return res.status(400).json({ error: 'Company not found' });

    const { converted, rate } = await convertToBaseCurrency(
      company.currencyCode,
      parsed.amount,
      parsed.currency
    );

    const expense = await prisma.expense.create({
      data: {
        companyId: req.user!.companyId,
        userId: req.user!.id,
        description: parsed.description,
        category: parsed.category,
        expenseDate: new Date(parsed.expenseDate),
        amountOriginalCents: Math.round(parsed.amount * 100),
        currencyOriginal: parsed.currency,
        amountCompanyCents: Math.round(converted * 100),
        currencyCompany: company.currencyCode,
        conversionRate: rate,
        receiptUrl,
        ocrText,
        ocrVendor,
        ocrDate,
        ocrAmountCents,
        status: parsed.submit ? 'SUBMITTED' : 'DRAFT',
      },
    });

    if (parsed.submit) {
      await buildApprovalChainForExpense(expense);
    }

    res.json(expense);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  const where = req.user!.role === 'ADMIN'
    ? { companyId: req.user!.companyId }
    : req.user!.role === 'MANAGER'
    ? { companyId: req.user!.companyId }
    : { companyId: req.user!.companyId, userId: req.user!.id };
  const expenses = await prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(expenses);
});

export default router;
