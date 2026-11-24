/**
 * @file cryptographicSecurity.test.js
 * @description Comprehensive automated cryptographic security test suite for Phase 4:
 * 1. Valid end-to-end AES-256-GCM + RSA-OAEP + ECDSA encryption and decryption roundtrip
 * 2. Ciphertext bit-flip/tamper rejection (AES-GCM tag verification failure)
 * 3. Authentication tag modification rejection
 * 4. AAD metadata modification rejection (recipient/sender/timestamp tampering)
 * 5. Digital signature bit-flip/tamper rejection (ECDSA validation failure)
 * 6. Wrong recipient facility ID boundary rejection
 * 7. Unauthorized recipient private key rejection (RSA-OAEP failure)
 * 8. Untrusted / mismatched sender signing key rejection
 * 9. Revoked sender facility key rejection
 * 10. Expired sender facility key rejection
 * 11. Multi-part QR out-of-order reassembly success
 * 12. Corrupted QR chunk rejection via CRC32 mismatch
 * 13. Missing QR frame tracking and duplicate frame deduplication
 * 14. Local PIN wrapping authorization: correct PIN unwrap success
 * 15. Local PIN wrapping authorization: incorrect PIN unwrap rejection
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
  decryptReferralEnvelope,
  canonicalizeJson,
  computeSha256Fingerprint,
  PROTOCOL_VERSION
} from '../../src/crypto/webCryptoEngine.js';
import {
  provisionFacilityKeypair,
  unlockFacilityPrivateKey,
  getTrustedFacility,
  revokeFacilityKey,
  ensureDefaultFacilityKeysSeeded
} from '../../src/services/keyManagementService.js';
import {
  chunkReferralEnvelope
} from '../../src/qr/qrEngine.js';
import {
  MultiPartReassemblyManager,
  createReassemblySession
} from '../../src/qr/qrScannerEngine.js';
import { formatFrame, parseFrame, calculateCRC32 } from '../../src/qr/protocol.js';
import {
  createReferral,
  sealReferralPackage,
  verifyAndIngestReferralEnvelope
} from '../../src/services/referralService.js';
import { generateSyntheticReferral } from '../../src/utils/syntheticData.js';
import { putRecord, getRecord } from '../../src/services/dbService.js';
import { STORES } from '../../src/db/schema.js';

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

async function runCryptographicSecurityTestSuite() {
  console.log('====================================================');
  console.log('   MediLink Offline Phase 4 Cryptographic Security');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: END-TO-END HYBRID ENCRYPTION & SIGNING ROUNDTRIP
  // ----------------------------------------------------
  console.log('--- Suite 1: Pure Web Crypto Engine Primitives & Roundtrip ---');

  // Generate Sender (PHC) ECDSA keypair
  const senderEcdsaPair = await generateEcdsaKeyPair();
  const senderEcdsaPubJwk = await exportKeyJwk(senderEcdsaPair.publicKey);

  // Generate Recipient (Hospital) RSA-OAEP keypair
  const recipientRsaPair = await generateRsaKeyPair(2048);
  const recipientRsaPubJwk = await exportKeyJwk(recipientRsaPair.publicKey);

  const samplePayload = {
    referralId: 'd3b07384-d113-49fb-a796-03f6f1c7d21a',
    originatingFacilityId: 'PHC-DHAR-04',
    destinationFacilityId: 'DH-INDORE-01',
    patient: {
      fullName: 'Aarav Kumar',
      age: 32,
      gender: 'MALE',
      nationalHealthId: '91-4567-8901-2345'
    },
    vitals: { systolicBP: 120, diastolicBP: 80, oxygenSaturationSpO2: 98 },
    provisionalDiagnosis: 'Acute Severe Pneumonia',
    referralReason: 'ICU Ventilator Support Required'
  };

  const sealedEnvelope = await encryptReferralEnvelope({
    referralPayload: samplePayload,
    recipientPublicKey: recipientRsaPubJwk,
    senderPrivateKey: senderEcdsaPair.privateKey,
    senderFacilityId: 'PHC-DHAR-04',
    recipientFacilityId: 'DH-INDORE-01',
    referralId: samplePayload.referralId
  });

  assert(sealedEnvelope.version === PROTOCOL_VERSION, 'Envelope contains standard protocol version 1.0.0');
  assert(typeof sealedEnvelope.ciphertext === 'string' && sealedEnvelope.ciphertext.length > 20, 'Ciphertext is non-empty Base64');
  assert(typeof sealedEnvelope.authTag === 'string' && sealedEnvelope.authTag.length > 10, 'Authentication tag is non-empty Base64');
  assert(typeof sealedEnvelope.wrappedSessionKey === 'string' && sealedEnvelope.wrappedSessionKey.length > 20, 'Wrapped session key is non-empty Base64');
  assert(typeof sealedEnvelope.digitalSignature === 'string' && sealedEnvelope.digitalSignature.length > 20, 'Digital signature is non-empty Base64');

  // Test 1.1: Legitimate Decryption Roundtrip
  const decryptedRecord = await decryptReferralEnvelope({
    envelope: sealedEnvelope,
    recipientPrivateKey: recipientRsaPair.privateKey,
    trustedSenderPublicKey: senderEcdsaPubJwk,
    expectedRecipientFacilityId: 'DH-INDORE-01'
  });

  assert(decryptedRecord.referralId === samplePayload.referralId, 'Decrypted referralId matches original payload');
  assert(decryptedRecord.patient.fullName === 'Aarav Kumar', 'Decrypted patient demographic data matches');
  assert(decryptedRecord.vitals.oxygenSaturationSpO2 === 98, 'Decrypted vitals data matches');
  assert(decryptedRecord.provisionalDiagnosis === 'Acute Severe Pneumonia', 'Decrypted provisional diagnosis matches');

  // ----------------------------------------------------
  // SUITE 2: CRYPTOGRAPHIC ATTACK & TAMPER RESISTANCE
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Cryptographic Attack & Tamper Resistance ---');

  // Test 2.1: Ciphertext modification rejection (AES-GCM / ECDSA)
  let tamperedCiphertextEnvelope = { ...sealedEnvelope };
  const ctBytes = Buffer.from(tamperedCiphertextEnvelope.ciphertext, 'base64');
  ctBytes[0] ^= 0xFF; // Flip bits in ciphertext
  tamperedCiphertextEnvelope.ciphertext = ctBytes.toString('base64');

  let tamperCtCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: tamperedCiphertextEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk
    });
  } catch (err) {
    tamperCtCaught = true;
  }
  assert(tamperCtCaught, 'Modified ciphertext is strictly rejected (Tag or Signature validation failed)');

  // Test 2.2: Auth tag modification rejection
  let tamperedTagEnvelope = { ...sealedEnvelope };
  const tagBytes = Buffer.from(tamperedTagEnvelope.authTag, 'base64');
  tagBytes[0] ^= 0xFF; // Flip bits in auth tag
  tamperedTagEnvelope.authTag = tagBytes.toString('base64');

  let tamperTagCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: tamperedTagEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk
    });
  } catch (err) {
    tamperTagCaught = true;
  }
  assert(tamperTagCaught, 'Modified authentication tag is strictly rejected');

  // Test 2.3: AAD metadata modification rejection (Recipient redirection attack)
  let tamperedRecipientEnvelope = { ...sealedEnvelope, recipientFacilityId: 'DH-BHOPAL-99' };
  let tamperRecipientCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: tamperedRecipientEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk
    });
  } catch (err) {
    tamperRecipientCaught = true;
  }
  assert(tamperRecipientCaught, 'Tampered recipientFacilityId in envelope rejected (Signature & AAD mismatch)');

  // Test 2.4: Digital signature bit-flip rejection
  let tamperedSigEnvelope = { ...sealedEnvelope };
  const sigBytes = Buffer.from(tamperedSigEnvelope.digitalSignature, 'base64');
  sigBytes[0] ^= 0xFF; // Flip bits in ECDSA signature
  tamperedSigEnvelope.digitalSignature = sigBytes.toString('base64');

  let tamperSigCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: tamperedSigEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk
    });
  } catch (err) {
    tamperSigCaught = true;
  }
  assert(tamperSigCaught, 'Forged or bit-flipped ECDSA signature is strictly rejected');

  // Test 2.5: Destination facility boundary check
  let wrongStationCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: sealedEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk,
      expectedRecipientFacilityId: 'DH-UJJAIN-02' // Different station
    });
  } catch (err) {
    if (err.message.includes('Access Violation')) {
      wrongStationCaught = true;
    }
  }
  assert(wrongStationCaught, 'Wrong recipient facility station node boundary enforced');

  // Test 2.6: Unauthorized recipient private key rejection (RSA-OAEP failure)
  const unauthorizedHospitalRsa = await generateRsaKeyPair(2048);
  let unauthorizedUnwrapCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: sealedEnvelope,
      recipientPrivateKey: unauthorizedHospitalRsa.privateKey,
      trustedSenderPublicKey: senderEcdsaPubJwk
    });
  } catch (err) {
    unauthorizedUnwrapCaught = true;
  }
  assert(unauthorizedUnwrapCaught, 'Unauthorized recipient private key fails session key recovery');

  // Test 2.7: Untrusted sender public key rejection
  const imposterEcdsaPair = await generateEcdsaKeyPair();
  const imposterEcdsaPubJwk = await exportKeyJwk(imposterEcdsaPair.publicKey);
  let untrustedSenderCaught = false;
  try {
    await decryptReferralEnvelope({
      envelope: sealedEnvelope,
      recipientPrivateKey: recipientRsaPair.privateKey,
      trustedSenderPublicKey: imposterEcdsaPubJwk
    });
  } catch (err) {
    untrustedSenderCaught = true;
  }
  assert(untrustedSenderCaught, 'Referral signed by untrusted / mismatched sender key rejected');

  // ----------------------------------------------------
  // SUITE 3: LOCAL CREDENTIAL & PIN-BASED WRAPPING (PBKDF2)
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Local Storage Key Wrapping (PIN-Derived PBKDF2) ---');

  const testPin = '849201';
  const privateKeyJwk = await exportKeyJwk(senderEcdsaPair.privateKey);

  // Wrap private key with PIN
  const wrappedKeyRecord = await wrapPrivateKeyWithPin(privateKeyJwk, testPin);
  assert(wrappedKeyRecord.iterations === 100000, 'PBKDF2 iterations configured to OWASP 100,000');
  assert(typeof wrappedKeyRecord.saltBase64 === 'string', 'Salt generated as random Base64 string');
  assert(typeof wrappedKeyRecord.ciphertextBase64 === 'string', 'Wrapped private key ciphertext stored');

  // Unwrap with correct PIN
  const unwrappedKey = await unwrapPrivateKeyWithPin(wrappedKeyRecord, testPin, 'ECDSA', ['sign']);
  assert(unwrappedKey instanceof Object && unwrappedKey.type === 'private', 'Private key unwrapped into active memory CryptoKey');

  // Unwrap with incorrect PIN
  let wrongPinCaught = false;
  try {
    await unwrapPrivateKeyWithPin(wrappedKeyRecord, '000000', 'ECDSA', ['sign']);
  } catch (err) {
    if (err.message.includes('PIN verification failed')) {
      wrongPinCaught = true;
    }
  }
  assert(wrongPinCaught, 'Incorrect PIN rejected with AES-GCM tag failure');

  // ----------------------------------------------------
  // SUITE 4: FACILITY KEY MANAGEMENT & REVOCATION
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Facility Trust Directory & Revocation ---');

  // Seed default facility keys
  await ensureDefaultFacilityKeysSeeded('1234');

  const phcFacility = await getTrustedFacility('PHC-DHAR-04');
  assert(phcFacility.status === 'ACTIVE', 'PHC-DHAR-04 trusted key is ACTIVE');
  assert(phcFacility.signingPublicKeyJwk !== undefined, 'PHC signing public key is registered');

  const dhFacility = await getTrustedFacility('DH-INDORE-01');
  assert(dhFacility.status === 'ACTIVE', 'DH-INDORE-01 trusted key is ACTIVE');
  assert(dhFacility.encryptionPublicKeyJwk !== undefined, 'Hospital encryption public key is registered');

  // Test Key Revocation
  const adminUser = { userId: 'USR-ADMIN-01', role: 'ADMIN', facilityId: 'DH-INDORE-01' };
  const revokedRecord = await revokeFacilityKey('PHC-NALCHHA-02', 'Facility decommissioned', adminUser);
  assert(revokedRecord.status === 'REVOKED', 'Key status updated to REVOKED');

  let revokedAccessCaught = false;
  try {
    await getTrustedFacility('PHC-NALCHHA-02');
  } catch (err) {
    if (err.message.includes('REVOKED')) {
      revokedAccessCaught = true;
    }
  }
  assert(revokedAccessCaught, 'Access to REVOKED facility public key is denied');

  // Test Key Expiry handling
  const expiredFacilityKey = {
    ...phcFacility,
    facilityId: 'PHC-EXPIRED-TEST',
    validUntil: '2020-01-01T00:00:00.000Z' // In the past
  };
  await putRecord(STORES.TRUSTED_KEYS, expiredFacilityKey);

  let expiredAccessCaught = false;
  try {
    await getTrustedFacility('PHC-EXPIRED-TEST');
  } catch (err) {
    if (err.message.includes('EXPIRED')) {
      expiredAccessCaught = true;
    }
  }
  assert(expiredAccessCaught, 'Access to EXPIRED facility public key is denied');

  // ----------------------------------------------------
  // SUITE 5: MLO1 MULTI-PART QR CHUNKING & RECONSTRUCTION
  // ----------------------------------------------------
  console.log('\n--- Suite 5: MLO1 QR Framing & Out-of-Order Reassembly ---');

  // Chunk sealed referral envelope (approx 1200 - 1600 bytes) into 400-byte chunks
  const qrPackage = chunkReferralEnvelope(sealedEnvelope, 400);
  assert(qrPackage.totalFrames >= 2, `Payload chunked into ${qrPackage.totalFrames} sequential MLO1 frames`);
  assert(qrPackage.frames.length === qrPackage.totalFrames, 'All frames generated');

  // Verify frame structure: MLO1|refIdShort|seq|total|crc32|chunkData
  const sampleFrameString = qrPackage.frames[0].frameString;
  assert(sampleFrameString.startsWith('MLO1|'), 'Frame begins with MLO1 magic prefix');

  // Reassemble frames in SCRAMBLED (out-of-order) sequence
  const session = createReassemblySession();
  const scrambledFrames = [...qrPackage.frames].reverse();

  let finalReassemblyResult = null;
  for (const frame of scrambledFrames) {
    finalReassemblyResult = session.ingestFrame(frame.frameString);
  }

  assert(finalReassemblyResult.status === 'COMPLETE', 'Out-of-order frames successfully reassembled to COMPLETE');
  assert(finalReassemblyResult.percentComplete === 100, 'Reassembly progress reports 100%');
  assert(finalReassemblyResult.missingFrames.length === 0, 'No frames missing after full reception');
  assert(finalReassemblyResult.envelope.referralId === samplePayload.referralId, 'Reassembled envelope referralId matches original');

  // Test CRC32 corruption detection
  const corruptSession = createReassemblySession();
  const corruptChunkData = qrPackage.frames[0].frameString.slice(0, -3) + 'XYZ';
  const corruptResult = corruptSession.ingestFrame(corruptChunkData);
  assert(corruptResult.status === 'CORRUPTED', 'Corrupted frame rejected due to CRC32 mismatch');

  // Test Missing Frame Detection & Duplicate Frame Handling
  const partialSession = createReassemblySession();
  // Ingest Frame 1
  partialSession.ingestFrame(qrPackage.frames[0].frameString);
  // Duplicate Frame 1
  const dupResult = partialSession.ingestFrame(qrPackage.frames[0].frameString);
  assert(dupResult.status === 'DUPLICATE', 'Duplicate frame recognized and deduplicated');

  const partialStatus = partialSession.getStatus();
  assert(partialStatus.isComplete === false, 'Partial session reports incomplete');
  assert(partialStatus.missingFrames.includes(2), 'Missing frame 2 detected in progress checklist');

  // ----------------------------------------------------
  // SUITE 6: END-TO-END SERVICE WORKFLOW (PHC -> HOSPITAL)
  // ----------------------------------------------------
  console.log('\n--- Suite 6: Full Application Service Cryptographic Flow ---');

  const phcDoctor = {
    userId: 'USR-DOC-PHC-01',
    fullName: 'Dr. Rajesh Sharma, MBBS',
    role: 'PHC_DOCTOR',
    facilityId: 'PHC-DHAR-04'
  };

  const triageNurse = {
    userId: 'USR-TRIAGE-DH-01',
    fullName: 'Anita Desai (Triage Lead)',
    role: 'HOSPITAL_TRIAGE',
    facilityId: 'DH-INDORE-01'
  };

  // 1. PHC Doctor creates referral
  const newReferralInput = generateSyntheticReferral('PAT-2026-00812');
  newReferralInput.originatingFacilityId = 'PHC-DHAR-04';
  newReferralInput.destinationFacilityId = 'DH-INDORE-01';
  const createdRef = await createReferral(newReferralInput, phcDoctor);

  // 2. PHC Doctor seals referral package (AES-256 + RSA-OAEP + ECDSA)
  const { envelope: sealedServiceEnvelope, qrPackage: serviceQrPackage } = await sealReferralPackage(
    createdRef.referralId,
    phcDoctor,
    '1234'
  );
  assert(sealedServiceEnvelope.digitalSignature !== undefined, 'Referral sealed and digitally signed via service layer');
  assert(serviceQrPackage.frames.length > 0, 'Service layer produced valid MLO1 QR frames');

  // 3. District Hospital Triage ingests multi-part frames through reassembler
  const hospitalScanner = createReassemblySession();
  let hospitalScanComplete = null;
  for (const f of serviceQrPackage.frames) {
    hospitalScanComplete = hospitalScanner.ingestFrame(f.frameString);
  }
  assert(hospitalScanComplete.status === 'COMPLETE', 'Hospital scanner assembled complete referral from frames');

  // 4. District Hospital verifies ECDSA signature, unwraps RSA session key with PIN, decrypts AES payload
  const ingestedRecord = await verifyAndIngestReferralEnvelope(
    hospitalScanComplete.envelope,
    triageNurse,
    '1234'
  );

  assert(ingestedRecord.referralId === createdRef.referralId, 'Hospital intake verified matching referralId');
  assert(ingestedRecord.signatureStatus === 'VERIFIED_AUTHENTIC', 'Referral marked as VERIFIED_AUTHENTIC in hospital store');
  assert(ingestedRecord.patient.fullName === createdRef.patient.fullName, 'Intake clinical patient record verified authentic');

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests}/${totalTests} PHASE 4 SECURITY TESTS PASSED!`);
  console.log('====================================================\n');
}

runCryptographicSecurityTestSuite().catch((err) => {
  console.error('\n[FATAL ERROR IN SECURITY TEST SUITE]', err);
  process.exit(1);
});

