import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Send, QrCode } from '../../components/common/Icons.jsx';
import { getOutgoingReferrals } from '../../services/referralService.js';

export default function ReferralHistory({
  currentUser = { userId: 'USR-DOC-PHC-01', role: 'PHC_DOCTOR', facilityId: 'PHC-DHAR-04' },
  onNavigate
}) {
  const [outgoingReferrals, setOutgoingReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getOutgoingReferrals(currentUser);
        setOutgoingReferrals(data);
      } catch (err) {
        console.warn('Failed to load outgoing referrals:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
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
          <div className="text-[11px] text-slate-400">{row.patient?.age || row.age} Yrs • {row.patient?.gender || row.gender}</div>
        </div>
      )
    },
    {
      header: 'Provisional Diagnosis',
      accessor: 'provisionalDiagnosis',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium max-w-xs truncate block">
          {row.provisionalDiagnosis || row.diagnosis}
        </span>
      )
    },
    {
      header: 'Destination',
      accessor: 'destinationFacilityId',
      render: (row) => (
        <span className="font-mono text-xs text-slate-700">
          {row.destinationFacilityId || row.destination}
        </span>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <Badge variant={row.priority === 'EMERGENCY_CRITICAL' ? 'emergency' : 'urgent'} size="sm" dot>
          {row.priority}
        </Badge>
      )
    },
    {
      header: 'Dispatched At',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs font-mono text-slate-500">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'QR Matrix',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          icon={QrCode}
          onClick={() => onNavigate && onNavigate('generateQR')}
        >
          View QR
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Outgoing Referral History</h2>
          <p className="text-xs text-slate-500">
            Log of all emergency clinical referral handoffs dispatched from this Primary Health Centre
          </p>
        </div>
        <Button
          variant="primary"
          icon={Send}
          onClick={() => onNavigate && onNavigate('createReferral')}
        >
          New Referral
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={outgoingReferrals}
        keyField="referralId"
        searchPlaceholder="Search referrals by patient name, diagnosis, or UUID..."
      />
    </div>
  );
}
