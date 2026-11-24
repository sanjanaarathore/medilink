import React, { useState, useEffect } from 'react';
import { DataTable, Modal } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Building2, Plus, CheckCircle2, AlertCircle } from '../../components/common/Icons.jsx';
import { getAllFacilities, registerFacility } from '../../services/facilityService.js';

export default function FacilityManagement({ currentUser = { userId: 'USR-ADMIN-01', role: 'ADMIN', facilityId: 'DH-INDORE-01' } }) {
  const [facilities, setFacilities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    facilityId: '',
    name: '',
    type: 'PRIMARY_HEALTH_CENTRE',
    district: 'Dhar',
    state: 'Madhya Pradesh',
    contactNumber: ''
  });
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadFacilities = async () => {
    try {
      const data = await getAllFacilities();
      setFacilities(data);
    } catch (err) {
      setErrorMessage('Failed to load facilities from IndexedDB: ' + err.message);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleAddFacility = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const newFacility = await registerFacility(formData, currentUser);
      setLoading(false);
      setIsModalOpen(false);
      setFormData({
        facilityId: '',
        name: '',
        type: 'PRIMARY_HEALTH_CENTRE',
        district: 'Dhar',
        state: 'Madhya Pradesh',
        contactNumber: ''
      });
      setSuccessNotice(`Facility ${newFacility.name} (${newFacility.facilityId}) successfully registered.`);
      await loadFacilities();
      setTimeout(() => setSuccessNotice(''), 4000);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to register facility.');
    }
  };

  const columns = [
    {
      header: 'Facility Code',
      accessor: 'facilityId',
      cellClassName: 'font-mono text-xs font-semibold text-slate-800'
    },
    {
      header: 'Facility Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-[11px] text-slate-400">{row.district}, {row.state}</div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
          {row.type}
        </span>
      )
    },
    {
      header: 'Contact Phone',
      accessor: 'contactNumber',
      cellClassName: 'text-xs text-slate-600 font-mono'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm" dot>
          {row.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Healthcare Facility Registry</h2>
          <p className="text-xs text-slate-500">
            Configure participating Primary Health Centres, Community Health Centres, and District Hospitals
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setErrorMessage('');
            setIsModalOpen(true);
          }}
        >
          Register New Facility
        </Button>
      </div>

      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={facilities}
        keyField="facilityId"
        searchPlaceholder="Search by facility code, name, or district..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Healthcare Facility"
        subtitle="Provision a new clinical node in the local IndexedDB registry"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleAddFacility}>
              Confirm & Save Facility
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddFacility} className="space-y-4">
          <div>
            <label className="input-label">Facility Identifier (Unique Code) *</label>
            <input
              type="text"
              required
              placeholder="e.g. PHC-SARDARPUR-01"
              value={formData.facilityId}
              onChange={(e) => setFormData({ ...formData, facilityId: e.target.value.toUpperCase() })}
              className="input-field font-mono"
            />
          </div>

          <div>
            <label className="input-label">Official Facility Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sardarpur Primary Health Centre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Facility Tier *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input-field"
              >
                <option value="PRIMARY_HEALTH_CENTRE">Primary Health Centre (PHC)</option>
                <option value="DISTRICT_HOSPITAL">District Hospital (DH)</option>
                <option value="COMMUNITY_HEALTH_CENTRE">Community Health Centre (CHC)</option>
              </select>
            </div>
            <div>
              <label className="input-label">District *</label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Contact Telephone Number</label>
            <input
              type="tel"
              placeholder="+91-7292-XXXXXX"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              className="input-field"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
