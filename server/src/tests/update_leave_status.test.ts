
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { managersTable, leaveRequestsTable } from '../db/schema';
import { type UpdateLeaveStatusInput } from '../schema';
import { updateLeaveStatus } from '../handlers/update_leave_status';
import { eq } from 'drizzle-orm';

describe('updateLeaveStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let managerId: number;
  let leaveRequestId: number;

  beforeEach(async () => {
    // Create manager
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager1',
        password_hash: 'hashed_password',
        name: 'John Manager',
        role: 'MANAGER',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();
    
    managerId = managerResult[0].id;

    // Create leave request
    const leaveResult = await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP001',
        department: 'HR',
        reason: 'Medical appointment',
        leave_date: new Date('2024-01-15'),
        location: 'Jakarta'
      })
      .returning()
      .execute();
    
    leaveRequestId = leaveResult[0].id;
  });

  it('should approve a leave request', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'APPROVED',
      manager_id: managerId
    };

    const result = await updateLeaveStatus(input);

    expect(result.id).toBe(leaveRequestId);
    expect(result.status).toBe('APPROVED');
    expect(result.approved_by).toBe(managerId);
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.rejection_reason).toBeNull();
  });

  it('should reject a leave request with reason', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'REJECTED',
      manager_id: managerId,
      rejection_reason: 'Insufficient staffing'
    };

    const result = await updateLeaveStatus(input);

    expect(result.id).toBe(leaveRequestId);
    expect(result.status).toBe('REJECTED');
    expect(result.approved_by).toBe(managerId);
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.rejection_reason).toBe('Insufficient staffing');
  });

  it('should reject a leave request without reason', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'REJECTED',
      manager_id: managerId
    };

    const result = await updateLeaveStatus(input);

    expect(result.id).toBe(leaveRequestId);
    expect(result.status).toBe('REJECTED');
    expect(result.approved_by).toBe(managerId);
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.rejection_reason).toBeNull();
  });

  it('should persist changes in database', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'APPROVED',
      manager_id: managerId
    };

    await updateLeaveStatus(input);

    // Verify changes were saved to database
    const updatedRequest = await db.select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.id, leaveRequestId))
      .execute();

    expect(updatedRequest).toHaveLength(1);
    expect(updatedRequest[0].status).toBe('APPROVED');
    expect(updatedRequest[0].approved_by).toBe(managerId);
    expect(updatedRequest[0].approved_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent manager', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'APPROVED',
      manager_id: 99999 // Non-existent manager
    };

    await expect(updateLeaveStatus(input)).rejects.toThrow(/manager not found/i);
  });

  it('should throw error for non-existent leave request', async () => {
    const input: UpdateLeaveStatusInput = {
      id: 99999, // Non-existent leave request
      status: 'APPROVED',
      manager_id: managerId
    };

    await expect(updateLeaveStatus(input)).rejects.toThrow(/leave request not found/i);
  });

  it('should throw error when trying to update already processed request', async () => {
    // First, approve the request
    const firstInput: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'APPROVED',
      manager_id: managerId
    };

    await updateLeaveStatus(firstInput);

    // Try to update again
    const secondInput: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'REJECTED',
      manager_id: managerId
    };

    await expect(updateLeaveStatus(secondInput)).rejects.toThrow(/already been processed/i);
  });

  it('should maintain original request data when updating status', async () => {
    const input: UpdateLeaveStatusInput = {
      id: leaveRequestId,
      status: 'APPROVED',
      manager_id: managerId
    };

    const result = await updateLeaveStatus(input);

    // Verify original data is preserved
    expect(result.employee_id).toBe('EMP001');
    expect(result.department).toBe('HR');
    expect(result.reason).toBe('Medical appointment');
    expect(result.location).toBe('Jakarta');
    expect(result.leave_date).toEqual(new Date('2024-01-15'));
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
