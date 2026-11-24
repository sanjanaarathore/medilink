/**
 * @file syntheticData.js
 * @description Synthetic data generator providing 100% fictitious clinical fixtures for testing and development.
 * Complies with HIPAA and DISHA guidelines. Contains zero real patient health information (PHI).
 */

import { FACILITY_TYPE, REFERRAL_PRIORITY } from '../types/schemas.js';
import { ROLES } from '../config/roles.js';

export const SYNTHETIC_FACILITIES = Object.freeze([
  {
    facilityId: 'PHC-DHAR-04',
    name: 'Dhar Primary Health Centre',
    type: FACILITY_TYPE.PHC,
    district: 'Dhar',
    state: 'Madhya Pradesh',
    contactNumber: '+91-7292-234567',
    status: 'ACTIVE',
    createdAt: '2026-01-15T08:00:00.000Z'
  },
  {
    facilityId: 'PHC-NALCHHA-02',
    name: 'Nalchha Health Sub-Centre',
    type: FACILITY_TYPE.PHC,
    district: 'Dhar',
    state: 'Madhya Pradesh',
    contactNumber: '+91-7292-245678',
    status: 'ACTIVE',
    createdAt: '2026-01-20T09:30:00.000Z'
  },
  {
    facilityId: 'DH-INDORE-01',
    name: 'Maharaja Yeshwantrao District Hospital, Indore',
    type: FACILITY_TYPE.DISTRICT_HOSPITAL,
    district: 'Indore',
    state: 'Madhya Pradesh',
    contactNumber: '+91-731-2527383',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z'
  }
]);

export const SYNTHETIC_USERS = Object.freeze([
  {
    userId: 'USR-ADMIN-01',
    username: 'admin.patel',
    fullName: 'Suresh Patel (System Administrator)',
    role: ROLES.ADMIN,
    facilityId: 'DH-INDORE-01',
    status: 'ACTIVE'
  },
  {
    userId: 'USR-DOC-PHC-01',
    username: 'dr.rajesh',
    fullName: 'Dr. Rajesh Sharma, MBBS',
    role: ROLES.PHC_DOCTOR,
    facilityId: 'PHC-DHAR-04',
    status: 'ACTIVE'
  },
  {
    userId: 'USR-STAFF-PHC-01',
    username: 'priya.nurse',
    fullName: 'Priya Verma (Staff Nurse)',
    role: ROLES.PHC_STAFF,
    facilityId: 'PHC-DHAR-04',
    status: 'ACTIVE'
  },
  {
    userId: 'USR-TRIAGE-DH-01',
    username: 'triage.anita',
    fullName: 'Anita Desai (Emergency Triage Lead)',
    role: ROLES.HOSPITAL_TRIAGE,
    facilityId: 'DH-INDORE-01',
    status: 'ACTIVE'
  },
  {
    userId: 'USR-DOC-DH-01',
    username: 'dr.mehta',
    fullName: 'Dr. V. K. Mehta, MD (Critical Care)',
    role: ROLES.HOSPITAL_PHYSICIAN,
    facilityId: 'DH-INDORE-01',
    status: 'ACTIVE'
  }
]);

export const SYNTHETIC_PATIENTS = Object.freeze([
  {
    patientId: 'PAT-2026-00812',
    nationalHealthId: '91-4567-8901-2345',
    fullName: 'Aarav Kumar',
    gender: 'MALE',
    dateOfBirth: '1994-06-12',
    age: 32,
    contactPhone: '+91-9876543210',
    addressVillage: 'Mandu Road, Village Nalchha',
    district: 'Dhar',
    guardianName: 'Sunita Kumar (Wife)',
    createdAt: '2026-11-24T10:15:00.000Z'
  },
  {
    patientId: 'PAT-2026-00945',
    nationalHealthId: '91-8899-1234-5678',
    fullName: 'Meera Bai',
    gender: 'FEMALE',
    dateOfBirth: '1998-03-22',
    age: 28,
    contactPhone: '+91-9123456789',
    addressVillage: 'Gram Tirla, Post Dhar',
    district: 'Dhar',
    guardianName: 'Ramesh Bai (Husband)',
    createdAt: '2026-11-24T11:00:00.000Z'
  }
]);

/**
 * Generates a complete synthetic clinical referral record.
 * @param {string} [patientId='PAT-2026-00812']
 * @param {string} [priority=REFERRAL_PRIORITY.EMERGENCY_CRITICAL]
 * @returns {import('../types/schemas.js').ClinicalReferralRecord}
 */
export function generateSyntheticReferral(patientId = 'PAT-2026-00812', priority = REFERRAL_PRIORITY.EMERGENCY_CRITICAL) {
  const patient = SYNTHETIC_PATIENTS.find(p => p.patientId === patientId) || SYNTHETIC_PATIENTS[0];
  
  return {
    referralId: 'd3b07384-d113-49fb-a796-03f6f1c7d21a',
    originatingFacilityId: 'PHC-DHAR-04',
    originatingFacilityName: 'Dhar Primary Health Centre',
    destinationFacilityId: 'DH-INDORE-01',
    destinationFacilityName: 'Maharaja Yeshwantrao District Hospital, Indore',
    referringDoctorName: 'Dr. Rajesh Sharma, MBBS (Reg: MP-48192)',
    priority,
    referralReason: 'Acute severe hypoxia and respiratory exhaustion secondary to bilateral lower lobe pneumonia. Requires ICU mechanical ventilation and arterial blood gas monitoring.',
    provisionalDiagnosis: 'Severe Community-Acquired Pneumonia with Acute Respiratory Distress Syndrome (ARDS)',
    clinicalSummary: 'Patient presented with 4-day history of high-grade fever, productive cough, and progressive dyspnea. On exam, bilateral crepitations present in lower zones. Tachycardia and central cyanosis noted. Oxygen therapy via face mask at 6 L/min improved SpO2 marginally to 88%. Peripheral IV line established in right forearm.',
    medicationsGiven: [
      { name: 'IV Ceftriaxone', dose: '1g stat', frequency: 'Single dose', administeredAt: '2026-11-24T10:00:00.000Z' },
      { name: 'Nebulized Salbutamol + Ipratropium', dose: '2.5mg / 0.5mg', frequency: 'Single inhalation', administeredAt: '2026-11-24T10:10:00.000Z' },
      { name: 'IV Hydrocortisone', dose: '100mg stat', frequency: 'Single dose', administeredAt: '2026-11-24T10:15:00.000Z' }
    ],
    allergies: ['Penicillin (causes severe urticaria & angioedema)', 'Sulfonamides'],
    patient,
    vitals: {
      systolicBP: 85,
      diastolicBP: 55,
      heartRate: 128,
      respiratoryRate: 34,
      temperatureCelsius: 39.2,
      oxygenSaturationSpO2: 86,
      randomBloodSugar: 142,
      recordedAt: '2026-11-24T10:20:00.000Z'
    },
    createdAt: '2026-11-24T10:30:00.000Z'
  };
}

