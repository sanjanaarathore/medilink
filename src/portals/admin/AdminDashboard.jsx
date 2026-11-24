import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Button.jsx';
import {
  Building2,
  Users,
  Key,
  ShieldCheck,
  Activity,
  ArrowRight,
  Database,
  RefreshCw,
  Clock
} from '../../components/common/Icons.jsx';

export default function AdminDashboard({ onNavigate }) {
  const stats = [
    { label: 'Registered Facilities', value: '18', sub: '14 PHCs, 4 Hospitals', icon: Building2, color: 'text-medgreen-800', bg: 'bg-medgreen-50' },
    { label: 'Authorized Users', value: '64', sub: 'Doctors, Nurses, Admins', icon: Users, color: 'text-medteal-700', bg: 'bg-medteal-50' },
    { label: 'Active Trust Keys', value: '18', sub: 'ECDSA P-256 + RSA-OAEP', icon: Key, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Audit Log Entries', value: '1,248', sub: '100% Immutable local log', icon: ShieldCheck, color: 'text-blue-700', bg: 'bg-blue-50' },
  ];

  const recentFacilities = [
    { id: 'PHC-DHAR-04', name: 'Dhar Primary Health Centre', type: 'PHC', district: 'Dhar', status: 'ACTIVE', keys: 'Provisioned' },
    { id: 'DH-INDORE-01', name: 'MY District Hospital, Indore', type: 'DISTRICT_HOSPITAL', district: 'Indore', status: 'ACTIVE', keys: 'Provisioned' },
    { id: 'PHC-NALCHHA-02', name: 'Nalchha Health Sub-Centre', type: 'PHC', district: 'Dhar', status: 'ACTIVE', keys: 'Provisioned' },
    { id: 'CHC-BADNAWAR-01', name: 'Badnawar Community Health Centre', type: 'CHC', district: 'Dhar', status: 'ACTIVE', keys: 'Provisioned' }
  ];

  const systemHealth = [
    { parameter: 'IndexedDB Database Engine', status: 'OPERATIONAL', details: 'medilink_offline_db (v1) - 8 stores active' },
    { parameter: 'Web Crypto API Subsystem', status: 'OPERATIONAL', details: 'Native browser SubtleCrypto hardware-accelerated' },
    { parameter: 'PWA Service Worker Cache', status: 'ACTIVE', details: 'All 42 static bundles pre-cached for offline access' },
    { parameter: 'Air-Gap Key Trust Directory', status: 'VALIDATED', details: '18/18 active certificates valid through 2028' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-white border border-medgreen-200/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-medgreen-50 text-medgreen-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">District Health Network: Fully Operational</h3>
            <p className="text-xs text-slate-500">
              Offline cryptographic directory synchronized. All 18 participating clinics configured with valid keys.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('keys')}
            className="px-3 py-1.5 text-xs font-semibold rounded-md bg-medgreen-900 text-white hover:bg-medgreen-800 transition-colors"
          >
            Manage Public Keys
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
                <div className={`w-8 h-8 rounded-md ${s.bg} ${s.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{s.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Facility Status & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Healthcare Facilities Quick List */}
        <Card
          title="Facility Registry Overview"
          subtitle="Registered health centers and hospital nodes"
          icon={Building2}
          action={
            <button
              onClick={() => onNavigate('facilities')}
              className="text-xs font-semibold text-medgreen-800 hover:text-medgreen-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="pb-2">Facility Name</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Crypto Keys</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentFacilities.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-medium text-slate-800">{f.name}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                        {f.type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Badge variant="success" size="sm" dot>
                        {f.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right text-emerald-700 font-medium">
                      {f.keys}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* System Health & Cryptographic Diagnostics */}
        <Card
          title="System Subsystem Diagnostics"
          subtitle="Health status of client-side offline engines"
          icon={Activity}
          action={
            <button
              onClick={() => onNavigate('sync')}
              className="text-xs font-semibold text-medgreen-800 hover:text-medgreen-950 flex items-center gap-1"
            >
              <span>Sync Monitor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="space-y-3">
            {systemHealth.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">{item.parameter}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{item.details}</div>
                </div>
                <Badge variant="success" size="sm" dot>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

