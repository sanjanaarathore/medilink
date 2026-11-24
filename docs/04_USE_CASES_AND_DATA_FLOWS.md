# 04. Use Cases and Data-Flow Diagrams

## 1. Primary Actors Matrix

| Actor | Category | Description | Access Rights |
|---|---|---|---|
| **System Administrator** | Administrative | Responsible for facility provisioning, role assignments, and key directory management. | Full Admin Portal Access |
| **PHC Medical Officer** | Clinical Origin | Examines patient, makes referral decisions, signs clinical records with facility key. | PHC Portal (Full Access) |
| **PHC Nurse / Staff** | Clinical Origin | Assists in patient registration, recording baseline vitals, and operating QR display. | PHC Portal (Restricted Signing) |
| **Emergency Triage Nurse** | Clinical Destination | Operates QR scanner at hospital casualty intake, validates sender authenticity. | District Hospital Portal (Triage) |
| **Admitting Physician** | Clinical Destination | Reviews decrypted medical history, confirms clinical admission, plans emergency treatment. | District Hospital Portal (Physician) |

---

## 2. Core Use-Case Specifications

### 2.1 Use Case UC-01: End-to-End Emergency Referral Creation and QR Encoding
- **Primary Actor**: PHC Medical Officer
- **Preconditions**:
  - The PHC facility profile and local private key are provisioned in IndexedDB.
  - The destination District Hospital's public key is present in the local Trust Directory.
  - The medical officer has unlocked their credentials using their authorized PIN.
- **Main Success Scenario**:
  1. Doctor navigates to PHC Portal -> "Create Referral".
  2. Doctor selects or registers the patient (`PAT-2026-00812`), enters vitals (BP 80/50, SpO2 88%, Pulse 125 bpm), diagnosis ("Acute Respiratory Distress Syndrome secondary to Pneumonia"), and medications given (IV Ceftriaxone, Nebulized Salbutamol).
  3. Doctor selects destination: "District Hospital Indore", priority: "EMERGENCY_CRITICAL".
  4. System validates all clinical fields.
  5. System generates ephemeral 256-bit AES key and 96-bit IV via `crypto.getRandomValues()`.
  6. System encrypts structured clinical JSON using AES-256-GCM.
  7. System fetches Destination Hospital's RSA-OAEP public key from local Trust Directory and encrypts the AES key.
  8. System signs the referral envelope using the PHC's ECDSA P-256 private key.
  9. System packages the payload into MLO1 protocol frames (e.g., 3 chunks of 380 bytes each) with individual CRC32 checksums.
  10. System displays the animated QR code on screen (or prints static multi-frame referral paper slip).
  11. System saves the referral record locally in IndexedDB under `referrals_outgoing` with status `DISPATCHED`.
- **Postconditions**:
  - An encrypted, tamper-evident referral payload is visually displayed as a QR stream ready for transit.

### 2.2 Use Case UC-02: QR Scanning, Signature Verification, and Decryption at District Hospital
- **Primary Actor**: Hospital Triage Nurse / Admitting Physician
- **Preconditions**:
  - The District Hospital's private key is stored in IndexedDB.
  - The sending PHC's ECDSA public key is registered in the hospital's local Trust Directory.
  - Clinician is logged in with authorized PIN.
- **Main Success Scenario**:
  1. Triage Nurse opens Hospital Portal -> "Scan Incoming Referral".
  2. Nurse points camera at the patient's smartphone screen or printed paper slip showing the MLO1 QR code.
  3. Scanner detects Frame 1/3, verifies CRC32, caches chunk.
  4. Scanner detects Frame 2/3 and 3/3 in successive frames (displaying "3 of 3 Frames Captured - 100%").
  5. System concatenates chunks and parses the `EncryptedReferralEnvelope`.
  6. System extracts `senderFacilityId` ("PHC-DHAR-04") and retrieves its public key from `trusted_keys`.
  7. System verifies the ECDSA digital signature over the ciphertext and envelope metadata. Signature is VALID.
  8. System prompts clinician for PIN to unwrap hospital private key.
  9. System decrypts AES session key using RSA-OAEP private key.
  10. System decrypts referral record using AES-256-GCM and verifies the 128-bit authentication tag. Auth tag is VALID.
  11. System renders decrypted clinical summary with highlighted CRITICAL EMERGENCY alerts.
  12. Nurse clicks "Acknowledge & Admit Patient", assigning triage bed and admitting team.
  13. System saves record into `referrals_received` store with status `ADMITTED`.
- **Alternative / Exception Flows**:
  - *Invalid CRC*: Frame discarded silently, scanner continues waiting for clean frame.
  - *Unknown Sender Public Key*: System displays warning: "UNREGISTERED SENDER. Referral cannot be authenticated. Proceed with manual verification."
  - *Signature Verification Failed*: System aborts intake with high-visibility error: "SECURITY ALERT: Digital signature mismatch. Referral payload has been altered or forged."
  - *Authentication Tag Mismatch*: System aborts: "DECRYPTION ERROR: Ciphertext corrupted. Authentication tag validation failed."

