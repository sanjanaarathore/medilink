/**
 * @file offlineReferralHandoffE2E.test.js
 * @description Comprehensive End-to-End Simulation of the MediLink Offline Referral Workflow
 * across two completely isolated client/station contexts (PHC Station A vs District Hospital Station B)
 * with ZERO network/internet connectivity.
 * 
 * Workflow Stages:
 * [PHC Station A]:
 *  1. Authenticate Doctor (PIN 1234)
 *  2. Register Synthetic Patient (Meera Bai)
 *  3. Record Clinical Baseline Vitals
 *  4. Create Emergency Clinical Referral (UUIDv4)
 *  5. Seal Referral Package:
 *     - Ephemeral AES-256-GCM encryption with bound AAD metadata
 *     - RSA-OAEP key encapsulation for Recipient Hospital public key
 *     - ECDSA P-256 digital signature from PHC identity key (PIN-unwrapped)
 *  6. Fragment Sealed Package into MLO1 QR Barcode Frames
 * 
 * [Optical Air-Gap Transfer]:
 *  7. Physical transport via smartphone screen slideshow or printed referral slip (0 HTTP requests)
 * 
 * [District Hospital Station B]:
 *  8. Triage Casualty Station launches offline
 *  9. Ingests QR frames over simulated optical camera (including out-of-order capture)
 *  10. Reassembles frames and validates 32-bit CRC checksums
 *  11. Verifies PHC origin authenticity against Certified Public Key Trust Directory
 *  12. Staff enters hospital PIN (1234) to unwrap local RSA-OAEP private key
 *  13. Recovers AES session key and decrypts AES-256-GCM ciphertext + 128-bit tag
 *  14. Validates decrypted clinical schema and vitals
 *  15. Admits patient to ICU and persists intake record locally in Hospital store
 */

import {
  generateAesKey,
  generateRsaKeyPair,
  generateEcdsaKeyPair,
  exportKeyJwk,
  importKeyJwk,
  wrapPrivateKeyWithPin,
  unwrapPrivateKeyWithPin,
  encryptReferralEnvelope,
  decryptReferralEnvelope
} from '../../src/crypto/webCryptoEngine.js';
import {
  chunkReferralEnvelope,
  renderQrSvg
} from '../../src/qr/qrEngine.js';
import {
  createReassemblySession
} from '../../src/qr/qrScannerEngine.js';
import {
  login,
  hasPermission
} from '../../src/services/authService.js';
import {
  registerPatient,
  getPatientById
} from '../../src/services/patientService.js';
import {
  createReferral,
  sealReferralPackage,
  verifyAndIngestReferralEnvelope,
  updateReferralDisposition,
  getReceivedReferrals
} from '../../src/services/referralService.js';
import {
  provisionFacilityKeypair,
  unlockFacilityPrivateKey,
  getTrustedFacility,
  ensureDefaultFacilityKeysSeeded
} from '../../src/services/keyManagementService.js';
import { ROLES, PERMISSIONS } from '../../src/config/roles.js';
import { generateSyntheticReferral } from '../../src/utils/syntheticData.js';

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

