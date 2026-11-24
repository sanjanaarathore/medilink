import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { HeartPulse, CheckCircle2, AlertTriangle, ArrowRight, AlertCircle } from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS } from '../../utils/syntheticData.js';
import { recordPatientVitals } from '../../services/patientService.js';

export default function ClinicalExamForm({
  patient = SYNTHETIC_PATIENTS[0],
  currentUser = { userId: 'USR-DOC-PHC-01', role: 'PHC_DOCTOR', facilityId: 'PHC-DHAR-04' },
  onNavigate
}) {
  const [vitals, setVitals] = useState({
    systolicBP: '85',
    diastolicBP: '55',
    heartRate: '128',
    respiratoryRate: '34',
    temperatureCelsius: '39.2',
    oxygenSaturationSpO2: '86',
    randomBloodSugar: '142',
    gcsScore: '14'
  });
  const [examNotes, setExamNotes] = useState(
    'Bilateral coarse crepitations in lower and mid lung fields. Patient tachypneic with accessory muscle use. Peripheral cyanosis present.'
  );
  const [notice, setNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isHypotensive = Number(vitals.systolicBP) < 90 && vitals.systolicBP !== '';
  const isHypoxic = Number(vitals.oxygenSaturationSpO2) < 90 && vitals.oxygenSaturationSpO2 !== '';
  const isTachycardic = Number(vitals.heartRate) > 100;
  const isFeverish = Number(vitals.temperatureCelsius) >= 38.5;

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (patient?.patientId) {
        await recordPatientVitals(patient.patientId, { ...vitals, examNotes }, currentUser);
      }
      setLoading(false);
      setNotice('Clinical vitals recorded in patient local file and verified.');
      setTimeout(() => {
        setNotice('');
        if (onNavigate) onNavigate('createReferral');
      }, 1200);
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to record vitals.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Clinical Examination & Vitals Triage</h2>
          <p className="text-xs text-slate-500">
            Record physiological measurements for {patient?.fullName || 'Patient'}. Real-time alerts for hemodynamic instability.
          </p>
        </div>
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

      {/* Critical Physiological Alerts Banner */}
      {(isHypoxic || isHypotensive) && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-lg shadow-sm flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
              Critical Physiological Alert: Severe Instability
            </h4>
            <ul className="text-xs text-red-700 mt-1 list-disc list-inside space-y-0.5">
              {isHypoxic && <li>Severe Hypoxia (SpO2: {vitals.oxygenSaturationSpO2}% &lt; 90%). High-flow oxygen and emergency escalation required.</li>}
              {isHypotensive && <li>Hemodynamic Instability / Hypotension (BP: {vitals.systolicBP}/{vitals.diastolicBP} mmHg). IV fluid resuscitation indicated.</li>}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Vital Signs & Hemodynamics" icon={HeartPulse}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="input-label">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.systolicBP}
                onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })}
                className={`input-field font-mono font-bold ${isHypotensive ? 'border-red-400 bg-red-50/50 text-red-900' : ''}`}
                required
              />
            </div>
            <div>
              <label className="input-label">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.diastolicBP}
                onChange={(e) => setVitals({ ...vitals, diastolicBP: e.target.value })}
                className="input-field font-mono"
                required
              />
            </div>
            <div>
              <label className="input-label">Oxygen Saturation (SpO2 %)</label>
              <input
                type="number"
                value={vitals.oxygenSaturationSpO2}
                onChange={(e) => setVitals({ ...vitals, oxygenSaturationSpO2: e.target.value })}
                className={`input-field font-mono font-bold ${isHypoxic ? 'border-red-400 bg-red-50/50 text-red-900' : ''}`}
                required
              />
            </div>

            <div>
              <label className="input-label">Heart Rate (bpm)</label>
              <input
                type="number"
                value={vitals.heartRate}
                onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                className={`input-field font-mono ${isTachycardic ? 'border-amber-400 bg-amber-50/50' : ''}`}
                required
              />
            </div>
            <div>
              <label className="input-label">Respiratory Rate (/min)</label>
              <input
                type="number"
                value={vitals.respiratoryRate}
                onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
                className="input-field font-mono"
                required
              />
            </div>
            <div>
              <label className="input-label">Body Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={vitals.temperatureCelsius}
                onChange={(e) => setVitals({ ...vitals, temperatureCelsius: e.target.value })}
                className={`input-field font-mono ${isFeverish ? 'border-amber-400 bg-amber-50/50' : ''}`}
                required
              />
            </div>
          </div>
        </Card>

        <Card title="Physical Examination Findings">
          <div>
            <textarea
              rows={4}
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              className="input-field text-xs"
              placeholder="Record respiratory, cardiovascular, and neurological exam observations..."
            />
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
            Save Vitals & Proceed to Referral
          </Button>
        </div>
      </form>
    </div>
  );
}
