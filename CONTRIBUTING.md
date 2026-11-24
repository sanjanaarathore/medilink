# Contributing to MediLink Offline

Thank you for your interest in contributing to **MediLink Offline**.

## Non-Negotiable Engineering Guidelines

Please review [`AGENTS.md`](AGENTS.md) before submitting changes:
1. **Strictly Three Portals**: Keep **Admin**, **PHC**, and **District Hospital** portals cleanly separated inside the single React application.
2. **100% Offline Critical Path**: Core clinical workflows (registration, referral creation, encryption, signing, QR generation, scanning, verification, decryption, intake) must operate with zero internet connectivity.
3. **Standard Cryptography Only**: Use the W3C Web Crypto API (`window.crypto.subtle`) exclusively—never introduce custom cryptographic primitives or plaintext private key storage.
4. **Synthetic Data Only**: Never commit real patient health information (PHI) or identifiable records. All fixtures and tests must use strictly synthetic clinical data.

## Running Tests Locally

```bash
node tests/integration/offlineReferralHandoffE2E.test.js
node tests/security/cryptographicSecurity.test.js
node tests/unit/corePatientReferral.test.js
node tests/unit/portalNavigation.test.js
node tests/offline/pwaAndStorage.test.js
node tests/offline/syncQueue.test.js
node tests/qr/protocol.test.js
```

