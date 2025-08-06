
import { db } from '../db';
import { leaveRequestsTable, managersTable } from '../db/schema';
import { type UpdateLeaveStatusInput, type LeaveRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLeaveStatus = async (input: UpdateLeaveStatusInput): Promise<LeaveRequest> => {
  try {
    // Verify manager exists
    const manager = await db.select()
      .from(managersTable)
      .where(eq(managersTable.id, input.manager_id))
      .execute();

    if (manager.length === 0) {
      throw new Error('Manager not found');
    }

    // Verify leave request exists and is still pending
    const existingRequest = await db.select()
      .from(leaveRequestsTable)
      .where(eq(leaveRequestsTable.id, input.id))
      .execute();

    if (existingRequest.length === 0) {
      throw new Error('Leave request not found');
    }

    if (existingRequest[0].status !== 'PENDING') {
      throw new Error('Leave request has already been processed');
    }

    // Prepare update data
    const updateData: any = {
      status: input.status,
      approved_by: input.manager_id,
      approved_at: new Date()
    };

    // Add rejection reason if status is REJECTED
    if (input.status === 'REJECTED' && input.rejection_reason) {
      updateData.rejection_reason = input.rejection_reason;
    }

    // Update leave request status
    const result = await db.update(leaveRequestsTable)
      .set(updateData)
      .where(eq(leaveRequestsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Leave status update failed:', error);
    throw error;
  }
};
