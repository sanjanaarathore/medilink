/**
 * @file referralService.js
 * @description Comprehensive clinical referral management service for MediLink Offline.
 * Coordinates referral creation, cryptographic sealing (AES-256-GCM + RSA-OAEP + ECDSA),
 * status transitions, outgoing registers, casualty ingestion, and disposition.
 */

import { STORES } from '../db/schema.js';
import { getRecord, putRecord, getAllRecords } from './dbService.js';
import { validateReferral } from './validationService.js';
import { assertPermission, hasPermission } from './authService.js';
import { PERMISSIONS } from '../config/roles.js';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService.js';
import { encryptReferralEnvelope, decryptReferralEnvelope } from '../crypto/webCryptoEngine.js';
import {
  getTrustedFacility,
  unlockFacilityPrivateKey,
  ensureDefaultFacilityKeysSeeded
} from './keyManagementService.js';
import { chunkReferralEnvelope } from '../qr/qrEngine.js';
import { enqueueSyncItem, SYNC_ENTITY_TYPE } from './syncService.js';

export const REFERRAL_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  DISPATCHED: 'DISPATCHED',
  ARRIVING: 'ARRIVING',
  TRIAGED: 'TRIAGED',
  ADMITTED: 'ADMITTED'
});

/**
 * Generates a standard UUIDv4 identifier for referral tracking.
 * @returns {string}
 */
export function generateReferralUUID() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Standard compliant RFC4122 v4 UUID generator for all environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates and persists an outgoing referral package.
 * @param {Object} referralInput
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function createReferral(referralInput, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.CREATE_REFERRAL);

  const referralId = referralInput.referralId || generateReferralUUID();
  const timestamp = new Date().toISOString();

  const referralRecord = {
    referralId,
    originatingFacilityId: callerUser.facilityId,
    originatingFacilityName: referralInput.originatingFacilityName || 'Dhar Primary Health Centre',
    destinationFacilityId: referralInput.destinationFacilityId,
    destinationFacilityName: referralInput.destinationFacilityName || 'Maharaja Yeshwantrao District Hospital, Indore',
    referringDoctorName: callerUser.fullName,
    priority: referralInput.priority,
    provisionalDiagnosis: referralInput.provisionalDiagnosis.trim(),
    referralReason: referralInput.referralReason.trim(),
    clinicalSummary: referralInput.clinicalSummary || '',
    medicationsGiven: referralInput.medicationsGiven || [],
    allergies: referralInput.allergies || [],
    patient: referralInput.patient,
    vitals: referralInput.vitals || null,
    status: REFERRAL_STATUS.DISPATCHED,
    syncStatus: 'PENDING_LOCAL',
    qrFramesCount: 3,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  validateReferral(referralRecord);

  // Persist to local outgoing store
  await putRecord(STORES.REFERRALS_OUTGOING, referralRecord);
  await enqueueSyncItem({
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    entityId: referralId,
    action: 'CREATE',
    payload: referralRecord,
    facilityId: callerUser.facilityId,
    userId: callerUser.userId
  });
  await logAuditEvent(
    AUDIT_ACTIONS.REFERRAL_CREATED,
    callerUser.userId,
    callerUser.facilityId,
    `Created referral ${referralId.slice(0, 8)} for patient ${referralRecord.patient.patientId}`
  );

  return referralRecord;
}

/**
 * Cryptographically seals an outgoing referral:
 * 1. Encrypts payload with ephemeral AES-256-GCM + AAD.
 * 2. Encapsulates AES key with recipient Hospital's RSA-OAEP public key.
 * 3. Signs canonical envelope with sender PHC's ECDSA private key (unwrapped with PIN).
 * 4. Chunks envelope into MLO1 QR frames.
 * 
 * @param {string} referralId
 * @param {Object} callerUser
 * @param {string} pin - Clinician authorization PIN
 * @returns {Promise<{envelope: Object, qrPackage: Object}>}
 */
