import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { UserPlus, CheckCircle2, AlertCircle, ArrowRight } from '../../components/common/Icons.jsx';
import { registerPatient } from '../../services/patientService.js';

export default function PatientRegistration({ currentUser = { userId: 'USR-DOC-PHC-01', role: 'PHC_DOCTOR', facilityId: 'PHC-DHAR-04' }, onPatientRegistered, onNavigate }) {
  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'MALE',
    age: '',
    dateOfBirth: '',
    contactPhone: '',
    nationalHealthId: '',
    addressVillage: '',
    district: 'Dhar',
    guardianName: '',
    guardianPhone: ''
  });
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const newPatient = await registerPatient(formData, currentUser);
      setLoading(false);

      if (onPatientRegistered) {
        onPatientRegistered(newPatient);
      }

      setNotice(`Patient ${newPatient.fullName} successfully registered with identifier ${newPatient.patientId}.`);
      setTimeout(() => {
        setNotice('');
        if (onNavigate) onNavigate('profile');
      }, 1500);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to enroll patient.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Patient Intake & Registration</h2>
        <p className="text-xs text-slate-500">
          Capture patient identification, demographics, and contact details for the local PHC registry
        </p>
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

      <Card title="Demographic Information" subtitle="Official registration fields validated against schema" icon={UserPlus}>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">National Health ID (ABHA) [Optional]</label>
              <input
                type="text"
                placeholder="e.g. 91-4567-8901-2345"
                value={formData.nationalHealthId}
                onChange={(e) => setFormData({ ...formData, nationalHealthId: e.target.value })}
                className="input-field font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="input-label">Age (Years) *</label>
              <input
                type="number"
                required
                min={0}
                max={120}
                placeholder="35"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Biological Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="input-label">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Primary Contact Telephone</label>
              <input
                type="tel"
                placeholder="+91-98765-XXXXX"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Village / Locality Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. Village Nalchha, Mandu Road"
                value={formData.addressVillage}
                onChange={(e) => setFormData({ ...formData, addressVillage: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="input-label">Guardian / Attendant Full Name</label>
              <input
                type="text"
                placeholder="e.g. Sunita Kumar (Wife)"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Guardian Emergency Phone</label>
              <input
                type="tel"
                placeholder="+91-98000-XXXXX"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate && onNavigate('patientList')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Save Patient & Open Clinical File
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
