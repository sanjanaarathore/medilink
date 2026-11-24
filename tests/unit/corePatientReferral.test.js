/**
 * @file corePatientReferral.test.js
 * @description Comprehensive automated test suite for Phase 3:
 * - Authentication & RBAC boundaries
 * - Patient registration, validation, and editing
 * - Clinical vitals & medical record management
 * - Referral creation, status tracking, and casualty intake
 * - IndexedDB persistence and audit trails
 */

import { login, hasPermission, assertPermission } from '../../src/services/authService.js';
import { ROLES, PERMISSIONS } from '../../src/config/roles.js';
import {
  registerPatient,
  updatePatient,
  recordPatientVitals,
  getPatientById,
  getAllPatients,
  searchPatients,
  generatePatientId
} from '../../src/services/patientService.js';
import {
  createReferral,
  getOutgoingReferrals,
  getReceivedReferrals,
  ingestDecryptedReferral,
  updateReferralDisposition
} from '../../src/services/referralService.js';
import { registerFacility, getAllFacilities } from '../../src/services/facilityService.js';
import { provisionUser, getAllUsers } from '../../src/services/userService.js';
import { getAuditLogs } from '../../src/services/auditService.js';
import { ValidationError } from '../../src/services/validationService.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runPhase3Tests() {
  console.log('====================================================');
  console.log('   MediLink Offline Phase 3 Comprehensive Test Suite');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: AUTHENTICATION & RBAC BOUNDARIES
  // ----------------------------------------------------
  console.log('--- Suite 1: Authentication & RBAC Boundaries ---');

  // Test 1.1: Valid login with default seeded PIN
  const authRes = await login('dr.rajesh', '1234');
  assert(authRes.success === true && authRes.user.role === ROLES.PHC_DOCTOR, 'PHC Doctor login with PIN 1234');

  // Test 1.2: Invalid PIN rejection
  const badAuth = await login('dr.rajesh', '0000');
  assert(badAuth.success === false && badAuth.error.includes('Invalid'), 'Rejection of invalid PIN 0000');

  // Test 1.3: Non-existent user rejection
  const noUser = await login('fake.doctor', '1234');
  assert(noUser.success === false, 'Rejection of unknown username');

  // Test 1.4: RBAC boundary: Doctor has patient access
  const doctorCanViewPatient = hasPermission(ROLES.PHC_DOCTOR, PERMISSIONS.VIEW_PATIENT);
  assert(doctorCanViewPatient === true, 'PHC Doctor has VIEW_PATIENT permission');

  // Test 1.5: Security rule: Admin does NOT have clinical access
  const adminCanViewPatient = hasPermission(ROLES.ADMIN, PERMISSIONS.VIEW_PATIENT);
  assert(adminCanViewPatient === false, 'Strict RBAC: Admin does NOT hold VIEW_PATIENT permission');

  const adminCanCreateReferral = hasPermission(ROLES.ADMIN, PERMISSIONS.CREATE_REFERRAL);
  assert(adminCanCreateReferral === false, 'Strict RBAC: Admin does NOT hold CREATE_REFERRAL permission');

  // ----------------------------------------------------
  // SUITE 2: PATIENT MANAGEMENT & VALIDATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Patient Registration & Schema Validation ---');

  const doctorUser = authRes.user;

  // Test 2.1: Register valid patient
  const uniqueAbha = `91-0000-${Date.now().toString().slice(-4)}-9999`;
  const patientData = {
    fullName: 'Sunil Verma',
    age: 42,
    gender: 'MALE',
    dateOfBirth: '1984-05-10',
    contactPhone: '+91-98765-12345',
    addressVillage: 'Village Nalchha',
    district: 'Dhar',
    guardianName: 'Kavita Verma',
    nationalHealthId: uniqueAbha
  };

  const registered = await registerPatient(patientData, doctorUser);
  assert(registered.patientId.startsWith('PAT-'), 'Auto-generated ID starts with PAT-');
  assert(registered.fullName === 'Sunil Verma', 'Patient full name preserved');

  // Test 2.2: Rejection of duplicate ABHA ID
  let duplicateCaught = false;
  try {
    await registerPatient({ ...patientData, fullName: 'Duplicate Sunil' }, doctorUser);
  } catch (err) {
    duplicateCaught = true;
  }
  assert(duplicateCaught === true, 'Duplicate National Health ID (ABHA) prevented');

  // Test 2.3: Schema validation: Invalid age rejection
  let invalidAgeCaught = false;
  try {
    await registerPatient({ ...patientData, nationalHealthId: '', age: 999 }, doctorUser);
  } catch (err) {
    if (err instanceof ValidationError) invalidAgeCaught = true;
  }
  assert(invalidAgeCaught === true, 'Rejection of invalid age (999)');

  // Test 2.4: Edit patient demographics
  const updated = await updatePatient(registered.patientId, { contactPhone: '+91-91111-22222' }, doctorUser);
  assert(updated.contactPhone === '+91-91111-22222', 'Patient demographic update persisted');

  // Test 2.5: Search patients
  const searchResults = await searchPatients('Sunil', doctorUser);
  assert(searchResults.some((p) => p.patientId === registered.patientId), 'Patient found via search query');

  // ----------------------------------------------------
  // SUITE 3: MEDICAL RECORDS & CLINICAL VITALS
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Medical Record & Clinical Vitals ---');

  // Test 3.1: Record valid vitals
  const vitalsInput = {
    systolicBP: '120',
    diastolicBP: '80',
    heartRate: '78',
    respiratoryRate: '16',
    temperatureCelsius: '37.0',
    oxygenSaturationSpO2: '98',
    randomBloodSugar: '110'
  };

  const patientWithVitals = await recordPatientVitals(registered.patientId, vitalsInput, doctorUser);
  assert(patientWithVitals.latestVitals.systolicBP === 120, 'Systolic BP recorded as number 120');
  assert(patientWithVitals.latestVitals.oxygenSaturationSpO2 === 98, 'SpO2 recorded as number 98');

  // Test 3.2: Rejection of physiologically impossible vitals (SpO2 > 100)
  let impossibleVitalsCaught = false;
  try {
    await recordPatientVitals(registered.patientId, { ...vitalsInput, oxygenSaturationSpO2: '150' }, doctorUser);
  } catch (err) {
    if (err instanceof ValidationError) impossibleVitalsCaught = true;
  }
  assert(impossibleVitalsCaught === true, 'Rejection of out-of-range SpO2 (150%)');

  // ----------------------------------------------------
  // SUITE 4: REFERRAL CREATION & HOSPITAL INTAKE
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Clinical Referral Management ---');

  // Test 4.1: Create emergency referral
  const referralInput = {
    destinationFacilityId: 'DH-INDORE-01',
    destinationFacilityName: 'Maharaja Yeshwantrao District Hospital, Indore',
    priority: 'EMERGENCY_CRITICAL',
    provisionalDiagnosis: 'Acute Severe Asthma with Hypoxemic Respiratory Distress',
    referralReason: 'Severe wheezing and bronchospasm unresponsive to initial nebulization. Requires ICU observation.',
    medicationsGiven: [
      { name: 'Nebulized Salbutamol', dose: '5mg stat', time: '10:00 AM' },
      { name: 'IV Hydrocortisone', dose: '100mg stat', time: '10:15 AM' }
    ],
    allergies: ['Penicillin'],
    patient: registered,
    vitals: patientWithVitals.latestVitals
  };

  const createdReferral = await createReferral(referralInput, doctorUser);
  assert(createdReferral.referralId.length === 36, 'Referral created with standard 36-char UUIDv4');
  assert(createdReferral.priority === 'EMERGENCY_CRITICAL', 'Priority emergency critical preserved');

  // Test 4.2: Retrieve outgoing referral list
  const outgoingList = await getOutgoingReferrals(doctorUser);
  assert(outgoingList.some((r) => r.referralId === createdReferral.referralId), 'Referral found in outgoing register');

  // Test 4.3: Hospital intake: ingest decrypted referral
  const hospitalAuth = await login('triage.anita', '1234');
  const hospitalUser = hospitalAuth.user;

  const ingested = await ingestDecryptedReferral(createdReferral, hospitalUser);
  assert(ingested.referralId === createdReferral.referralId, 'Referral ingested with matching UUID');
  assert(ingested.signatureStatus === 'VERIFIED_AUTHENTIC', 'Ingested record marked verified authentic');

  // Test 4.4: Casualty triage bed allocation
  const admitted = await updateReferralDisposition(createdReferral.referralId, 'ADMITTED_ICU', 'ICU Bed 05', hospitalUser);
  assert(admitted.triageStatus === 'ADMITTED_ICU', 'Disposition updated to ADMITTED_ICU');
  assert(admitted.assignedBed === 'ICU Bed 05', 'Assigned bed updated to ICU Bed 05');

  // ----------------------------------------------------
  // SUITE 5: ADMINISTRATIVE ENTITIES & AUDIT TRAIL
  // ----------------------------------------------------
  console.log('\n--- Suite 5: Administrative Facilities, Users & Audit Trail ---');

  const adminAuth = await login('admin.patel', '1234');
  const adminUser = adminAuth.user;

  // Test 5.1: Register new healthcare facility
  const newFacilityData = {
    facilityId: `PHC-TEST-${Date.now().toString().slice(-4)}`,
    name: 'Test Rural Health Subcentre',
    type: 'PRIMARY_HEALTH_CENTRE',
    district: 'Dhar',
    state: 'Madhya Pradesh',
    contactNumber: '+91-7292-888888'
  };
  const regFacility = await registerFacility(newFacilityData, adminUser);
  assert(regFacility.status === 'ACTIVE', 'New facility node registered as ACTIVE');

  // Test 5.2: Provision user with salted hash
  const newStaff = await provisionUser({
    username: `nurse.test${Date.now().toString().slice(-4)}`,
    fullName: 'Staff Nurse Sunita',
    role: ROLES.PHC_STAFF,
    facilityId: regFacility.facilityId,
    pin: '5678'
  }, adminUser);
  assert(newStaff.role === ROLES.PHC_STAFF, 'Staff user provisioned with role PHC_STAFF');
  assert(!newStaff.pin && !newStaff.pinHash, 'User API response does NOT leak plaintext PIN or hash');

  // Test 5.3: Verify audit logs trail
  const logs = await getAuditLogs();
  assert(logs.length > 5, 'Comprehensive audit entries generated across all operations');
  assert(logs.some((l) => l.action === 'PATIENT_REGISTERED'), 'Audit log contains PATIENT_REGISTERED action');
  assert(logs.some((l) => l.action === 'REFERRAL_CREATED'), 'Audit log contains REFERRAL_CREATED action');
  assert(logs.some((l) => l.action === 'PATIENT_ADMITTED'), 'Audit log contains PATIENT_ADMITTED action');

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests}/${totalTests} PHASE 3 TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runPhase3Tests().catch((err) => {
  console.error('\nTest Suite Execution Aborted:', err);
  process.exit(1);
});

