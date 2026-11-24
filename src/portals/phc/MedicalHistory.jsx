import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { ClipboardList, CheckCircle2, AlertTriangle, Plus } from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS } from '../../utils/syntheticData.js';

export default function MedicalHistory({ patient = SYNTHETIC_PATIENTS[0] }) {
  const [history, setHistory] = useState({
    chronicConditions: ['Hypertension (Stage 1, diagnosed 2023)', 'Type 2 Diabetes Mellitus (on Metformin)'],
    pastSurgeries: ['Appendectomy (2018)'],
    allergies: ['Penicillin (Severe urticaria and facial angioedema)', 'Sulfonamides'],
    familyHistory: 'Father had early CAD (Myocardial Infarction at age 52). Mother has Hypertension.'
  });
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [notice, setNotice] = useState('');

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    setHistory({ ...history, chronicConditions: [...history.chronicConditions, newCondition.trim()] });
    setNewCondition('');
    setNotice('Condition added to patient history.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    setHistory({ ...history, allergies: [...history.allergies, newAllergy.trim()] });
    setNewAllergy('');
    setNotice('Allergy flag added to patient record.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Medical History: {patient?.fullName || 'Aarav Kumar'}
          </h2>
          <p className="text-xs text-slate-500">
            Persistent chronic diagnoses, allergies, and past interventions transferred across clinical referrals
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Allergies Warning Card */}
      <Card
        title="Drug & Environmental Allergies"
        subtitle="Mandatory alert flags transferred directly in encrypted referral payload"
        icon={AlertTriangle}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            {history.allergies.map((alg, idx) => (
              <div key={idx} className="p-2.5 bg-red-50 border border-red-200 rounded-md text-xs font-semibold text-red-800 flex items-center justify-between">
                <span>{alg}</span>
                <span className="text-[10px] uppercase tracking-wider text-red-600 font-bold bg-red-100 px-1.5 py-0.5 rounded">High Severity</span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Ciprofloxacin (causes skin rash)"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              className="input-field text-xs"
            />
            <Button variant="outline" size="sm" icon={Plus} onClick={handleAddAllergy}>
              Add Allergy
            </Button>
          </div>
        </div>
      </Card>

      {/* Chronic Diagnoses Card */}
      <Card
        title="Chronic Medical Conditions & Comorbidities"
        icon={ClipboardList}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            {history.chronicConditions.map((cond, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 flex items-center justify-between">
                <span>{cond}</span>
                <span className="text-[10px] text-slate-500 font-mono">Active</span>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Chronic Kidney Disease (Stage 2)"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              className="input-field text-xs"
            />
            <Button variant="outline" size="sm" icon={Plus} onClick={handleAddCondition}>
              Add Condition
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

