/**
 * @file facilityService.js
 * @description Healthcare facility registry and public key trust directory management.
 */

import { STORES } from '../db/schema.js';
import { getRecord, putRecord, getAllRecords } from './dbService.js';
import { validateFacility } from './validationService.js';
import { assertPermission } from './authService.js';
import { PERMISSIONS } from '../config/roles.js';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService.js';

/**
 * Retrieves all registered facilities.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllFacilities() {
  return getAllRecords(STORES.FACILITIES);
}

/**
 * Retrieves a single facility by code.
 * @param {string} facilityId
 * @returns {Promise<Object | null>}
 */
export async function getFacilityById(facilityId) {
  return getRecord(STORES.FACILITIES, facilityId);
}

/**
 * Registers a new healthcare facility node.
 * @param {Object} facilityData
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function registerFacility(facilityData, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.MANAGE_FACILITIES);
  validateFacility(facilityData);

  const existing = await getRecord(STORES.FACILITIES, facilityData.facilityId);
  if (existing) {
    throw new Error(`Facility with code '${facilityData.facilityId}' is already registered.`);
  }

  const timestamp = new Date().toISOString();
  const facility = {
    ...facilityData,
    facilityId: facilityData.facilityId.toUpperCase(),
    status: 'ACTIVE',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await putRecord(STORES.FACILITIES, facility);
  await logAuditEvent(
    AUDIT_ACTIONS.FACILITY_REGISTERED,
    callerUser.userId,
    callerUser.facilityId,
    `Registered facility node ${facility.facilityId} (${facility.name})`
  );

  return facility;
}

/**
 * Updates a facility record.
 * @param {string} facilityId
 * @param {Object} updates
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function updateFacility(facilityId, updates, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.MANAGE_FACILITIES);

  const existing = await getRecord(STORES.FACILITIES, facilityId);
  if (!existing) {
    throw new Error(`Facility '${facilityId}' not found.`);
  }

  const merged = {
    ...existing,
    ...updates,
    facilityId: existing.facilityId,
    updatedAt: new Date().toISOString()
  };

  validateFacility(merged);
  await putRecord(STORES.FACILITIES, merged);
  return merged;
}

/**
 * Exports trusted facility public keys as a JSON air-gap bundle (.mldir).
 * @returns {Promise<Object>}
 */
export async function exportTrustBundle() {
  const facilities = await getAllRecords(STORES.FACILITIES);
  const keys = await getAllRecords(STORES.TRUSTED_KEYS);

  return {
    version: '1.0',
    exportTimestamp: new Date().toISOString(),
    region: 'Indore-Dhar Healthcare Region',
    certifiedFacilitiesCount: facilities.length,
    facilities,
    trustedKeys: keys
  };
}

/**
 * Imports an administrative trust bundle.
 * @param {Object} bundleData
 * @param {Object} callerUser
 * @returns {Promise<number>} Count of certified keys imported
 */
export async function importTrustBundle(bundleData, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.MANAGE_KEYS);

  if (!bundleData || !bundleData.facilities) {
    throw new Error('Invalid trust package format. Missing facilities array.');
  }

  let count = 0;
  for (const fac of bundleData.facilities) {
    await putRecord(STORES.FACILITIES, fac);
    count++;
  }

  await logAuditEvent(
    AUDIT_ACTIONS.KEYS_IMPORTED,
    callerUser.userId,
    callerUser.facilityId,
    `Imported ${count} certified facility trust entries from air-gap package`
  );

  return count;
}

