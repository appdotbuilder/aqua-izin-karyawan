
import { z } from 'zod';

// Department enum
export const departmentEnum = z.enum([
  'HR',
  'FINANCE',
  'PRODUCTION',
  'MARKETING',
  'IT',
  'OPERATIONS',
  'QUALITY_CONTROL',
  'LOGISTICS'
]);

// Leave request status enum
export const leaveStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED'
]);

// Manager role enum
export const managerRoleEnum = z.enum([
  'MANAGER',
  'DEPARTMENT_MANAGER'
]);

// Manager schema
export const managerSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  name: z.string(),
  role: managerRoleEnum,
  phone_number: z.string(),
  created_at: z.coerce.date()
});

export type Manager = z.infer<typeof managerSchema>;

// Leave request schema
export const leaveRequestSchema = z.object({
  id: z.number(),
  employee_id: z.string(),
  department: departmentEnum,
  reason: z.string(),
  leave_date: z.coerce.date(),
  location: z.string(),
  status: leaveStatusEnum,
  approved_by: z.number().nullable(),
  approved_at: z.coerce.date().nullable(),
  rejection_reason: z.string().nullable(),
  created_at: z.coerce.date()
});

export type LeaveRequest = z.infer<typeof leaveRequestSchema>;

// Input schemas for creating leave request
export const createLeaveRequestInputSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  department: departmentEnum,
  reason: z.string().min(1, "Reason is required"),
  leave_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
  location: z.string().min(1, "Location is required")
});

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestInputSchema>;

// Input schema for manager login
export const managerLoginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type ManagerLoginInput = z.infer<typeof managerLoginInputSchema>;

// Input schema for updating leave request status
export const updateLeaveStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['APPROVED', 'REJECTED']),
  manager_id: z.number(),
  rejection_reason: z.string().optional()
});

export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusInputSchema>;

// Response schemas
export const leaveRequestResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: leaveRequestSchema.optional()
});

export type LeaveRequestResponse = z.infer<typeof leaveRequestResponseSchema>;

export const managerLoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  manager: z.object({
    id: z.number(),
    name: z.string(),
    role: managerRoleEnum
  }).optional()
});

export type ManagerLoginResponse = z.infer<typeof managerLoginResponseSchema>;

export const leaveRequestListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(leaveRequestSchema)
});

export type LeaveRequestListResponse = z.infer<typeof leaveRequestListResponseSchema>;
