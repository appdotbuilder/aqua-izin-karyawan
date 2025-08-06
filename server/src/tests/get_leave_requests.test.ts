
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { managersTable, leaveRequestsTable } from '../db/schema';
import { getLeaveRequests } from '../handlers/get_leave_requests';

describe('getLeaveRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no leave requests exist', async () => {
    const result = await getLeaveRequests();

    expect(result).toEqual([]);
  });

  it('should fetch all leave requests ordered by creation date (newest first)', async () => {
    // Create test manager
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager1',
        password_hash: 'hashed_password123',
        name: 'John Manager',
        role: 'MANAGER',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();
    
    const managerId = managerResult[0].id;

    // Create leave requests with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Insert requests in chronological order (oldest first)
    await db.insert(leaveRequestsTable)
      .values([
        {
          employee_id: 'EMP001',
          department: 'HR',
          reason: 'Personal leave',
          leave_date: twoDaysAgo,
          location: 'Home',
          status: 'PENDING',
          created_at: twoDaysAgo
        },
        {
          employee_id: 'EMP002',
          department: 'IT',
          reason: 'Medical appointment',
          leave_date: yesterday,
          location: 'Hospital',
          status: 'APPROVED',
          approved_by: managerId,
          approved_at: yesterday,
          created_at: yesterday
        },
        {
          employee_id: 'EMP003',
          department: 'FINANCE',
          reason: 'Family emergency',
          leave_date: now,
          location: 'Remote',
          status: 'REJECTED',
          approved_by: managerId,
          approved_at: now,
          rejection_reason: 'Insufficient notice',
          created_at: now
        }
      ])
      .execute();

    const result = await getLeaveRequests();

    expect(result).toHaveLength(3);
    
    // Check ordering (newest first)
    expect(result[0].employee_id).toEqual('EMP003');
    expect(result[1].employee_id).toEqual('EMP002');
    expect(result[2].employee_id).toEqual('EMP001');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should include manager information for approved and rejected requests', async () => {
    // Create test manager
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager1',
        password_hash: 'hashed_password123',
        name: 'John Manager',
        role: 'DEPARTMENT_MANAGER',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();
    
    const managerId = managerResult[0].id;

    // Create approved request
    await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP001',
        department: 'MARKETING',
        reason: 'Vacation',
        leave_date: new Date(),
        location: 'Beach',
        status: 'APPROVED',
        approved_by: managerId,
        approved_at: new Date()
      })
      .execute();

    const result = await getLeaveRequests();

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual('EMP001');
    expect(result[0].department).toEqual('MARKETING');
    expect(result[0].reason).toEqual('Vacation');
    expect(result[0].location).toEqual('Beach');
    expect(result[0].status).toEqual('APPROVED');
    expect(result[0].approved_by).toEqual(managerId);
    expect(result[0].approved_at).toBeInstanceOf(Date);
    expect(result[0].rejection_reason).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle pending requests without manager information', async () => {
    // Create pending request
    await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP001',
        department: 'PRODUCTION',
        reason: 'Sick leave',
        leave_date: new Date(),
        location: 'Home',
        status: 'PENDING'
      })
      .execute();

    const result = await getLeaveRequests();

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual('EMP001');
    expect(result[0].department).toEqual('PRODUCTION');
    expect(result[0].status).toEqual('PENDING');
    expect(result[0].approved_by).toBeNull();
    expect(result[0].approved_at).toBeNull();
    expect(result[0].rejection_reason).toBeNull();
  });

  it('should handle rejected requests with rejection reason', async () => {
    // Create test manager
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager1',
        password_hash: 'hashed_password123',
        name: 'Jane Manager',
        role: 'MANAGER',
        phone_number: '+1234567890'
      })
      .returning()
      .execute();
    
    const managerId = managerResult[0].id;

    // Create rejected request
    await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP002',
        department: 'OPERATIONS',
        reason: 'Personal reasons',
        leave_date: new Date(),
        location: 'Home',
        status: 'REJECTED',
        approved_by: managerId,
        approved_at: new Date(),
        rejection_reason: 'Busy period, cannot approve leave'
      })
      .execute();

    const result = await getLeaveRequests();

    expect(result).toHaveLength(1);
    expect(result[0].employee_id).toEqual('EMP002');
    expect(result[0].status).toEqual('REJECTED');
    expect(result[0].approved_by).toEqual(managerId);
    expect(result[0].approved_at).toBeInstanceOf(Date);
    expect(result[0].rejection_reason).toEqual('Busy period, cannot approve leave');
  });
});
