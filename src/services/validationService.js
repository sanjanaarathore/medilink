/**
 * @file validationService.js
 * @description Comprehensive validation rules for patients, medical records, referrals, and administrative entities.
 */

import { REFERRAL_PRIORITY, FACILITY_TYPE } from '../types/schemas.js';
import { ROLES } from '../config/roles.js';

export class ValidationError extends Error {
  constructor(message, fieldErrors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Validates a patient registration or update payload.
 * @param {Object} patient
 * @throws {ValidationError}
 */
export function validatePatient(patient) {
  const errors = {};

  if (!patient.fullName || typeof patient.fullName !== 'string' || patient.fullName.trim().length < 2) {
    errors.fullName = 'Full legal name is required (minimum 2 characters).';
  }

  const age = Number(patient.age);
  if (isNaN(age) || age < 0 || age > 130) {
    errors.age = 'A valid age between 0 and 130 is required.';
  }

  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (!patient.gender || !validGenders.includes(patient.gender.toUpperCase())) {
    errors.gender = 'Gender must be MALE, FEMALE, or OTHER.';
  }

  if (!patient.addressVillage || patient.addressVillage.trim().length < 2) {
    errors.addressVillage = 'Village/locality address is required.';
  }

  if (patient.contactPhone && !/^\+?[0-9\s-]{8,15}$/.test(patient.contactPhone.trim())) {
    errors.contactPhone = 'Contact phone number contains invalid characters.';
  }

  if (patient.nationalHealthId && !/^[0-9\s-]{10,20}$/.test(patient.nationalHealthId.trim())) {
    errors.nationalHealthId = 'ABHA ID must be in valid numeric format.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Patient validation failed', errors);
  }

  return true;
}

/**
 * Validates clinical vital sign inputs.
 * @param {Object} vitals
 * @throws {ValidationError}
 */
export function validateVitals(vitals) {
  const errors = {};

  if (vitals.systolicBP !== undefined && vitals.systolicBP !== '') {
    const s = Number(vitals.systolicBP);
    if (isNaN(s) || s < 40 || s > 300) {
      errors.systolicBP = 'Systolic BP must be between 40 and 300 mmHg.';
    }
  }

  if (vitals.diastolicBP !== undefined && vitals.diastolicBP !== '') {
    const d = Number(vitals.diastolicBP);
    if (isNaN(d) || d < 20 || d > 200) {
      errors.diastolicBP = 'Diastolic BP must be between 20 and 200 mmHg.';
    }
  }

  if (vitals.oxygenSaturationSpO2 !== undefined && vitals.oxygenSaturationSpO2 !== '') {
    const spo2 = Number(vitals.oxygenSaturationSpO2);
    if (isNaN(spo2) || spo2 < 40 || spo2 > 100) {
      errors.oxygenSaturationSpO2 = 'SpO2 must be between 40% and 100%.';
    }
  }

  if (vitals.heartRate !== undefined && vitals.heartRate !== '') {
    const hr = Number(vitals.heartRate);
    if (isNaN(hr) || hr < 20 || hr > 300) {
      errors.heartRate = 'Heart rate must be between 20 and 300 bpm.';
    }
  }

  if (vitals.temperatureCelsius !== undefined && vitals.temperatureCelsius !== '') {
    const temp = Number(vitals.temperatureCelsius);
    if (isNaN(temp) || temp < 30 || temp > 45) {
      errors.temperatureCelsius = 'Temperature must be between 30°C and 45°C.';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Clinical vitals validation failed', errors);
  }

  return true;
}

/**
 * Validates a clinical referral creation payload.
 * @param {Object} referral
 * @throws {ValidationError}
 */
export function validateReferral(referral) {
  const errors = {};

  if (!referral.referralId) {
    errors.referralId = 'Referral identifier UUID is required.';
  }

  if (!referral.destinationFacilityId) {
    errors.destinationFacilityId = 'Destination healthcare facility must be selected.';
  }

  if (referral.destinationFacilityId === referral.originatingFacilityId) {
    errors.destinationFacilityId = 'Destination facility cannot be the same as originating facility.';
  }

  const validPriorities = Object.values(REFERRAL_PRIORITY);
  if (!referral.priority || !validPriorities.includes(referral.priority)) {
    errors.priority = 'A valid triage priority level is required.';
  }

  if (!referral.provisionalDiagnosis || referral.provisionalDiagnosis.trim().length < 3) {
    errors.provisionalDiagnosis = 'Provisional clinical diagnosis is required (minimum 3 characters).';
  }

  if (!referral.referralReason || referral.referralReason.trim().length < 5) {
    errors.referralReason = 'Detailed reason for referral is required (minimum 5 characters).';
  }

  if (!referral.patient || !referral.patient.patientId) {
    errors.patient = 'Referral must be linked to a valid enrolled patient.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Referral validation failed', errors);
  }

  return true;
}

/**
 * Validates a healthcare facility entry.
 * @param {Object} facility
 * @throws {ValidationError}
 */
export function validateFacility(facility) {
  const errors = {};

  if (!facility.facilityId || !/^[A-Z0-9_-]{4,20}$/.test(facility.facilityId)) {
    errors.facilityId = 'Facility code must be uppercase alphanumeric (4-20 characters).';
  }

  if (!facility.name || facility.name.trim().length < 3) {
    errors.name = 'Official facility name is required.';
  }

  if (!facility.type || !Object.values(FACILITY_TYPE).includes(facility.type)) {
    errors.type = 'Valid facility type tier is required.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Facility validation failed', errors);
  }

  return true;
}

/**
 * Validates a user provisioning entry.
 * @param {Object} user
 * @throws {ValidationError}
 */
export function validateUser(user) {
  const errors = {};

  if (!user.username || !/^[a-z0-9._-]{3,24}$/.test(user.username.trim())) {
    errors.username = 'Username must be lowercase alphanumeric with dots/dashes (3-24 characters).';
  }

  if (!user.fullName || user.fullName.trim().length < 3) {
    errors.fullName = 'Full clinical name is required.';
  }

  if (!user.role || !Object.values(ROLES).includes(user.role)) {
    errors.role = 'A certified system role is required.';
  }

  if (!user.facilityId) {
    errors.facilityId = 'User must be assigned to an active facility node.';
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('User validation failed', errors);
  }

  return true;
}

