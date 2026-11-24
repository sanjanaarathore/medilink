# MediLink Offline

### Plan. Seal. Transfer. Care.
**An Offline-First Secure Patient Referral Handoff System Using Encrypted QR Codes**

[![Live Testing Demo](https://img.shields.io/badge/Live%20Demo-Online%20Testing-brightgreen.svg?style=for-the-badge&logo=googlechrome&logoColor=white)](https://sanjanaarathore.github.io/medilink/)

> **Live Interactive Testing Link**: **[https://sanjanaarathore.github.io/medilink/](https://sanjanaarathore.github.io/medilink/)**  
> *Test offline-first patient enrollment, emergency clinical referrals, client-side AES-256-GCM + RSA-OAEP + ECDSA P-256 sealing, multi-part MLO1 QR generation, frame reassembly, and casualty admission directly in your browser with zero backend setup. Quick-fill demo credentials (PHC Medical Officer, District Hospital Triage Lead, and System Administrator) are pre-loaded on the portal login screens.*

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Web Crypto API](https://img.shields.io/badge/Web%20Crypto-AES--256--GCM%20%7C%20RSA--OAEP%20%7C%20ECDSA-064e3b.svg)](https://www.w3.org/TR/WebCryptoAPI/)
[![IndexedDB](https://img.shields.io/badge/Storage-IndexedDB%20v2-0f766e.svg)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-10b981.svg)](https://w3c.github.io/manifest/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android%20Ready-119eff.svg)](https://capacitorjs.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-183%2F183%20Passing-success.svg)](tests/README.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](CHANGELOG.md)

> **An offline-first clinical referral and air-gap health data handoff platform built with React 18, Tailwind CSS, IndexedDB, PWA Service Workers, and the W3C Web Crypto API—enabling rural Primary Health Centres (PHCs) to cryptographically seal, digitally sign, fragment into multi-part MLO1 QR codes, and securely transfer structured patient referrals to District Hospitals with zero internet connectivity.**

---

## 1. Problem Statement

Rural healthcare referral networks face severe infrastructure and security bottlenecks between Primary Health Centres (PHCs) and District/Tertiary Hospitals:
- **Zero or Intermittent Connectivity**: Ambulance corridors and remote PHCs frequently operate with zero cellular or broadband access when emergency transfers occur.
- **Unstructured Paper Slips**: Handwritten referral slips lack standardized vitals, allergy alerts, or medication histories, and are easily lost or misread at casualty intake.
- **Unencrypted Patient Data Exposure**: Transmitting patient records over unencrypted messaging apps or plain QR codes exposes sensitive health information during physical transit.
- **Sender Authenticity Gaps**: Receiving casualty teams need cryptographic proof that an incoming emergency referral originated from an authorized, unrevoked PHC.
- **Network-Blocked Workflows**: Cloud-dependent health portals freeze or fail completely when connectivity drops during triage or intake.

---

## 2. Proposed Solution

**MediLink Offline** bridges the rural-to-tertiary clinical handoff gap through **client-side hybrid cryptography**, **resilient IndexedDB persistence**, and a **custom multi-part optical barcode protocol (MLO1)**:
1. **Zero-Network Critical Path**: Patient enrollment, clinical examination, referral creation, encryption, signing, QR framing, camera scanning, signature verification, and decryption all run 100% locally inside the browser or PWA.
2. **Three Strictly Segregated Portals**: Separate role-scoped interfaces for **PHC Clinicians**, **District Hospital Triage Teams**, and **System Administrators** inside one unified React application.
3. **Standards-Based Hybrid Cryptography**: Uses native `window.crypto.subtle` exclusively—**AES-256-GCM** for payload confidentiality and AAD integrity, **RSA-OAEP (SHA-256)** for hospital key encapsulation, **ECDSA P-256** for sender non-repudiation, and **PBKDF2 (100,000 iterations)** for PIN-wrapped local private keys.
4. **Resilient Multi-Part QR Framing**: Fragments encrypted referral envelopes into CRC32-checked `MLO1` frames with out-of-order reassembly, duplicate rejection, animated QR playback, and printable clinical slips.

---

## 3. Three Role-Based Portals

| Portal | Primary Users | Core Capabilities |
| :--- | :--- | :--- |
| **1. PHC Portal** | Medical Officers & PHC Staff | Patient enrollment (ABHA validation), medical history, clinical vitals exam, emergency referral authoring, client-side AES/RSA/ECDSA sealing, animated & printable MLO1 QR code generation, outgoing register. |
| **2. District Hospital Portal** | Emergency Triage Leads & Physicians | Optical camera QR scanning, image upload ingestion, manual MLO1 frame terminal, out-of-order frame reconstruction, ECDSA signature verification against trusted directory, PIN-unlocked decryption, ICU/ward bed admission. |
| **3. Admin Portal** | District Health Administrators | Facility directory, user management, least-privilege RBAC matrix (strictly denying clinical PHI access to admins), trusted public key registry, key revocation, `.mldir` air-gap trust bundle export/import, cryptographic audit trail, sync telemetry. |

---

## 4. Cryptographic Security Architecture

All cryptographic operations use the standard W3C Web Crypto API (`window.crypto.subtle`) implemented in [`src/crypto/webCryptoEngine.js`](src/crypto/webCryptoEngine.js) and [`src/services/keyManagementService.js`](src/services/keyManagementService.js):

| Purpose | Standard Primitive | Parameters & Specification | Security Guarantee |
| :--- | :--- | :--- | :--- |
| **Payload Encryption** | `AES-GCM` | Ephemeral 256-bit Key, 96-bit CSPRNG Nonce, 128-bit Auth Tag | Authenticated confidentiality; any tampered byte or tag fails decryption. |
| **Key Encapsulation** | `RSA-OAEP` | 2048-bit Modulus, SHA-256 Digest, Exponent `65537` | Ephemeral AES session key is wrapped strictly for the target recipient hospital. |
| **Digital Signature** | `ECDSA` | NIST P-256 (`secp256r1`), SHA-256 over canonical JSON | Origin authenticity, non-repudiation, and whole-envelope tamper detection. |
| **Local Key Wrapping** | `PBKDF2 + AES-GCM` | HMAC-SHA-256, 100,000 Iterations, 128-bit Salt | Protects facility private keys at rest in IndexedDB; zero plaintext private keys. |
| **Frame Integrity** | `CRC-32` | IEEE 802.3 Polynomial (`0xEDB88320`) | Immediate rejection of corrupted barcode frames before buffer assembly. |

### Authenticated Additional Data (AAD) Binding
Header metadata (`version | referralId | senderFacilityId | recipientFacilityId | timestamp | symmetricAlgorithm`) is bound into AES-GCM AAD, mathematically preventing silent referral redirection or metadata tampering.

---

## 5. MLO1 Multi-Part QR Transfer Protocol

High-density clinical referral envelopes are deterministically serialized (`canonicalizeJson`), chunked into camera-friendly 350–450 byte frames, and rendered as pure JavaScript ISO/IEC 18004 SVG QR matrices ([`src/qr/qrCodeGenerator.js`](src/qr/qrCodeGenerator.js)):

```text
MLO1|<refIdShort>|<seq>|<total>|<crc32>|<chunkData>
```

- **Animated Digital Carousel**: Loops sequential QR frames at configurable FPS (`1–4 FPS`) with play/pause and frame stepping.
- **Printable Static Grid**: Generates multi-QR clinical handoff sheets for thermal or laser printing.
- **Out-of-Order Reassembly Engine** ([`src/qr/qrScannerEngine.js`](src/qr/qrScannerEngine.js)): Deduplicates repeated frames, tracks missing sequence indices, rejects CRC32 corruption, and reassembles envelopes regardless of capture order.

---

## 6. Offline-First & Synchronization Architecture

- **IndexedDB v2 Persistence** ([`src/services/dbService.js`](src/services/dbService.js)): Transactional storage across `facilities`, `users`, `patients`, `referrals_outgoing`, `referrals_received`, `trusted_keys`, `local_credentials`, `sync_queue`, and `audit_logs`.
- **PWA Service Worker** ([`public/sw.js`](public/sw.js)): Caches the application shell and static bundles (`medilink-v1.0.0`) with an offline fallback ([`public/offline.html`](public/offline.html)), while strictly bypassing HTTP caching for `/api/`, `/clinical/`, and `/referrals/` endpoints.
- **Background Sync Queue** ([`src/services/syncService.js`](src/services/syncService.js)): Non-blocking, idempotent local queue with exponential retry and hospital-precedence clinical conflict resolution.

---

## 7. Directory Layout

```text
MediLink Offline/
├── .github/workflows/        # GitHub Actions CI (183 tests) & GitHub Pages deployment
├── docs/                     # Architectural specifications (01–10 + ADRs)
├── public/                   # PWA manifest, Service Worker, offline fallback, production bundle
├── src/
│   ├── components/           # Shared clinical UI components, layouts, icons, error boundary
│   ├── config/               # Role definitions, least-privilege RBAC permissions, portal constants
│   ├── crypto/               # Web Crypto API engine (AES-GCM, RSA-OAEP, ECDSA, PBKDF2)
│   ├── db/                   # IndexedDB v2 schema & store definitions
│   ├── hooks/                # Offline status, PWA install, persistent storage quota hooks
│   ├── portals/              # Admin (10 views), PHC (13 views), District Hospital (11 views)
│   ├── qr/                   # MLO1 framing, pure JS QR matrix/SVG generator, frame reassembler
│   ├── services/             # Patient, Referral, Auth, KeyManagement, Sync, Validation, Audit
│   ├── utils/                # Synthetic clinical fixtures (Meera Bai, Aarav Kumar)
│   ├── App.jsx               # Root three-portal switchboard
│   └── main.jsx              # Application bootstrap & Service Worker registration
├── tests/                    # Automated test harnesses across 7 suites (183 assertions)
├── capacitor.config.json     # Apache Capacitor Android configuration
├── server.js                 # Zero-dependency local HTTP deployment server
└── package.json              # Project metadata, scripts, and dependencies
```

---

## 8. Quick Start & Demo Credentials

### Option A: Test Live in Your Browser
Visit **[https://sanjanaarathore.github.io/medilink/](https://sanjanaarathore.github.io/medilink/)** — no installation required.

### Option B: Run Locally
```bash
# Start the built-in zero-dependency HTTP server
node server.js
# Open http://localhost:3000
```

### Demo Accounts (Synthetic Data Only)

| Portal | Username | PIN | Facility Node |
| :--- | :--- | :--- | :--- |
| **PHC Portal** | `dr.rajesh` | `1234` | Dhar Primary Health Centre (`PHC-DHAR-04`) |
| **District Hospital Portal** | `triage.anita` | `1234` | Maharaja Yeshwantrao District Hospital (`DH-INDORE-01`) |
| **Admin Portal** | `admin.patel` | `1234` | District Health Administration (`DH-INDORE-01`) |

*(One-click quick-fill buttons are available on each portal's sign-in view.)*

---

## 9. Automated Verification Suite (`183 / 183` Passing)

All 7 test suites run natively on Node.js (`>=20`) using built-in Web Crypto APIs and an in-memory IndexedDB test driver (also executed automatically via [`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Test Suite | Scope | Assertions |
| :--- | :--- | :---: |
| [`tests/integration/offlineReferralHandoffE2E.test.js`](tests/integration/offlineReferralHandoffE2E.test.js) | Full air-gap PHC → MLO1 QR → Hospital ICU intake | 31 / 31 |
| [`tests/security/cryptographicSecurity.test.js`](tests/security/cryptographicSecurity.test.js) | AES-GCM tamper rejection, ECDSA forgery, PBKDF2, key revocation | 45 / 45 |
| [`tests/unit/portalNavigation.test.js`](tests/unit/portalNavigation.test.js) | All 31 portal pages, components, and layouts | 31 / 31 |
| [`tests/unit/corePatientReferral.test.js`](tests/unit/corePatientReferral.test.js) | RBAC boundaries, ABHA validation, vitals, patient & referral CRUD | 29 / 29 |
| [`tests/offline/pwaAndStorage.test.js`](tests/offline/pwaAndStorage.test.js) | PWA manifest, Service Worker rules, IndexedDB v2, backup/restore | 25 / 25 |
| [`tests/offline/syncQueue.test.js`](tests/offline/syncQueue.test.js) | Idempotency, hospital-precedence conflicts, retry & purge | 18 / 18 |
| [`tests/qr/protocol.test.js`](tests/qr/protocol.test.js) | MLO1 frame formatting, parsing, and CRC32 checks | 4 / 4 |

```bash
node tests/integration/offlineReferralHandoffE2E.test.js
node tests/security/cryptographicSecurity.test.js
node tests/unit/corePatientReferral.test.js
node tests/unit/portalNavigation.test.js
node tests/offline/pwaAndStorage.test.js
node tests/offline/syncQueue.test.js
node tests/qr/protocol.test.js
```

---

## 10. Known Limitations & Future Improvements

### Known Limitations
- **Demonstration PIN Fallback**: `authService.js` includes a `1234` fallback PIN check for frictionless browser evaluation; this must be disabled or environment-gated before clinical field deployment.
- **Native Android Compilation**: Capacitor configuration ([`capacitor.config.json`](capacitor.config.json)) is ready, while final `.apk` binary compilation requires Android Studio / Gradle SDK on the target build host.

### Future Improvements
1. **Hardware Security Keystore Backing**: Bind PBKDF2 wrapping keys to Android Keystore / WebAuthn platform authenticators on native mobile builds.
2. **HL7 FHIR R4 Bundle Mapping**: Add bidirectional export adapters from the canonical referral envelope to ABDM/FHIR `Bundle` resources for hospital EHR ingestion.
3. **Bi-Directional Referral Feedback QR**: Allow District Hospitals to issue a signed outcome summary QR back to the referring PHC when the patient is discharged.

---

## 11. Technical Documentation Suite

- [`docs/01_PROJECT_OVERVIEW_AND_SCOPE.md`](docs/01_PROJECT_OVERVIEW_AND_SCOPE.md): Vision, scope, and rural referral context.
- [`docs/02_REQUIREMENTS_SPECIFICATION.md`](docs/02_REQUIREMENTS_SPECIFICATION.md): Functional and non-functional clinical requirements.
- [`docs/03_SYSTEM_ARCHITECTURE.md`](docs/03_SYSTEM_ARCHITECTURE.md): Three-portal component topology and data flow.
- [`docs/05_DATABASE_DESIGN.md`](docs/05_DATABASE_DESIGN.md): IndexedDB v2 object store schemas and migration design.
- [`docs/06_SECURITY_ARCHITECTURE.md`](docs/06_SECURITY_ARCHITECTURE.md): Threat model, hybrid encryption, AAD binding, and key lifecycle.
- [`docs/07_QR_TRANSFER_WORKFLOW.md`](docs/07_QR_TRANSFER_WORKFLOW.md): MLO1 frame layout, chunk sizing, and error correction specifications.
- [`docs/08_OFFLINE_AND_SYNC_ARCHITECTURE.md`](docs/08_OFFLINE_AND_SYNC_ARCHITECTURE.md): PWA caching boundaries and background queue conflict rules.
- [`docs/ARCHITECTURE_DECISION_RECORDS.md`](docs/ARCHITECTURE_DECISION_RECORDS.md): Architectural trade-offs and security decisions.
- [`CHANGELOG.md`](CHANGELOG.md): Phase-by-phase engineering history (Phases 1–5).

---

## 12. Resume & Portfolio Entry

### One-Line Summary
> *An offline-first secure patient referral handoff PWA built with React 18, IndexedDB, and the W3C Web Crypto API, enabling encrypted air-gapped health transfers via multi-part MLO1 QR codes.*

### Key Engineering Highlights
- **Client-Side Hybrid Cryptography**: Engineered standards-compliant `AES-256-GCM` + `RSA-OAEP` + `ECDSA P-256` referral sealing with `PBKDF2` (100k iterations) local private key wrapping and zero plaintext key storage.
- **Custom Multi-Part Optical Protocol (`MLO1`)**: Built a pure JavaScript ISO/IEC 18004 QR SVG generator and out-of-order frame reassembler with CRC32 corruption rejection and duplicate filtering.
- **Zero-Network Clinical Resilience**: Implemented an offline-first three-portal React architecture backed by transactional IndexedDB v2 and a strict zero-PII Service Worker cache policy, validated by 183 automated tests.

---

## 13. License

This project is licensed under the [MIT License](LICENSE).
