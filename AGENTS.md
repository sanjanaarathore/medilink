# MediLink Offline: Agent Collaboration Guidelines & System Manifesto

## Project Title
**MediLink Offline: An Offline-First Secure Patient Referral Handoff System Using Encrypted QR Codes**

## 1. Project Objective & Vision
MediLink Offline bridges the critical communication and infrastructure gap between rural Primary Health Centres (PHCs) and District/Tertiary Hospitals. In resource-constrained or remote environments with zero or intermittent internet connectivity, structured patient referral information must be securely transferred without data loss, tampering, or unauthorized interception. MediLink Offline achieves this through client-side hybrid cryptography and high-density, multi-part 2D barcode (QR code) handoffs.

---

## 2. Core Architectural Principles (Non-Negotiable)

1. **Strictly Three Role-Based Portals in One React Application**:
   - **Admin Portal**: Healthcare facility registry, user access management, role/permission assignments, trusted facility public key directory, audit logs, system health, and cryptographic configurations.
   - **PHC Portal**: Patient registration, medical history, clinical examination, triage scoring, referral generation, payload encryption, ECDSA digital signing, multi-part QR code generation, and outgoing referral tracking.
   - **District Hospital Portal**: QR scanning (camera & image upload), multi-part frame reconstruction, digital signature verification (authenticity & non-repudiation), payload decryption (confidentiality), structured clinical intake, and received referral history.
   *Do NOT add, remove, or merge these portals.*

2. **Offline-First Resilience**:
   - The core workflow (patient registration -> referral creation -> encryption -> signing -> QR generation -> camera scanning -> signature verification -> decryption -> patient intake) must function 100% offline without network connectivity.
   - Local state is persisted in client-side IndexedDB with transaction safety.
   - Service Workers cache application shell, styles, scripts, and static assets for Progressive Web Application (PWA) operation.
   - Optional future cloud synchronization is designed as an asynchronous, non-blocking background queue; it is never in the critical path.

3. **Rigorous, Standards-Compliant Cryptography**:
   - **Payload Encryption**: AES-256-GCM (authenticated encryption with associated data) providing confidentiality and tamper detection via 128-bit authentication tags.
   - **Key Encapsulation / Asymmetric Exchange**: RSA-OAEP with SHA-256 (2048-bit or 4096-bit) to encrypt the ephemeral AES-256 session key specifically for the recipient District Hospital's public key.
   - **Authenticity & Integrity**: ECDSA with curve P-256 and SHA-256 for signing the referral payload using the sending PHC's private key.
   - **Local Key Storage Security**: Private keys stored in IndexedDB must NEVER be saved in plaintext. They must be wrapped/encrypted using an AES-GCM key derived via PBKDF2 (minimum 100,000 iterations, SHA-256) from a user-provided authorization PIN/passphrase. *A PIN alone is never a key exchange mechanism.*
   - **No Custom Crypto**: Use standard Web Crypto API (`window.crypto.subtle`) exclusively.

4. **Multi-Part QR Transfer Protocol**:
   - High-density QR codes (Version 40, Error Correction Level L or M) have practical byte limits when scanning with standard mobile/web cameras.
   - Large referral payloads (patient demographics, clinical notes, medications, vitals) are serialized into compact JSON, optionally compressed (Deflate/gzip), encrypted, and fragmented into sequential QR frames (`CHUNK_i_OF_n:payload_hash:seq:total:chunk_data`).
   - The scanner reconstructs the complete payload, validates the integrity hash, verifies the ECDSA signature against the sender's public key, and decrypts the AES payload using the hospital's private key.

5. **Cross-Platform Compatibility**:
   - Built with standard web technologies (React 18+, Vite, Tailwind CSS, React Router v6+).
   - Structured for seamless native Android compilation using Apache Capacitor (`@capacitor/core`, `@capacitor/camera`, `@capacitor/filesystem`).

6. **Privacy, Compliance & Synthetic Data**:
   - All development, demonstration, and automated testing must use strictly synthetic, non-identifiable patient data.
   - Compliant with digital health data principles (e.g., DISHA / ABDM guidelines in India, HIPAA security rule standards).

---

## 3. Directory Layout Standard

```
MediLink Offline/
├── docs/                     # Architectural specifications, security models, data flows, API schemas
├── public/                   # Static assets, PWA manifest, service worker files, offline fallback
├── src/
│   ├── assets/               # Icons, styles, brand graphics
│   ├── components/           # Reusable UI component library (Tailwind CSS)
│   │   ├── common/           # Buttons, Inputs, Modals, Cards, Badges, Loaders
│   │   ├── layout/           # Navbar, Sidebar, PortalLayout, OfflineIndicator
│   │   └── qr/               # QRGenerator, QRScanner, MultiPartProgress, FrameViewer
│   ├── config/               # App configuration, constants, portal routes, role definitions
│   ├── context/              # React Context providers (AuthContext, SecurityContext, SyncContext)
│   ├── crypto/               # Web Crypto API wrapper, key management, envelope encryption, signing
│   ├── db/                   # IndexedDB schema, Dexie/idb wrappers, repositories, migrations
│   ├── hooks/                # Custom React hooks (useOffline, useQRScanner, useCrypto, useIndexedDB)
│   ├── portals/              # The Three Primary Role-Based Portals
│   │   ├── admin/            # Facilities, Users, Keys, Audit Logs, System Settings
│   │   ├── phc/              # Patient Registry, Clinical Records, Referrals, QR Generator
│   │   └── hospital/         # QR Ingestion, Signature Verifier, Decryptor, Intake Dashboard
│   ├── qr/                   # Barcode chunking, sequencing, CRC32/SHA-256 checks, reconstruction
│   ├── services/             # Application services (PatientService, ReferralService, AuditService)
│   ├── types/                # JSDoc / Type definition schemas (Referral, Patient, KeyEnvelope)
│   ├── utils/                # Date formatters, validators, synthetic generators, compression
│   ├── App.jsx               # Root router and portal switchboard
│   ├── main.jsx              # Application bootstrap
│   └── sw.js                 # Service worker definition for offline PWA caching
├── capacitor.config.json     # Capacitor configuration for Android packaging
├── vite.config.js            # Vite build configuration
├── tailwind.config.js        # Tailwind CSS styling framework config
├── package.json              # Project dependencies and lifecycle scripts
└── AGENTS.md                 # This Manifesto & Agent Operational Guide
```

---

## 4. Phase 1 vs Phase 2 Boundaries

- **Phase 1 (Current)**:
  - System Architecture & Engineering Specifications
  - Project Foundation, Directory Scaffolding & Configuration
  - Comprehensive Technical Documentation (14 Required Architectural Sections)
  - Formal Data Schemas, Cryptographic Contracts & Transfer Protocols
  - Risk Identification and Phase 2 Implementation Roadmap
  - *No unnecessary UI implementation code until architecture is formally reviewed and approved.*

- **Phase 2 (Subsequent)**:
  - Cryptographic engine implementation & Web Crypto API test harnesses
  - IndexedDB storage engine and repository pattern
  - Multi-part QR encoding and ZXing/Capacitor camera scanning engine
  - Portal-specific UI workflows (Admin, PHC, District Hospital)
  - PWA service worker caching and offline status synchronization

