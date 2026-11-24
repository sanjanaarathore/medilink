import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  User,
  HeartPulse,
  Send,
  AlertTriangle,
  ClipboardList,
  Clock,
  ArrowRight,
  Activity
} from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS } from '../../utils/syntheticData.js';

export default function PatientProfile({ patient = SYNTHETIC_PATIENTS[0], onNavigate }) {
  const activePatient = patient || SYNTHETIC_PATIENTS[0];

  const latestVitals = {
    bp: '85/55 mmHg',
    heartRate: '128 bpm',
    respiratoryRate: '34 /min',
    spo2: '86%',
    temp: '39.2 °C',
    glucose: '142 mg/dL',
    recordedAt: 'Today, 10:20 AM'
  };

  const knownAllergies = [
    'Penicillin (Anaphylaxis & severe angioedema)',
    'Sulfonamides'
  ];

  return (
    <div className="space-y-6">
      {/* Top Patient Summary Header */}
      <div className="bg-white border border-slate-200/90 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-card">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-medgreen-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {activePatient.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{activePatient.fullName}</h2>
              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {activePatient.patientId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {activePatient.age} Years • {activePatient.gender} • Locality: {activePatient.addressVillage}, {activePatient.district}
            </p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              ABHA ID: {activePatient.nationalHealthId || 'Not linked'} • Phone: {activePatient.contactPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Button
            variant="emergency"
            icon={Send}
            onClick={() => onNavigate('createReferral')}
            className="flex-1 md:flex-initial"
          >
            Create Emergency Referral
          </Button>
          <Button
            variant="outline"
            icon={HeartPulse}
            onClick={() => onNavigate('exam')}
          >
            Record Vitals
          </Button>
        </div>
      </div>

      {/* Grid: Baseline Vitals & Medical History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Latest Clinical Vitals */}
        <div className="md:col-span-2 space-y-6">
          <Card
            title="Latest Clinical Examination & Triage Vitals"
            subtitle={`Recorded: ${latestVitals.recordedAt}`}
            icon={Activity}
            action={
              <Badge variant="emergency" size="sm" dot>
                Critical Vitals Detected
              </Badge>
            }
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Blood Pressure</span>
                <div className="text-base font-bold text-red-900 mt-1">{latestVitals.bp}</div>
                <span className="text-[10px] text-red-600 font-medium">Hypotensive Shock</span>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Oxygen Saturation (SpO2)</span>
                <div className="text-base font-bold text-red-900 mt-1">{latestVitals.spo2}</div>
                <span className="text-[10px] text-red-600 font-medium">Severe Hypoxia</span>
              </div>

              <div className="p-3 bg-red-50/70 border border-red-200/80 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Heart Rate</span>
                <div className="text-base font-bold text-red-900 mt-1">{latestVitals.heartRate}</div>
                <span className="text-[10px] text-red-600 font-medium">Tachycardia</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Respiratory Rate</span>
                <div className="text-base font-bold text-slate-900 mt-1">{latestVitals.respiratoryRate}</div>
                <span className="text-[10px] text-amber-700 font-medium">Tachypnea</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Temperature</span>
                <div className="text-base font-bold text-slate-900 mt-1">{latestVitals.temp}</div>
                <span className="text-[10px] text-amber-700 font-medium">High Grade Pyrexia</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Blood Glucose</span>
                <div className="text-base font-bold text-slate-900 mt-1">{latestVitals.glucose}</div>
                <span className="text-[10px] text-emerald-700 font-medium">Euglycemic</span>
              </div>
            </div>
          </Card>

          {/* Clinical Presentation Summary */}
          <Card
            title="Presenting Complaint & Provisional Assessment"
            icon={ClipboardList}
          >
            <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
              <p>
                Patient presents with a 4-day history of worsening productive cough with rusty sputum, high-grade rigors, and rapid breathing. Cyanosis of lips and nail beds observed. Poor response to 6 L/min low-flow oxygen.
              </p>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 font-medium text-[11px]">
                Clinical Impression: Severe Community-Acquired Pneumonia with secondary Acute Respiratory Distress Syndrome (ARDS). Urgent transfer to tertiary ICU indicated.
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Allergies & Emergency Contacts */}
        <div className="space-y-6">
          <Card
            title="Known Severe Allergies"
            icon={AlertTriangle}
          >
            <div className="space-y-2">
              {knownAllergies.map((alg, idx) => (
                <div key={idx} className="p-2.5 bg-red-50 border border-red-200/90 rounded text-xs text-red-800 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>{alg}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Guardian & Emergency Contacts"
            icon={User}
          >
            <div className="text-xs text-slate-600 space-y-2">
              <div>
                <span className="font-semibold text-slate-800">Primary Contact:</span>
                <div className="text-slate-900">{activePatient.guardianName || 'Sunita Kumar (Wife)'}</div>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Telephone:</span>
                <div className="font-mono text-slate-900">{activePatient.contactPhone}</div>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Transport Method:</span>
                <div className="text-slate-900">108 Emergency Ambulance Dispatched</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

