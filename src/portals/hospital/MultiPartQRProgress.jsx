import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { CheckCircle2, ShieldCheck, ArrowRight, ArrowLeft, QrCode } from '../../components/common/Icons.jsx';

export default function MultiPartQRProgress({ onNavigate }) {
  const frames = [
    {
      seq: 1,
      total: 3,
      refIdShort: 'd3b07384',
      crc32: '3f93a9c7',
      bytes: 382,
      status: 'VERIFIED_OK',
      description: 'Envelope Metadata: Protocol Version 1.0, Origin (PHC-DHAR-04), Recipient (DH-INDORE-01)'
    },
    {
      seq: 2,
      total: 3,
      refIdShort: 'd3b07384',
      crc32: 'e941b02d',
      bytes: 410,
      status: 'VERIFIED_OK',
      description: 'AES-256-GCM Encrypted Patient Demographics, Baseline Vitals & Clinical Narrative'
    },
    {
      seq: 3,
      total: 3,
      refIdShort: 'd3b07384',
      crc32: 'a10b48f9',
      bytes: 395,
      status: 'VERIFIED_OK',
      description: '128-bit Authentication Tag + ECDSA P-256 Digital Signature from Referring Medical Officer'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Multi-Part Frame Reconstruction</h2>
          <p className="text-xs text-slate-500">
            MLO1 protocol reassembly: 3 of 3 sequential optical frames successfully captured and validated
          </p>
        </div>
        <Button
          variant="secondary"
          icon={ShieldCheck}
          onClick={() => onNavigate && onNavigate('verify')}
        >
          Verify Cryptographic Signatures
        </Button>
      </div>

      {/* Assembly Success Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <div className="font-bold">Lossless Payload Reassembly Complete (1,187 bytes)</div>
            <div className="text-[11px] text-emerald-700">CRC-32 checksums verified for every individual chunk. Zero data loss.</div>
          </div>
        </div>
        <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-200">
          UUID: d3b07384
        </span>
      </div>

      {/* Segmented Frame List */}
      <Card title="Captured Optical Frame Sequence" icon={QrCode}>
        <div className="space-y-3">
          {frames.map((frame) => (
            <div key={frame.seq} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Frame {frame.seq} of {frame.total}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    CRC32: {frame.crc32}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">({frame.bytes} bytes)</span>
                </div>
                <div className="text-slate-600 text-[11px]">{frame.description}</div>
              </div>
              <Badge variant="success" size="sm" dot>
                Validated
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => onNavigate && onNavigate('scan')}
        >
          Rescan Frames
        </Button>

        <Button
          variant="primary"
          icon={ArrowRight}
          iconPosition="right"
          onClick={() => onNavigate && onNavigate('verify')}
        >
          Proceed to Digital Signature Verification & Decrypt
        </Button>
      </div>
    </div>
  );
}

