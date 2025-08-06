
import { db } from '../db';
import { leaveRequestsTable } from '../db/schema';
import { type CreateLeaveRequestInput, type LeaveRequest } from '../schema';

export const createLeaveRequest = async (input: CreateLeaveRequestInput): Promise<LeaveRequest> => {
  try {
    // Insert leave request record
    const result = await db.insert(leaveRequestsTable)
      .values({
        employee_id: input.employee_id,
        department: input.department,
        reason: input.reason,
        leave_date: new Date(input.leave_date),
        location: input.location,
        status: 'PENDING' // Default status for new requests
      })
      .returning()
      .execute();

    // Return the created leave request
    const leaveRequest = result[0];
    return leaveRequest;
  } catch (error) {
    console.error('Leave request creation failed:', error);
    throw error;
  }
};
