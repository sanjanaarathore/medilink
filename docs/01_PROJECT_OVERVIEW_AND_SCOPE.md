# 01. Project Overview, Problem Statement, Objectives & Scope

## 1. Project Title
**MediLink Offline: An Offline-First Secure Patient Referral Handoff System Using Encrypted QR Codes**

---

## 2. Executive Summary
In rural and remote healthcare settings across developing regions, Primary Health Centres (PHCs) serve as the frontline of clinical triage and acute care. When patients develop acute complications, severe trauma, obstetric emergencies, or complex pathologies exceeding primary care capabilities, they must be escalated to tertiary District Hospitals. 

However, rural clinics routinely suffer from:
- Persistent or unpredictable telecommunications outages (zero cellular signal, fiber cuts, power grid failures).
- Complete absence of centralized Electronic Health Record (EHR) network connectivity.
- Reliance on handwritten paper referral slips that are easily soiled, lost, unreadable, or missing vital diagnostic context.
- High risk of patient identity mismatch, delayed triage at the referral destination, and lack of medical auditability.

**MediLink Offline** solves this systemic failure by providing an offline-first, client-side web and progressive mobile application that transforms a patient's complete clinical referral record into a cryptographically secured, high-density 2D optical barcode (single or animated multi-part QR code). 

The referral is encrypted using hybrid cryptography (AES-256-GCM + RSA-OAEP) and digitally signed with ECDSA (P-256) directly within the browser using the standard Web Crypto API. The patient or ambulance attendant physically carries this optical payload to the District Hospital. Upon arrival, hospital clinicians scan the QR code with any standard camera or mobile tablet, cryptographically verify sender authenticity, decrypt the patient record, and immediately initiate targeted clinical intervention—**all without requiring an active internet connection.**

---

## 3. Problem Statement

### 3.1 The Rural-Urban Referral Disconnect
The healthcare delivery pipeline between rural PHCs and urban District Hospitals is plagued by acute operational vulnerabilities:
1. **The Infrastructure Gap**: Over 60% of rural health sub-centres and primary clinics in remote geographies operate under frequent or permanent data connectivity deficits. Cloud-dependent EHR and referral systems (e.g., standard FHIR endpoints or central health databases) fail completely in these environments.
2. **Paper-Based Inefficiency and Medical Errors**: Paper referral slips are prone to legibility errors, physical damage, loss during transit, and omissions of critical diagnostic parameters (allergies, medications administered en route, baseline vitals).
3. **Data Tampering & Impersonation**: Paper slips cannot guarantee authenticity. There is no mechanism to verify whether a referral slip was legitimately authored by an authorized medical officer or altered by third parties.
4. **Patient Privacy & Confidentiality Breaches**: Physical referral notes expose sensitive patient diagnostic information (e.g., HIV status, psychiatric history, reproductive health) to couriers, transport drivers, or family members.
5. **Triage Bottlenecks at District Hospitals**: Hospital emergency departments receive incoming patients with no structured digital pre-intake. Clinicians are forced to re-enter patient demographics and re-run baseline diagnostics, losing golden-hour treatment windows.

---

## 4. Objectives and Scope

### 4.1 Core Objectives
1. **100% Offline Operational Autonomy**: Enable end-to-end patient referral creation, digital signing, encryption, QR code generation, camera scanning, verification, and clinical intake with zero dependency on internet connectivity or external cloud servers.
2. **Zero-Trust Client-Side Cryptography**: Ensure strict confidentiality, authenticity, integrity, and non-repudiation using standard Web Crypto API primitives (AES-256-GCM, RSA-OAEP with SHA-256, and ECDSA P-256).
3. **Physical Optical Data Transport**: Leverage single and animated multi-part QR code sequences to transfer structured clinical records (demographics, vitals, history, medications, allergies, referral reason) across the physical air gap.
4. **Three Dedicated Role-Based Portals**: Deliver a unified single-page React application containing strictly isolated portals:
   - **Admin Portal**: Healthcare facility directory, user management, RBAC, trusted public key management, and audit logging.
   - **PHC Portal**: Patient registration, clinical triage, emergency referral drafting, cryptographic sealing, and QR generation.
   - **District Hospital Portal**: Optical QR scanning/upload, multi-part frame reassembly, signature verification, payload decryption, and emergency intake triage.
5. **Future-Proof Extensibility**: Provide native mobile wrapping readiness via Capacitor and optional asynchronous background synchronization whenever network connectivity is intermittently restored.

### 4.2 In Scope
- **Client-Side Progressive Web App (PWA)**: Installable on commodity desktop laptops, tablets, and smartphones via modern browsers (Chrome, Edge, Firefox, Safari).
- **Local Persistence via IndexedDB**: Transactional, isolated client-side storage for facilities, users, trusted public keys, patient records, referrals, and audit trails.
- **Cryptographic Key Management**:
  - Generation and distribution of facility identity keys (ECDSA for signing; RSA-OAEP for encryption).
  - PIN-derived local credential unlocking using PBKDF2 (100,000 iterations) and AES-GCM wrapping.
  - Public key trust directory exchange for facility authenticity.
- **Multi-Part QR Protocol (MLO1)**: Intelligent fragmentation, frame sequencing, CRC32 chunk validation, and lossless reassembly for payloads exceeding single QR capacity.
- **Android Ready**: Architectural compatibility with Apache Capacitor for camera hardware access and native packaging.
- **Synthetic Data Compliance**: All test vectors, demonstration databases, and mocks utilize strictly synthetic patient and clinical information.

### 4.3 Out of Scope (Phase 1 & Phase 2 Non-Goals)
- Mandatory centralized backend servers or real-time cloud database requirements.
- Custom, unverified proprietary cryptographic algorithms.
- Biological biometric authentication (e.g., fingerprint scanners requiring specialized proprietary USB drivers).
- Direct integration with proprietary proprietary hospital PACS (Picture Archiving and Communication System) imaging servers in Phase 1 (referrals carry clinical summaries, not multi-gigabyte DICOM CT scans).
- Automated medical diagnosis or clinical decision-support AI models replacing registered physicians.

