/**
 * @file schemas.js
 * @description Canonical schemas, JSDoc types, and payload envelopes for MediLink Offline.
 */

/**
 * @typedef {Object} PatientDemographics
 * @property {string} patientId - Unique local identifier (e.g. "PAT-2026-00812")
 * @property {string} [nationalHealthId] - Optional ABHA / National Health ID
 * @property {string} fullName - Full legal name
 * @property {string} gender - "MALE" | "FEMALE" | "OTHER"
 * @property {string} dateOfBirth - ISO 8601 Date (YYYY-MM-DD)
 * @property {number} age - Calculated age in years
 * @property {string} contactPhone - Primary contact telephone
 * @property {string} addressVillage - Village/Locality name
 * @property {string} district - Administrative district
 * @property {string} guardianName - Emergency contact or guardian name
 */

/**
 * @typedef {Object} ClinicalVitals
 * @property {number} systolicBP - mmHg
 * @property {number} diastolicBP - mmHg
 * @property {number} heartRate - bpm
 * @property {number} respiratoryRate - breaths/min
 * @property {number} temperatureCelsius - Body temperature in Celsius
 * @property {number} oxygenSaturationSpO2 - Percentage (e.g. 96)
 * @property {number} [randomBloodSugar] - mg/dL
 * @property {string} recordedAt - ISO 8601 Timestamp
 */

/**
 * @typedef {Object} ClinicalReferralRecord
 * @property {string} referralId - Globally unique referral identifier (UUIDv4)
 * @property {string} originatingFacilityId - Sending PHC identifier (e.g. "PHC-DHAR-04")
 * @property {string} originatingFacilityName - Sending PHC human-readable name
 * @property {string} destinationFacilityId - Recipient District Hospital ID (e.g. "DH-INDORE-01")
 * @property {string} destinationFacilityName - Recipient District Hospital name
 * @property {string} referringDoctorName - Name and registration of referring doctor
 * @property {string} priority - "ROUTINE" | "URGENT" | "EMERGENCY_CRITICAL"
 * @property {string} referralReason - Primary indication for escalation
 * @property {string} provisionalDiagnosis - Clinical impression
 * @property {string} clinicalSummary - History of present illness and findings
 * @property {Array<{name: string, dose: string, frequency: string, administeredAt?: string}>} medicationsGiven
 * @property {Array<string>} allergies - Known drug or environmental allergies
 * @property {PatientDemographics} patient - Complete patient demographics
 * @property {ClinicalVitals} vitals - Recorded vital signs
 * @property {string} createdAt - ISO 8601 Timestamp
 */

/**
 * @typedef {Object} EncryptedReferralEnvelope
 * @property {string} version - Protocol version (e.g. "1.0")
 * @property {string} referralId - Unencrypted UUID for tracking & indexing
 * @property {string} senderFacilityId - PHC ID (matched against public key directory)
 * @property {string} recipientFacilityId - DH ID (intended recipient)
 * @property {string} timestamp - ISO 8601 generation timestamp
 * @property {string} encryptedSessionKey - RSA-OAEP encrypted AES-256 session key (Base64)
 * @property {string} iv - 96-bit AES-GCM Initialization Vector (Base64)
 * @property {string} ciphertext - AES-256-GCM encrypted ClinicalReferralRecord (Base64)
 * @property {string} authTag - 128-bit AES-GCM authentication tag (Base64)
 * @property {string} digitalSignature - ECDSA P-256 signature over (senderId + recipientId + timestamp + ciphertext + authTag) (Base64)
 */

/**
 * @typedef {Object} QRFrameHeader
 * @property {string} magic - Protocol identifier, e.g. "MLO1" (MediLink Offline v1)
 * @property {string} refIdPrefix - First 8 characters of referralId for quick visual correlation
 * @property {number} seq - Frame sequence index (1-based, 1..N)
 * @property {number} total - Total number of frames in sequence (N)
 * @property {string} checksum - CRC32 or SHA-256 fragment checksum
 * @property {string} data - Chunk payload string
 */

/**
 * @typedef {Object} FacilityIdentity
 * @property {string} facilityId - Unique ID (e.g. "PHC-DHAR-04")
 * @property {string} name - Facility name
 * @property {string} type - "PHC" | "DISTRICT_HOSPITAL" | "COMMUNITY_HEALTH_CENTRE"
 * @property {string} district - District
 * @property {string} state - State/Province
 * @property {string} rsaPublicKeyJwk - Exported RSA-OAEP Public Key (JSON Web Key)
 * @property {string} ecdsaPublicKeyJwk - Exported ECDSA P-256 Public Key (JSON Web Key)
 * @property {string} status - "ACTIVE" | "REVOKED" | "SUSPENDED"
 * @property {string} validFrom - ISO 8601 Date
 * @property {string} validUntil - ISO 8601 Date
 */

export const REFERRAL_PRIORITY = Object.freeze({
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  EMERGENCY_CRITICAL: 'EMERGENCY_CRITICAL'
});

export const FACILITY_TYPE = Object.freeze({
  PHC: 'PRIMARY_HEALTH_CENTRE',
  DISTRICT_HOSPITAL: 'DISTRICT_HOSPITAL',
  COMMUNITY_HEALTH_CENTRE: 'COMMUNITY_HEALTH_CENTRE'
});

