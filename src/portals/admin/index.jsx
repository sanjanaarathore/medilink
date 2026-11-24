import React, { useState } from 'react';
import { PortalLayout } from '../../components/layout/PortalLayout.jsx';
import AdminLogin from './AdminLogin.jsx';
import AdminDashboard from './AdminDashboard.jsx';
import FacilityManagement from './FacilityManagement.jsx';
import UserManagement from './UserManagement.jsx';
import RolePermissionManagement from './RolePermissionManagement.jsx';
import TrustedKeyManagement from './TrustedKeyManagement.jsx';
import AuditLogs from './AuditLogs.jsx';
import SystemSettings from './SystemSettings.jsx';
import SyncMonitoring from './SyncMonitoring.jsx';

import {
  Activity,
  Building2,
  Users,
  Shield,
  Key,
  ShieldCheck,
  Settings,
  RefreshCw,
  LogOut
} from '../../components/common/Icons.jsx';

export default function AdminPortal({ activePortal = 'admin', onChangePortal = () => {} }) {
  const [currentUser, setCurrentUser] = useState({
    userId: 'USR-ADMIN-01',
    username: 'admin.patel',
    fullName: 'Suresh Patel',
    role: 'System Administrator',
    facilityId: 'DH-INDORE-01'
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Activity },
    { key: 'facilities', label: 'Facility Management', icon: Building2 },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'roles', label: 'Roles & Permissions', icon: Shield },
    { key: 'keys', label: 'Trust & Key Directory', icon: Key },
    { key: 'audits', label: 'Security Audit Logs', icon: ShieldCheck },
    { key: 'sync', label: 'Sync Telemetry', icon: RefreshCw },
    { key: 'settings', label: 'System Settings', icon: Settings },
  ];

  if (!currentUser) {
    return <AdminLogin onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'facilities':
        return <FacilityManagement currentUser={currentUser} />;
      case 'users':
        return <UserManagement currentUser={currentUser} />;
      case 'roles':
        return <RolePermissionManagement />;
      case 'keys':
        return <TrustedKeyManagement />;
      case 'audits':
        return <AuditLogs />;
      case 'sync':
        return <SyncMonitoring />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const pageHeaders = {
    dashboard: { title: 'Admin Overview & System Health', desc: 'Central administrative monitoring and operational readiness' },
    facilities: { title: 'Healthcare Facility Directory', desc: 'Manage participating Primary Health Centres and District Hospitals' },
    users: { title: 'Authorized User Accounts', desc: 'Manage local clinician access and credential provisioning' },
    roles: { title: 'Role-Based Access Control Matrix', desc: 'Inspect least-privilege permission assignments per clinical role' },
    keys: { title: 'Public Key Trust Directory', desc: 'Certified ECDSA P-256 and RSA-OAEP keys for air-gap referral verification' },
    audits: { title: 'Cryptographic Audit Trail', desc: 'Immutable local log of patient intake, signing, and decryption events' },
    sync: { title: 'Synchronization Telemetry', desc: 'Monitor offline queue backlogs and background sync gateway status' },
    settings: { title: 'System & Security Settings', desc: 'Tuning parameters for PBKDF2 iterations, MLO1 chunk sizes, and storage' },
  };

  const currentHeader = pageHeaders[activeTab] || pageHeaders.dashboard;

  return (
    <PortalLayout
      portalType="admin"
      activePortal={activePortal}
      onChangePortal={onChangePortal}
      navItems={navItems}
      activeNav={activeTab}
      onSelectNav={(tab) => setActiveTab(tab)}
      facilityName="District Health Administration Office"
      facilityId="DH-INDORE-ADMIN"
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
