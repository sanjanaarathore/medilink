/**
 * @file keyManagementService.js
 * @description Healthcare facility cryptographic identity and trust directory management service.
 * Manages asymmetric key generation, PIN-based PBKDF2 private key storage wrapping in IndexedDB,
 * trusted public key verification, air-gap trust bundle export/import, and key revocation.
 */

import { STORES } from '../db/schema.js';
import { getRecord, putRecord, getAllRecords } from './dbService.js';
import {
  generateEcdsaKeyPair,
  generateRsaKeyPair,
  exportKeyJwk,
  wrapPrivateKeyWithPin,
  unwrapPrivateKeyWithPin,
  computeSha256Fingerprint
} from '../crypto/webCryptoEngine.js';
import { KEY_USAGES } from '../crypto/cryptoConstants.js';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService.js';
import { assertPermission } from './authService.js';
import { PERMISSIONS } from '../config/roles.js';

export const KEY_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED'
});

/**
 * Provisions a complete cryptographic identity for a healthcare facility node.
 * Generates both ECDSA P-256 (signing) and RSA-OAEP 2048-bit (key encapsulation) pairs.
 * Private keys are wrapped using AES-256-GCM derived via PBKDF2 (100k iter) from the user PIN.
 * Public keys are registered in the local trusted_keys directory.
 * 
 * @param {string} facilityId
 * @param {string} facilityName
 * @param {string} facilityType
 * @param {string} pin - Clinician / Admin PIN
 * @returns {Promise<Object>} Public key directory entry
 */
export async function provisionFacilityKeypair(facilityId, facilityName, facilityType, pin) {
  if (!facilityId || !pin || pin.length < 4) {
    throw new Error('Facility provisioning requires a valid facilityId and at least a 4-digit PIN.');
  }

  // 1. Generate Keypairs
  const ecdsaPair = await generateEcdsaKeyPair();
  const rsaPair = await generateRsaKeyPair(2048);

  // 2. Export Keys to JWK
  const ecdsaPublicJwk = await exportKeyJwk(ecdsaPair.publicKey);
  const ecdsaPrivateJwk = await exportKeyJwk(ecdsaPair.privateKey);
  const rsaPublicJwk = await exportKeyJwk(rsaPair.publicKey);
  const rsaPrivateJwk = await exportKeyJwk(rsaPair.privateKey);

  // 3. Compute Fingerprints
  const ecdsaFingerprint = await computeSha256Fingerprint(JSON.stringify(ecdsaPublicJwk));
  const rsaFingerprint = await computeSha256Fingerprint(JSON.stringify(rsaPublicJwk));

  // 4. Wrap Private Keys with PIN (PBKDF2 + AES-GCM)
  const wrappedSigningKey = await wrapPrivateKeyWithPin(ecdsaPrivateJwk, pin);
  const wrappedDecryptionKey = await wrapPrivateKeyWithPin(rsaPrivateJwk, pin);

  // 5. Store Wrapped Credentials in IndexedDB (local_credentials)
  const localCredentialRecord = {
    keyId: facilityId,
    facilityId,
    wrappedSigningKey,
    wrappedDecryptionKey,
    updatedAt: new Date().toISOString()
  };
  await putRecord(STORES.LOCAL_CREDENTIALS, localCredentialRecord);

  // 6. Register Public Keys in trusted_keys directory
  const validFrom = new Date().toISOString();
  const validUntilDate = new Date();
  validUntilDate.setFullYear(validUntilDate.getFullYear() + 2); // 2-year validity

  const trustRecord = {
    facilityId,
    facilityName,
    facilityType,
    signingAlgorithm: 'ECDSA P-256 (SHA-256)',
    encryptionAlgorithm: 'RSA-OAEP (2048-bit, SHA-256)',
    signingPublicKeyJwk: ecdsaPublicJwk,
    encryptionPublicKeyJwk: rsaPublicJwk,
    fingerprint: rsaFingerprint, // Primary facility fingerprint
    signingKeyFingerprint: ecdsaFingerprint,
    encryptionKeyFingerprint: rsaFingerprint,
    validFrom,
    validUntil: validUntilDate.toISOString(),
    status: KEY_STATUS.ACTIVE,
    updatedAt: validFrom
  };

  await putRecord(STORES.TRUSTED_KEYS, trustRecord);
  return trustRecord;
}

/**
 * Unwraps and returns an active in-memory CryptoKey for the specified facility and purpose.
 * 
 * @param {string} facilityId
 * @param {string} pin - Clinician authorization PIN
 * @param {'SIGNING' | 'DECRYPTION'} keyRole
 * @returns {Promise<CryptoKey>} Unwrapped CryptoKey in memory
 */
export async function unlockFacilityPrivateKey(facilityId, pin, keyRole) {
  const credentialRecord = await getRecord(STORES.LOCAL_CREDENTIALS, facilityId);
  if (!credentialRecord) {
    throw new Error(
      `Local Credentials Error: No cryptographic identity found locally for facility '${facilityId}'. Please provision facility keys first.`
    );
  }

  if (keyRole === 'SIGNING') {
    if (!credentialRecord.wrappedSigningKey) {
      throw new Error(`Facility '${facilityId}' lacks a signing key.`);
    }
    return unwrapPrivateKeyWithPin(
      credentialRecord.wrappedSigningKey,
      pin,
      'ECDSA',
      KEY_USAGES.ECDSA_SIGN
    );
  }

  if (keyRole === 'DECRYPTION') {
    if (!credentialRecord.wrappedDecryptionKey) {
      throw new Error(`Facility '${facilityId}' lacks a decryption key.`);
    }
    return unwrapPrivateKeyWithPin(
      credentialRecord.wrappedDecryptionKey,
      pin,
      'RSA-OAEP',
      KEY_USAGES.RSA_ENVELOPE_DECRYPT
    );
  }

  throw new Error(`Unsupported key role: ${keyRole}. Expected 'SIGNING' or 'DECRYPTION'.`);
}

