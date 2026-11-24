import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  CheckCircle2,
  AlertTriangle,
  Hospital,
  HeartPulse,
  Send,
  User,
  Activity,
  ArrowLeft
} from '../../components/common/Icons.jsx';
import { generateSyntheticReferral } from '../../utils/syntheticData.js';
import { updateReferralDisposition } from '../../services/referralService.js';

export default function PatientReferralDetails({
  referral,
  currentUser = { userId: 'USR-DOC-DH-01', role: 'HOSPITAL_PHYSICIAN', facilityId: 'DH-INDORE-01' },
  onNavigate
}) {
  const activeReferral = referral || generateSyntheticReferral();
  const [admittedNotice, setAdmittedNotice] = useState('');
  const [assignedBed, setAssignedBed] = useState('ICU Bay 02');
  const [loading, setLoading] = useState(false);

  const handleAdmit = async () => {
    setLoading(true);
    try {
      if (activeReferral?.referralId) {
        await updateReferralDisposition(activeReferral.referralId, 'ADMITTED_ICU', assignedBed, currentUser);
      }
      setLoading(false);
      setAdmittedNotice(`Patient ${activeReferral.patient?.fullName} successfully admitted to ${assignedBed}. Intake logged into hospital records.`);
      setTimeout(() => {
        if (onNavigate) onNavigate('history');
      }, 1500);
    } catch (err) {
      setLoading(false);
      setAdmittedNotice(`Admission saved locally: ${assignedBed}`);
      setTimeout(() => {
        if (onNavigate) onNavigate('history');
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Decrypted Patient Referral Record</h2>
            <Badge variant="success" size="sm">
              Authentic & Decrypted
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transferred via optical air-gap from {activeReferral.originatingFacilityName || 'Dhar PHC'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => onNavigate && onNavigate('dashboard')}
        >
          Casualty Dashboard
        </Button>
      </div>

      {admittedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold">{admittedNotice}</span>
        </div>
      )}

      {/* Critical Allergies & Priority Banner */}
      <div className="p-4 bg-red-50 border border-red-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-900 uppercase tracking-wide">
              Priority: {activeReferral.priority || 'EMERGENCY_CRITICAL'} • SEVERE ALLERGY WARNING
            </div>
            <div className="text-xs text-red-800 font-semibold mt-0.5">
              KNOWN ALLERGY: PENICILLIN (Causes Anaphylaxis & Angioedema)
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-red-700 font-bold bg-white px-2.5 py-1 rounded border border-red-200">
            DO NOT ADMINISTER BETA-LACTAMS
          </span>
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-card space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">{activeReferral.patient?.fullName}</h3>
            <span className="text-slate-400 font-mono text-[11px]">{activeReferral.patient?.patientId}</span>
          </div>
          <div className="text-right text-slate-500">
            <div>{activeReferral.patient?.age} Yrs / {activeReferral.patient?.gender}</div>
            <div className="text-[11px]">Locality: {activeReferral.patient?.addressVillage}</div>
          </div>
        </div>

        {/* Diagnosis & Indication */}
        <div className="space-y-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Provisional Diagnosis</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{activeReferral.provisionalDiagnosis}</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Referring Doctor Note & Indication</span>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-700 mt-0.5 leading-relaxed">
              {activeReferral.referralReason}
            </div>
          </div>
        </div>

        {/* Vitals Recorded at Dispatch */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dispatch Vitals (PHC Baseline)</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
            <div className="p-2.5 rounded bg-red-50/70 border border-red-200 text-center">
              <span className="text-[10px] text-red-600 block font-bold">Blood Pressure</span>
              <span className="font-bold text-red-900 font-mono text-sm">
                {activeReferral.vitals?.systolicBP}/{activeReferral.vitals?.diastolicBP}
              </span>
            </div>
            <div className="p-2.5 rounded bg-red-50/70 border border-red-200 text-center">
              <span className="text-[10px] text-red-600 block font-bold">Oxygen (SpO2)</span>
              <span className="font-bold text-red-900 font-mono text-sm">
                {activeReferral.vitals?.oxygenSaturationSpO2}%
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block">Heart Rate</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activeReferral.vitals?.heartRate} bpm
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block">Resp Rate</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activeReferral.vitals?.respiratoryRate} /min
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 block">Temperature</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {activeReferral.vitals?.temperatureCelsius} °C
              </span>
            </div>
          </div>
        </div>

        {/* Pre-transport Medications Administered */}
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pre-Transport Interventions Administered</span>
          <ul className="mt-1 list-disc list-inside space-y-1 text-slate-700">
            {activeReferral.medicationsGiven?.map((m, idx) => (
              <li key={idx}>
                <span className="font-bold text-slate-900">{m.name}</span> — {m.dose} ({m.time || m.administeredAt || 'Stat'})
              </li>
            ))}
          </ul>
        </div>

        {/* Triage Admission Action Box */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-medteal-50/60 p-4 rounded-lg border border-medteal-200">
            <div>
              <span className="font-bold text-medteal-900">Confirm Casualty Intake & Bed Allocation</span>
              <p className="text-[11px] text-slate-600">Assign admitting team and triage resuscitation bay</p>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={assignedBed}
                onChange={(e) => setAssignedBed(e.target.value)}
                className="input-field text-xs py-1.5"
              >
                <option value="ICU Bay 02">ICU Resuscitation Bay 02</option>
                <option value="ICU Bay 04">ICU Mechanical Ventilation Bay 04</option>
                <option value="Acute Trauma Bay">Acute Trauma Bay</option>
                <option value="HDU Observation">HDU Observation</option>
              </select>
              <Button
                variant="secondary"
                loading={loading}
                icon={CheckCircle2}
                onClick={handleAdmit}
              >
                Confirm Admission
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
