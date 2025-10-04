"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
const ruleSchema = zod_1.z.object({
    type: zod_1.z.enum(['PERCENTAGE', 'SPECIFIC', 'HYBRID']),
    percentage: zod_1.z.number().int().min(1).max(100).optional(),
    specificApproverId: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional().default(true),
});
router.post('/', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const input = ruleSchema.parse(req.body);
        const rule = await prisma_1.prisma.approvalRule.create({
            data: {
                companyId: req.user.companyId,
                type: input.type,
                percentage: input.percentage,
                specificApproverId: input.specificApproverId,
                isActive: input.isActive,
            },
        });
        res.json(rule);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.get('/', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const rules = await prisma_1.prisma.approvalRule.findMany({ where: { companyId: req.user.companyId } });
    res.json(rules);
});
router.patch('/:id', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    try {
        const input = ruleSchema.partial().parse(req.body);
        const rule = await prisma_1.prisma.approvalRule.update({ where: { id: req.params.id }, data: input });
        res.json(rule);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.default = router;
