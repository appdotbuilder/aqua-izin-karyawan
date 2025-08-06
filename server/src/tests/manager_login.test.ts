
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { managersTable } from '../db/schema';
import { type ManagerLoginInput } from '../schema';
import { managerLogin } from '../handlers/manager_login';

// Test manager data
const testManagerData = {
  username: 'testmanager',
  password: 'testpassword123',
  name: 'Test Manager',
  role: 'MANAGER' as const,
  phone_number: '555-0123'
};

const testInput: ManagerLoginInput = {
  username: 'testmanager',
  password: 'testpassword123'
};

describe('managerLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login successfully with valid credentials', async () => {
    // Create test manager with hashed password using Bun's built-in hashing
    const hashedPassword = await Bun.password.hash(testManagerData.password);
    
    const result = await db.insert(managersTable)
      .values({
        username: testManagerData.username,
        password_hash: hashedPassword,
        name: testManagerData.name,
        role: testManagerData.role,
        phone_number: testManagerData.phone_number
      })
      .returning()
      .execute();

    const createdManager = result[0];

    // Test login
    const loginResult = await managerLogin(testInput);

    expect(loginResult.success).toBe(true);
    expect(loginResult.message).toEqual('Login successful');
    expect(loginResult.manager).toBeDefined();
    expect(loginResult.manager!.id).toEqual(createdManager.id);
    expect(loginResult.manager!.name).toEqual('Test Manager');
    expect(loginResult.manager!.role).toEqual('MANAGER');
  });

  it('should fail with invalid username', async () => {
    // Create test manager
    const hashedPassword = await Bun.password.hash(testManagerData.password);
    
    await db.insert(managersTable)
      .values({
        username: testManagerData.username,
        password_hash: hashedPassword,
        name: testManagerData.name,
        role: testManagerData.role,
        phone_number: testManagerData.phone_number
      })
      .execute();

    // Test login with wrong username
    const wrongUsernameInput: ManagerLoginInput = {
      username: 'wrongusername',
      password: 'testpassword123'
    };

    const loginResult = await managerLogin(wrongUsernameInput);

    expect(loginResult.success).toBe(false);
    expect(loginResult.message).toEqual('Invalid credentials');
    expect(loginResult.manager).toBeUndefined();
  });

  it('should fail with invalid password', async () => {
    // Create test manager
    const hashedPassword = await Bun.password.hash(testManagerData.password);
    
    await db.insert(managersTable)
      .values({
        username: testManagerData.username,
        password_hash: hashedPassword,
        name: testManagerData.name,
        role: testManagerData.role,
        phone_number: testManagerData.phone_number
      })
      .execute();

    // Test login with wrong password
    const wrongPasswordInput: ManagerLoginInput = {
      username: 'testmanager',
      password: 'wrongpassword'
    };

    const loginResult = await managerLogin(wrongPasswordInput);

    expect(loginResult.success).toBe(false);
    expect(loginResult.message).toEqual('Invalid credentials');
    expect(loginResult.manager).toBeUndefined();
  });

  it('should work with department manager role', async () => {
    // Create department manager
    const hashedPassword = await Bun.password.hash(testManagerData.password);
    
    const result = await db.insert(managersTable)
      .values({
        username: testManagerData.username,
        password_hash: hashedPassword,
        name: testManagerData.name,
        role: 'DEPARTMENT_MANAGER',
        phone_number: testManagerData.phone_number
      })
      .returning()
      .execute();

    const createdManager = result[0];

    // Test login
    const loginResult = await managerLogin(testInput);

    expect(loginResult.success).toBe(true);
    expect(loginResult.message).toEqual('Login successful');
    expect(loginResult.manager).toBeDefined();
    expect(loginResult.manager!.id).toEqual(createdManager.id);
    expect(loginResult.manager!.name).toEqual('Test Manager');
    expect(loginResult.manager!.role).toEqual('DEPARTMENT_MANAGER');
  });
});