/**
 * Retrieves a facility's public key from the Trusted Facility Directory.
 * Enforces status checks (ACTIVE vs REVOKED vs EXPIRED).
 * 
 * @param {string} facilityId
 * @param {Object} [options]
 * @param {boolean} [options.requireSigning=false]
 * @param {boolean} [options.requireEncryption=false]
 * @returns {Promise<Object>} Trust directory record
 */
export async function getTrustedFacility(facilityId, options = {}) {
  const record = await getRecord(STORES.TRUSTED_KEYS, facilityId);
  if (!record) {
    throw new Error(
      `Trust Exception: Facility '${facilityId}' is NOT registered in the local Trusted Facility Directory.`
    );
  }

  if (record.status === KEY_STATUS.REVOKED) {
    throw new Error(
      `Security Exception: Public key for facility '${facilityId}' has been REVOKED! Reason: ${record.revokedReason || 'Administrative revocation'}.`
    );
  }

  if (record.validUntil && new Date(record.validUntil).getTime() < Date.now()) {
    throw new Error(
      `Security Exception: Public key for facility '${facilityId}' EXPIRED on ${record.validUntil}.`
    );
  }

  if (options.requireSigning && !record.signingPublicKeyJwk) {
    throw new Error(`Trusted facility '${facilityId}' does not have a registered signing public key.`);
  }

  if (options.requireEncryption && !record.encryptionPublicKeyJwk) {
    throw new Error(`Trusted facility '${facilityId}' does not have a registered encryption public key.`);
  }

  return record;
}

/**
 * Revokes a facility's public key in the trust directory.
 * @param {string} facilityId
 * @param {string} reason
 * @param {Object} adminUser
 * @returns {Promise<Object>}
 */
export async function revokeFacilityKey(facilityId, reason, adminUser) {
  assertPermission(adminUser?.role, PERMISSIONS.MANAGE_KEYS);

  const record = await getRecord(STORES.TRUSTED_KEYS, facilityId);
  if (!record) {
    throw new Error(`Facility '${facilityId}' not found in Trusted Directory.`);
  }

  const updatedRecord = {
    ...record,
    status: KEY_STATUS.REVOKED,
    revokedReason: reason || 'Administrative key revocation',
    revokedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await putRecord(STORES.TRUSTED_KEYS, updatedRecord);
  await logAuditEvent(
    AUDIT_ACTIONS.KEY_REVOKED,
    adminUser.userId,
    adminUser.facilityId,
    `Revoked trusted key for facility ${facilityId}: ${reason}`
  );

  return updatedRecord;
}

/**
 * Retrieves all registered trusted facility keys.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllTrustedKeys() {
  return getAllRecords(STORES.TRUSTED_KEYS);
}

/**
 * Seeds default cryptographic keys for initial demo/testing facilities if unseeded.
 * Ensures PHC-DHAR-04 and DH-INDORE-01 have valid, verified cryptographic keys.
 * Default PIN used for seed demo is '1234'.
 * 
 * @param {string} [defaultPin='1234']
 * @returns {Promise<void>}
 */
export async function ensureDefaultFacilityKeysSeeded(defaultPin = '1234') {
  const existingKeys = await getAllRecords(STORES.TRUSTED_KEYS);
  if (existingKeys.length > 0) return;

  // Provision Dhar PHC
  await provisionFacilityKeypair(
    'PHC-DHAR-04',
    'Dhar Primary Health Centre',
    'PRIMARY_HEALTH_CENTRE',
    defaultPin
  );

  // Provision Nalchha Sub-Centre
  await provisionFacilityKeypair(
    'PHC-NALCHHA-02',
    'Nalchha Health Sub-Centre',
    'PRIMARY_HEALTH_CENTRE',
    defaultPin
  );

  // Provision Indore District Hospital
  await provisionFacilityKeypair(
    'DH-INDORE-01',
    'Maharaja Yeshwantrao District Hospital, Indore',
    'DISTRICT_HOSPITAL',
    defaultPin
  );
}

/**
 * Exports trusted facility public keys as a JSON air-gap bundle (.mldir).
 * @returns {Promise<Object>}
 */
export async function exportTrustDirectoryBundle() {
  const facilities = await getAllRecords(STORES.FACILITIES);
  const keys = await getAllRecords(STORES.TRUSTED_KEYS);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    district: 'Indore-Dhar Healthcare Network',
    facilities,
    trustedKeys: keys
  };
}

/**
 * Imports a trust directory bundle (.mldir) received via air-gap.
 * @param {Object} bundle
 * @param {Object} adminUser
 * @returns {Promise<{imported: number}>}
 */
export async function importTrustDirectoryBundle(bundle, adminUser) {
  assertPermission(adminUser?.role, PERMISSIONS.MANAGE_KEYS);

  if (!bundle || !bundle.trustedKeys || !Array.isArray(bundle.trustedKeys)) {
    throw new Error('Invalid Trust Directory Bundle format.');
  }

  let count = 0;
  for (const keyRecord of bundle.trustedKeys) {
    if (keyRecord.facilityId && keyRecord.signingPublicKeyJwk) {
      await putRecord(STORES.TRUSTED_KEYS, {
        ...keyRecord,
        updatedAt: new Date().toISOString()
      });
      count++;
    }
  }

  await logAuditEvent(
    AUDIT_ACTIONS.SECURITY_SETTINGS_UPDATED,
    adminUser.userId,
    adminUser.facilityId,
    `Imported ${count} trusted facility keys from air-gap trust bundle`
  );

  return { imported: count };
}
