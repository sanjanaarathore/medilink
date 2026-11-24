import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  Scan,
  Hospital,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Upload,
  Activity,
  HeartPulse
} from '../../components/common/Icons.jsx';

export default function HospitalDashboard({ onNavigate }) {
  const metrics = [
    { label: 'Critical Arrivals Today', value: '14', sub: 'Escalated from rural PHCs', icon: AlertTriangle, color: 'text-emergency-600', bg: 'bg-red-50' },
    { label: 'Optical QR Ingestions', value: '12', sub: '100% Signature verified', icon: Scan, color: 'text-medteal-700', bg: 'bg-medteal-50' },
    { label: 'Active ICU Resuscitation', value: '5', sub: 'Admitted from PHC triage', icon: HeartPulse, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Decryption Success Rate', value: '100%', sub: 'Zero auth tag failures', icon: CheckCircle2, color: 'text-medgreen-800', bg: 'bg-medgreen-50' },
  ];

  const incomingIntake = [
    {
      id: 'd3b07384',
      origin: 'PHC-DHAR-04 (Dhar PHC)',
      patientName: 'Aarav Kumar',
      age: 32,
      gender: 'M',
      diagnosis: 'Severe Pneumonia / ARDS (SpO2 86%)',
      priority: 'EMERGENCY_CRITICAL',
      status: 'ARRIVING_NOW',
      assignedBed: 'ICU Bed 04'
    },
    {
      id: 'f94101e2',
      origin: 'PHC-DHAR-04 (Dhar PHC)',
      patientName: 'Meera Bai',
      age: 28,
      gender: 'F',
      diagnosis: 'Severe Pre-eclampsia (BP 170/110)',
      priority: 'EMERGENCY_CRITICAL',
      status: 'TRIAGED',
      assignedBed: 'Obstetric HDU 02'
    },
    {
      id: 'c81920aa',
      origin: 'PHC-NALCHHA-02',
      patientName: 'Suresh Verma',
      age: 46,
      gender: 'M',
      diagnosis: 'Acute Abdomen / Suspected Perforation',
      priority: 'URGENT',
      status: 'ADMITTED',
      assignedBed: 'Surgical Ward 3'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Casualty Reception Hero */}
      <div className="bg-white border border-medteal-200/90 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-medteal-100 text-medteal-800 border border-medteal-200 mb-1.5">
            Emergency Casualty Handoff Reception
          </span>
          <h2 className="text-base font-bold text-slate-900">District Tertiary Hospital Intake Workstation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest air-gapped referral barcodes, verify originating PHC digital signatures, and decrypt patient medical records.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            icon={Scan}
            onClick={() => onNavigate('scan')}
          >
            Launch Camera QR Scanner
          </Button>
          <Button
            variant="outline"
            icon={Upload}
            onClick={() => onNavigate('upload')}
          >
            Upload Barcode Image
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{m.label}</span>
                <div className={`w-8 h-8 rounded-md ${m.bg} ${m.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{m.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Received Referrals Triage Dashboard */}
      <Card
        title="Incoming & Recently Ingested Referrals"
        subtitle="Referrals transferred physically via optical air-gap"
        icon={Hospital}
        action={
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-medteal-700 hover:text-medteal-900 flex items-center gap-1"
          >
            <span>Complete Intake Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                <th className="pb-2">Patient Details</th>
                <th className="pb-2">Originating PHC</th>
                <th className="pb-2">Clinical Indication</th>
                <th className="pb-2">Triage Priority</th>
                <th className="pb-2">Bed Allocation</th>
                <th className="pb-2 text-right">Intake Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incomingIntake.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onNavigate('details')}
                  className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <td className="py-3 font-medium">
                    <div className="font-bold text-slate-900">{item.patientName}</div>
                    <div className="text-[11px] text-slate-400">{item.age}Y, {item.gender} • Ref #{item.id}</div>
                  </td>
                  <td className="py-3 font-mono text-slate-700">
                    {item.origin}
                  </td>
                  <td className="py-3 text-slate-700 font-medium max-w-xs truncate">
                    {item.diagnosis}
                  </td>
                  <td className="py-3">
                    <Badge variant={item.priority === 'EMERGENCY_CRITICAL' ? 'emergency' : 'urgent'} size="sm" dot>
                      {item.priority}
                    </Badge>
                  </td>
                  <td className="py-3 font-semibold text-slate-800">
                    {item.assignedBed}
                  </td>
                  <td className="py-3 text-right">
                    <Badge variant={item.status === 'ARRIVING_NOW' ? 'emergency' : 'success'} size="sm">
                      {item.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

