import React, { useState } from 'react';
import { PORTALS } from './config/roles';
import AdminPortal from './portals/admin';
import PhcPortal from './portals/phc';
import HospitalPortal from './portals/hospital';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

/**
 * MediLink Offline Root Switchboard
 * Mounts exactly three role-based portals in a unified, offline-first React architecture.
 */
function getInitialPortal() {
  if (typeof window === 'undefined') return PORTALS.PHC;
  const params = new URLSearchParams(window.location.search);
  const queryPortal = params.get('portal')?.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (queryPortal === 'admin' || path.includes('/admin')) return PORTALS.ADMIN;
  if (queryPortal === 'hospital' || path.includes('/hospital')) return PORTALS.HOSPITAL;
  if (queryPortal === 'phc' || path.includes('/phc')) return PORTALS.PHC;
  return PORTALS.PHC;
}

export default function App() {
  const [activePortal, setActivePortal] = useState(getInitialPortal);

  return (
    <ErrorBoundary onReset={() => setActivePortal(PORTALS.PHC)}>
      <div className="min-h-screen bg-clinical-bg text-clinical-text font-sans antialiased">
        {activePortal === PORTALS.ADMIN && (
          <AdminPortal activePortal={activePortal} onChangePortal={setActivePortal} />
        )}
        {activePortal === PORTALS.PHC && (
          <PhcPortal activePortal={activePortal} onChangePortal={setActivePortal} />
        )}
        {activePortal === PORTALS.HOSPITAL && (
          <HospitalPortal activePortal={activePortal} onChangePortal={setActivePortal} />
        )}
      </div>
    </ErrorBoundary>
  );
}
