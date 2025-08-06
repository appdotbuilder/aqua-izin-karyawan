
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leaveRequestsTable, managersTable } from '../db/schema';
import { exportLeaveRequests } from '../handlers/export_leave_requests';

// Helper function to parse CSV content
const parseCSV = (csvContent: string): Array<Record<string, string>> => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
};

describe('exportLeaveRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export empty CSV file when no leave requests exist', async () => {
    const result = await exportLeaveRequests();

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);

    // Verify CSV structure
    const csvContent = result.toString('utf-8');
    const lines = csvContent.split('\n');
    
    // Should have header row
    expect(lines[0]).toContain('ID,Employee ID,Department,Reason,Leave Date,Location,Status,Approved By,Approved At,Rejection Reason,Created At');
    
    // Should have only header row (no data rows)
    expect(lines.filter(line => line.trim().length > 0)).toHaveLength(1);
  });

  it('should export leave requests without manager information', async () => {
    // Create a leave request without approved_by manager
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP001',
      department: 'IT',
      reason: 'Medical appointment',
      leave_date: new Date('2024-01-15'),
      location: 'Home',
      status: 'PENDING'
    }).execute();

    const result = await exportLeaveRequests();

    expect(result).toBeInstanceOf(Buffer);

    // Parse CSV and verify data
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['ID']).toBeDefined();
    expect(row['Employee ID']).toEqual('EMP001');
    expect(row['Department']).toEqual('IT');
    expect(row['Reason']).toEqual('Medical appointment');
    expect(row['Leave Date']).toEqual('2024-01-15');
    expect(row['Location']).toEqual('Home');
    expect(row['Status']).toEqual('PENDING');
    expect(row['Approved By']).toEqual('');
    expect(row['Approved At']).toEqual('');
    expect(row['Rejection Reason']).toEqual('');
    expect(row['Created At']).toBeDefined();
  });

  it('should export leave requests with manager information', async () => {
    // Create a manager first
    const managerResult = await db.insert(managersTable).values({
      username: 'manager1',
      password_hash: 'hashed_password',
      name: 'John Manager',
      role: 'MANAGER',
      phone_number: '+1234567890'
    }).returning().execute();

    const managerId = managerResult[0].id;

    // Create an approved leave request
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP002',
      department: 'HR',
      reason: 'Personal leave',
      leave_date: new Date('2024-02-10'),
      location: 'Office',
      status: 'APPROVED',
      approved_by: managerId,
      approved_at: new Date('2024-01-20')
    }).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify data
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['Employee ID']).toEqual('EMP002');
    expect(row['Department']).toEqual('HR');
    expect(row['Status']).toEqual('APPROVED');
    expect(row['Approved By']).toEqual('John Manager');
    expect(row['Approved At']).toEqual('2024-01-20');
  });

  it('should export rejected leave requests with rejection reason', async () => {
    // Create a manager
    const managerResult = await db.insert(managersTable).values({
      username: 'manager2',
      password_hash: 'hashed_password',
      name: 'Jane Manager',
      role: 'DEPARTMENT_MANAGER',
      phone_number: '+1234567891'
    }).returning().execute();

    const managerId = managerResult[0].id;

    // Create a rejected leave request
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP003',
      department: 'FINANCE',
      reason: 'Vacation',
      leave_date: new Date('2024-03-01'),
      location: 'Remote',
      status: 'REJECTED',
      approved_by: managerId,
      approved_at: new Date('2024-02-15'),
      rejection_reason: 'Insufficient notice period'
    }).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify data
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['Status']).toEqual('REJECTED');
    expect(row['Approved By']).toEqual('Jane Manager');
    expect(row['Rejection Reason']).toEqual('Insufficient notice period');
  });

  it('should export multiple leave requests correctly ordered', async () => {
    // Create two managers
    const manager1Result = await db.insert(managersTable).values({
      username: 'manager1',
      password_hash: 'hash1',
      name: 'Manager One',
      role: 'MANAGER',
      phone_number: '+1111111111'
    }).returning().execute();

    const manager2Result = await db.insert(managersTable).values({
      username: 'manager2',
      password_hash: 'hash2',
      name: 'Manager Two',
      role: 'DEPARTMENT_MANAGER',
      phone_number: '+2222222222'
    }).returning().execute();

    // Create multiple leave requests
    await db.insert(leaveRequestsTable).values([
      {
        employee_id: 'EMP001',
        department: 'IT',
        reason: 'Sick leave',
        leave_date: new Date('2024-01-10'),
        location: 'Home',
        status: 'PENDING'
      },
      {
        employee_id: 'EMP002',
        department: 'HR',
        reason: 'Annual leave',
        leave_date: new Date('2024-01-15'),
        location: 'Office',
        status: 'APPROVED',
        approved_by: manager1Result[0].id,
        approved_at: new Date('2024-01-12')
      },
      {
        employee_id: 'EMP003',
        department: 'FINANCE',
        reason: 'Personal',
        leave_date: new Date('2024-01-20'),
        location: 'Remote',
        status: 'REJECTED',
        approved_by: manager2Result[0].id,
        approved_at: new Date('2024-01-18'),
        rejection_reason: 'Conflicting schedule'
      }
    ]).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify data
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(3);

    // Verify all required columns are present in header
    const headers = csvContent.split('\n')[0];
    expect(headers).toContain('ID');
    expect(headers).toContain('Employee ID');
    expect(headers).toContain('Department');
    expect(headers).toContain('Reason');
    expect(headers).toContain('Leave Date');
    expect(headers).toContain('Location');
    expect(headers).toContain('Status');
    expect(headers).toContain('Approved By');
    expect(headers).toContain('Approved At');
    expect(headers).toContain('Rejection Reason');
    expect(headers).toContain('Created At');

    // Verify specific data for different statuses
    const pendingRequest = data.find(row => row['Employee ID'] === 'EMP001');
    expect(pendingRequest!['Status']).toEqual('PENDING');
    expect(pendingRequest!['Approved By']).toEqual('');

    const approvedRequest = data.find(row => row['Employee ID'] === 'EMP002');
    expect(approvedRequest!['Status']).toEqual('APPROVED');
    expect(approvedRequest!['Approved By']).toEqual('Manager One');
    expect(approvedRequest!['Rejection Reason']).toEqual('');

    const rejectedRequest = data.find(row => row['Employee ID'] === 'EMP003');
    expect(rejectedRequest!['Status']).toEqual('REJECTED');
    expect(rejectedRequest!['Approved By']).toEqual('Manager Two');
    expect(rejectedRequest!['Rejection Reason']).toEqual('Conflicting schedule');
  });

  it('should handle CSV escaping for values with commas and quotes', async () => {
    // Create leave request with values that need CSV escaping
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP004',
      department: 'MARKETING',
      reason: 'Personal reasons, family emergency',
      leave_date: new Date('2024-12-25'),
      location: 'Home, Remote office',
      status: 'PENDING'
    }).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify escaping
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['Reason']).toEqual('Personal reasons, family emergency');
    expect(row['Location']).toEqual('Home, Remote office');
  });

  it('should handle date formatting correctly', async () => {
    // Create leave request with specific dates
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP004',
      department: 'MARKETING',
      reason: 'Conference',
      leave_date: new Date('2024-12-25T10:30:00Z'),
      location: 'Conference Center',
      status: 'PENDING'
    }).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify date formatting
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['Leave Date']).toEqual('2024-12-25');
    expect(row['Created At']).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });

  it('should handle rejection reason with quotes correctly', async () => {
    // Create a manager
    const managerResult = await db.insert(managersTable).values({
      username: 'manager3',
      password_hash: 'hashed_password',
      name: 'Test Manager',
      role: 'MANAGER',
      phone_number: '+1234567892'
    }).returning().execute();

    const managerId = managerResult[0].id;

    // Create a rejected leave request with quotes in rejection reason
    await db.insert(leaveRequestsTable).values({
      employee_id: 'EMP005',
      department: 'OPERATIONS',
      reason: 'Emergency leave',
      leave_date: new Date('2024-03-15'),
      location: 'Home',
      status: 'REJECTED',
      approved_by: managerId,
      approved_at: new Date('2024-03-10'),
      rejection_reason: 'Policy states "minimum 48 hours notice required"'
    }).execute();

    const result = await exportLeaveRequests();

    // Parse CSV and verify quote handling
    const csvContent = result.toString('utf-8');
    const data = parseCSV(csvContent);

    expect(data).toHaveLength(1);
    
    const row = data[0];
    expect(row['Rejection Reason']).toEqual('Policy states "minimum 48 hours notice required"');
  });
});
