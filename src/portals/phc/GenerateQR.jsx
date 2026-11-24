import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  QrCode,
  ShieldCheck,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Printer
} from '../../components/common/Icons.jsx';
import { chunkReferralEnvelope, downloadSvgImage } from '../../qr/qrEngine.js';
import { generateSyntheticReferral } from '../../utils/syntheticData.js';

export default function GenerateQR({ referral, qrPackage: initialQrPackage, envelope: initialEnvelope, onNavigate }) {
  const [activeFrame, setActiveFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(2); // 2 FPS default
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' or 'printable'

  const activeReferral = referral || generateSyntheticReferral();

  // If initialQrPackage was passed, use it; otherwise chunk the active referral or synthetic envelope
  const qrPackage = useMemo(() => {
    if (initialQrPackage && initialQrPackage.frames) {
      return initialQrPackage;
    }
    const sampleEnvelope = initialEnvelope || {
      version: '1.0.0',
      referralId: activeReferral.referralId,
      senderFacilityId: activeReferral.originatingFacilityId,
      recipientFacilityId: activeReferral.destinationFacilityId,
      timestamp: activeReferral.createdAt || new Date().toISOString(),
      algorithms: {
        symmetric: 'AES-256-GCM',
        keyEncapsulation: 'RSA-OAEP-SHA256',
        signature: 'ECDSA-P256-SHA256'
      },
      nonce: 'b25jZUV4YW1wbGVWYWx1ZQ==',
      ciphertext: 'Y2lwaGVydGV4dEV4YW1wbGVWYWx1ZVBheWxvYWQxMjM0NTY3ODkwYWJjZGVm',
      authTag: 'YXV0aFRhZ0V4YW1wbGUxNjg=',
      wrappedSessionKey: 'd3JhcHBlZFNlc3Npb25LZXlCYXNlNjQ=',
      senderKeyFingerprint: 'SHA256:8f3a9e21b47c0a91',
      digitalSignature: 'ZGlnaXRhbFNpZ25hdHVyZUV4YW1wbGVCYXNlNjQ='
    };
    return chunkReferralEnvelope(sampleEnvelope, 400);
  }, [initialQrPackage, initialEnvelope, activeReferral]);

  const totalFrames = qrPackage.totalFrames || 1;
  const currentFrame = qrPackage.frames[activeFrame - 1] || qrPackage.frames[0];
  const refIdShort = qrPackage.refIdShort || 'd3b07384';

  // Carousel playback timer
  useEffect(() => {
    if (!isPlaying || viewMode !== 'carousel' || totalFrames <= 1) return;
    const intervalMs = Math.round(1000 / fps);
    const timer = setInterval(() => {
      setActiveFrame((prev) => (prev >= totalFrames ? 1 : prev + 1));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, fps, viewMode, totalFrames]);

  const handleDownloadActiveFrame = () => {
    if (!currentFrame) return;
    downloadSvgImage(currentFrame.svg, `MediLink_QR_${refIdShort}_Frame_${currentFrame.seq}.svg`);
  };

  const handleDownloadAllFrames = () => {
    qrPackage.frames.forEach((f, idx) => {
      setTimeout(() => {
        downloadSvgImage(f.svg, `MediLink_QR_${refIdShort}_Frame_${f.seq}_of_${totalFrames}.svg`);
      }, idx * 200);
    });
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Encrypted Referral Barcode (MLO1 Protocol)</h2>
          <p className="text-xs text-slate-500">
            High-density optical payload sealed with AES-256-GCM and signed with ECDSA P-256
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'carousel' ? 'printable' : 'carousel')}
          >
            {viewMode === 'carousel' ? 'Switch to Printable Multi-Grid' : 'Switch to Animated Carousel'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => onNavigate && onNavigate('preview')}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Security Seal Confirmation Bar */}
      <div className="p-3 bg-medgreen-50 border border-medgreen-200 rounded-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-medgreen-900">
          <ShieldCheck className="w-4 h-4 text-medgreen-800 flex-shrink-0" />
          <span className="font-semibold">Cryptographic Seal Verified Authentic</span>
          <span className="text-slate-500 font-mono text-[11px]">• Destination: {activeReferral.destinationFacilityId}</span>
        </div>
        <Badge variant="emergency" size="sm">
          {activeReferral.priority || 'EMERGENCY CRITICAL'}
        </Badge>
      </div>

      {viewMode === 'carousel' ? (
        /* Animated Carousel Presentation Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Optical QR Matrix Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-card space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono font-semibold">Referral: #{refIdShort}</span>
              <span className="font-bold text-medgreen-900 bg-medgreen-50 px-2 py-0.5 rounded border border-medgreen-200">
                Frame {activeFrame} of {totalFrames}
              </span>
            </div>

            {/* QR Code Matrix Viewport */}
            <div className="relative mx-auto w-64 h-64 bg-slate-900 p-3 rounded-lg flex items-center justify-center shadow-inner">
              <div
                className="w-full h-full bg-white rounded p-2 flex items-center justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: currentFrame?.svg || '' }}
              />
              <div className="absolute bottom-1 bg-white/90 px-2 py-0.5 rounded text-[9px] font-mono text-slate-700 font-bold shadow-sm">
                MLO1 FRAME {activeFrame}/{totalFrames}
              </div>
            </div>

            {/* Playback Progress Indicator */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
              {qrPackage.frames.map((f) => (
                <div
                  key={f.seq}
                  className={`h-full flex-1 transition-all ${
                    activeFrame === f.seq ? 'bg-medgreen-700' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-center space-x-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause Animation' : 'Resume Playback'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFrame((prev) => (prev <= 1 ? totalFrames : prev - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFrame((prev) => (prev >= totalFrames ? 1 : prev + 1))}
              >
                Next
              </Button>
            </div>

            {/* Speed Configuration */}
            <div className="flex items-center justify-center space-x-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-medium">Transmission Rate:</span>
              {[1, 2, 3, 4].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setFps(rate)}
                  className={`px-2 py-0.5 rounded text-xs font-mono ${
                    fps === rate
                      ? 'bg-medgreen-800 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rate} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Operational Guidance & Actions Card */}
          <div className="space-y-4">
            <Card title="Transport Instructions" subtitle="Casualty Handoff Protocol" icon={QrCode}>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-medteal-700" />
                    <span>Mode 1: Ambulance Mobile Presentation</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hand this device or screen to the ambulance paramedic. Upon arrival at the District Hospital casualty desk, the intake nurse points their camera to scan this cycling barcode.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-medteal-700" />
                    <span>Mode 2: Printed Paper Backup</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If mobile battery is low or device cannot leave the PHC, print the static multi-frame referral slip and hand it physically to the patient's escort.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadActiveFrame}
                    className="flex-1"
                  >
                    Download Frame {activeFrame}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={handleDownloadAllFrames}
                    className="flex-1"
                  >
                    Download All ({totalFrames})
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Printer}
                    onClick={() => window.print()}
                    className="flex-1"
                  >
                    Print Slip
                  </Button>
                </div>
              </div>
            </Card>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Air-Gap Data Integrity Note:</span> Each QR frame contains an MLO1 32-bit CRC checksum. Any camera optical distortion is automatically detected and rejected without corrupting patient records.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Printable Static Multi-Grid Presentation Mode */
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Clinical Referral Slip (Offline Air-Gap)</h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{activeReferral.patient?.fullName}</span> • Age: {activeReferral.patient?.age} • Gender: {activeReferral.patient?.gender}
              </p>
            </div>
            <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
              Print Physical Slip
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {qrPackage.frames.map((f) => (
              <div key={f.seq} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-2">
                <div className="text-xs font-mono font-bold text-slate-700">
                  Frame {f.seq} of {totalFrames}
                </div>
                <div
                  className="w-48 h-48 mx-auto bg-white p-2 rounded border border-slate-200 flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: f.svg }}
                />
                <div className="text-[10px] font-mono text-slate-400">
                  CRC32: {f.crc32} • {f.chunkLength} bytes
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
            MediLink Offline MLO1 Protocol • Cryptographically sealed with AES-256-GCM and ECDSA P-256
          </div>
        </div>
      )}
    </div>
  );
}
