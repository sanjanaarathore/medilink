/**
 * @file patientService.js
 * @description Comprehensive patient and medical record management service for MediLink Offline.
 * Enforces schema validation, RBAC boundaries, and transactional local persistence.
 */

import { STORES } from '../db/schema.js';
import { getRecord, putRecord, getAllRecords } from './dbService.js';
import { validatePatient, validateVitals } from './validationService.js';
import { assertPermission } from './authService.js';
import { PERMISSIONS } from '../config/roles.js';
import { logAuditEvent, AUDIT_ACTIONS } from './auditService.js';
import { enqueueSyncItem, SYNC_ENTITY_TYPE } from './syncService.js';

/**
 * Generates a unique, standardized patient identifier.
 * Format: PAT-YYYY-XXXXX (e.g. PAT-2026-48192)
 * @returns {string}
 */
export function generatePatientId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `PAT-${year}-${randomSuffix}`;
}

/**
 * Registers a new patient record in local IndexedDB.
 * @param {Object} patientData - Patient demographics & clinical baseline
 * @param {Object} callerUser - Current authenticated session user
 * @returns {Promise<Object>} The persisted patient record
 */
export async function registerPatient(patientData, callerUser) {
  // Enforce clinical RBAC permission
  assertPermission(callerUser?.role, PERMISSIONS.REGISTER_PATIENT);

  // Validate patient schema
  validatePatient(patientData);

  // Verify National Health ID (ABHA) uniqueness if provided
  if (patientData.nationalHealthId) {
    const existing = await getAllRecords(STORES.PATIENTS);
    const duplicate = existing.find(
      (p) => p.nationalHealthId && p.nationalHealthId.trim() === patientData.nationalHealthId.trim()
    );
    if (duplicate) {
      throw new Error(`A patient record with ABHA ID '${patientData.nationalHealthId}' is already registered (${duplicate.patientId}).`);
    }
  }

  const patientId = patientData.patientId || generatePatientId();
  const timestamp = new Date().toISOString();

  const completeRecord = {
    patientId,
    nationalHealthId: patientData.nationalHealthId || '',
    fullName: patientData.fullName.trim(),
    gender: patientData.gender.toUpperCase(),
    dateOfBirth: patientData.dateOfBirth || '',
    age: Number(patientData.age),
    contactPhone: patientData.contactPhone || '',
    addressVillage: patientData.addressVillage.trim(),
    district: patientData.district || 'Dhar',
    guardianName: patientData.guardianName || '',
    guardianPhone: patientData.guardianPhone || '',
    medicalHistory: {
      chronicConditions: patientData.chronicConditions || [],
      pastSurgeries: patientData.pastSurgeries || [],
      allergies: patientData.allergies || [],
      familyHistory: patientData.familyHistory || ''
    },
    latestVitals: patientData.latestVitals || null,
    registeredByUserId: callerUser.userId,
    facilityId: callerUser.facilityId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  await putRecord(STORES.PATIENTS, completeRecord);
  await enqueueSyncItem({
    entityType: SYNC_ENTITY_TYPE.PATIENT,
    entityId: patientId,
    action: 'REGISTER',
    payload: completeRecord,
    facilityId: callerUser.facilityId,
    userId: callerUser.userId
  });
  await logAuditEvent(AUDIT_ACTIONS.PATIENT_REGISTERED, callerUser.userId, callerUser.facilityId, `Enrolled patient ${patientId}`);

  return completeRecord;
}

/**
 * Updates an existing patient record.
 * @param {string} patientId
 * @param {Object} updates
 * @param {Object} callerUser
 * @returns {Promise<Object>} Updated patient record
 */
export async function updatePatient(patientId, updates, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.EDIT_PATIENT);

  const existing = await getRecord(STORES.PATIENTS, patientId);
  if (!existing) {
    throw new Error(`Patient record '${patientId}' not found.`);
  }

  const merged = {
    ...existing,
    ...updates,
    patientId: existing.patientId, // Prevent ID mutability
    updatedAt: new Date().toISOString()
  };

  validatePatient(merged);
  await putRecord(STORES.PATIENTS, merged);
  await logAuditEvent(AUDIT_ACTIONS.PATIENT_UPDATED, callerUser.userId, callerUser.facilityId, `Updated demographics for ${patientId}`);

  return merged;
}

/**
 * Records vital signs for a patient.
 * @param {string} patientId
 * @param {Object} vitalsData
 * @param {Object} callerUser
 * @returns {Promise<Object>}
 */
export async function recordPatientVitals(patientId, vitalsData, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.EDIT_PATIENT);
  validateVitals(vitalsData);

  const existing = await getRecord(STORES.PATIENTS, patientId);
  if (!existing) {
    throw new Error(`Patient record '${patientId}' not found.`);
  }

  const vitalsRecord = {
    ...vitalsData,
    systolicBP: Number(vitalsData.systolicBP),
    diastolicBP: Number(vitalsData.diastolicBP),
    heartRate: Number(vitalsData.heartRate),
    respiratoryRate: Number(vitalsData.respiratoryRate),
    temperatureCelsius: Number(vitalsData.temperatureCelsius),
    oxygenSaturationSpO2: Number(vitalsData.oxygenSaturationSpO2),
    recordedAt: new Date().toISOString(),
    recordedByUserId: callerUser.userId
  };

  existing.latestVitals = vitalsRecord;
  existing.updatedAt = new Date().toISOString();

  await putRecord(STORES.PATIENTS, existing);
  await logAuditEvent(AUDIT_ACTIONS.VITALS_RECORDED, callerUser.userId, callerUser.facilityId, `Recorded clinical vitals for ${patientId}`);

  return existing;
}

/**
 * Retrieves a single patient by ID.
 * @param {string} patientId
 * @param {Object} callerUser
 * @returns {Promise<Object | null>}
 */
export async function getPatientById(patientId, callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.VIEW_PATIENT);
  return getRecord(STORES.PATIENTS, patientId);
}

/**
 * Retrieves all patient records.
 * @param {Object} callerUser
 * @returns {Promise<Array<Object>>}
 */
export async function getAllPatients(callerUser) {
  assertPermission(callerUser?.role, PERMISSIONS.VIEW_PATIENT);
  return getAllRecords(STORES.PATIENTS);
}

/**
 * Searches and filters patient records across name, ID, village, and ABHA ID.
 * @param {string} query
 * @param {Object} callerUser
 * @returns {Promise<Array<Object>>}
 */
export async function searchPatients(query, callerUser) {
  const all = await getAllPatients(callerUser);
  if (!query || !query.trim()) return all;

  const q = query.trim().toLowerCase();
  return all.filter((p) =>
    (p.fullName && p.fullName.toLowerCase().includes(q)) ||
    (p.patientId && p.patientId.toLowerCase().includes(q)) ||
    (p.addressVillage && p.addressVillage.toLowerCase().includes(q)) ||
    (p.nationalHealthId && p.nationalHealthId.toLowerCase().includes(q))
  );
}

