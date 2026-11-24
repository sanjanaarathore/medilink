# Architecture Decision Records (ADR)

## ADR-001: Strict Three-Portal Modular Architecture
- **Status**: Accepted
- **Context**: The user specification requires a unified healthcare referral handoff system serving three distinct clinical and administrative user groups: System Administrators, Rural Primary Health Centre (PHC) staff, and Urban District Hospital emergency teams.
- **Decision**: Implement exactly three role-based portals (`AdminPortal`, `PhcPortal`, `HospitalPortal`) within a single React application bundle, governed by Role-Based Access Control (RBAC) and client-side routing.
- **Consequences**: Avoids maintaining three separate frontend repositories; enables shared cryptographic, storage, and QR protocol libraries; allows single-command PWA installation and uniform offline caching.

---

## ADR-002: Client-Side Web Crypto API Exclusivity
- **Status**: Accepted
- **Context**: In an offline-first system handling sensitive health information, cryptographic security must be mathematically rigorous, fast, and secure against timing/side-channel attacks.
- **Decision**: Standardize exclusively on the browser native W3C **Web Crypto API** (`window.crypto.subtle`).
  - Content encryption: **AES-256-GCM** with 96-bit random IV and 128-bit authentication tags.
  - Asymmetric key encapsulation: **RSA-OAEP** with SHA-256.
  - Digital signatures: **ECDSA P-256** with SHA-256.
- **Consequences**: Zero third-party unvetted cryptographic npm dependencies; hardware-accelerated performance; eliminates supply-chain vulnerabilities in crypto libraries.

---

## ADR-003: PIN-Derived PBKDF2 Key Wrapping for Local Storage
- **Status**: Accepted
- **Context**: Private facility keys must be persisted locally in client-side IndexedDB so clinicians can sign and decrypt referrals while offline. However, storing plaintext private keys on shared clinic tablets is a critical security vulnerability.
- **Decision**: Private keys in IndexedDB are encrypted at rest using AES-256-GCM with a key derived from a clinician-entered authorization PIN via **PBKDF2** (HMAC-SHA-256, 100,000 iterations, 128-bit random salt).
- **Rule**: Explicitly document that a PIN alone is never a key exchange mechanism; it is strictly an authorization vector to unlock locally wrapped cryptographic keys.

---

## ADR-004: MLO1 Multi-Part Optical Framing Protocol
- **Status**: Accepted
- **Context**: Encrypted, signed clinical referral envelopes range from 1,200 to 2,500 bytes. Displaying this data in a single dense QR code (Version 35–40) causes frequent scanning failures on low-cost smartphone cameras under poor lighting.
- **Decision**: Specify and implement the **MLO1 Multi-Part QR Protocol**. Payloads are split into 350–450 byte segments formatted as `MLO1|<refIdShort>|<seq>|<total>|<crc32>|<data>`. Frames are displayed as an animated slideshow (2–3 FPS) or printed as a multi-frame paper grid. The scanner reconstructs the envelope out-of-order and validates CRC32 per frame.

---

## ADR-005: Client-Side Persistence via IndexedDB
- **Status**: Accepted
- **Context**: The application must store facility directories, user profiles, trusted public keys, patient records, outgoing referrals, and incoming records without requiring a backend server.
- **Decision**: Use native **IndexedDB** wrapped with the lightweight, Promise-based `idb` library. All database writes are executed within explicit ACID-compliant transactions across stores.

---

## ADR-006: Progressive Web App (PWA) with Cache-First Service Worker
- **Status**: Accepted
- **Context**: Rural health posts experience zero or erratic internet connectivity. The entire application shell, scripts, styles, and static assets must load instantly without network access.
- **Decision**: Configure Vite with `vite-plugin-pwa` and Workbox, implementing a **Cache-First** strategy for all static assets with automated background updating when connectivity returns.

---

## ADR-007: Android Packaging Readiness via Capacitor
- **Status**: Accepted
- **Context**: In Phase 2 and beyond, field health workers may require native Android APK distribution for deployment on state-issued health department tablets.
- **Decision**: Architect the frontend and camera hardware integration to support Apache **Capacitor** (`@capacitor/core`, `@capacitor/camera`, `@capacitor/filesystem`) without modifying core web logic.

---

## ADR-008: Synthetic Patient Data Compliance
- **Status**: Accepted
- **Context**: Health data regulations (DISHA, HIPAA) mandate strict protection of Personal Health Information (PHI).
- **Decision**: All development fixtures, automated test suites, sample databases, and demonstration records must use 100% synthetic, non-identifiable test data.

