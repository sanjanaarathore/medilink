# 02. Requirements Specification (Functional & Non-Functional)

## 1. System Stakeholders and User Roles

| Role Identifier | Role Name | Primary Responsibility | Primary Portal |
|---|---|---|---|
| `ADMIN` | System / District Administrator | Manages healthcare facility registry, provisions authorized user credentials, manages trusted public key directories, audits system access logs, and manages cryptographic policies. | Admin Portal |
| `PHC_DOCTOR` | PHC Medical Officer | Conducts clinical examinations, establishes provisional diagnoses, orders emergency referrals, digitally signs outgoing referral records, and authorizes QR generation. | PHC Portal |
| `PHC_STAFF` | PHC Nurse / Auxiliary Staff | Registers patient demographics, records baseline vitals, assists in drafting referral forms, and operates the QR display/printing station. | PHC Portal |
| `HOSPITAL_TRIAGE` | Hospital Triage Nurse / Officer | Operates camera QR scanners at the emergency reception, verifies incoming referral frames, checks sender facility authenticity, and triggers emergency priority alerts. | District Hospital Portal |
| `HOSPITAL_PHYSICIAN` | Receiving Hospital Specialist | Reviews decrypted clinical summaries, confirms patient acceptance, inspects past medications administered, and updates intake disposition. | District Hospital Portal |
| `AUDITOR` | Healthcare Quality Auditor | Inspects immutable local audit logs, tracks referral completion rates, and verifies key rotation compliance. | Admin Portal |

---

## 2. Functional Requirements (FR)

### 2.1 Portal 1: Admin Portal Requirements
- **FR-ADM-01: Healthcare Facility Registry**:
  - The system shall allow administrators to register, view, update, and deactivate healthcare facilities (Primary Health Centres, Community Health Centres, Sub-District Hospitals, and District Hospitals).
  - Each facility record must store: `facilityId`, `name`, `type`, `district`, `state`, `contactInfo`, and `status`.
- **FR-ADM-02: User Access & RBAC Management**:
  - The system shall allow administrators to provision local user accounts with assigned roles (`ADMIN`, `PHC_DOCTOR`, `PHC_STAFF`, `HOSPITAL_TRIAGE`, `HOSPITAL_PHYSICIAN`, `AUDITOR`).
  - Access to portal routes, actions, and cryptographic keys must be strictly enforced via the RBAC matrix.
- **FR-ADM-03: Facility Identity & Trusted Key Directory**:
  - The system shall manage public keys for all participating facilities.
  - The system shall store both the ECDSA P-256 public signing key and the RSA-OAEP public encryption key for each facility.
  - The system shall provide an exportable/importable JSON Trust Directory package allowing offline synchronization of public keys across facilities via USB thumb drive or optical barcode.
  - The system shall support key revocation marking and validity expiration dates (`validFrom`, `validUntil`).
- **FR-ADM-04: System Audit Logs**:
  - The system shall maintain an append-only audit trail in IndexedDB recording: `timestamp`, `userId`, `facilityId`, `actionType`, `resourceId`, and `status`.
  - Administrative users can filter audit logs by date range, action type, and user ID.
- **FR-ADM-05: System Configuration & Cryptographic Parameters**:
  - The system shall display system health diagnostics, IndexedDB storage consumption, Service Worker cache status, and cryptographic configuration (PBKDF2 iteration count, QR chunk sizing limits).

### 2.2 Portal 2: PHC Portal Requirements
- **FR-PHC-01: Patient Registration & Profile Management**:
  - The system shall capture patient demographics: Full Name, Age/DOB, Gender, Contact Phone, Village, District, Guardian/Attendant Name, and optional National Health ID (ABHA).
  - The system shall assign a unique local patient identifier (`PAT-YYYY-XXXXX`).
- **FR-PHC-02: Clinical History & Vitals Entry**:
  - The system shall capture baseline clinical vitals: Systolic BP, Diastolic BP, Heart Rate, Respiratory Rate, Body Temperature, SpO2 (Oxygen Saturation), and Random Blood Sugar.
  - The system shall provide structured fields for Past Medical History, Known Allergies, and Current Chronic Medications.
- **FR-PHC-03: Emergency Referral Creation**:
  - The system shall enable clinical staff to generate a referral slip selecting: Destination District Hospital, Referral Priority (`ROUTINE`, `URGENT`, `EMERGENCY_CRITICAL`), Primary Referral Reason, Provisional Diagnosis, Clinical History Summary, and Medications Administered prior to transport.
- **FR-PHC-04: Client-Side Hybrid Encryption**:
  - The system shall generate a cryptographically secure random 256-bit AES key and a 96-bit IV using `crypto.getRandomValues()`.
  - The system shall encrypt the complete structured JSON referral record using AES-256-GCM, producing ciphertext and a 128-bit authentication tag.
  - The system shall retrieve the recipient District Hospital's RSA-OAEP public key from the local Trust Directory and encrypt the AES session key with RSA-OAEP (SHA-256).
- **FR-PHC-05: Digital Signature Generation**:
  - The system shall compute an ECDSA P-256 digital signature over the referral envelope (sender facility ID, recipient facility ID, timestamp, ciphertext, authentication tag) using the sending PHC's private key.
  - The private key must be unlocked from IndexedDB storage using the authorized clinician's PIN/passphrase.
