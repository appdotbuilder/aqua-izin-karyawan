
import { db } from '../db';
import { managersTable } from '../db/schema';
import { type ManagerLoginInput, type ManagerLoginResponse } from '../schema';
import { eq } from 'drizzle-orm';

export async function managerLogin(input: ManagerLoginInput): Promise<ManagerLoginResponse> {
  try {
    // Find manager by username
    const managers = await db.select()
      .from(managersTable)
      .where(eq(managersTable.username, input.username))
      .execute();

    if (managers.length === 0) {
      return {
        success: false,
        message: "Invalid credentials",
        manager: undefined
      };
    }

    const manager = managers[0];

    // Verify password using Bun's built-in password verification
    const isPasswordValid = await Bun.password.verify(input.password, manager.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid credentials",
        manager: undefined
      };
    }

    // Return successful login response
    return {
      success: true,
      message: "Login successful",
      manager: {
        id: manager.id,
        name: manager.name,
        role: manager.role
      }
    };
  } catch (error) {
    console.error('Manager login failed:', error);
    throw error;
  }
}
