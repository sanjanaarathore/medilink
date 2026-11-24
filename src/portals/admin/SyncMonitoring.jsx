import React, { useState, useEffect } from 'react';
import { Card, DataTable } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { RefreshCw, Wifi, WifiOff, CheckCircle2, Clock, Database, AlertTriangle } from '../../components/common/Icons.jsx';
import { getSyncQueue, processSyncQueue, purgeCompletedSyncRecords, SYNC_STATUS } from '../../services/syncService.js';
import { useOfflineStatus } from '../../hooks/index.js';

export default function SyncMonitoring({ currentUser = { userId: 'USR-ADMIN-01', role: 'ADMIN', facilityId: 'DH-INDORE-01' } }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');
  const [queueItems, setQueueItems] = useState([]);
  const { isOnline } = useOfflineStatus();

  const loadQueue = async () => {
    try {
      const items = await getSyncQueue();
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load sync queue:', err);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncNotice('');

    try {
      const result = await processSyncQueue(null, currentUser);
      await loadQueue();
      setIsSyncing(false);
      if (!result.isOnline) {
        setSyncNotice('Device is currently offline. Queue evaluation completed; synchronization will resume when internet connectivity is detected.');
      } else {
        setSyncNotice(`Batch sync completed: ${result.successCount} items processed, ${result.failureCount} failed, ${result.conflictCount} conflicts resolved.`);
      }
      setTimeout(() => setSyncNotice(''), 6000);
    } catch (err) {
      setIsSyncing(false);
      setSyncNotice(`Sync exception: ${err.message}`);
    }
  };

  const pendingCount = queueItems.filter(
    (i) => i.status === SYNC_STATUS.PENDING || i.status === SYNC_STATUS.FAILED
  ).length;

  const syncedCount = queueItems.filter((i) => i.status === SYNC_STATUS.SYNCED).length;

  const columns = [
    {
      header: 'Queue Identifier',
      accessor: 'syncId',
      cellClassName: 'font-mono text-xs font-semibold text-slate-800',
      render: (row) => <span>#SYNC-{row.syncId}</span>
    },
    {
      header: 'Entity / Record',
      accessor: 'entityId',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900">{row.entityType}</span>
          <span className="font-mono text-slate-500 ml-2 text-xs">({row.entityId ? row.entityId.slice(0, 12) : ''}...)</span>
        </div>
      )
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
          {row.action}
        </span>
      )
    },
    {
      header: 'Sync Status',
      accessor: 'status',
      render: (row) => {
        let variant = 'warning';
        if (row.status === SYNC_STATUS.SYNCED) variant = 'success';
        if (row.status === SYNC_STATUS.FAILED) variant = 'danger';
        if (row.status === SYNC_STATUS.SYNCING) variant = 'info';

        return (
          <Badge variant={variant} size="sm" dot>
            {row.status}
          </Badge>
        );
      }
    },
    {
      header: 'Queued At',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleTimeString() : 'N/A'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Synchronization & Queue Telemetry</h2>
          <p className="text-xs text-slate-500">
            Monitor the asynchronous background cloud synchronization worker and outgoing referral queue
          </p>
        </div>
        <Button
          variant="secondary"
          icon={RefreshCw}
          loading={isSyncing}
          onClick={handleManualSync}
        >
          Trigger Asynchronous Batch Sync
        </Button>
      </div>

      {syncNotice && (
        <div className="p-3 bg-medteal-50 border border-medteal-200 rounded-md flex items-center space-x-2 text-xs text-medteal-900">
          <CheckCircle2 className="w-4 h-4 text-medteal-700 flex-shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Connectivity & Node Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network Connection</div>
          <div className="mt-2 flex items-center space-x-2">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-emerald-600" />
                <span className="text-base font-bold text-slate-900">Active Network</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-amber-600" />
                <span className="text-base font-bold text-slate-900">Pure Air-Gap Offline</span>
              </>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Core referral flows operate 100% offline</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queued Outgoing Items</div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Pending background upload</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-card">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Synchronized Items</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tracking-tight">{syncedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Automated non-blocking background queue</div>
        </div>
      </div>

      {/* Pending Sync Queue Table */}
      <Card
        title="Pending Outgoing Referral Sync Queue"
        subtitle={`${queueItems.length} records staged in local IndexedDB`}
        icon={Database}
      >
        <DataTable
          columns={columns}
          data={queueItems}
          emptyMessage="No operations currently queued. Local store is synchronized."
        />
      </Card>
    </div>
  );
}
