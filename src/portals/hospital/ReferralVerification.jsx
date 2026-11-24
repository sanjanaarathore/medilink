import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft
} from '../../components/common/Icons.jsx';
import { generateSyntheticReferral } from '../../utils/syntheticData.js';
import {
  verifyAndIngestReferralEnvelope,
  sealReferralPackage,
  createReferral
} from '../../services/referralService.js';

export default function ReferralVerification({
  envelope,
  currentUser = { userId: 'USR-TRIAGE-DH-01', role: 'HOSPITAL_TRIAGE', facilityId: 'DH-INDORE-01' },
  onNavigate
}) {
  const [pin, setPin] = useState('1234');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionComplete, setDecryptionComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [decryptedRecord, setDecryptedRecord] = useState(null);

  const verificationDetails = {
    referralId: envelope?.referralId || 'd3b07384-d113-49fb-a796-03f6f1c7d21a',
    senderFacilityId: envelope?.senderFacilityId || 'PHC-DHAR-04',
    senderFacilityName: envelope?.senderFacilityId === 'PHC-DHAR-04' ? 'Dhar Primary Health Centre' : 'Primary Health Centre',
    recipientFacilityId: envelope?.recipientFacilityId || currentUser.facilityId || 'DH-INDORE-01',
    signingAlgorithm: envelope?.algorithms?.signature || 'ECDSA P-256 with SHA-256',
    signingKeyFingerprint: envelope?.senderKeyFingerprint || 'SHA256:8f3a9e21...b47c0a91',
    encryptionAlgorithm: envelope?.algorithms ? `${envelope.algorithms.keyEncapsulation} + ${envelope.algorithms.symmetric}` : 'RSA-OAEP (2048-bit) + AES-256-GCM',
    timestamp: envelope?.timestamp || '2026-11-24 10:30:15 UTC'
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setIsDecrypting(true);
    setErrorMessage('');

    try {
      let envelopeToDecrypt = envelope;

      // If no live scanned envelope was passed, create and seal one for demonstration
      if (!envelopeToDecrypt) {
        const phcDoctor = {
          userId: 'USR-DOC-PHC-01',
          fullName: 'Dr. Rajesh Sharma, MBBS',
          role: 'PHC_DOCTOR',
          facilityId: 'PHC-DHAR-04'
        };
        const sampleRef = generateSyntheticReferral();
        sampleRef.originatingFacilityId = 'PHC-DHAR-04';
        sampleRef.destinationFacilityId = currentUser.facilityId || 'DH-INDORE-01';

        await createReferral(sampleRef, phcDoctor);
        const sealed = await sealReferralPackage(sampleRef.referralId, phcDoctor, '1234');
        envelopeToDecrypt = sealed.envelope;
      }

      const ingested = await verifyAndIngestReferralEnvelope(
        envelopeToDecrypt,
        currentUser,
        pin
      );

      setDecryptedRecord(ingested);
      setIsDecrypting(false);
      setDecryptionComplete(true);

      setTimeout(() => {
        if (onNavigate) {
          onNavigate('details', { referral: ingested });
        }
      }, 1200);
    } catch (err) {
      setIsDecrypting(false);
      setErrorMessage(err.message || 'Verification or Decryption Failed.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Cryptographic Verification & Decryption</h2>
          <p className="text-xs text-slate-500">
            Verify originating facility digital signature and decrypt confidential clinical payload
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-3 text-xs text-rose-900">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Cryptographic Security Exception</div>
            <div className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</div>
            <div className="text-[10px] text-rose-500 mt-1">
              Data handoff rejected: In accordance with MediLink Offline security policy, unverified or failed payloads are never displayed.
            </div>
          </div>
        </div>
      )}

      {decryptionComplete && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-bold">Decryption Confirmed & Persisted to Received Store</div>
            <div className="text-[11px] text-emerald-700">AES-256-GCM authentication tag valid. Transitioning to clinical intake...</div>
          </div>
        </div>
      )}

      {/* Step 1: Origin Authenticity Verification */}
      <Card
        title="1. Originating Facility Authenticity"
        subtitle="ECDSA P-256 Digital Signature Verification"
        icon={ShieldCheck}
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">{verificationDetails.senderFacilityName}</span>
                <span className="font-mono text-slate-500 ml-2">({verificationDetails.senderFacilityId})</span>
              </div>
              <Badge variant="success" size="sm" dot>
                Verified in Trust Directory
              </Badge>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Signing Algorithm: {verificationDetails.signingAlgorithm} • Key Fingerprint: {verificationDetails.signingKeyFingerprint}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-slate-600">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Referral UUID</span>
              <span className="font-mono text-[11px] text-slate-800">{verificationDetails.referralId}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-semibold">Origin Timestamp</span>
              <span className="text-[11px] text-slate-800">{verificationDetails.timestamp}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 2: Content Confidentiality & Key Unwrapping */}
      <Card
        title="2. Recipient Key Unwrapping & Decryption"
        subtitle="RSA-OAEP Session Key Recovery & AES-256-GCM Decryption"
        icon={Lock}
      >
        <form onSubmit={handleDecrypt} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Target Facility Authorization</span>
              <span className="font-mono text-slate-500 text-[11px]">{verificationDetails.recipientFacilityId}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              The AES-256 symmetric key is encapsulated specifically for this District Hospital's RSA public key. Enter the local staff PIN to derive the PBKDF2 wrapping key and unwrap your hospital's RSA private key.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-48">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Hospital PIN (1234)"
                className="input-field font-mono tracking-widest text-sm text-center"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              loading={isDecrypting}
              icon={Unlock}
              className="w-full sm:w-auto"
            >
              Verify Signature & Decrypt
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