- **FR-PHC-06: Multi-Part QR Code Generation & Display**:
  - The system shall package the encrypted envelope into the MLO1 protocol format.
  - If the payload size exceeds single QR scan thresholds (>400 bytes), the system shall automatically fragment the payload into sequential chunks (`seq` of `total`) with CRC32 integrity checksums.
  - The system shall provide an animated QR slideshow viewer (adjustable 1–4 FPS) and a static printable multi-frame view for paper handoffs.
- **FR-PHC-07: Outgoing Referral History**:
  - The system shall persist outgoing referrals in local IndexedDB with referral status, timestamps, and destination facility details.

### 2.3 Portal 3: District Hospital Portal Requirements
- **FR-HOS-01: Optical QR Scanning & Image Ingestion**:
  - The system shall interface with standard webcam or mobile camera hardware using ZXing / Capacitor Camera to scan physical QR codes in real-time.
  - The system shall provide an alternate file upload mechanism allowing triage staff to upload photographic images of QR codes captured via external devices.
- **FR-HOS-02: Multi-Part Frame Reassembly**:
  - The scanner engine shall continuously ingest incoming QR frames, parse the `MLO1` header, validate each frame's CRC32 checksum, and update a visual frame-completion indicator (e.g., "Frame 3 of 5 scanned - 60% complete").
  - The system shall reassemble the frames in proper numerical sequence once all frames are successfully received.
- **FR-HOS-03: Sender Authenticity & Signature Verification**:
  - The system shall extract the sending `facilityId` from the envelope and look up the sending PHC's public key in the local Trust Directory.
  - The system shall verify the ECDSA P-256 signature over the payload.
  - If signature verification fails or if the sending facility key is revoked/unrecognized, the system shall raise a prominent security warning ("UNVERIFIED SENDER / INTEGRITY BREACH") and halt automated intake.
- **FR-HOS-04: Recipient Decryption**:
  - The system shall verify that the recipient facility ID matches the local hospital ID.
  - The user shall enter their authorized PIN to unlock the hospital's private RSA-OAEP key from local storage.
  - The system shall decrypt the AES session key using RSA-OAEP and subsequently decrypt the referral ciphertext using AES-256-GCM.
  - If the GCM authentication tag fails verification (indicating data corruption or tampering), the system shall immediately reject the payload.
- **FR-HOS-05: Clinical Intake Dashboard & Triage Prioritization**:
  - The system shall render the decrypted referral record with clear color-coded emergency triage flags (Red for Emergency Critical, Yellow for Urgent, Green for Routine).
  - Triage staff can accept the referral, assign an admitting physician, and log intake disposition into the local hospital database.
- **FR-HOS-06: Received Referral Registry**:
  - The system shall maintain an offline searchable registry of all decrypted incoming referrals.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security & Cryptographic Integrity
- **NFR-SEC-01**: All cryptographic operations must execute exclusively client-side via the W3C Web Crypto API (`window.crypto.subtle`). No external or unvetted crypto libraries shall be used.
- **NFR-SEC-02**: AES-256-GCM must use a cryptographically fresh, unique 96-bit IV generated via `crypto.getRandomValues()` for every single referral. IV reuse is strictly prohibited.
- **NFR-SEC-03**: Private keys stored in IndexedDB must be encrypted at rest using AES-256-GCM with a key derived from the user's PIN via PBKDF2 (HMAC-SHA256, >= 100,000 iterations, 128-bit random salt).
- **NFR-SEC-04**: Under zero circumstances shall private keys or unencrypted clinical payloads be transmitted over network connections or stored in unencrypted browser storage (e.g., standard `localStorage`).

### 3.2 Performance & Responsiveness
- **NFR-PERF-01**: Cold boot application load time under offline PWA caching must be < 1.5 seconds on standard hardware.
- **NFR-PERF-02**: Referral encryption and digital signing must complete in < 250 milliseconds on modern smartphone or desktop hardware.
- **NFR-PERF-03**: QR code scanning frame processing must achieve >= 15 frames per second on standard camera feeds.
- **NFR-PERF-04**: Total reassembly, signature verification, and decryption of a 5-frame referral must complete in < 500 milliseconds upon scanning the final frame.

### 3.3 Reliability & Offline Resilience
- **NFR-REL-01**: 100% of core referral operations (drafting, encrypting, signing, QR generation, scanning, verifying, decrypting, and viewing) must function without any active network interface.
- **NFR-REL-02**: Local data in IndexedDB must use ACID-compliant transactions to prevent partial writes or database corruption during sudden power loss.
- **NFR-REL-03**: Service Worker must cache all application static assets (HTML, CSS, JS, fonts, icons) using a Cache-First strategy with auto-updating capabilities.

### 3.4 Usability & Human Factors in Clinical Environments
- **NFR-USE-01**: High-contrast UI tailored for low-lit rural health posts and bright outdoor ambulance environments.
- **NFR-USE-02**: Real-time visual progress indicator during multi-part QR scanning showing missing frame numbers so the operator can position the camera accurately.
- **NFR-USE-03**: Support touch-friendly, large target controls for gloved hands or mobile tablet usage.

### 3.5 Maintainability & Extensibility
- **NFR-MAINT-01**: Modular separation of concerns into strictly decoupled layers: Presentation, Application Services, Security/Crypto Engine, QR Protocol, and Storage.
- **NFR-MAINT-02**: Clean Capacitor plugin abstraction allowing future native Android compilation without refactoring business logic.

