
import { db } from '../db';
import { leaveRequestsTable, managersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function exportLeaveRequests(): Promise<Buffer> {
  try {
    // Fetch all leave requests with manager information using a left join
    const results = await db.select({
      id: leaveRequestsTable.id,
      employee_id: leaveRequestsTable.employee_id,
      department: leaveRequestsTable.department,
      reason: leaveRequestsTable.reason,
      leave_date: leaveRequestsTable.leave_date,
      location: leaveRequestsTable.location,
      status: leaveRequestsTable.status,
      approved_by: leaveRequestsTable.approved_by,
      approved_at: leaveRequestsTable.approved_at,
      rejection_reason: leaveRequestsTable.rejection_reason,
      created_at: leaveRequestsTable.created_at,
      manager_name: managersTable.name,
    })
    .from(leaveRequestsTable)
    .leftJoin(managersTable, eq(leaveRequestsTable.approved_by, managersTable.id))
    .execute();

    // CSV headers
    const headers = [
      'ID',
      'Employee ID',
      'Department',
      'Reason',
      'Leave Date',
      'Location',
      'Status',
      'Approved By',
      'Approved At',
      'Rejection Reason',
      'Created At'
    ];

    // Helper function to escape CSV values
    const escapeCSVValue = (value: string | null | undefined): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Helper function to format date
    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Convert data to CSV rows
    const csvRows = results.map(result => [
      escapeCSVValue(result.id?.toString()),
      escapeCSVValue(result.employee_id),
      escapeCSVValue(result.department),
      escapeCSVValue(result.reason),
      escapeCSVValue(formatDate(result.leave_date)),
      escapeCSVValue(result.location),
      escapeCSVValue(result.status),
      escapeCSVValue(result.manager_name || ''),
      escapeCSVValue(formatDate(result.approved_at)),
      escapeCSVValue(result.rejection_reason || ''),
      escapeCSVValue(formatDate(result.created_at))
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Convert to buffer
    return Buffer.from(csvContent, 'utf-8');
  } catch (error) {
    console.error('Leave requests export failed:', error);
    throw error;
  }
}
