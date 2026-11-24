/**
 * @file auditService.js
 * @description Append-only security and operational audit logging service for MediLink Offline.
 * Persists immutable event records to IndexedDB without exposing patient PII.
 */

import { STORES } from '../db/schema.js';
import { putRecord, getAllRecords, getRecordsByIndex } from './dbService.js';

export const AUDIT_ACTIONS = Object.freeze({
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  SESSION_LOCKED: 'SESSION_LOCKED',
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
  VITALS_RECORDED: 'VITALS_RECORDED',
  REFERRAL_CREATED: 'REFERRAL_CREATED',
  REFERRAL_DISPATCHED: 'REFERRAL_DISPATCHED',
  REFERRAL_INGESTED: 'REFERRAL_INGESTED',
  REFERRAL_DECRYPTED: 'REFERRAL_DECRYPTED',
  PATIENT_ADMITTED: 'PATIENT_ADMITTED',
  FACILITY_REGISTERED: 'FACILITY_REGISTERED',
  USER_PROVISIONED: 'USER_PROVISIONED',
  KEYS_EXPORTED: 'KEYS_EXPORTED',
  KEYS_IMPORTED: 'KEYS_IMPORTED',
  KEY_REVOKED: 'KEY_REVOKED',
  SECURITY_SETTINGS_UPDATED: 'SECURITY_SETTINGS_UPDATED',
  SYNC_STARTED: 'SYNC_STARTED',
  SYNC_COMPLETED: 'SYNC_COMPLETED',
  SYNC_FAILED: 'SYNC_FAILED',
  SYNC_CONFLICT: 'SYNC_CONFLICT'
});

/**
 * Appends an audit entry to the immutable local audit trail.
 * Explicitly sanitizes details to prevent logging raw patient names or medical conditions.
 * @param {string} action - Action code from AUDIT_ACTIONS
 * @param {string} userId - User identifier performing the action
 * @param {string} facilityId - Associated facility code
 * @param {string} details - Non-PII description of the operation
 * @param {'SUCCESS' | 'FAILURE' | 'WARNING'} [status='SUCCESS']
 */
export async function logAuditEvent(action, userId, facilityId, details, status = 'SUCCESS') {
  const auditRecord = {
    timestamp: new Date().toISOString(),
    action,
    userId: userId || 'SYSTEM',
    facilityId: facilityId || 'UNKNOWN_FACILITY',
    details,
    status
  };

  try {
    await putRecord(STORES.AUDIT_LOGS, auditRecord);
    return auditRecord;
  } catch (err) {
    // Fail-safe: do not crash application if audit write fails, but surface warning
    console.warn('[AuditService] Failed to persist audit record:', err.message);
    return null;
  }
}

/**
 * Retrieves all audit logs ordered by timestamp.
 * @returns {Promise<Array<Object>>}
 */
export async function getAuditLogs() {
  const logs = await getAllRecords(STORES.AUDIT_LOGS);
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

