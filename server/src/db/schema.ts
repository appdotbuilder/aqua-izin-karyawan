
import { serial, text, pgTable, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const departmentEnum = pgEnum('department', [
  'HR',
  'FINANCE', 
  'PRODUCTION',
  'MARKETING',
  'IT',
  'OPERATIONS',
  'QUALITY_CONTROL',
  'LOGISTICS'
]);

export const leaveStatusEnum = pgEnum('leave_status', [
  'PENDING',
  'APPROVED', 
  'REJECTED'
]);

export const managerRoleEnum = pgEnum('manager_role', [
  'MANAGER',
  'DEPARTMENT_MANAGER'
]);

// Managers table
export const managersTable = pgTable('managers', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: managerRoleEnum('role').notNull(),
  phone_number: text('phone_number').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Leave requests table
export const leaveRequestsTable = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  employee_id: text('employee_id').notNull(),
  department: departmentEnum('department').notNull(),
  reason: text('reason').notNull(),
  leave_date: timestamp('leave_date').notNull(),
  location: text('location').notNull(),
  status: leaveStatusEnum('status').notNull().default('PENDING'),
  approved_by: integer('approved_by'),
  approved_at: timestamp('approved_at'),
  rejection_reason: text('rejection_reason'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const managersRelations = relations(managersTable, ({ many }) => ({
  approvedRequests: many(leaveRequestsTable),
}));

export const leaveRequestsRelations = relations(leaveRequestsTable, ({ one }) => ({
  approvedByManager: one(managersTable, {
    fields: [leaveRequestsTable.approved_by],
    references: [managersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Manager = typeof managersTable.$inferSelect;
export type NewManager = typeof managersTable.$inferInsert;
export type LeaveRequest = typeof leaveRequestsTable.$inferSelect;
export type NewLeaveRequest = typeof leaveRequestsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  managers: managersTable, 
  leaveRequests: leaveRequestsTable 
};
