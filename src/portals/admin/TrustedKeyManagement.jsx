import React, { useState, useEffect } from 'react';
import { Card, DataTable, Modal } from '../../components/common/Card.jsx';
import { Button, Badge } from '../../components/common/Button.jsx';
import { Key, ShieldCheck, Download, Upload, CheckCircle2, AlertTriangle } from '../../components/common/Icons.jsx';
import {
  getAllTrustedKeys,
  ensureDefaultFacilityKeysSeeded,
  exportTrustDirectoryBundle,
  importTrustDirectoryBundle,
  revokeFacilityKey
} from '../../services/keyManagementService.js';

export default function TrustedKeyManagement({ currentUser = { userId: 'USR-ADMIN-01', role: 'ADMIN', facilityId: 'DH-INDORE-01' } }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [trustedKeys, setTrustedKeys] = useState([]);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadKeys = async () => {
    try {
      await ensureDefaultFacilityKeysSeeded('1234');
      const keys = await getAllTrustedKeys();
      setTrustedKeys(keys);
    } catch (err) {
      console.error('Failed to load trusted keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleExportTrustBundle = async () => {
    try {
      const bundle = await exportTrustDirectoryBundle();
      const bundleData = JSON.stringify(bundle, null, 2);

      const blob = new Blob([bundleData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MediLink_TrustDirectory_${new Date().toISOString().slice(0, 10)}.mldir`;
      a.click();
      URL.revokeObjectURL(url);

      setNotice('Trust Directory bundle (.mldir) exported successfully for offline flash drive transport.');
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(`Export error: ${err.message}`);
    }
  };

  const handleRevokeKey = async (facilityId) => {
    if (!window.confirm(`Are you sure you want to REVOKE the trusted public key for ${facilityId}? Any incoming referrals from this facility will be rejected.`)) {
      return;
    }
    try {
      await revokeFacilityKey(facilityId, 'Decommissioned by District Administrator', currentUser);
      await loadKeys();
      setSelectedKey(null);
      setNotice(`Successfully REVOKED trusted key for facility ${facilityId}.`);
      setTimeout(() => setNotice(''), 4000);
    } catch (err) {
      setNotice(`Revocation error: ${err.message}`);
    }
  };

  const columns = [
    {
      header: 'Facility Identifier',
      accessor: 'facilityId',
      cellClassName: 'font-mono text-xs font-semibold text-slate-800'
    },
    {
      header: 'Facility Name',
      accessor: 'facilityName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.facilityName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.signingAlgorithm}</div>
        </div>
      )
    },
    {
      header: 'Key Fingerprint',
      accessor: 'fingerprint',
      cellClassName: 'font-mono text-xs text-slate-600',
      render: (row) => (
        <span className="font-mono text-[11px] text-slate-600">
          {row.fingerprint ? `${row.fingerprint.slice(0, 18)}...` : 'SHA256:8f3a9e...'}
        </span>
      )
    },
    {
      header: 'Validity Period',
      accessor: 'validUntil',
      render: (row) => (
        <span className="text-xs text-slate-600">
          Expires: {row.validUntil ? row.validUntil.slice(0, 10) : '2028-01-01'}
        </span>
      )
    },
    {
      header: 'Trust Status',
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'} size="sm" dot>
          {row.status}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedKey(row)}
        >
          View Public JWK
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Trusted Facility Key Directory</h2>
          <p className="text-xs text-slate-500">
            Certified public keys (ECDSA P-256 for signing, RSA-OAEP for encryption) used for offline referral verification
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportTrustBundle}
          >
            Export Trust Package (.mldir)
          </Button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-medteal-50 border border-medteal-200 rounded-lg text-xs text-medteal-900 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-medteal-700 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Security Info Card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start space-x-3">
        <ShieldCheck className="w-5 h-5 text-medgreen-800 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">Zero-Trust Public Key Directory Architecture</div>
          <p className="text-[11px] text-slate-500">
            District hospitals and rural PHCs exchange public keys in advance via certified air-gap directory bundles (.mldir). No private keys are ever shared or transmitted over barcodes.
          </p>
        </div>
      </div>

      {/* Keys Table */}
      <Card title="Registered Facility Identity Keys" subtitle={`${trustedKeys.length} verified facility public keys`} icon={Key}>
        <DataTable
          columns={columns}
          data={trustedKeys}
          emptyMessage="No facility public keys registered in local directory."
        />
      </Card>

      {/* Public Key Details Modal */}
      {selectedKey && (
        <Modal
          isOpen={!!selectedKey}
          onClose={() => setSelectedKey(null)}
          title={`Public Key Profile: ${selectedKey.facilityId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Facility:</span>
                <span className="font-semibold text-slate-900">{selectedKey.facilityName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Type:</span>
                <span className="font-mono text-slate-700">{selectedKey.facilityType || selectedKey.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Signing Spec:</span>
                <span className="font-mono text-slate-700">{selectedKey.signingAlgorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Encryption Spec:</span>
                <span className="font-mono text-slate-700">{selectedKey.encryptionAlgorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Key Fingerprint:</span>
                <span className="font-mono text-[11px] text-slate-800">{selectedKey.fingerprint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge variant={selectedKey.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                  {selectedKey.status}
                </Badge>
              </div>
            </div>

            {/* Public JWK Representation */}
            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                Certified Public JSON Web Key (JWK)
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(selectedKey.signingPublicKeyJwk || selectedKey.encryptionPublicKeyJwk || {
                  kty: 'EC',
                  crv: 'P-256',
                  x: 'f83oj3_Qpxs0t8VGuSuBDWE6gpgXSJ8SkvGhjhFB9mY',
                  y: 'x_daaquoklBW4hh9umKsHX6vCppY60VeL3IqYK4488A'
                }, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-between">
              {selectedKey.status === 'ACTIVE' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRevokeKey(selectedKey.facilityId)}
                >
                  Revoke Key
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedKey(null)}
                className="ml-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
