import React, { useState, useEffect } from 'react';
import { DataTable } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Users, Plus, Send, Stethoscope } from '../../components/common/Icons.jsx';
import { getAllPatients } from '../../services/patientService.js';

export default function PatientList({
  currentUser = { userId: 'USR-DOC-PHC-01', role: 'PHC_DOCTOR', facilityId: 'PHC-DHAR-04' },
  onSelectPatient,
  onNavigate
}) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = async () => {
    try {
      const data = await getAllPatients(currentUser);
      setPatients(data);
    } catch (err) {
      console.warn('Failed to load patients:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const columns = [
    {
      header: 'Patient Identifier',
      accessor: 'patientId',
      cellClassName: 'font-mono text-xs font-semibold text-slate-800'
    },
    {
      header: 'Full Legal Name',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.fullName}</div>
          <div className="text-[11px] text-slate-400">
            {row.age} Yrs • {row.gender} • ABHA: {row.nationalHealthId || 'Not Linked'}
          </div>
        </div>
      )
    },
    {
      header: 'Village / Locality',
      accessor: 'addressVillage',
      cellClassName: 'text-xs text-slate-600'
    },
    {
      header: 'Contact Phone',
      accessor: 'contactPhone',
      cellClassName: 'text-xs font-mono text-slate-600'
    },
    {
      header: 'Emergency Contact',
      accessor: 'guardianName',
      cellClassName: 'text-xs text-slate-600'
    },
    {
      header: 'Clinical Actions',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPatient(row);
              onNavigate('profile');
            }}
          >
            Clinical Chart
          </Button>
          <Button
            variant="emergency"
            size="sm"
            icon={Send}
            onClick={(e) => {
              e.stopPropagation();
              onSelectPatient(row);
              onNavigate('createReferral');
            }}
          >
            Refer
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Enrolled Patient Registry</h2>
          <p className="text-xs text-slate-500">
            Search local PHC patient records, inspect medical histories, or initiate emergency referrals
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => onNavigate('register')}
        >
          Register New Patient
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={patients}
        keyField="patientId"
        searchPlaceholder="Search by patient ID, name, village, or ABHA..."
        onRowClick={(row) => {
          onSelectPatient(row);
          onNavigate('profile');
        }}
      />
    </div>
  );
}
