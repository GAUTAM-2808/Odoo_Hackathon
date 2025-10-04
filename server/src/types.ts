export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export const Roles: Record<Role, Role> = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
};

export type ExpenseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export const ExpenseStatuses: Record<ExpenseStatus, ExpenseStatus> = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export const ApprovalStatuses: Record<ApprovalStatus, ApprovalStatus> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SKIPPED: 'SKIPPED',
};

export type ApprovalRuleType = 'PERCENTAGE' | 'SPECIFIC' | 'HYBRID';
export const RuleTypes: Record<ApprovalRuleType, ApprovalRuleType> = {
  PERCENTAGE: 'PERCENTAGE',
  SPECIFIC: 'SPECIFIC',
  HYBRID: 'HYBRID',
};
