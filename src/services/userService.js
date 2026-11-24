/**
 * @file userService.js
 * @description User account management, credential provisioning, and role assignment.
 */

import { STORES } from '../db/schema.js';
import { getRecord, putRecord, getAllRecords } from './dbService.js';
import { validateUser } from './validationService.js';
import { assertPermission, hashPin } from './authService.js';
import { PERMISSIONS } from '../config/roles.js';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService.js';

/**
 * Retrieves all authorized user accounts.
 * Strips security salts and hashes before returning to presentation layer.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllUsers() {
  const users = await getAllRecords(STORES.USERS);
  return users.map((u) => {
    const { pinHash, pinSalt, ...safeUser } = u;
    return safeUser;
  });
}

/**
 * Retrieves a user by ID.
 * @param {string} userId
 * @returns {Promise<Object | null>}
 */
export async function getUserById(userId) {
  const user = await getRecord(STORES.USERS, userId);
  if (!user) return null;
  const { pinHash, pinSalt, ...safeUser } = user;
  return safeUser;
}

/**
 * Provisions a new authorized user with a hashed PIN.
 * Never stores plain PINs or passwords.
 * @param {Object} userInput
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function provisionUser(userInput, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.MANAGE_USERS);
  validateUser(userInput);

  const existingUsers = await getAllRecords(STORES.USERS);
  const duplicate = existingUsers.find(
    (u) => u.username.toLowerCase() === userInput.username.trim().toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Username '@${userInput.username}' is already in use.`);
  }

  const userId = userInput.userId || `USR-${Date.now().toString().slice(-5)}`;
  const salt = 'a7b8c9d0e1f2a3b4';
  const pinHash = await hashPin(userInput.pin || '1234', salt);
  const timestamp = new Date().toISOString();

  const userRecord = {
    userId,
    username: userInput.username.trim().toLowerCase(),
    fullName: userInput.fullName.trim(),
    role: userInput.role,
    facilityId: userInput.facilityId,
    qualification: userInput.qualification || 'Clinical Staff',
    status: 'ACTIVE',
    pinSalt: salt,
    pinHash,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await putRecord(STORES.USERS, userRecord);
  await logAuditEvent(
    AUDIT_ACTIONS.USER_PROVISIONED,
    callerUser.userId,
    callerUser.facilityId,
    `Provisioned user ${userRecord.userId} (@${userRecord.username}) with role ${userRecord.role}`
  );

  const { pinHash: _h, pinSalt: _s, ...safeUser } = userRecord;
  return safeUser;
}

/**
 * Toggles or updates user active status.
 * @param {string} userId
 * @param {'ACTIVE' | 'DEACTIVATED'} status
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function updateUserStatus(userId, status, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.MANAGE_USERS);

  const user = await getRecord(STORES.USERS, userId);
  if (!user) {
    throw new Error(`User account '${userId}' not found.`);
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();

  await putRecord(STORES.USERS, user);
  const { pinHash, pinSalt, ...safeUser } = user;
  return safeUser;
}

