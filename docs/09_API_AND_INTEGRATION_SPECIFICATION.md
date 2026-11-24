# 09. API & Integration Specification (Optional Sync & Interoperability)

## 1. Optional Cloud Sync Gateway Architecture

When network connectivity is available, nodes can optionally synchronize telemetry and audit data with a central health gateway. 
- **Protocol**: HTTPS / REST with JSON payloads.
- **Authentication**: Mutual TLS (mTLS) or Signed Facility JWT (signed via the node's ECDSA private key).
- **Architecture**: Stateless Node.js service backed by PostgreSQL.

---

## 2. REST Endpoints Specification

### 2.1 Batch Referral Synchronization
- **Endpoint**: `POST /api/v1/sync/referrals/batch`
- **Description**: Uploads a batch of outgoing or received encrypted referral envelopes.
- **Request Headers**:
  ```http
  Content-Type: application/json
  X-Facility-ID: PHC-DHAR-04
  X-Node-Timestamp: 2026-11-24T12:00:00.000Z
  X-Facility-Signature: MEQCIG...Base64SignatureOverPayload...
  ```
- **Request Body**:
  ```json
  {
    "facilityId": "PHC-DHAR-04",
    "batchTimestamp": "2026-11-24T12:00:00.000Z",
    "referrals": [
      {
        "referralId": "d3b07384-d113-49fb-a796-03f6f1c7d21a",
        "senderFacilityId": "PHC-DHAR-04",
        "recipientFacilityId": "DH-INDORE-01",
        "priority": "EMERGENCY_CRITICAL",
        "timestamp": "2026-11-24T10:30:00.000Z",
        "encryptedSessionKey": "q8fN...Base64...",
        "iv": "vJ9k2LmOPq1s",
        "ciphertext": "kM98v1xL...Base64...",
        "authTag": "0a1b2c3d4e5f6789a0b1c2d3e4f5a6b7",
        "digitalSignature": "MEQCIG9...Base64..."
      }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "processedCount": 1,
    "acknowledgedReferralIds": ["d3b07384-d113-49fb-a796-03f6f1c7d21a"],
    "serverTimestamp": "2026-11-24T12:00:01.215Z"
  }
  ```

### 2.2 Trust Directory Sync & Verification
- **Endpoint**: `GET /api/v1/directory/trusted-keys`
- **Description**: Downloads the authoritative public key directory and revocation list.
- **Response** (`200 OK`):
  ```json
  {
    "version": "2026.11.24",
    "district": "Indore-Dhar Region",
    "issuedAt": "2026-11-24T00:00:00.000Z",
    "masterAuthoritySignature": "MEUCIQ...MasterAuthoritySignature...",
    "facilities": [
      {
        "facilityId": "DH-INDORE-01",
        "name": "Maharaja Yeshwantrao District Hospital, Indore",
        "type": "DISTRICT_HOSPITAL",
        "rsaPublicKeyJwk": { "kty": "RSA", "n": "...", "e": "AQAB" },
        "ecdsaPublicKeyJwk": { "kty": "EC", "crv": "P-256", "x": "...", "y": "..." },
        "status": "ACTIVE",
        "validUntil": "2028-01-01T00:00:00.000Z"
      }
    ],
    "revocations": []
  }
  ```

---

## 3. Healthcare Interoperability: FHIR & ABDM Alignment

MediLink Offline aligns with international and national digital health standards:
1. **HL7 FHIR (Fast Healthcare Interoperability Resources)**:
   - The decrypted clinical referral record maps directly to a FHIR **ServiceRequest** bundle, linking to:
     - `Patient` (demographics, ABHA ID)
     - `Observation` (vital signs, SpO2, blood pressure)
     - `Condition` (provisional diagnosis)
     - `MedicationStatement` (administered pre-transport drugs)
     - `AllergyIntolerance` (allergy alerts)
2. **Ayushman Bharat Digital Mission (ABDM - India)**:
   - Ready for integration with ABHA (Ayushman Bharat Health Account) 14-digit patient identifiers.
   - Conforms to DISHA (Digital Information Security in Healthcare Act) confidentiality and consent standards.

---

## 4. Offline Data Export / Import Interchange Formats

To support facilities that are completely air-gapped from network connectivity forever:
1. **Administrative Trust Package Export (`.mldir`)**:
   - Encrypted/Signed JSON bundle containing facility public keys, exportable to a USB thumb drive.
   - Admin portal allows one-click file import to update local facility certificates.
2. **Disaster Recovery Backup Package (`.mlbak`)**:
   - Encrypted backup of local IndexedDB stores.
   - Protected with administrator passphrase via PBKDF2 + AES-GCM.

