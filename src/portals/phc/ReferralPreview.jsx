import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  ShieldCheck,
  Lock,
  QrCode,
  Key,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle
} from '../../components/common/Icons.jsx';
import { generateSyntheticReferral } from '../../utils/syntheticData.js';
import { sealReferralPackage } from '../../services/referralService.js';

export default function ReferralPreview({ referral, currentUser, onNavigate }) {
  const activeReferral = referral || generateSyntheticReferral();
  const [pin, setPin] = useState('1234');
  const [isSigning, setIsSigning] = useState(false);
  const [signedSuccess, setSignedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeUser = currentUser || {
    userId: 'USR-DOC-PHC-01',
    fullName: 'Dr. Rajesh Sharma, MBBS',
    role: 'PHC_DOCTOR',
    facilityId: activeReferral.originatingFacilityId || 'PHC-DHAR-04'
  };

  const handleSealAndSign = async (e) => {
    e.preventDefault();
    setIsSigning(true);
    setErrorMessage('');

    try {
      const { envelope, qrPackage } = await sealReferralPackage(
        activeReferral.referralId,
        activeUser,
        pin
      );

      setIsSigning(false);
      setSignedSuccess(true);
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('generateQR', {
            referral: activeReferral,
            qrPackage,
            envelope
          });
        }
      }, 800);
    } catch (err) {
      setIsSigning(false);
      setErrorMessage(err.message || 'Cryptographic sealing failed.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Review & Cryptographically Seal Referral</h2>
          <p className="text-xs text-slate-500">
            Verify clinical payload before applying ECDSA digital signature and AES-256-GCM encryption
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => onNavigate && onNavigate('createReferral')}
        >
          Modify Clinical Fields
        </Button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Cryptographic Sealing Exception</div>
            <div className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {signedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-bold">Cryptographic Sealing Completed Successfully</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Envelope signed with ECDSA P-256. MLO1 multi-part QR frames prepared. Transitioning to barcode display...
            </div>
          </div>
        </div>
      )}

      {/* Referral Paper Preview Style Sheet */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-card space-y-6 text-xs text-slate-800">
        {/* Clinical Referral Slip Header */}
        <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Department of Health & Family Welfare • Official Offline Referral
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Emergency Clinical Referral Slip
            </h3>
            <div className="text-[11px] text-slate-500 mt-1">
              Origin: <span className="font-semibold">{activeReferral.originatingFacilityName}</span> ({activeReferral.originatingFacilityId})
            </div>
            <div className="text-[11px] text-slate-500">
              Destination: <span className="font-semibold">{activeReferral.destinationFacilityName}</span> ({activeReferral.destinationFacilityId})
            </div>
          </div>

          <div className="text-right">
            <Badge variant="emergency" size="md">
              {activeReferral.priority}
            </Badge>
            <div className="font-mono text-[11px] text-slate-400 mt-2">
              UUID: {activeReferral.referralId ? activeReferral.referralId.slice(0, 8) : 'd3b07384'}...
            </div>
            <div className="text-[11px] text-slate-400">{new Date(activeReferral.createdAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Section 1: Demographics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{activeReferral.patient?.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Age / Gender</span>
            <span className="font-medium">{activeReferral.patient?.age} Yrs / {activeReferral.patient?.gender}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">ABHA / National ID</span>
            <span className="font-mono">{activeReferral.patient?.nationalHealthId || 'Not Linked'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Guardian Contact</span>
            <span>{activeReferral.patient?.guardianName} ({activeReferral.patient?.contactPhone})</span>
          </div>
        </div>

        {/* Section 2: Vitals Grid */}
        {activeReferral.vitals && (
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">Baseline Clinical Vitals</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                <span className="font-bold text-slate-900">{activeReferral.vitals.systolicBP}/{activeReferral.vitals.diastolicBP}</span>
                <span className="text-[9px] text-slate-400 block">mmHg</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Pulse Rate</span>
                <span className="font-bold text-slate-900">{activeReferral.vitals.heartRate}</span>
                <span className="text-[9px] text-slate-400 block">bpm</span>
              </div>
              <div className="p-2 bg-rose-50 rounded border border-rose-200 text-rose-900">
                <span className="text-[10px] text-rose-500 block">Oxygen SpO2</span>
                <span className="font-bold text-rose-700 text-sm">{activeReferral.vitals.oxygenSaturationSpO2}%</span>
                <span className="text-[9px] text-rose-400 block">Room Air</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Resp. Rate</span>
                <span className="font-bold text-slate-900">{activeReferral.vitals.respiratoryRate}</span>
                <span className="text-[9px] text-slate-400 block">/min</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Temp</span>
                <span className="font-bold text-slate-900">{activeReferral.vitals.temperatureCelsius}°C</span>
                <span className="text-[9px] text-slate-400 block">Axillary</span>
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 block">Blood Sugar</span>
                <span className="font-bold text-slate-900">{activeReferral.vitals.randomBloodSugar || 142}</span>
                <span className="text-[9px] text-slate-400 block">mg/dL</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Clinical Impression & Referral Reason */}
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Provisional Clinical Assessment</h4>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-1 font-semibold text-slate-900">
              {activeReferral.provisionalDiagnosis}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Reason for District Referral</h4>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-1 text-slate-700">
              {activeReferral.referralReason}
            </div>
          </div>

          {activeReferral.clinicalSummary && (
            <div>
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Clinical Examination Notes</h4>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-1 text-slate-600 leading-relaxed">
                {activeReferral.clinicalSummary}
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Medications Administered */}
        <div>
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Emergency Pre-Referral Medications Administered at PHC
          </h4>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              {activeReferral.medicationsGiven?.map((med, idx) => (
                <li key={idx}>
                  <span className="font-semibold text-slate-900">{med.name}</span> — {med.dose} ({med.frequency || med.administeredAt || 'Stat'})
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cryptographic Signing Authorization Box */}
        <div className="border-t border-slate-200 pt-5">
          <div className="p-4 bg-medgreen-50/70 border border-medgreen-200 rounded-lg space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-medgreen-900">
              <Key className="w-4 h-4 text-medgreen-800" />
              <span>Medical Officer Authorization & Digital Signing</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Enter your clinical PIN to derive the PBKDF2 local key, unlock your ECDSA private signing key, and seal the AES-256-GCM referral payload.
            </p>

            <form onSubmit={handleSealAndSign} className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative w-full sm:w-48">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN (Default: 1234)"
                  className="input-field font-mono tracking-widest text-sm text-center"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={isSigning}
                icon={ShieldCheck}
                className="w-full sm:w-auto"
              >
                Sign & Generate Encrypted QR
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
