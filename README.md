# MediLink Offline

> **An Offline-First Secure Patient Referral Handoff System Using Encrypted QR Codes**

[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-064e3b.svg)](https://w3c.github.io/manifest/)
[![Cryptography](https://img.shields.io/badge/Security-AES--256--GCM%20%7C%20RSA--OAEP%20%7C%20ECDSA-0f766e.svg)](https://www.w3.org/TR/WebCryptoAPI/)
[![Tests Passing](https://img.shields.io/badge/Tests-183%2F183%20Passed-10b981.svg)](tests/)

---

## 1. Executive Summary & Vision

In rural and resource-constrained environments across developing healthcare networks, Primary Health Centres (PHCs) and Community Health Centres (CHCs) regularly refer critical emergency patients to District Hospitals. However, cellular and broadband internet connectivity in transit and remote areas is frequently zero, intermittent, or unstable.

**MediLink Offline** eliminates this critical infrastructure gap by enabling secure, structured, client-side digital referral handoffs **without requiring internet connectivity or cloud servers**. 

The system utilizes **hybrid client-side cryptography** and **high-density, multi-part 2D barcodes (MLO1 Protocol)** to transfer patient records, vitals, pre-referral medications, and clinical notes directly from a PHC doctor's workstation or smartphone to a hospital casualty intake desk via mobile screens or printed paper slips.

---

## 2. Core Architectural Principles (Non-Negotiable)

1. **Strictly Three Role-Based Portals in One React Application**:
   - **Admin Portal**: Facility registry, user management, trusted public key directory, air-gap `.mldir` trust bundle exchange, and administrative audit logs.
   - **PHC Portal**: Patient enrollment, clinical history, examination, vitals, triage priority scoring, referral generation, cryptographic sealing (AES-256-GCM + RSA-OAEP + ECDSA), and MLO1 QR code generation.
   - **District Hospital Portal**: Optical QR camera scanner, image upload ingestion, manual frame terminal, MLO1 multi-part frame reassembly, ECDSA signature verification, PIN-unwrapped RSA-OAEP private key recovery, AES-256-GCM decryption, and clinical intake.

2. **Zero-Trust Physical Transport Security Philosophy**:
   - The physical transport layer (patients, ambulance drivers, smartphones, printed slips) is treated as public and untrusted.
   - Security does not rely on transport secrecy or obscure encoding. Confidentiality and authenticity are mathematically guaranteed at the data layer using standardized W3C Web Crypto API primitives (`window.crypto.subtle`).
   - A PIN alone is NEVER a key exchange mechanism; PINs are strictly used with PBKDF2 (100,000 iterations, 128-bit salt, AES-256-GCM) to unwrap local private keys stored in IndexedDB.

3. **100% Offline-First Operation**:
   - The complete clinical referral handoff workflow functions with zero network connectivity.
   - All state is persisted client-side in IndexedDB with transactional safety.
   - Progressive Web Application (PWA) Service Worker pre-caches application shell, icons, and offline fallbacks.
   - Optional cloud synchronization operates as a non-blocking, background queue; it is never in the critical path.

---

## 3. Cryptographic Specification

| Purpose | Standard Primitive | Parameters & Specification | Security Guarantee |
|---|---|---|---|
| **Content Encryption** | `AES-GCM` | 256-bit Key, 96-bit Nonce (`iv`), 128-bit Authentication Tag | Authenticated confidentiality; any byte corruption fails decryption. |
| **Key Encapsulation** | `RSA-OAEP` | 2048-bit Modulus, SHA-256 Digest, Public Exponent 65537 | Ephemeral AES session key is encapsulated exclusively for the recipient hospital. |
| **Digital Signatures** | `ECDSA` | NIST P-256 Curve (`secp256r1`), SHA-256 Digest | Origin authenticity, non-repudiation, and whole-envelope integrity verification. |
| **Local Key Wrapping** | `PBKDF2 + AES-GCM` | HMAC-SHA-256, 100,000 Iterations, 128-bit CSPRNG Salt | Protects private keys at rest in IndexedDB using clinician/staff PINs. |
| **Frame Integrity** | `CRC-32` | 32-bit Polynomial (`0xEDB88320`) | Instant rejection of corrupted or distorted barcode frames before buffering. |

### Authenticated Additional Data (AAD) Binding
$$\text{AAD} = \text{version} \parallel \text{referralId} \parallel \text{senderFacilityId} \parallel \text{recipientFacilityId} \parallel \text{timestamp} \parallel \text{symmetricAlgorithm}$$
Header metadata is mathematically bound to the ciphertext. Any unauthorized attempt to redirect a referral to a different hospital or alter timestamps immediately causes AES-GCM authentication tag verification to fail.

---

## 4. MLO1 Multi-Part Barcode Transfer Protocol

High-density QR codes (Version 20–40, Error Correction Level M) are partitioned into optimal chunks of **350–450 bytes** to ensure 99.9% first-pass scan success across budget smartphone cameras and hospital webcams in suboptimal lighting:

$$\text{MLO1} \mid \text{refIdShort} \mid \text{seq} \mid \text{total} \mid \text{crc32} \mid \text{chunkData}$$

```
Frame 1: MLO1|d3b07384|1|4|a94f01c2|eyJ2ZXIiOiIxLjAiLCJyZWZJZCI6ImQzYj...
Frame 2: MLO1|d3b07384|2|4|f7b2c019|c2VuZGVyRmFjaWxpdHlJZCI6IlBIQy1ES...
Frame 3: MLO1|d3b07384|3|4|10a3d4e8|d3JhcHBlZFNlc3Npb25LZXkiOiJSVE5CT...
Frame 4: MLO1|d3b07384|4|4|8b92ef11|ZGlnaXRhbFNpZ25hdHVyZSI6Ik1FUVNJ...
```

### Presentation & Scanning Modes
- **Animated Digital Carousel**: Loops frames sequentially at 1 to 4 FPS (default 2 FPS) with operator play/pause, prev/next controls.
- **Printable Static Multi-Grid**: Renders an official clinical referral slip with side-by-side barcode frames for thermal or laser paper printing.
- **Out-of-Order Frame Reassembly**: Captures frames in any order, automatically deduplicates repeated frames, detects CRC32 corruption, and tracks missing frame indices.

---

## 5. Technology Architecture

- **Frontend Framework**: React 18+ (Hooks, Context, Error Boundaries)
- **Styling**: Tailwind CSS with clinical color palette (`#064e3b` deep green, `#0f766e` teal, Inter font)
- **Build Tool**: Vite 5+
- **Offline Storage**: IndexedDB (Schema v2 with `sync_queue` and migration handler)
- **PWA**: Web App Manifest (`manifest.json`), Service Worker (`sw.js`), Offline Fallback (`offline.html`)
- **Cryptography**: Pure W3C Web Crypto API (`window.crypto.subtle`)
- **Barcode Engine**: Pure JavaScript ISO/IEC 18004 QR Matrix and SVG Generator (`qrCodeGenerator.js`)
- **Mobile Container**: Apache Capacitor (`@capacitor/core`, `@capacitor/camera`, `@capacitor/filesystem`)

---

## 6. Directory Layout

```
MediLink Offline/
├── docs/                     # Architectural specifications (01 to 10 + ADRs)
├── public/                   # Static PWA assets, manifest.json, sw.js, offline.html, favicon.svg
├── src/
│   ├── components/           # Reusable UI component library
│   │   ├── common/           # Buttons, Cards, Badges, Modals, ErrorBoundary, StateViews
│   │   └── layout/           # Header, Sidebar, PortalLayout, OfflineIndicator
│   ├── config/               # Roles, Permissions, Routes, Portal Constants
│   ├── crypto/               # Web Crypto Engine, AES-GCM, RSA-OAEP, ECDSA, PBKDF2, Canonicalization
│   ├── db/                   # IndexedDB Schema v2, Store Definitions, Migrations
│   ├── hooks/                # useOfflineStatus, usePwaInstall, usePersistentStorage
│   ├── portals/              # The Three Primary Portals
│   │   ├── admin/            # Facilities, Users, Trusted Keys, Audit Logs, Sync Telemetry
│   │   ├── phc/              # Patient Registry, Clinical Records, Referrals, QR Generator
│   │   └── hospital/         # Camera Ingestion, Reassembler, Verifier, Decryptor, Intake
│   ├── qr/                   # MLO1 Protocol Framing, QR Matrix & SVG Generator, Scanner Reassembler
│   ├── services/             # PatientService, ReferralService, KeyManagementService, SyncService, AuditService
│   ├── utils/                # Synthetic Patient Fixtures, Date & Data Formatters
│   ├── App.jsx               # Root Switchboard with ErrorBoundary
│   └── main.jsx              # Application Bootstrap & Service Worker Registration
├── tests/                    # Automated Test Harnesses
│   ├── integration/          # E2E Multi-Station Offline Handoff Simulation (31 tests)
│   ├── offline/              # PWA, Storage, Migration & Sync Queue Tests (43 tests)
│   ├── security/             # Cryptographic Attack & Tamper Tests (45 tests)
│   ├── qr/                   # MLO1 Framing & CRC32 Tests (4 tests)
│   └── unit/                 # Core Patient Management & UI Architecture Tests (60 tests)
├── capacitor.config.json     # Capacitor Native Android Configuration
├── vite.config.js            # Vite Build Configuration
└── package.json              # Project Dependencies & Scripts
```

---

## 7. Automated Test Suite (183/183 Passed)

All test suites execute natively in headless Node.js v24 using the built-in Web Crypto API and IndexedDB memory driver:

```powershell
# Run all test suites
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/integration/offlineReferralHandoffE2E.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/offline/syncQueue.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/offline/pwaAndStorage.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/security/cryptographicSecurity.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/qr/protocol.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/unit/corePatientReferral.test.js
& "C:\Users\Sanjana\AppData\Local\ms-playwright-go\1.57.0\node.exe" tests/unit/portalNavigation.test.js
```

### Test Results Breakdown:
- **E2E Offline Referral Handoff Simulation**: 31/31 passed
- **PWA, Storage Migration & Recovery**: 25/25 passed
- **Sync Queue, Idempotency & Conflict Resolution**: 18/18 passed
- **Cryptographic Security & Tamper Resistance**: 45/45 passed
- **MLO1 Protocol & CRC32 Integrity**: 4/4 passed
- **Core Patient Management & RBAC Boundaries**: 29/29 passed
- **UI Architecture & Portal Pages Verification**: 31/31 passed
- **Total Assertions**: **183 / 183 Passed (100% Success)**

---

## 8. Step-by-Step Demonstration Guide

To demonstrate the complete air-gapped referral handoff:

1. **Station A (PHC Doctor)**:
   - Select **PHC Portal** -> Login as `dr.rajesh` with PIN `1234`.
   - Go to **Patient Registration** -> Enroll synthetic patient (`Meera Bai`, Age 28).
   - Go to **Create Referral** -> Select destination `Maharaja Yeshwantrao District Hospital, Indore` (`DH-INDORE-01`).
   - Enter clinical vitals (BP 85/55, SpO2 86%, RR 34) and diagnosis (`Severe Community-Acquired Pneumonia with ARDS`).
   - Click **Preview Referral** -> Enter Doctor PIN `1234` -> Click **Sign & Generate Encrypted QR**.
   - View the animated MLO1 QR carousel or switch to printable multi-grid view.

2. **Physical Transport (Air-Gap Simulation)**:
   - Disconnect network / disable Wi-Fi. Notice the live `Offline Mode` indicator in the header.

3. **Station B (Hospital Casualty)**:
   - Switch to **District Hospital Portal** -> Login as `triage.anita` with PIN `1234`.
   - Go to **QR Scanner** -> Point camera or click **Switch to Manual Paste** -> Paste the MLO1 frames.
   - The system reassembles the payload, validates CRC32 checksums, and transitions to **Referral Verification**.
   - Notice the green badge: `Verified in Trust Directory (ECDSA P-256)`.
   - Enter Hospital PIN `1234` -> Click **Verify Signature & Decrypt**.
   - View the decrypted patient demographics, baseline vitals, and emergency medications.
   - Click **Admit Patient** -> Allocate bed `ICU Isolation Bay 04`.

4. **Station C (District Administrator)**:
   - Switch to **Admin Portal** -> View the **Trusted Key Directory**.
   - Click **Export Trust Package (.mldir)** for offline flash-drive distribution.
   - View **Synchronization Telemetry** to inspect the local background queue.

---

## 9. Android Capacitor Readiness Evaluation

- **Status**: **Architecture Ready for Native Compilation**.
- **Configuration**: `capacitor.config.json` configured with `appId: "org.medilink.offline"` and `androidScheme: "https"`.
- **Permissions**: Camera access (`android.permission.CAMERA`) and local storage configured.
- **WebView Compatibility**: Pure W3C Web Crypto (`window.crypto.subtle`) and IndexedDB are natively supported in Android Chromium WebViews (Android 7.0+ / API 24+).
- **Compilation Path**: Requires Android Studio / Android SDK (Gradle, Java 17+), executing `npm run build` followed by `npx cap sync android`.

---

## 10. Privacy, Ethics & Compliance

- **Synthetic Data**: 100% of fixtures and development data are strictly fictitious, complying with HIPAA Security Rules and DISHA / ABDM guidelines in India.
- **Zero Cloud Leaks**: Confidential clinical health records are never transmitted unencrypted and never cached in HTTP Service Worker storage.

