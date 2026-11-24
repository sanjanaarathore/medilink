import React from 'react';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Button.jsx';
import { Shield, CheckCircle2, X } from '../../components/common/Icons.jsx';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../../config/roles.js';

export default function RolePermissionManagement() {
  const allPermissions = [
    { key: PERMISSIONS.MANAGE_FACILITIES, label: 'Manage Facilities', category: 'Administration' },
    { key: PERMISSIONS.MANAGE_USERS, label: 'Manage Users & Credentials', category: 'Administration' },
    { key: PERMISSIONS.MANAGE_KEYS, label: 'Manage Cryptographic Keys', category: 'Administration' },
    { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'View Immutable Audit Trail', category: 'Administration' },
    { key: PERMISSIONS.REGISTER_PATIENT, label: 'Register Patients & Vitals', category: 'PHC Clinical' },
    { key: PERMISSIONS.CREATE_REFERRAL, label: 'Draft Emergency Referrals', category: 'PHC Clinical' },
    { key: PERMISSIONS.SIGN_REFERRAL, label: 'ECDSA Digital Signing', category: 'PHC Clinical' },
    { key: PERMISSIONS.GENERATE_QR, label: 'Generate & Broadcast QR Frames', category: 'PHC Clinical' },
    { key: PERMISSIONS.SCAN_QR, label: 'Camera / Optical QR Scanning', category: 'Hospital Intake' },
    { key: PERMISSIONS.VERIFY_SIGNATURE, label: 'Verify Originating Signature', category: 'Hospital Intake' },
    { key: PERMISSIONS.DECRYPT_REFERRAL, label: 'RSA-OAEP / AES Payload Decrypt', category: 'Hospital Intake' },
    { key: PERMISSIONS.ACCEPT_PATIENT, label: 'Patient Triage & Admission', category: 'Hospital Intake' },
  ];

  const roleList = [
    { role: ROLES.ADMIN, title: 'System Administrator' },
    { role: ROLES.PHC_DOCTOR, title: 'PHC Medical Officer' },
    { role: ROLES.PHC_STAFF, title: 'PHC Staff / Nurse' },
    { role: ROLES.HOSPITAL_TRIAGE, title: 'Hospital Triage Lead' },
    { role: ROLES.HOSPITAL_PHYSICIAN, title: 'Hospital Physician' },
    { role: ROLES.AUDITOR, title: 'Healthcare Auditor' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
        <p className="text-xs text-slate-500">
          Enforces strict least-privilege clinical and administrative boundaries across all three portals
        </p>
      </div>

      <Card title="Permissions & Operational Entitlements" icon={Shield}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="py-3 px-4 font-semibold text-slate-700 uppercase tracking-wider">
                  Permission / Capability
                </th>
                <th className="py-3 px-3 font-semibold text-slate-700 uppercase tracking-wider">
                  Category
                </th>
                {roleList.map((r) => (
                  <th key={r.role} className="py-3 px-3 text-center font-semibold text-slate-700">
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">{r.role}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allPermissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-800">{perm.label}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {perm.category}
                    </span>
                  </td>
                  {roleList.map((r) => {
                    const hasPerm = (ROLE_PERMISSIONS[r.role] || []).includes(perm.key);
                    return (
                      <td key={r.role} className="py-3 px-3 text-center">
                        {hasPerm ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