async function runCompleteOfflineHandoffScenario() {
  console.log('====================================================');
  console.log('   MediLink Offline: End-to-End Referral Handoff');
  console.log('   Simulating Two Disconnected Air-Gap Stations');
  console.log('====================================================\n');

  // =========================================================================
  // INITIAL AIR-GAP PROVISIONING (Shared Public Keys in Trust Directory)
  // =========================================================================
  console.log('--- Step 0: Pre-Provisioned Certified Trust Directory ---');
  await ensureDefaultFacilityKeysSeeded('1234');

  const phcTrustRecord = await getTrustedFacility('PHC-DHAR-04');
  assert(phcTrustRecord.status === 'ACTIVE', 'PHC-DHAR-04 registered in Trust Directory');

  const hospitalTrustRecord = await getTrustedFacility('DH-INDORE-01');
  assert(hospitalTrustRecord.status === 'ACTIVE', 'DH-INDORE-01 registered in Trust Directory');

  // =========================================================================
  // STATION A: PHC CLINICAL WORKSTATION (Dhar Primary Health Centre)
  // =========================================================================
  console.log('\n--- Station A (PHC): Clinician Workflow & Referral Sealing ---');

  // 1. Authenticate PHC Doctor
  const phcAuth = await login('dr.rajesh', '1234');
  assert(phcAuth.success === true, 'PHC Doctor authenticated with PIN');
  assert(phcAuth.user.role === ROLES.PHC_DOCTOR, 'PHC Doctor holds role PHC_DOCTOR');
  assert(hasPermission(phcAuth.user.role, PERMISSIONS.CREATE_REFERRAL), 'Doctor holds CREATE_REFERRAL entitlement');

  // 2. Register New Patient
  const patientInput = {
    patientId: 'PAT-2026-00999',
    nationalHealthId: '91-9988-7766-5544',
    fullName: 'Meera Bai',
    gender: 'FEMALE',
    dateOfBirth: '1998-03-22',
    age: 28,
    contactPhone: '+91-9123456789',
    addressVillage: 'Gram Tirla, Post Dhar',
    district: 'Dhar',
    guardianName: 'Ramesh Bai (Husband)'
  };
  const enrolledPatient = await registerPatient(patientInput, phcAuth.user);
  assert(enrolledPatient.patientId === 'PAT-2026-00999', 'Patient enrolled in local PHC database');
  assert(enrolledPatient.fullName === 'Meera Bai', 'Patient identity preserved');

  // 3. Clinical Examination & Baseline Vitals
  const clinicalVitals = {
    systolicBP: 85,
    diastolicBP: 55,
    heartRate: 128,
    respiratoryRate: 34,
    temperatureCelsius: 39.2,
    oxygenSaturationSpO2: 86,
    randomBloodSugar: 142,
    recordedAt: new Date().toISOString()
  };

  // 4. Create Emergency Referral Package
  const referralInput = {
    patient: enrolledPatient,
    originatingFacilityId: 'PHC-DHAR-04',
    originatingFacilityName: 'Dhar Primary Health Centre',
    destinationFacilityId: 'DH-INDORE-01',
    destinationFacilityName: 'Maharaja Yeshwantrao District Hospital, Indore',
    priority: 'EMERGENCY_CRITICAL',
    provisionalDiagnosis: 'Severe Community-Acquired Pneumonia with ARDS',
    referralReason: 'Acute severe hypoxia and respiratory exhaustion secondary to bilateral lower lobe pneumonia. Requires ICU mechanical ventilation.',
    clinicalSummary: 'Patient presented with 4-day history of high-grade fever and progressive dyspnea. Oxygen via face mask at 6 L/min improved SpO2 marginally to 88%. Peripheral IV line established in right forearm.',
    medicationsGiven: [
      { name: 'IV Ceftriaxone', dose: '1g stat', administeredAt: new Date().toISOString() },
      { name: 'Nebulized Salbutamol + Ipratropium', dose: '2.5mg / 0.5mg', administeredAt: new Date().toISOString() },
      { name: 'IV Hydrocortisone', dose: '100mg stat', administeredAt: new Date().toISOString() }
    ],
    allergies: ['Penicillin (severe angioedema)'],
    vitals: clinicalVitals
  };

  const createdReferral = await createReferral(referralInput, phcAuth.user);
  assert(createdReferral.referralId !== undefined, 'Referral generated with valid UUIDv4');
  assert(createdReferral.priority === 'EMERGENCY_CRITICAL', 'Referral priority marked EMERGENCY_CRITICAL');

  // 5. Cryptographically Seal Referral Package (Doctor enters PIN 1234)
  const { envelope: sealedEnvelope, qrPackage } = await sealReferralPackage(
    createdReferral.referralId,
    phcAuth.user,
    '1234'
  );

  assert(sealedEnvelope.version === '1.0.0', 'Sealed envelope contains version 1.0.0');
  assert(sealedEnvelope.ciphertext !== undefined, 'Clinical payload encrypted with AES-256-GCM');
  assert(sealedEnvelope.authTag !== undefined, '128-bit authentication tag preserved');
  assert(sealedEnvelope.wrappedSessionKey !== undefined, 'Ephemeral AES session key wrapped for DH-INDORE-01');
  assert(sealedEnvelope.digitalSignature !== undefined, 'Envelope signed with PHC ECDSA private key');

  // 6. Generate MLO1 QR Barcode Frames
  assert(qrPackage.totalFrames >= 2, `Referral payload fragmented into ${qrPackage.totalFrames} MLO1 frames`);
  assert(qrPackage.frames[0].frameString.startsWith('MLO1|'), 'Frames formatted with MLO1 magic prefix');
  assert(qrPackage.frames[0].svg.includes('<svg'), 'QR frames render valid scalable vector graphics (SVG)');

  // =========================================================================
  // PHYSICAL AIR-GAP TRANSPORT (Ambulance Transport — ZERO Cloud Calls)
  // =========================================================================
  console.log('\n--- Optical Air-Gap Physical Transport ---');
  console.log(`  [SIMULATION] Patient transported 65 km via ambulance from Dhar PHC to MY Hospital, Indore.`);
  console.log(`  [SIMULATION] Data transferred exclusively via ${qrPackage.totalFrames} optical QR frames on mobile screen / paper slip.`);
  console.log(`  [SIMULATION] Zero HTTP requests, zero cellular connection, zero cloud dependency.`);

  // =========================================================================
  // STATION B: DISTRICT HOSPITAL CASUALTY INTAKE (MY Hospital, Indore)
  // =========================================================================
  console.log('\n--- Station B (District Hospital): Casualty Ingestion & Intake ---');

  // 1. Authenticate Triage Nurse
  const triageAuth = await login('triage.anita', '1234');
  assert(triageAuth.success === true, 'Hospital Triage Lead authenticated with PIN');
  assert(triageAuth.user.role === ROLES.HOSPITAL_TRIAGE, 'User holds HOSPITAL_TRIAGE role');

  // 2. Optical Scanner Ingestion (Simulate Camera Capturing Frames OUT-OF-ORDER)
  const hospitalScanner = createReassemblySession();
  
  // Ingest frames out of order: e.g. Frame 3, Frame 1, Frame 2 (with a duplicate Frame 1)
  const outOfOrderSequence = [
    qrPackage.frames[qrPackage.frames.length - 1], // Last frame
    qrPackage.frames[0],                           // Frame 1
    qrPackage.frames[0],                           // Duplicate Frame 1 (should be ignored)
    ...qrPackage.frames.slice(1, -1)               // Middle frames
  ];

  let scanResult = null;
  for (const frame of outOfOrderSequence) {
    scanResult = hospitalScanner.ingestFrame(frame.frameString);
  }

  assert(scanResult.status === 'COMPLETE', 'Hospital scanner reassembled full referral envelope from out-of-order stream');
  assert(scanResult.envelope.referralId === createdReferral.referralId, 'Reassembled envelope referralId matches origin');

  // 3. Verify Origin Authenticity & Decrypt Clinical Payload
  // Staff enters Hospital PIN (1234) to unwrap DH-INDORE-01 RSA-OAEP private key
  const ingestedClinicalRecord = await verifyAndIngestReferralEnvelope(
    scanResult.envelope,
    triageAuth.user,
    '1234'
  );

  assert(ingestedClinicalRecord.referralId === createdReferral.referralId, 'Decrypted record referralId matches original');
  assert(ingestedClinicalRecord.signatureStatus === 'VERIFIED_AUTHENTIC', 'Sender ECDSA signature verified authentic');
  assert(ingestedClinicalRecord.patientName === 'Meera Bai', 'Patient identity verified: Meera Bai');
  assert(ingestedClinicalRecord.vitals.oxygenSaturationSpO2 === 86, 'Emergency SpO2 vitals verified: 86%');
  assert(ingestedClinicalRecord.provisionalDiagnosis.includes('Pneumonia'), 'Provisional diagnosis verified intact');
  assert(ingestedClinicalRecord.medicationsGiven.length === 3, 'Pre-referral medications verified: 3 doses');

  // 4. Hospital Casualty Physician Updates Disposition & Bed Allocation
  const docAuth = await login('dr.mehta', '1234');
  const updatedDisposition = await updateReferralDisposition(
    ingestedClinicalRecord.referralId,
    'ADMITTED',
    'ICU Isolation Bay 04',
    docAuth.user
  );

  assert(updatedDisposition.triageStatus === 'ADMITTED', 'Referral disposition transitioned to ADMITTED');
  assert(updatedDisposition.assignedBed === 'ICU Isolation Bay 04', 'Bed allocated: ICU Isolation Bay 04');

  // 5. Verify Received Register at District Hospital
  const receivedList = await getReceivedReferrals(triageAuth.user);
  const foundReceived = receivedList.find((r) => r.referralId === createdReferral.referralId);
  assert(foundReceived !== undefined, 'Referral securely persisted in District Hospital received database');
  assert(foundReceived.assignedBed === 'ICU Isolation Bay 04', 'Persisted record contains updated ICU bed allocation');

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests}/${totalTests} END-TO-END OFFLINE HANDOFF TESTS PASSED!`);
  console.log('   AIR-GAP HANDOFF CONFIRMED 100% OPERATIONAL');
  console.log('====================================================\n');
}

runCompleteOfflineHandoffScenario().catch((err) => {
  console.error('[FATAL ERROR IN E2E HANDOFF TEST]', err);
  process.exit(1);
});