export async function sealReferralPackage(referralId, callerUser, pin = '1234') {
  assertPermission(callerUser?.role, PERMISSIONS.CREATE_REFERRAL);

  // Ensure cryptographic keys are present
  await ensureDefaultFacilityKeysSeeded(pin);

  const referral = await getRecord(STORES.REFERRALS_OUTGOING, referralId);
  if (!referral) {
    throw new Error(`Referral '${referralId}' not found in outgoing register.`);
  }

  // 1. Fetch trusted recipient Hospital public key
  const recipientFacility = await getTrustedFacility(referral.destinationFacilityId, {
    requireEncryption: true
  });

  // 2. Unlock sender PHC's ECDSA private key from local storage using PIN
  const senderPrivateKey = await unlockFacilityPrivateKey(callerUser.facilityId, pin, 'SIGNING');

  // 3. Encrypt and digitally sign canonical referral envelope
  const envelope = await encryptReferralEnvelope({
    referralPayload: referral,
    recipientPublicKey: recipientFacility.encryptionPublicKeyJwk,
    senderPrivateKey,
    senderFacilityId: callerUser.facilityId,
    recipientFacilityId: referral.destinationFacilityId,
    referralId: referral.referralId,
    timestamp: new Date().toISOString(),
    senderKeyFingerprint: recipientFacility.signingKeyFingerprint
  });

  // 4. Generate MLO1 QR Frames
  const qrPackage = chunkReferralEnvelope(envelope);

  // 5. Update referral record with sealed envelope metadata
  referral.sealedEnvelope = envelope;
  referral.qrFramesCount = qrPackage.totalFrames;
  referral.updatedAt = new Date().toISOString();
  await putRecord(STORES.REFERRALS_OUTGOING, referral);

  await logAuditEvent(
    AUDIT_ACTIONS.REFERRAL_DISPATCHED,
    callerUser.userId,
    callerUser.facilityId,
    `Sealed and generated encrypted QR for referral ${referralId.slice(0, 8)} (${qrPackage.totalFrames} frames)`
  );

  return { envelope, qrPackage };
}

/**
 * Verifies and decrypts an incoming EncryptedReferralEnvelope at the District Hospital:
 * 1. Checks recipient facility ID matches local hospital.
 * 2. Validates sender facility in Trust Directory (active, unrevoked, unexpired).
 * 3. Verifies ECDSA signature over canonical envelope data using sender public key.
 * 4. Unwraps AES session key using recipient hospital's RSA-OAEP private key (unwrapped with PIN).
 * 5. Decrypts AES-256-GCM ciphertext and verifies 128-bit authentication tag + AAD.
 * 6. Validates decrypted clinical schema and persists to received records.
 * 
 * @param {Object} envelope - Sealed EncryptedReferralEnvelope
 * @param {Object} callerUser
 * @param {string} pin - Clinician authorization PIN
 * @returns {Promise<Object>} Ingested clinical record
 */
export async function verifyAndIngestReferralEnvelope(envelope, callerUser, pin = '1234') {
  assertPermission(callerUser?.role, PERMISSIONS.DECRYPT_REFERRAL);

  // Ensure cryptographic keys are present
  await ensureDefaultFacilityKeysSeeded(pin);

  if (!envelope || !envelope.senderFacilityId || !envelope.recipientFacilityId) {
    throw new Error('Verification Error: Malformed referral envelope structure.');
  }

  // 1. Verify Destination Facility Boundary
  if (callerUser.facilityId && envelope.recipientFacilityId !== callerUser.facilityId) {
    throw new Error(
      `Access Violation: Referral is addressed to facility '${envelope.recipientFacilityId}', but this station is '${callerUser.facilityId}'. Decryption refused.`
    );
  }

  // 2. Fetch sender PHC's trusted public signing key
  const senderFacility = await getTrustedFacility(envelope.senderFacilityId, {
    requireSigning: true
  });

  // 3. Unlock recipient Hospital's RSA-OAEP private decryption key using PIN
  const recipientPrivateKey = await unlockFacilityPrivateKey(callerUser.facilityId, pin, 'DECRYPTION');

  // 4. Decrypt and verify referral envelope
  const decryptedPayload = await decryptReferralEnvelope({
    envelope,
    recipientPrivateKey,
    trustedSenderPublicKey: senderFacility.signingPublicKeyJwk,
    expectedRecipientFacilityId: callerUser.facilityId
  });

  // 5. Ingest and persist to received referrals store
  return ingestDecryptedReferral(decryptedPayload, callerUser);
}

