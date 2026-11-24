import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Database, Download, CheckCircle2, Shield, RefreshCw } from '../../components/common/Icons.jsx';

export default function OfflineRecords() {
  const localStores = [
    { name: 'patients', label: 'Enrolled Patient Records', count: 48, size: '340 KB' },
    { name: 'referrals_outgoing', label: 'Outgoing Referrals Envelopes', count: 12, size: '820 KB' },
    { name: 'trusted_keys', label: 'Certified Public Key Directory', count: 18, size: '64 KB' },
    { name: 'audit_logs', label: 'Cryptographic Security Audit Log', count: 124, size: '410 KB' },
    { name: 'local_credentials', label: 'Wrapped Facility Private Key', count: 1, size: '8 KB' },
  ];

  const handleExportBackup = () => {
    alert('Local offline encrypted backup (.mlbak) generated from IndexedDB stores.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Local Offline Data & Storage Engine</h2>
          <p className="text-xs text-slate-500">
            IndexedDB persistence overview for this Primary Health Centre terminal
          </p>
        </div>
        <Button
          variant="outline"
          icon={Download}
          onClick={handleExportBackup}
        >
          Export Encrypted Node Backup (.mlbak)
        </Button>
      </div>

      {/* Persistence Health Banner */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-medgreen-50 text-medgreen-800 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">IndexedDB: medilink_offline_db (v1)</div>
            <div className="text-xs text-slate-500">Persistent client storage granted by browser (Zero eviction risk)</div>
          </div>
        </div>
        <Badge variant="success" size="sm" dot>
          ACID Verified
        </Badge>
      </div>

      {/* Object Stores Breakdown */}
      <Card title="Local Database Object Stores" icon={Database}>
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
              {localStores.map((store) => (
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

