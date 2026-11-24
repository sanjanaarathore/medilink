import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Inbox, Eye } from '../../components/common/Icons.jsx';
import { getReceivedReferrals } from '../../services/referralService.js';

export default function ReceivedReferralHistory({
  currentUser = { userId: 'USR-TRIAGE-DH-01', role: 'HOSPITAL_TRIAGE', facilityId: 'DH-INDORE-01' },
  onNavigate
}) {
  const [receivedReferrals, setReceivedReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceived() {
      try {
        const data = await getReceivedReferrals(currentUser);
        setReceivedReferrals(data);
      } catch (err) {
        console.warn('Failed to load received referrals:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadReceived();
  }, [currentUser]);

  const columns = [
    {
      header: 'Referral UUID',
      accessor: 'referralId',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {row.referralId ? row.referralId.slice(0, 8) : 'd3b07384'}...
        </span>
      )
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.patient?.fullName || row.patientName}</div>
          <div className="text-[11px] text-slate-400">
            {row.patient?.age || row.age || 32}Y, {row.patient?.gender || row.gender || 'M'}
          </div>
        </div>
      )
    },
    {
      header: 'Originating PHC',
      accessor: 'originatingFacilityId',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.originatingFacilityId || row.origin || 'PHC-DHAR-04'}
        </span>
      )
    },
    {
      header: 'Clinical Indication',
      accessor: 'provisionalDiagnosis',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium max-w-xs truncate block">
          {row.provisionalDiagnosis || row.diagnosis || 'Acute Respiratory Distress'}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <Badge variant={row.priority === 'EMERGENCY_CRITICAL' ? 'emergency' : 'urgent'} size="sm" dot>
          {row.priority || 'EMERGENCY_CRITICAL'}
        </Badge>
      )
    },
    {
      header: 'Disposition / Bed',
      render: (row) => (
        <div>
          <div className="font-semibold text-xs text-slate-800">{row.assignedBed || 'ICU Bay 02'}</div>
          <div className="text-[10px] text-emerald-700 font-medium font-mono">{row.triageStatus || 'TRIAGED'}</div>
        </div>
      )
    },
    {
      header: 'Received At',
      accessor: 'receivedAt',
      render: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(row.receivedAt || row.createdAt || Date.now()).toLocaleTimeString()}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => onNavigate && onNavigate('details')}
        >
          View Chart
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Received Referral Registry</h2>
          <p className="text-xs text-slate-500">
            Log of all air-gapped emergency clinical referrals received and admitted at this District Hospital
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={receivedReferrals}
        keyField="referralId"
        searchPlaceholder="Search received referrals by patient name, origin, or UUID..."
      />
    </div>
  );
}