---

## 3. Detailed Data-Flow Diagrams (DFD)

### 3.1 DFD Level 0: Global Context Diagram

```mermaid
flowchart TD
    subgraph PHCEnv["Primary Health Centre"]
        Doctor["PHC Medical Staff"]
        PHCApp["MediLink Offline (PHC Portal)"]
    end

    subgraph Transit["Physical Transport"]
        QRCarrier["Patient / Ambulance Attendant (QR Payload)"]
    end

    subgraph HospitalEnv["District Hospital"]
        HospitalApp["MediLink Offline (Hospital Portal)"]
        TriageStaff["Triage Clinician"]
    end

    subgraph AdminEnv["System Administration"]
        AdminUser["Health System Admin"]
        AdminApp["MediLink Offline (Admin Portal)"]
    end

    AdminUser -->|"Provisions Facilities & Trust Directory"| AdminApp
    AdminApp -.->|"Offline Public Key Sync (USB / QR)"| PHCApp
    AdminApp -.->|"Offline Public Key Sync (USB / QR)"| HospitalApp

    Doctor -->|"Inputs Clinical Record"| PHCApp
    PHCApp -->|"Encodes Encrypted Multi-Part QR"| QRCarrier
    QRCarrier -->|"Presents QR Code to Camera"| HospitalApp
    HospitalApp -->|"Displays Decrypted Record"| TriageStaff
```

---

### 3.2 Sequence Diagram: Complete Cryptographic Referral Creation & Ingestion Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Doc as PHC Doctor
    participant PHCPortal as PHC Portal
    participant CryptoEng as Web Crypto Engine
    participant IDB_PHC as PHC IndexedDB
    actor Patient as Physical Transit (QR)
    participant HospScanner as Hospital QR Scanner
    participant HospCrypto as Hospital Crypto Engine
    participant IDB_Hosp as Hospital IndexedDB
    actor Nurse as Triage Nurse

    %% Referral Creation
    Doc->>PHCPortal: Fill Patient Demographics, Vitals & Referral Details
    Doc->>PHCPortal: Click "Generate Secure Referral"
    PHCPortal->>CryptoEng: Request Ephemeral AES-256 Key + IV
    CryptoEng-->>PHCPortal: Returns AES Key & 96-bit IV
    PHCPortal->>CryptoEng: Encrypt Clinical Payload (AES-256-GCM)
    CryptoEng-->>PHCPortal: Returns Ciphertext + 128-bit Auth Tag
    PHCPortal->>IDB_PHC: Fetch Recipient Hospital RSA Public Key
    IDB_PHC-->>PHCPortal: Recipient RSA Public Key
    PHCPortal->>CryptoEng: Encrypt AES Key with RSA-OAEP
    CryptoEng-->>PHCPortal: Encrypted Session Key
    PHCPortal->>CryptoEng: Sign Envelope with PHC ECDSA Private Key
    CryptoEng-->>PHCPortal: ECDSA Digital Signature (P-256)
    PHCPortal->>PHCPortal: Fragment Envelope into MLO1 QR Frames
    PHCPortal->>Doc: Display Animated / Printable QR Code
    PHCPortal->>IDB_PHC: Save Outgoing Referral Record

    %% Physical Handoff
    Doc->>Patient: Hand over QR Code (Phone Screen or Paper)
    Patient->>Nurse: Present QR Code at Hospital Triage

    %% Hospital Ingestion
    Nurse->>HospScanner: Point Camera at QR Code
    loop Frame Scanning
        HospScanner->>HospScanner: Parse MLO1 Header & Validate CRC32
    end
    HospScanner->>HospScanner: Reassemble Frames into Complete Envelope
    HospScanner->>IDB_Hosp: Retrieve Sender PHC ECDSA Public Key
    IDB_Hosp-->>HospScanner: Sender ECDSA Public Key
    HospScanner->>HospCrypto: Verify ECDSA Signature
    alt Signature Invalid
        HospCrypto-->>HospScanner: Verification FAILED
        HospScanner->>Nurse: Display SECURITY WARNING: Forged or Altered Payload
    else Signature Valid
        HospCrypto-->>HospScanner: Verification SUCCESS
        Nurse->>HospCrypto: Provide PIN to Unlock Hospital RSA Private Key
        HospCrypto->>HospCrypto: Decrypt Session Key (RSA-OAEP)
        HospCrypto->>HospCrypto: Decrypt Payload & Verify Auth Tag (AES-256-GCM)
        HospCrypto-->>HospScanner: Plaintext Clinical Referral Record
        HospScanner->>Nurse: Display Decrypted Clinical Intake & Triage Level
        Nurse->>IDB_Hosp: Confirm Patient Acceptance & Save Received Record
    end
```

