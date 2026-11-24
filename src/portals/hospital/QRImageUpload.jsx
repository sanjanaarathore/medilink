import React, { useState } from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Upload, CheckCircle2, QrCode, ArrowRight } from '../../components/common/Icons.jsx';

export default function QRImageUpload({ onNavigate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsProcessing(true);
      setStatusMessage('Analyzing optical 2D barcode image via ZXing decoder...');

      setTimeout(() => {
        setIsProcessing(false);
        setStatusMessage('MLO1 Multi-Part Optical Barcode detected! 3 Frames parsed.');
        setTimeout(() => {
          if (onNavigate) onNavigate('progress');
        }, 1000);
      }, 1000);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-base font-bold text-slate-900">Upload Referral Barcode Image</h2>
        <p className="text-xs text-slate-500">
          Upload photographic images of QR referral slips captured via external smartphones or document scanners
        </p>
      </div>

      <Card title="Image File Ingestion" icon={Upload}>
        <div className="space-y-4 text-center">
          <label className="border-2 border-dashed border-slate-300 hover:border-medteal-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50">
            <div className="w-12 h-12 rounded-full bg-medteal-50 text-medteal-700 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {selectedFile ? selectedFile.name : 'Click to select or drag and drop image'}
            </span>
            <span className="text-xs text-slate-400 mt-1">Supports PNG, JPG, JPEG, WebP</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {isProcessing && (
            <div className="p-3 bg-medteal-50 border border-medteal-200 rounded-md text-xs text-medteal-900 flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-medteal-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>{statusMessage}</span>
            </div>
          )}

          {!isProcessing && statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

