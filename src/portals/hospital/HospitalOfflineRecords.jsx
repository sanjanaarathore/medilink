import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Database, Download, Hospital } from '../../components/common/Icons.jsx';

export default function HospitalOfflineRecords() {
  const hospitalStores = [
    { name: 'referrals_received', label: 'Decrypted Incoming Patient Referrals', count: 38, size: '1.4 MB' },
    { name: 'trusted_keys', label: 'Certified PHC Public Signing Keys', count: 18, size: '64 KB' },
    { name: 'audit_logs', label: 'Decryption & Admission Audit Logs', count: 212, size: '680 KB' },
    { name: 'local_credentials', label: 'Wrapped Hospital RSA Private Key', count: 1, size: '12 KB' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">District Hospital Local Offline Datastore</h2>
          <p className="text-xs text-slate-500">
            Client-side persistence overview for this tertiary casualty reception node
          </p>
        </div>
        <Button
          variant="outline"
          icon={Download}
          onClick={() => alert('Hospital encrypted backup package (.mlbak) exported.')}
        >
          Export Encrypted Node Backup
        </Button>
      </div>

      {/* Persistence Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-medteal-50 text-medteal-700 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">IndexedDB: medilink_offline_db (DH-INDORE-01)</div>
            <div className="text-xs text-slate-500">ACID multi-store consistency • Persistent storage granted</div>
          </div>
        </div>
        <Badge variant="success" size="sm" dot>
          Operational
        </Badge>
      </div>

      {/* Hospital Stores Breakdown */}
      <Card title="Hospital Object Stores" icon={Database}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <th className="pb-2">Object Store Name</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-center">Record Count</th>
                <th className="pb-2 text-right">Approx Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hospitalStores.map((store) => (
                <tr key={store.name} className="hover:bg-slate-50/60">
                  <td className="py-2.5 font-mono font-semibold text-slate-800">{store.name}</td>
                  <td className="py-2.5 text-slate-600">{store.label}</td>
                  <td className="py-2.5 text-center font-bold text-slate-900 font-mono">{store.count}</td>
                  <td className="py-2.5 text-right text-slate-500 font-mono">{store.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

