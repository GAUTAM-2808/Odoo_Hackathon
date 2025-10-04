"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleTypes = exports.ApprovalStatuses = exports.ExpenseStatuses = exports.Roles = void 0;
exports.Roles = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
};
exports.ExpenseStatuses = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
};
exports.ApprovalStatuses = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    SKIPPED: 'SKIPPED',
};
exports.RuleTypes = {
    PERCENTAGE: 'PERCENTAGE',
    SPECIFIC: 'SPECIFIC',
    HYBRID: 'HYBRID',
};
