import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  Users,
  Send,
  AlertTriangle,
  QrCode,
  Plus,
  ArrowRight,
  Clock,
  HeartPulse,
  Activity
} from '../../components/common/Icons.jsx';
import { SYNTHETIC_PATIENTS } from '../../utils/syntheticData.js';

export default function PhcDashboard({ onNavigate, onSelectPatient }) {
  const metrics = [
    { label: 'Active Outpatient Enrolled', value: '48', sub: 'Registered locally today', icon: Users, color: 'text-medgreen-800', bg: 'bg-medgreen-50' },
    { label: 'Emergency Referrals Dispatched', value: '12', sub: 'Encrypted via MLO1 QR', icon: Send, color: 'text-emergency-600', bg: 'bg-red-50' },
    { label: 'Critical Triage En Route', value: '3', sub: 'Transiting to MY Hospital', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Offline Database Integrity', value: '100%', sub: 'IndexedDB ACID synchronized', icon: Activity, color: 'text-medteal-700', bg: 'bg-medteal-50' },
  ];

  const recentReferrals = [
    {
      id: 'd3b07384',
      patientName: 'Aarav Kumar',
      age: 32,
      gender: 'M',
      diagnosis: 'Severe Pneumonia / ARDS (SpO2 86%)',
      destination: 'DH-INDORE-01',
      priority: 'EMERGENCY_CRITICAL',
      time: '10:30 AM',
      qrFrames: '3 frames'
    },
    {
      id: 'f94101e2',
      patientName: 'Meera Bai',
      age: 28,
      gender: 'F',
      diagnosis: 'Severe Pre-eclampsia (BP 170/110)',
      destination: 'DH-INDORE-01',
      priority: 'EMERGENCY_CRITICAL',
      time: '09:15 AM',
      qrFrames: '3 frames'
    },
    {
      id: '8a1290ff',
      patientName: 'Kailash Patel',
      age: 54,
      gender: 'M',
      diagnosis: 'Suspected Acute Coronary Syndrome',
      destination: 'DH-INDORE-01',
      priority: 'URGENT',
      time: 'Yesterday',
      qrFrames: '2 frames'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Clinical Action Banner */}
      <div className="bg-white border border-medgreen-200/90 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card">
        <div>
          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 mb-1.5">
            Emergency Clinical Intake & Escalation
          </span>
          <h2 className="text-base font-bold text-slate-900">Primary Health Centre Clinical Workstation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register arriving patients, record vital signs, seal encrypted emergency referral envelopes, and generate QR handoffs.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="emergency"
            icon={Plus}
            onClick={() => onNavigate('createReferral')}
          >
            Create Emergency Referral
          </Button>
          <Button
            variant="outline"
            icon={Users}
            onClick={() => onNavigate('register')}
          >
            Register Patient
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

      {/* Two Column Layout: Recent Referrals & Quick Registered Patient List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Outgoing Referrals */}
        <div className="lg:col-span-2">
          <Card
            title="Recent Outgoing Emergency Referrals"
            subtitle="Referrals sealed with AES-256-GCM and signed with PHC ECDSA private key"
            icon={Send}
            action={
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-medgreen-800 hover:text-medgreen-950 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Patient Details</th>
                    <th className="pb-2">Clinical Indication</th>
                    <th className="pb-2">Priority</th>
                    <th className="pb-2">Destination</th>
                    <th className="pb-2 text-right">QR Optical Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentReferrals.map((ref) => (
                    <tr
                      key={ref.id}
                      onClick={() => onNavigate('generateQR')}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{ref.patientName}</div>
                        <div className="text-[11px] text-slate-400">{ref.age}Y, {ref.gender} • {ref.time}</div>
                      </td>
                      <td className="py-3 max-w-xs truncate text-slate-700 font-medium">
                        {ref.diagnosis}
                      </td>
                      <td className="py-3">
                        <Badge variant={ref.priority === 'EMERGENCY_CRITICAL' ? 'emergency' : 'urgent'} size="sm" dot>
                          {ref.priority}
                        </Badge>
                      </td>
                      <td className="py-3 font-mono text-slate-700">
                        {ref.destination}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-medgreen-800 font-semibold bg-medgreen-50 px-2 py-0.5 rounded border border-medgreen-200">
                          <QrCode className="w-3 h-3" />
                          <span>{ref.qrFrames}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Patient Selection */}
        <div>
          <Card
            title="Enrolled Patients"
            subtitle="Local PHC cohort"
            icon={Users}
            action={
              <button
                onClick={() => onNavigate('patientList')}
                className="text-xs font-semibold text-medgreen-800 hover:text-medgreen-950 flex items-center gap-1"
              >
                <span>All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="space-y-3">
              {SYNTHETIC_PATIENTS.map((p) => (
                <div
                  key={p.patientId}
                  onClick={() => {
                    if (onSelectPatient) onSelectPatient(p);
                    onNavigate('profile');
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{p.fullName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{p.patientId}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {p.age} Yrs • {p.gender} • {p.addressVillage}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">ABHA: {p.nationalHealthId}</span>
                    <span className="text-medgreen-800 font-semibold hover:underline">View Chart →</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

