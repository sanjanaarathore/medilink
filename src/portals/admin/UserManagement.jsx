import React, { useState, useEffect } from 'react';
import { DataTable, Modal } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Users, Plus, CheckCircle2, Lock, AlertCircle } from '../../components/common/Icons.jsx';
import { getAllUsers, provisionUser } from '../../services/userService.js';
import { ROLES } from '../../config/roles.js';

export default function UserManagement({ currentUser = { userId: 'USR-ADMIN-01', role: 'ADMIN', facilityId: 'DH-INDORE-01' } }) {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    role: ROLES.PHC_DOCTOR,
    facilityId: 'PHC-DHAR-04',
    pin: '1234'
  });
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setErrorMessage('Failed to load users: ' + err.message);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const newUser = await provisionUser(formData, currentUser);
      setLoading(false);
      setIsModalOpen(false);
      setFormData({
        username: '',
        fullName: '',
        role: ROLES.PHC_DOCTOR,
        facilityId: 'PHC-DHAR-04',
        pin: '1234'
      });
      setNotice(`User ${newUser.fullName} successfully provisioned with role ${newUser.role}.`);
      await loadUsers();
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to provision user.');
    }
  };

  const columns = [
    {
      header: 'User Identifier',
      accessor: 'userId',
      cellClassName: 'font-mono text-xs text-slate-600'
    },
    {
      header: 'Full Name & Username',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.fullName}</div>
          <div className="text-[11px] text-slate-400 font-mono">@{row.username}</div>
        </div>
      )
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-medgreen-50 text-medgreen-900 border border-medgreen-200/60 font-semibold text-[11px]">
          {row.role}
        </span>
      )
    },
    {
      header: 'Facility Node',
      accessor: 'facilityId',
      cellClassName: 'font-mono text-xs text-slate-700'
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
          <h2 className="text-base font-bold text-slate-900">User Access Management</h2>
          <p className="text-xs text-slate-500">
            Provision clinical staff, medical officers, triage leads, and administrators
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
          Provision New User
        </Button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
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
        data={users}
        keyField="userId"
        searchPlaceholder="Search by name, username, or role..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision Authorized User"
        subtitle="Create an authorized local user profile with PBKDF2 salted credential hash"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={handleAddUser}>
              Provision User
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Username *</label>
              <input
                type="text"
                required
                placeholder="e.g. dr.anand"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Full Clinical Name *</label>
              <input
                type="text"
                required
                placeholder="Dr. Anand Verma, MBBS"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Assigned Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input-field"
              >
                <option value={ROLES.PHC_DOCTOR}>PHC Medical Officer (Doctor)</option>
                <option value={ROLES.PHC_STAFF}>PHC Staff / Nurse</option>
                <option value={ROLES.HOSPITAL_TRIAGE}>Hospital Triage Lead</option>
                <option value={ROLES.HOSPITAL_PHYSICIAN}>Hospital Physician / Specialist</option>
                <option value={ROLES.ADMIN}>System Administrator</option>
                <option value={ROLES.AUDITOR}>Healthcare Auditor</option>
              </select>
            </div>
            <div>
              <label className="input-label">Assigned Facility Node *</label>
              <select
                value={formData.facilityId}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                className="input-field font-mono text-xs"
              >
                <option value="PHC-DHAR-04">PHC-DHAR-04 (Dhar PHC)</option>
                <option value="PHC-NALCHHA-02">PHC-NALCHHA-02 (Nalchha)</option>
                <option value="DH-INDORE-01">DH-INDORE-01 (MY Hospital)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="input-label">Initial Authorization PIN *</label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                className="input-field font-mono tracking-widest"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Hashed with 128-bit salt before storage. Never stored in plaintext.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
