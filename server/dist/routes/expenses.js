"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const config_1 = require("../config");
const currencyService_1 = require("../services/currencyService");
const ocrService_1 = require("../services/ocrService");
const approvalEngine_1 = require("../services/approvalEngine");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// Ensure upload directory exists
fs_1.default.mkdirSync((0, config_1.resolveUploadPath)(), { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, (0, config_1.resolveUploadPath)()),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = (0, multer_1.default)({ storage });
const submitSchema = zod_1.z.object({
    description: zod_1.z.string().min(2),
    category: zod_1.z.string().min(1),
    expenseDate: zod_1.z.string(),
    amount: zod_1.z.number(),
    currency: zod_1.z.string().min(3).max(3),
    submit: zod_1.z.boolean().optional().default(true),
});
router.post('/', upload.single('receipt'), async (req, res) => {
    try {
        const parsed = submitSchema.parse({
            ...req.body,
            amount: Number(req.body.amount),
            submit: req.body.submit === 'false' ? false : true,
        });
        // OCR extraction if receipt uploaded
        let receiptUrl;
        let ocrText;
        let ocrVendor;
        let ocrDate;
        let ocrAmountCents;
        if (req.file) {
            receiptUrl = path_1.default.relative(process.cwd(), req.file.path);
            try {
                const text = await (0, ocrService_1.extractTextFromImage)(req.file.path);
                const parsedOcr = (0, ocrService_1.parseOcrForExpense)(text);
                ocrText = text;
                ocrVendor = parsedOcr.vendor;
                ocrDate = parsedOcr.date ? new Date(parsedOcr.date) : undefined;
                ocrAmountCents = parsedOcr.amount ? Math.round(parsedOcr.amount * 100) : undefined;
            }
            catch (err) {
                console.warn('OCR failed:', err?.message);
            }
        }
        const company = await prisma_1.prisma.company.findUnique({ where: { id: req.user.companyId } });
        if (!company)
            return res.status(400).json({ error: 'Company not found' });
        const { converted, rate } = await (0, currencyService_1.convertToBaseCurrency)(company.currencyCode, parsed.amount, parsed.currency);
        const expense = await prisma_1.prisma.expense.create({
            data: {
                companyId: req.user.companyId,
                userId: req.user.id,
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
            await (0, approvalEngine_1.buildApprovalChainForExpense)(expense);
        }
        res.json(expense);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get('/', async (req, res) => {
    const where = req.user.role === 'ADMIN'
        ? { companyId: req.user.companyId }
        : req.user.role === 'MANAGER'
            ? { companyId: req.user.companyId }
            : { companyId: req.user.companyId, userId: req.user.id };
    const expenses = await prisma_1.prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(expenses);
});
exports.default = router;
