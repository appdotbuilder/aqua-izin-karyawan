
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leaveRequestsTable, managersTable } from '../db/schema';
import { getLeaveRequestById } from '../handlers/get_leave_request_by_id';

describe('getLeaveRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return leave request by ID', async () => {
    // Create a test leave request
    const leaveResult = await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP001',
        department: 'HR',
        reason: 'Medical appointment',
        leave_date: new Date('2024-01-15'),
        location: 'New York Office',
        status: 'PENDING'
      })
      .returning()
      .execute();

    const createdLeave = leaveResult[0];
    const result = await getLeaveRequestById(createdLeave.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdLeave.id);
    expect(result!.employee_id).toEqual('EMP001');
    expect(result!.department).toEqual('HR');
    expect(result!.reason).toEqual('Medical appointment');
    expect(result!.leave_date).toBeInstanceOf(Date);
    expect(result!.leave_date.getTime()).toEqual(new Date('2024-01-15').getTime());
    expect(result!.location).toEqual('New York Office');
    expect(result!.status).toEqual('PENDING');
    expect(result!.approved_by).toBeNull();
    expect(result!.approved_at).toBeNull();
    expect(result!.rejection_reason).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent leave request', async () => {
    const result = await getLeaveRequestById(999);
    expect(result).toBeNull();
  });

  it('should return leave request with approved status', async () => {
    // Create a manager first
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager1',
        password_hash: 'hashed_password',
        name: 'John Manager',
        role: 'MANAGER',
        phone_number: '555-0100'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    // Create an approved leave request
    const approvedDate = new Date('2024-01-20T10:00:00Z');
    const leaveResult = await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP002',
        department: 'FINANCE',
        reason: 'Vacation',
        leave_date: new Date('2024-02-01'),
        location: 'Remote',
        status: 'APPROVED',
        approved_by: managerId,
        approved_at: approvedDate
      })
      .returning()
      .execute();

    const result = await getLeaveRequestById(leaveResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('APPROVED');
    expect(result!.approved_by).toEqual(managerId);
    expect(result!.approved_at).toBeInstanceOf(Date);
    expect(result!.approved_at!.getTime()).toEqual(approvedDate.getTime());
  });

  it('should return leave request with rejected status and reason', async () => {
    // Create a manager first
    const managerResult = await db.insert(managersTable)
      .values({
        username: 'manager2',
        password_hash: 'hashed_password',
        name: 'Jane Manager',
        role: 'DEPARTMENT_MANAGER',
        phone_number: '555-0200'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    // Create a rejected leave request
    const rejectedDate = new Date('2024-01-18T14:30:00Z');
    const leaveResult = await db.insert(leaveRequestsTable)
      .values({
        employee_id: 'EMP003',
        department: 'IT',
        reason: 'Personal leave',
        leave_date: new Date('2024-01-25'),
        location: 'Boston Office',
        status: 'REJECTED',
        approved_by: managerId,
        approved_at: rejectedDate,
        rejection_reason: 'Insufficient staffing during project deadline'
      })
      .returning()
      .execute();

    const result = await getLeaveRequestById(leaveResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('REJECTED');
    expect(result!.approved_by).toEqual(managerId);
    expect(result!.approved_at).toBeInstanceOf(Date);
    expect(result!.approved_at!.getTime()).toEqual(rejectedDate.getTime());
    expect(result!.rejection_reason).toEqual('Insufficient staffing during project deadline');
  });

  it('should handle different departments correctly', async () => {
    const departments = ['PRODUCTION', 'MARKETING', 'OPERATIONS', 'QUALITY_CONTROL', 'LOGISTICS'] as const;
    
    for (const department of departments) {
      const leaveResult = await db.insert(leaveRequestsTable)
        .values({
          employee_id: `EMP_${department}`,
          department,
          reason: `${department} related leave`,
          leave_date: new Date('2024-03-01'),
          location: 'Main Office',
          status: 'PENDING'
        })
        .returning()
        .execute();

      const result = await getLeaveRequestById(leaveResult[0].id);
      
      expect(result).not.toBeNull();
      expect(result!.department).toEqual(department);
      expect(result!.employee_id).toEqual(`EMP_${department}`);
    }
  });
});
