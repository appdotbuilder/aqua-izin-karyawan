
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leaveRequestsTable } from '../db/schema';
import { type CreateLeaveRequestInput } from '../schema';
import { createLeaveRequest } from '../handlers/create_leave_request';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateLeaveRequestInput = {
  employee_id: 'EMP001',
  department: 'IT',
  reason: 'Medical appointment',
  leave_date: '2024-01-15',
  location: 'New York Office'
};

describe('createLeaveRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a leave request', async () => {
    const result = await createLeaveRequest(testInput);

    // Basic field validation
    expect(result.employee_id).toEqual('EMP001');
    expect(result.department).toEqual('IT');
    expect(result.reason).toEqual('Medical appointment');
    expect(result.leave_date).toEqual(new Date('2024-01-15'));
    expect(result.location).toEqual('New York Office');
    expect(result.status).toEqual('PENDING');
    expect(result.approved_by).toBeNull();
    expect(result.approved_at).toBeNull();
    expect(result.rejection_reason).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save leave request to database', async () => {
    const result = await createLeaveRequest(testInput);

    // Query using proper drizzle syntax
    const leaveRequests = await db.select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.id, result.id))
      .execute();

    expect(leaveRequests).toHaveLength(1);
    const savedRequest = leaveRequests[0];
    expect(savedRequest.employee_id).toEqual('EMP001');
    expect(savedRequest.department).toEqual('IT');
    expect(savedRequest.reason).toEqual('Medical appointment');
    expect(savedRequest.leave_date).toEqual(new Date('2024-01-15'));
    expect(savedRequest.location).toEqual('New York Office');
    expect(savedRequest.status).toEqual('PENDING');
    expect(savedRequest.created_at).toBeInstanceOf(Date);
  });

  it('should handle different departments correctly', async () => {
    const hrInput: CreateLeaveRequestInput = {
      employee_id: 'EMP002',
      department: 'HR',
      reason: 'Personal leave',
      leave_date: '2024-02-01',
      location: 'Remote'
    };

    const result = await createLeaveRequest(hrInput);

    expect(result.employee_id).toEqual('EMP002');
    expect(result.department).toEqual('HR');
    expect(result.reason).toEqual('Personal leave');
    expect(result.location).toEqual('Remote');
    expect(result.status).toEqual('PENDING');
  });

  it('should handle date conversion properly', async () => {
    const futureDate = '2024-12-25';
    const input: CreateLeaveRequestInput = {
      employee_id: 'EMP003',
      department: 'FINANCE',
      reason: 'Holiday',
      leave_date: futureDate,
      location: 'Home'
    };

    const result = await createLeaveRequest(input);

    expect(result.leave_date).toEqual(new Date(futureDate));
    expect(result.leave_date).toBeInstanceOf(Date);

    // Verify in database
    const saved = await db.select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.id, result.id))
      .execute();

    expect(saved[0].leave_date).toEqual(new Date(futureDate));
  });
});
