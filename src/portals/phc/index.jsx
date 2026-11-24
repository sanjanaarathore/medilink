import React, { useState } from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout.jsx';
import PhcLogin from './PhcLogin.jsx';
import PhcDashboard from './PhcDashboard.jsx';
import PatientRegistration from './PatientRegistration.jsx';
import PatientList from './PatientList.jsx';
import PatientProfile from './PatientProfile.jsx';
import MedicalHistory from './MedicalHistory.jsx';
import ClinicalExamForm from './ClinicalExamForm.jsx';
import CreateReferral from './CreateReferral.jsx';
import ReferralPreview from './ReferralPreview.jsx';
import GenerateQR from './GenerateQR.jsx';
import ReferralHistory from './ReferralHistory.jsx';
import OfflineRecords from './OfflineRecords.jsx';

import {
  Activity,
  Users,
  UserPlus,
  HeartPulse,
  ClipboardList,
  Send,
  QrCode,
  Clock,
  Database,
  LogOut
} from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS, generateSyntheticReferral } from '../../utils/syntheticData.js';

export default function PhcPortal({ activePortal = 'phc', onChangePortal = () => {} }) {
  const [currentUser, setCurrentUser] = useState({
    userId: 'USR-DOC-PHC-01',
    username: 'dr.rajesh',
    fullName: 'Dr. Rajesh Sharma, MBBS',
    role: 'PHC Medical Officer',
    facilityId: 'PHC-DHAR-04'
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [patients, setPatients] = useState(SYNTHETIC_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(SYNTHETIC_PATIENTS[0]);
  const [currentReferral, setCurrentReferral] = useState(generateSyntheticReferral());

  const navItems = [
    { key: 'dashboard', label: 'Clinical Dashboard', icon: Activity },
    { key: 'register', label: 'Register Patient', icon: UserPlus },
    { key: 'patientList', label: 'Enrolled Patients', icon: Users, badge: `${patients.length}` },
    { key: 'profile', label: 'Patient Clinical Chart', icon: ClipboardList },
    { key: 'exam', label: 'Clinical Examination', icon: HeartPulse },
    { key: 'medicalHistory', label: 'Medical History', icon: ClipboardList },
    { key: 'createReferral', label: 'Create Referral', icon: Send },
    { key: 'preview', label: 'Referral Preview', icon: ClipboardList },
    { key: 'generateQR', label: 'Generate & Show QR', icon: QrCode },
    { key: 'history', label: 'Outgoing Referrals', icon: Clock },
    { key: 'offlineDb', label: 'Offline Records', icon: Database },
  ];

  if (!currentUser) {
    return <PhcLogin onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const handlePatientRegistered = (newPatient) => {
    setPatients([newPatient, ...patients]);
    setSelectedPatient(newPatient);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <PhcDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectPatient={(p) => setSelectedPatient(p)}
          />
        );
      case 'register':
        return (
          <PatientRegistration
            currentUser={currentUser}
            onPatientRegistered={handlePatientRegistered}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'patientList':
        return (
          <PatientList
            currentUser={currentUser}
            patients={patients}
            onSelectPatient={(p) => setSelectedPatient(p)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'profile':
        return (
          <PatientProfile
            patient={selectedPatient}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'medicalHistory':
        return <MedicalHistory patient={selectedPatient} />;
      case 'exam':
        return (
          <ClinicalExamForm
            currentUser={currentUser}
            patient={selectedPatient}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'createReferral':
        return (
          <CreateReferral
            currentUser={currentUser}
            patient={selectedPatient}
            onReferralReady={(ref) => setCurrentReferral(ref)}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'preview':
        return (
          <ReferralPreview
            referral={currentReferral}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'generateQR':
        return (
          <GenerateQR
            referral={currentReferral}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'history':
        return <ReferralHistory currentUser={currentUser} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'offlineDb':
        return <OfflineRecords />;
      default:
        return (
          <PhcDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectPatient={(p) => setSelectedPatient(p)}
          />
        );
    }
  };

  const pageHeaders = {
    dashboard: { title: 'PHC Clinical Triage & Outpatient Dashboard', desc: 'Primary care intake, vitals tracking, and emergency escalation' },
    register: { title: 'New Patient Enrollment', desc: 'Capture patient demographics and national health identity' },
    patientList: { title: 'Enrolled Patient Directory', desc: 'Browse and search local community cohort records' },
    profile: { title: `Clinical Record: ${selectedPatient?.fullName || 'Patient'}`, desc: 'Comprehensive chart, baseline vitals, and emergency options' },
    medicalHistory: { title: 'Chronic Illnesses & Known Allergies', desc: 'Persistent diagnostic profile and critical drug warnings' },
    exam: { title: 'Clinical Examination & Vitals Triage', desc: 'Record physiological readings with automated instability alarms' },
    createReferral: { title: 'Draft Emergency Referral', desc: 'Prepare clinical escalation package with medications administered' },
    preview: { title: 'Cryptographic Sealing & Verification', desc: 'Digitally sign envelope with ECDSA P-256 and encrypt with AES-256-GCM' },
    generateQR: { title: 'High-Density Encrypted Barcode Matrix', desc: 'Animated MLO1 optical transmission for air-gap handoff' },
    history: { title: 'Outgoing Referral Register', desc: 'Complete history of patient transfers dispatched from this center' },
    offlineDb: { title: 'Local Offline Data Store (IndexedDB)', desc: 'Inspect persistent local databases, cache status, and backup' },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.dashboard;

  return (
    <PortalLayout
      portalType="phc"
      activePortal={activePortal}
      onChangePortal={onChangePortal}
      navItems={navItems}
      activeNav={activeTab}
      onSelectNav={(tab) => setActiveTab(tab)}
      facilityName="Dhar Primary Health Centre"
      facilityId="PHC-DHAR-04"
      userName={currentUser.fullName}
      userRole={currentUser.role}
      pageTitle={currentHeader.title}
      pageDescription={currentHeader.desc}
      headerAction={
        <button
          onClick={() => setCurrentUser(null)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      }
    >
      {renderContent()}
    </PortalLayout>
  );
}
