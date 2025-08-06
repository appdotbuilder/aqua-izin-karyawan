
import { db } from '../db';
import { leaveRequestsTable, managersTable } from '../db/schema';
import { type LeaveRequest } from '../schema';
import { desc, eq } from 'drizzle-orm';

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    // Query all leave requests with optional manager information
    const results = await db.select()
      .from(leaveRequestsTable)
      .leftJoin(managersTable, eq(leaveRequestsTable.approved_by, managersTable.id))
      .orderBy(desc(leaveRequestsTable.created_at))
      .execute();

    // Transform results to match LeaveRequest schema
    return results.map(result => ({
      id: result.leave_requests.id,
      employee_id: result.leave_requests.employee_id,
      department: result.leave_requests.department as any,
      reason: result.leave_requests.reason,
      leave_date: result.leave_requests.leave_date,
      location: result.leave_requests.location,
      status: result.leave_requests.status as any,
      approved_by: result.leave_requests.approved_by,
      approved_at: result.leave_requests.approved_at,
      rejection_reason: result.leave_requests.rejection_reason,
      created_at: result.leave_requests.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    throw error;
  }
}
