import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Send, AlertTriangle, Building2, Plus, ArrowRight, AlertCircle } from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS } from '../../utils/syntheticData.js';
import { createReferral } from '../../services/referralService.js';
import { getAllFacilities } from '../../services/facilityService.js';

export default function CreateReferral({
  patient = SYNTHETIC_PATIENTS[0],
  currentUser = { userId: 'USR-DOC-PHC-01', fullName: 'Dr. Rajesh Sharma, MBBS', role: 'PHC_DOCTOR', facilityId: 'PHC-DHAR-04' },
  onReferralReady,
  onNavigate
}) {
  const activePatient = patient || SYNTHETIC_PATIENTS[0];

  const [destinationHospital, setDestinationHospital] = useState('DH-INDORE-01');
  const [facilities, setFacilities] = useState([]);
  const [priority, setPriority] = useState('EMERGENCY_CRITICAL');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState(
    'Severe Community-Acquired Pneumonia with Acute Respiratory Distress Syndrome (ARDS)'
  );
  const [referralReason, setReferralReason] = useState(
    'Acute hypoxia (SpO2 86% on 6L O2) and respiratory exhaustion unresponsive to initial bronchodilators and antibiotics. Requires tertiary ICU admission, mechanical ventilatory support, and critical monitoring.'
  );
  const [medications, setMedications] = useState([
    { name: 'IV Ceftriaxone', dose: '1g IV stat', time: '10:00 AM' },
    { name: 'Nebulized Salbutamol + Ipratropium', dose: '2.5mg / 0.5mg', time: '10:10 AM' },
    { name: 'IV Hydrocortisone', dose: '100mg IV stat', time: '10:15 AM' }
  ]);
  const [newMed, setNewMed] = useState({ name: '', dose: '', time: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadReceivingFacilities() {
      try {
        const facs = await getAllFacilities();
        const destOptions = facs.filter((f) => f.facilityId !== currentUser.facilityId);
        setFacilities(destOptions);
        if (destOptions.length > 0 && !destinationHospital) {
          setDestinationHospital(destOptions[0].facilityId);
        }
      } catch (err) {
        console.warn('Failed to load facilities:', err.message);
      }
    }
    loadReceivingFacilities();
  }, [currentUser.facilityId]);

  const handleAddMed = () => {
    if (!newMed.name) return;
    setMedications([...medications, { ...newMed, time: newMed.time || 'En route' }]);
    setNewMed({ name: '', dose: '', time: '' });
  };

  const handleProceedToPreview = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const selectedFac = facilities.find((f) => f.facilityId === destinationHospital);
      const referralInput = {
        destinationFacilityId: destinationHospital,
        destinationFacilityName: selectedFac?.name || 'District Hospital Indore',
        originatingFacilityName: 'Dhar Primary Health Centre',
        priority,
        patient: activePatient,
        provisionalDiagnosis,
        referralReason,
        medicationsGiven: medications,
        allergies: activePatient?.medicalHistory?.allergies || ['Penicillin', 'Sulfonamides'],
        vitals: activePatient?.latestVitals || {
          systolicBP: 85,
          diastolicBP: 55,
          heartRate: 128,
          respiratoryRate: 34,
          temperatureCelsius: 39.2,
          oxygenSaturationSpO2: 86
        }
      };

      const created = await createReferral(referralInput, currentUser);
      setLoading(false);

      if (onReferralReady) {
        onReferralReady(created);
      }
      if (onNavigate) {
        onNavigate('preview');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to create referral.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Create Secure Patient Referral</h2>
          <p className="text-xs text-slate-500">
            Escalate acute patient to tertiary care with schema validation and IndexedDB durability
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Patient Mini Banner */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-900">{activePatient.fullName}</div>
          <div className="text-[11px] text-slate-500">
            ID: <span className="font-mono">{activePatient.patientId}</span> • {activePatient.age} Yrs • {activePatient.gender} • Locality: {activePatient.addressVillage}
          </div>
        </div>
        <Badge variant={priority === 'EMERGENCY_CRITICAL' ? 'emergency' : 'urgent'} size="sm">
          {priority}
        </Badge>
      </div>

      <form onSubmit={handleProceedToPreview} className="space-y-6">
        <Card title="Referral Destination & Urgency" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="input-label">Destination Healthcare Facility *</label>
              <select
                value={destinationHospital}
                onChange={(e) => setDestinationHospital(e.target.value)}
                className="input-field"
              >
                {facilities.length > 0 ? (
                  facilities.map((f) => (
                    <option key={f.facilityId} value={f.facilityId}>
                      {f.name} ({f.type})
                    </option>
                  ))
                ) : (
                  <option value="DH-INDORE-01">Maharaja Yeshwantrao District Hospital, Indore (Tertiary / ICU)</option>
                )}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Recipient public key will be retrieved from the certified Trust Directory to encrypt AES session key.
              </p>
            </div>

            <div>
              <label className="input-label">Referral Priority Triage *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field font-semibold text-red-900 bg-red-50/30"
              >
                <option value="EMERGENCY_CRITICAL">EMERGENCY CRITICAL (Immediate Life Threat / Golden Hour)</option>
                <option value="URGENT">URGENT (Stabilized, requires specialized evaluation &lt; 4 hours)</option>
                <option value="ROUTINE">ROUTINE (Elective or non-acute diagnostic escalation)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Clinical Impression & Indication" icon={Send}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="input-label">Provisional Clinical Diagnosis *</label>
              <input
                type="text"
                required
                value={provisionalDiagnosis}
                onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                className="input-field font-semibold"
              />
            </div>

            <div>
              <label className="input-label">Specific Indication / Reason for Referral *</label>
              <textarea
                rows={3}
                required
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </Card>

        <Card title="Pre-Transport Interventions & Medications Administered" icon={AlertTriangle}>
          <div className="space-y-3 text-xs">
            <div className="space-y-2">
              {medications.map((m, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{m.name}</span>
                    <span className="text-slate-500 ml-2 font-mono">({m.dose})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Administered: {m.time}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Medication name (e.g. IV Furosemide)"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 40mg stat)"
                value={newMed.dose}
                onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                className="input-field"
              />
              <Button variant="outline" size="sm" icon={Plus} onClick={handleAddMed}>
                Add Drug
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
          >
            Review Clinical Package & Cryptographically Sign
          </Button>
        </div>
      </form>
    </div>
  );
}