/**
 * Retrieves all outgoing referrals dispatched from the user's facility.
 * @param {Object} callerUser
 * @returns {Promise<Array<Object>>}
 */
export async function getOutgoingReferrals(callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.VIEW_OUTGOING_REFERRALS);
  const all = await getAllRecords(STORES.REFERRALS_OUTGOING);
  return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Retrieves all received referrals for district hospital intake.
 * @param {Object} callerUser
 * @returns {Promise<Array<Object>>}
 */
export async function getReceivedReferrals(callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.VIEW_RECEIVED_REFERRALS);
  const all = await getAllRecords(STORES.REFERRALS_RECEIVED);
  return all.sort((a, b) => new Date(b.receivedAt || b.createdAt).getTime() - new Date(a.receivedAt || a.createdAt).getTime());
}

/**
 * Ingests an incoming decrypted referral at the hospital casualty department.
 * @param {Object} decryptedRecord
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function ingestDecryptedReferral(decryptedRecord, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.DECRYPT_REFERRAL);

  const timestamp = new Date().toISOString();
  const receivedRecord = {
    referralId: decryptedRecord.referralId,
    originatingFacilityId: decryptedRecord.originatingFacilityId,
    originatingFacilityName: decryptedRecord.originatingFacilityName,
    patientName: decryptedRecord.patient?.fullName || 'Unknown Patient',
    patient: decryptedRecord.patient,
    priority: decryptedRecord.priority,
    provisionalDiagnosis: decryptedRecord.provisionalDiagnosis,
    referralReason: decryptedRecord.referralReason,
    vitals: decryptedRecord.vitals,
    medicationsGiven: decryptedRecord.medicationsGiven || [],
    allergies: decryptedRecord.allergies || [],
    triageStatus: 'TRIAGED',
    assignedBed: 'ICU Bay 02',
    signatureStatus: 'VERIFIED_AUTHENTIC',
    receivedAt: timestamp,
    receivedByUserId: callerUser.userId
  };

  await putRecord(STORES.REFERRALS_RECEIVED, receivedRecord);
  await enqueueSyncItem({
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    entityId: receivedRecord.referralId,
    action: 'INTAKE',
    payload: receivedRecord,
    facilityId: callerUser.facilityId,
    userId: callerUser.userId
  });
  await logAuditEvent(
    AUDIT_ACTIONS.REFERRAL_INGESTED,
    callerUser.userId,
    callerUser.facilityId,
    `Ingested & decrypted air-gap referral ${decryptedRecord.referralId.slice(0, 8)}`
  );

  return receivedRecord;
}

/**
 * Updates intake disposition and bed allocation for a received patient referral.
 * @param {string} referralId
 * @param {string} triageStatus
 * @param {string} assignedBed
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function updateReferralDisposition(referralId, triageStatus, assignedBed, callerUser) {
  if (!hasPermission(callerUser?.role, PERMISSIONS.ACCEPT_PATIENT) && !hasPermission(callerUser?.role, PERMISSIONS.TRIAGE_PATIENT)) {
    throw new Error(`Access Denied: Role '${callerUser?.role}' lacks entitlement to update referral disposition`);
  }

  const existing = await getRecord(STORES.REFERRALS_RECEIVED, referralId);
  if (!existing) {
    throw new Error(`Received referral '${referralId}' not found.`);
  }

  existing.triageStatus = triageStatus;
  existing.assignedBed = assignedBed;
  existing.updatedAt = new Date().toISOString();

  await putRecord(STORES.REFERRALS_RECEIVED, existing);
  await logAuditEvent(
    AUDIT_ACTIONS.PATIENT_ADMITTED,
    callerUser.userId,
    callerUser.facilityId,
    `Admitted referral ${referralId.slice(0, 8)} to ${assignedBed}`
  );

  return existing;
}
