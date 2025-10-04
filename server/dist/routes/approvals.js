"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../prisma");
const approvalEngine_1 = require("../services/approvalEngine");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/pending', (0, auth_1.requireRole)('MANAGER', 'ADMIN'), async (req, res) => {
    const approvals = await prisma_1.prisma.approval.findMany({
        where: {
            approverId: req.user.id,
            status: 'PENDING',
            expense: { companyId: req.user.companyId, status: { in: ['SUBMITTED'] } },
        },
        include: { expense: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(approvals);
});
router.post('/:id/approve', (0, auth_1.requireRole)('MANAGER', 'ADMIN'), async (req, res) => {
    const { id } = req.params; // approval id
    const approval = await prisma_1.prisma.approval.update({
        where: { id },
        data: { status: 'APPROVED', decidedAt: new Date(), comment: req.body?.comment ?? null },
    });
    await (0, approvalEngine_1.handlePostApprovalProgress)(approval.expenseId);
    res.json(approval);
});
router.post('/:id/reject', (0, auth_1.requireRole)('MANAGER', 'ADMIN'), async (req, res) => {
    const { id } = req.params;
    const approval = await prisma_1.prisma.approval.update({
        where: { id },
        data: { status: 'REJECTED', decidedAt: new Date(), comment: req.body?.comment ?? null },
    });
    await prisma_1.prisma.expense.update({ where: { id: approval.expenseId }, data: { status: 'REJECTED' } });
    res.json(approval);
});
// Admin override
router.post('/expense/:expenseId/override', (0, auth_1.requireRole)('ADMIN'), async (req, res) => {
    const { expenseId } = req.params;
    const { status } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status for override' });
    }
    const exp = await prisma_1.prisma.expense.update({ where: { id: expenseId }, data: { status } });
    res.json(exp);
});
exports.default = router;
