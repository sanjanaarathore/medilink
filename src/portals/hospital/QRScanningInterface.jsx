import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import {
  Scan,
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  Terminal,
  ShieldCheck
} from '../../components/common/Icons.jsx';
import { createReassemblySession, ingestBatchFrames } from '../../qr/qrScannerEngine.js';

export default function QRScanningInterface({ onNavigate }) {
  const [inputMode, setInputMode] = useState('camera'); // 'camera' or 'manual'
  const [isScanning, setIsScanning] = useState(true);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState(0);
  const totalFrames = 3;

  // Manual Frame Paste state
  const [manualText, setManualText] = useState('');
  const [session] = useState(() => createReassemblySession());
  const [sessionStatus, setSessionStatus] = useState(() => session.getStatus());
  const [manualNotice, setManualNotice] = useState('');

  // Simulate progressive optical frame acquisition over camera video stream
  useEffect(() => {
    if (!isScanning || cameraPermissionDenied || inputMode !== 'camera') return;

    const timer1 = setTimeout(() => {
      setCapturedFrames(1);
    }, 800);

    const timer2 = setTimeout(() => {
      setCapturedFrames(2);
    }, 1600);

    const timer3 = setTimeout(() => {
      setCapturedFrames(3);
      setIsScanning(false);
      setTimeout(() => {
        if (onNavigate) onNavigate('verification');
      }, 1000);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isScanning, cameraPermissionDenied, inputMode, onNavigate]);

  const handleResetScan = () => {
    session.reset();
    setSessionStatus(session.getStatus());
    setCapturedFrames(0);
    setIsScanning(true);
    setCameraPermissionDenied(false);
  };

  const handleIngestManualFrame = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    const result = session.ingestFrame(manualText.trim());
    setSessionStatus(session.getStatus());

    if (result.status === 'COMPLETE') {
      setManualNotice('Reassembly Complete! 100% of MLO1 frames collected and CRC32 verified. Transitioning to verification...');
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('verification', { envelope: result.envelope });
        }
      }, 1200);
    } else if (result.status === 'CORRUPTED') {
      setManualNotice(`Frame Corrupted: ${result.error}`);
    } else if (result.status === 'DUPLICATE') {
      setManualNotice(`Duplicate Frame: Frame #${result.seq} was already buffered.`);
    } else if (result.status === 'INVALID') {
      setManualNotice(`Invalid Protocol Frame: ${result.error}`);
    } else {
      setManualNotice(`Frame #${result.seq} of ${result.total} buffered successfully.`);
    }

    setManualText('');
  };

  const handleSimulatePermissionDenial = () => {
    setIsScanning(false);
    setCameraPermissionDenied(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Optical Barcode Scanner</h2>
          <p className="text-xs text-slate-500">
            Scan high-density referral barcode (single or multi-part sequential slideshow)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInputMode(inputMode === 'camera' ? 'manual' : 'camera')}
          >
            {inputMode === 'camera' ? 'Switch to Manual Paste' : 'Switch to Camera View'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => onNavigate && onNavigate('upload')}
          >
            Image Upload
          </Button>
        </div>
      </div>

      {inputMode === 'camera' ? (
        <div className="space-y-4">
          {cameraPermissionDenied ? (
            /* Camera Permission Denial Fallback View */
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">Camera Access Denied or Unavailable</h3>
                <p className="text-xs text-amber-700 max-w-md mx-auto mt-1">
                  Unable to open local optical camera stream. To resolve, click the site permissions lock icon in your address bar and grant camera access.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Upload}
                  onClick={() => onNavigate && onNavigate('upload')}
                >
                  Upload Barcode Image File (.png, .jpg)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Terminal}
                  onClick={() => setInputMode('manual')}
                >
                  Paste Raw MLO1 Frame
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetScan}
                >
                  Retry Camera
                </Button>
              </div>
            </div>
          ) : (
            /* Optical Camera Viewfinder Container */
            <div className="relative w-full aspect-square max-w-md mx-auto bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-800 flex items-center justify-center">
              {/* Animated Scanner Laser Line */}
              {isScanning && (
                <div className="absolute inset-x-8 h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] z-20 animate-bounce top-1/3" />
              )}

              {/* Optical Viewfinder Reticle Grid */}
              <div className="absolute inset-10 border-2 border-dashed border-white/40 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/80 animate-ping" />
              </div>

              {/* Live Status Overlay */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-30">
                <Badge variant="neutral" size="sm" className="bg-black/60 text-white border-white/20">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rear Camera Active (15 FPS)</span>
                </Badge>
                <Badge variant={capturedFrames === 3 ? 'success' : 'urgent'} size="sm">
                  {capturedFrames === 3 ? 'Reassembly Complete' : `Capturing Frames: ${capturedFrames} / ${totalFrames}`}
                </Badge>
              </div>

              {/* Bottom Acquisition Feedback */}
              <div className="absolute bottom-4 inset-x-4 text-center z-30">
                <div className="inline-block bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-xs font-mono border border-white/10">
                  {capturedFrames === 0 && "Align QR code inside target reticle..."}
                  {capturedFrames === 1 && "Captured Frame 1/3: Protocol Header & UUID OK"}
                  {capturedFrames === 2 && "Captured Frame 2/3: AES Ciphertext OK (CRC Valid)"}
                  {capturedFrames === 3 && "Captured Frame 3/3: Signature Block OK! Reassembling..."}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar & Manual Triggers */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>MLO1 Frame Assembly Progress</span>
              <span className="font-mono text-medteal-700">{Math.round((capturedFrames / totalFrames) * 100)}%</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              <div className={`h-full flex-1 transition-all duration-300 ${capturedFrames >= 1 ? 'bg-medteal-600' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 transition-all duration-300 ${capturedFrames >= 2 ? 'bg-medteal-600' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 transition-all duration-300 ${capturedFrames >= 3 ? 'bg-medteal-600' : 'bg-slate-200'}`} />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                icon={RefreshCw}
                onClick={handleResetScan}
              >
                Restart Scanner
              </Button>

              <button
                type="button"
                onClick={handleSimulatePermissionDenial}
                className="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >
                Simulate Camera Blocked
              </button>

              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => onNavigate && onNavigate('progress')}
              >
                Skip to Assembly View
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Manual Frame Ingestion Mode (Air-Gap Terminal Fallback) */
        <Card title="Manual MLO1 Frame Ingestion" subtitle="Air-Gap Terminal Transfer & Debugging" icon={Terminal}>
          <form onSubmit={handleIngestManualFrame} className="space-y-4 text-xs">
            {manualNotice && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md font-mono text-[11px] text-slate-800">
                {manualNotice}
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Paste MLO1 Protocol Frame String:
              </label>
              <textarea
                rows={3}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="MLO1|d3b07384|1|3|8a3f90b1|eyJ2ZXIiOiIxLjAiLCJyZWZJZCI6ImQzYjA3..."
                className="input-field font-mono text-xs w-full"
              />
            </div>

            {/* Session Progress */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Active Referral: {sessionStatus.activeRefId || 'Awaiting Frame...'}</span>
                <span>{sessionStatus.percentComplete}% Complete ({sessionStatus.receivedCount} of {sessionStatus.totalFrames} frames)</span>
              </div>

              {sessionStatus.missingFrames.length > 0 && (
                <div className="text-[11px] text-amber-700 font-mono">
                  Missing frame sequence indices: [{sessionStatus.missingFrames.join(', ')}]
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="submit" variant="primary" size="sm">
                Ingest & Verify Frame
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  session.reset();
                  setSessionStatus(session.getStatus());
                  setManualNotice('Session buffer reset.');
                }}
              >
                Reset Buffer
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
