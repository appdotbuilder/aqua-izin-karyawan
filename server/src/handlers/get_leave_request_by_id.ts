
import { db } from '../db';
import { leaveRequestsTable } from '../db/schema';
import { type LeaveRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getLeaveRequestById = async (id: number): Promise<LeaveRequest | null> => {
  try {
    const results = await db.select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const leaveRequest = results[0];
    return {
      ...leaveRequest,
      // Convert timestamps to Date objects
      leave_date: new Date(leaveRequest.leave_date),
      approved_at: leaveRequest.approved_at ? new Date(leaveRequest.approved_at) : null,
      created_at: new Date(leaveRequest.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch leave request by ID:', error);
    throw error;
  }
};
