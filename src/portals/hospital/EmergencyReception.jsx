import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Hospital, Scan, AlertTriangle, HeartPulse, User, CheckCircle2 } from '../../components/common/Icons.jsx';

export default function EmergencyReception({ onNavigate }) {
  const activeCasualtyBeds = [
    { bedId: 'Bay 01 (Resuscitation)', patient: 'Aarav Kumar (32M)', origin: 'PHC-DHAR-04', priority: 'EMERGENCY_CRITICAL', status: 'Immediate Resuscitation', doctor: 'Dr. V. K. Mehta (Critical Care)' },
    { bedId: 'Bay 02 (Trauma)', patient: 'Meera Bai (28F)', origin: 'PHC-DHAR-04', priority: 'EMERGENCY_CRITICAL', status: 'Obstetric Triage', doctor: 'Dr. S. Nair (OBGYN)' },
    { bedId: 'Bay 03 (Acute Med)', patient: 'Available', origin: '-', priority: 'ROUTINE', status: 'Sanitized & Ready', doctor: 'On-Call Resident' },
    { bedId: 'Bay 04 (Observation)', patient: 'Suresh Verma (46M)', origin: 'PHC-NALCHHA-02', priority: 'URGENT', status: 'Awaiting Ultrasound', doctor: 'Dr. R. Choudhary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Casualty & Emergency Triage Reception</h2>
          <p className="text-xs text-slate-500">
            Real-time emergency department bed status and arriving ambulance handoff intake
          </p>
        </div>
        <Button
          variant="secondary"
          icon={Scan}
          onClick={() => onNavigate('scan')}
        >
          Scan Arriving Patient QR
        </Button>
      </div>

      {/* Bed Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeCasualtyBeds.map((bed, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">{bed.bedId}</span>
              <Badge variant={bed.priority === 'EMERGENCY_CRITICAL' ? 'emergency' : bed.patient === 'Available' ? 'success' : 'urgent'} size="sm">
                {bed.patient === 'Available' ? 'Vacant' : bed.priority}
              </Badge>
            </div>
            <div className="pt-1">
              <div className="text-sm font-semibold text-slate-800">{bed.patient}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{bed.origin} • {bed.doctor}</div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">{bed.status}</span>
              {bed.patient !== 'Available' && (
                <button
                  onClick={() => onNavigate('details')}
                  className="text-medteal-700 font-semibold hover:underline"
                >
                  Chart →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Ambulance Dispatch Protocol Notice */}
      <Card title="Ambulance Air-Gap Transport Protocol" icon={Hospital}>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            When a patient is brought into the casualty ward via 108 Emergency Ambulance, the emergency attendant presents the patient's smartphone or printed multi-part referral slip.
          </p>
          <div className="p-3 bg-medteal-50 border border-medteal-200 rounded text-medteal-900 font-medium text-[11px]">
            No internet connection is required. The optical scanner reads the animated QR sequence, confirms the originating PHC's ECDSA digital signature, and decrypts the complete clinical history immediately.
          </div>
        </div>
      </Card>
    </div>
  );
}

