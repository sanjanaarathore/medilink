import React, { useState } from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout.jsx';
import HospitalLogin from './HospitalLogin.jsx';
import HospitalDashboard from './HospitalDashboard.jsx';
import EmergencyReception from './EmergencyReception.jsx';
import QRScanningInterface from './QRScanningInterface.jsx';
import QRImageUpload from './QRImageUpload.jsx';
import MultiPartQRProgress from './MultiPartQRProgress.jsx';
import ReferralVerification from './ReferralVerification.jsx';
import PatientReferralDetails from './PatientReferralDetails.jsx';
import ReceivedReferralHistory from './ReceivedReferralHistory.jsx';
import HospitalOfflineRecords from './HospitalOfflineRecords.jsx';

import {
  Activity,
  Hospital,
  Scan,
  Upload,
  CheckCircle2,
  ShieldCheck,
  ClipboardList,
  Clock,
  Database,
  LogOut
} from '../../components/common/Icons.jsx';
import { generateSyntheticReferral } from '../../utils/syntheticData.js';

export default function HospitalPortal({ activePortal = 'hospital', onChangePortal = () => {} }) {
  const [currentUser, setCurrentUser] = useState({
    userId: 'USR-TRIAGE-DH-01',
    username: 'triage.anita',
    fullName: 'Anita Desai',
    role: 'Emergency Triage Lead',
    facilityId: 'DH-INDORE-01'
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentReferral, setCurrentReferral] = useState(generateSyntheticReferral());

  const navItems = [
    { key: 'dashboard', label: 'Casualty Overview', icon: Activity },
    { key: 'reception', label: 'Emergency Reception', icon: Hospital },
    { key: 'scan', label: 'Camera QR Scanner', icon: Scan },
    { key: 'upload', label: 'Upload QR Image', icon: Upload },
    { key: 'progress', label: 'Frame Reconstruction', icon: CheckCircle2 },
    { key: 'verify', label: 'Verify Signature', icon: ShieldCheck },
    { key: 'details', label: 'Decrypted Record', icon: ClipboardList },
    { key: 'history', label: 'Received Referrals', icon: Clock },
    { key: 'offlineDb', label: 'Offline Records', icon: Database },
  ];

  if (!currentUser) {
    return <HospitalLogin onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HospitalDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'reception':
        return <EmergencyReception onNavigate={(tab) => setActiveTab(tab)} />;
      case 'scan':
        return <QRScanningInterface onNavigate={(tab) => setActiveTab(tab)} />;
      case 'upload':
        return <QRImageUpload onNavigate={(tab) => setActiveTab(tab)} />;
      case 'progress':
        return <MultiPartQRProgress onNavigate={(tab) => setActiveTab(tab)} />;
      case 'verify':
        return <ReferralVerification currentUser={currentUser} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'details':
        return (
          <PatientReferralDetails
            currentUser={currentUser}
            referral={currentReferral}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'history':
        return <ReceivedReferralHistory currentUser={currentUser} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'offlineDb':
        return <HospitalOfflineRecords />;
      default:
        return <HospitalDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const pageHeaders = {
    dashboard: { title: 'District Hospital Casualty Intake', desc: 'Emergency triage reception, air-gap optical handoffs, and critical care' },
    reception: { title: 'Casualty Triage & Bed Availability', desc: 'Immediate resuscitation, trauma bay readiness, and ambulance reception' },
    scan: { title: 'Optical Barcode Camera Scanner', desc: 'Continuous camera acquisition and MLO1 multi-part frame detection' },
    upload: { title: 'Upload Referral Barcode Image', desc: 'Ingest photographic images of QR referral slips from external cameras' },
    progress: { title: 'Multi-Part Frame Reassembly Monitor', desc: 'Lossless chunk verification via CRC-32 and assembly of payload envelope' },
    verify: { title: 'Origin Signature & Key Decryption', desc: 'ECDSA P-256 authenticity check and PIN-prompted RSA-OAEP / AES decryption' },
    details: { title: 'Decrypted Clinical Intake Chart', desc: 'Patient history, vital signs at dispatch, medications en route, and admission' },
    history: { title: 'Received Referral Registry', desc: 'Historical archive of all received and triaged air-gap referrals' },
    offlineDb: { title: 'Hospital Local Datastore (IndexedDB)', desc: 'Inspect persistent local databases, cache status, and backup' },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.dashboard;

  return (
    <PortalLayout
      portalType="hospital"
      activePortal={activePortal}
      onChangePortal={onChangePortal}
      navItems={navItems}
      activeNav={activeTab}
      onSelectNav={(tab) => setActiveTab(tab)}
      facilityName="Maharaja Yeshwantrao District Hospital, Indore"
      facilityId="DH-INDORE-01"
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
