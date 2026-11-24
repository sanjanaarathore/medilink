/**
 * @file schema.js
 * @description IndexedDB database schema definitions, object stores, and indexes for MediLink Offline.
 * Utilizes standard web IndexedDB API wrapped cleanly with transaction guarantees.
 */

export const DB_NAME = 'medilink_offline_db';
export const DB_VERSION = 2; // Incremented for Phase 5: sync_queue & persistent storage support

export const STORES = Object.freeze({
  FACILITIES: 'facilities',
  USERS: 'users',
  TRUSTED_KEYS: 'trusted_keys',
  PATIENTS: 'patients',
  REFERRALS_OUTGOING: 'referrals_outgoing',
  REFERRALS_RECEIVED: 'referrals_received',
  AUDIT_LOGS: 'audit_logs',
  LOCAL_CREDENTIALS: 'local_credentials',
  APP_CONFIG: 'app_config',
  SYNC_QUEUE: 'sync_queue' // Background pending synchronization queue
});

/**
 * Store configurations and indexes for IndexedDB initialization.
 */
export const STORE_SCHEMAS = Object.freeze({
  [STORES.FACILITIES]: {
    keyPath: 'facilityId',
    autoIncrement: false,
    indexes: [
      { name: 'by_type', keyPath: 'type', unique: false },
      { name: 'by_district', keyPath: 'district', unique: false },
      { name: 'by_status', keyPath: 'status', unique: false }
    ]
  },
  [STORES.USERS]: {
    keyPath: 'userId',
    autoIncrement: false,
    indexes: [
      { name: 'by_facility', keyPath: 'facilityId', unique: false },
      { name: 'by_role', keyPath: 'role', unique: false },
      { name: 'by_username', keyPath: 'username', unique: true }
    ]
  },
  [STORES.TRUSTED_KEYS]: {
    keyPath: 'facilityId',
    autoIncrement: false,
    indexes: [
      { name: 'by_status', keyPath: 'status', unique: false },
      { name: 'by_updated', keyPath: 'updatedAt', unique: false }
    ]
  },
  [STORES.PATIENTS]: {
    keyPath: 'patientId',
    autoIncrement: false,
    indexes: [
      { name: 'by_name', keyPath: 'fullName', unique: false },
      { name: 'by_national_id', keyPath: 'nationalHealthId', unique: false },
      { name: 'by_created', keyPath: 'createdAt', unique: false }
    ]
  },
  [STORES.REFERRALS_OUTGOING]: {
    keyPath: 'referralId',
    autoIncrement: false,
    indexes: [
      { name: 'by_patient', keyPath: 'patientId', unique: false },
      { name: 'by_destination', keyPath: 'destinationFacilityId', unique: false },
      { name: 'by_priority', keyPath: 'priority', unique: false },
      { name: 'by_created', keyPath: 'createdAt', unique: false },
      { name: 'by_sync_status', keyPath: 'syncStatus', unique: false }
    ]
  },
  [STORES.REFERRALS_RECEIVED]: {
    keyPath: 'referralId',
    autoIncrement: false,
    indexes: [
      { name: 'by_origin', keyPath: 'originatingFacilityId', unique: false },
      { name: 'by_patient_name', keyPath: 'patientName', unique: false },
      { name: 'by_priority', keyPath: 'priority', unique: false },
      { name: 'by_received_at', keyPath: 'receivedAt', unique: false },
      { name: 'by_triage_status', keyPath: 'triageStatus', unique: false }
    ]
  },
  [STORES.AUDIT_LOGS]: {
    keyPath: 'logId',
    autoIncrement: true,
    indexes: [
      { name: 'by_timestamp', keyPath: 'timestamp', unique: false },
      { name: 'by_action', keyPath: 'action', unique: false },
      { name: 'by_user', keyPath: 'userId', unique: false },
      { name: 'by_facility', keyPath: 'facilityId', unique: false }
    ]
  },
  [STORES.LOCAL_CREDENTIALS]: {
    keyPath: 'keyId', // e.g. "facility_private_keys"
    autoIncrement: false
    // Stores salt, iterations, encryptedPrivateKeyJwk, IV, authTag
  },
  [STORES.APP_CONFIG]: {
    keyPath: 'key',
    autoIncrement: false
  },
  [STORES.SYNC_QUEUE]: {
    keyPath: 'syncId',
    autoIncrement: true,
    indexes: [
      { name: 'by_status', keyPath: 'status', unique: false },
      { name: 'by_type', keyPath: 'entityType', unique: false },
      { name: 'by_created', keyPath: 'createdAt', unique: false }
    ]
  }
});
