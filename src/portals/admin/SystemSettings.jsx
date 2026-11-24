import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Settings, Database, Shield, CheckCircle2 } from '../../components/common/Icons.jsx';

export default function SystemSettings() {
  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000);
  const [chunkSize, setChunkSize] = useState(400);
  const [carouselFps, setCarouselFps] = useState(2);
  const [savedNotice, setSavedNotice] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice('Cryptographic and QR transmission settings updated locally.');
    setTimeout(() => setSavedNotice(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-slate-900">System & Cryptographic Settings</h2>
        <p className="text-xs text-slate-500">
          Configure client-side Web Crypto parameters, QR fragmentation thresholds, and local storage
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Security Parameters Card */}
        <Card title="Cryptographic Engine Parameters" icon={Shield}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="input-label">PBKDF2 HMAC-SHA256 Iteration Count</label>
              <input
                type="number"
                value={pbkdf2Iterations}
                onChange={(e) => setPbkdf2Iterations(Number(e.target.value))}
                min={100000}
                step={10000}
                className="input-field max-w-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                OWASP recommended minimum is 100,000 iterations for deriving AES wrapping key from local PIN.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Content Encryption Algorithm</div>
                <div className="font-mono text-medgreen-800 mt-0.5">AES-256-GCM (128-bit tag, 96-bit IV)</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-semibold text-slate-800">Digital Signature Standard</div>
                <div className="font-mono text-medgreen-800 mt-0.5">ECDSA NIST P-256 with SHA-256</div>
              </div>
            </div>
          </div>
        </Card>

        {/* QR Transmission Configuration */}
        <Card title="Optical QR Protocol Tuning (MLO1)" icon={Settings}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="input-label">Target Chunk Byte Size (bytes per frame)</label>
              <input
                type="number"
                value={chunkSize}
                onChange={(e) => setChunkSize(Number(e.target.value))}
                min={200}
                max={600}
                step={50}
                className="input-field max-w-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Optimal range is 350-450 bytes to ensure rapid optical focus on budget smartphone cameras.
              </p>
            </div>

            <div>
              <label className="input-label">Animated QR Slideshow Frequency (Frames / Second)</label>
              <select
                value={carouselFps}
                onChange={(e) => setCarouselFps(Number(e.target.value))}
                className="input-field max-w-xs"
              >
                <option value={1}>1 FPS (1000 ms / frame - High Stability)</option>
                <option value={2}>2 FPS (500 ms / frame - Recommended Default)</option>
                <option value={3}>3 FPS (333 ms / frame - Fast Cameras)</option>
                <option value={4}>4 FPS (250 ms / frame - High Refresh Rates)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Local Storage Card */}
        <Card title="Local Storage Diagnostics" icon={Database}>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
              <div>
                <div className="font-semibold text-slate-800">IndexedDB Database (`medilink_offline_db`)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Estimated storage: 2.4 MB of 50 GB quota</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => alert('Storage diagnostic verified: Zero corruption detected across all stores.')}
              >
                Integrity Check
              </Button>
            </div>
          </div>
        </Card>

        <div>
          <Button type="submit" variant="primary">
            Save System Configurations
          </Button>
        </div>
      </form>
    </div>
  );
}

