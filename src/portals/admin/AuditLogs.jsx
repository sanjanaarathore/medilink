import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Button.jsx';
import { getAuditLogs } from '../../services/auditService.js';

export default function AuditLogs() {
  const [auditEntries, setAuditEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const logs = await getAuditLogs();
        setAuditEntries(logs);
      } catch (err) {
        console.warn('Failed to load audit logs:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const columns = [
    {
      header: 'Log ID',
      accessor: 'logId',
      cellClassName: 'font-mono text-xs text-slate-500'
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Security Action',
      accessor: 'action',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-medgreen-900 bg-slate-100 px-2 py-0.5 rounded">
          {row.action}
        </span>
      )
    },
    {
      header: 'Actor & Node',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800 text-xs">{row.userId}</span>
          <span className="text-[11px] text-slate-400 font-mono ml-1.5">({row.facilityId})</span>
        </div>
      )
    },
    {
      header: 'Audit Description',
      accessor: 'details',
      cellClassName: 'text-xs text-slate-600 max-w-md truncate'
    },
    {
      header: 'Outcome',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'SUCCESS' ? 'success' : 'emergency'} size="sm" dot>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">System Security Audit Logs</h2>
          <p className="text-xs text-slate-500">
            Immutable, append-only local event log recording all cryptographic operations and clinical state changes
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={auditEntries}
        keyField="logId"
        searchPlaceholder="Search audit log by action, user ID, or event details..."
      />
    </div>
  );
}
