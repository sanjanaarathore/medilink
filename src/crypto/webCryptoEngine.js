/**
 * @file webCryptoEngine.js
 * @description Standard Web Crypto API cryptographic operations for MediLink Offline.
 * Implements AES-256-GCM, RSA-OAEP (SHA-256), ECDSA (P-256, SHA-256), PBKDF2 key derivation,
 * canonical envelope encoding, digital signatures, and asymmetric key encapsulation.
 */

import {
  PROTOCOL_VERSION,
  CRYPTO_ALGORITHMS,
  KEY_USAGES,
  ALGORITHM_IDENTIFIERS
} from './cryptoConstants.js';

export {
  PROTOCOL_VERSION,
  CRYPTO_ALGORITHMS,
  KEY_USAGES,
  ALGORITHM_IDENTIFIERS
};

/**
 * Universal Crypto and SubtleCrypto provider for browser and Node.js environments.
 */
export function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is unavailable in this environment.');
}

export function getSubtle() {
  return getCrypto().subtle;
}

/**
 * Converts ArrayBuffer or Uint8Array to Base64 string.
 * @param {ArrayBuffer | Uint8Array} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/**
 * Converts Base64 string to Uint8Array.
 * @param {string} base64
 * @returns {Uint8Array}
 */
export function base64ToBytes(base64) {
  let binary;
  if (typeof atob !== 'undefined') {
    binary = atob(base64);
  } else {
    binary = Buffer.from(base64, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts Base64 string to ArrayBuffer.
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToBuffer(base64) {
  return base64ToBytes(base64).buffer;
}

/**
 * Canonicalizes an object into a deterministic JSON string.
 * Keys are sorted recursively, guaranteeing identical serialization across platforms.
 * @param {any} value
 * @returns {string}
 */
export function canonicalizeJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeJson(item)).join(',')}]`;
  }

  const sortedKeys = Object.keys(value).sort();
  const pairs = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`;
  });

  return `{${pairs.join(',')}}`;
}

/**
 * Computes a SHA-256 fingerprint hex string formatted as "SHA256:<hex>".
 * @param {string | ArrayBuffer | Uint8Array} data
 * @returns {Promise<string>}
 */
export async function computeSha256Fingerprint(data) {
  const subtle = getSubtle();
  let buffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data);
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer;
  } else {
    buffer = data;
  }

  const hashBuffer = await subtle.digest('SHA-256', buffer);
  const hashBytes = new Uint8Array(hashBuffer);
  let hex = '';
  for (let i = 0; i < hashBytes.length; i++) {
    hex += hashBytes[i].toString(16).padStart(2, '0');
  }
  return `SHA256:${hex}`;
}

// ============================================================================
// KEY GENERATION & JWK CONVERSION
// ============================================================================

/**
 * Generates an ephemeral symmetric AES-GCM 256-bit key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateAesKey() {
  const subtle = getSubtle();
  return subtle.generateKey(
    {
      name: CRYPTO_ALGORITHMS.SYMMETRIC.name,
      length: CRYPTO_ALGORITHMS.SYMMETRIC.length
    },
    true,
    KEY_USAGES.AES_CONTENT
  );
}

/**
 * Generates an RSA-OAEP keypair for asymmetric key encapsulation (Hospital Portal).
 * @param {number} [modulusLength=2048]
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateRsaKeyPair(modulusLength = CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.modulusLength) {
  const subtle = getSubtle();
  return subtle.generateKey(
    {
      name: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.name,
      modulusLength,
      publicExponent: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.publicExponent,
      hash: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.hash
    },
    true,
    [...KEY_USAGES.RSA_ENVELOPE_ENCRYPT, ...KEY_USAGES.RSA_ENVELOPE_DECRYPT]
  );
}

/**
 * Generates an ECDSA keypair on curve P-256 for digital signatures (PHC Portal).
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateEcdsaKeyPair() {
  const subtle = getSubtle();
  return subtle.generateKey(
    {
      name: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.name,
      namedCurve: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.namedCurve
    },
    true,
    [...KEY_USAGES.ECDSA_SIGN, ...KEY_USAGES.ECDSA_VERIFY]
  );
}

/**
 * Exports a CryptoKey to JWK format.
 * @param {CryptoKey} key
 * @returns {Promise<JsonWebKey>}
 */
export async function exportKeyJwk(key) {
  const subtle = getSubtle();
  return subtle.exportKey('jwk', key);
}

/**
 * Imports a JWK as an active CryptoKey.
 * @param {JsonWebKey} jwk
 * @param {'AES-GCM' | 'RSA-OAEP' | 'ECDSA'} algorithmType
 * @param {KeyUsage[]} usages
 * @param {boolean} [isPrivate=false]
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyJwk(jwk, algorithmType, usages, isPrivate = false) {
  const subtle = getSubtle();

  let algorithm;
  if (algorithmType === 'AES-GCM') {
    algorithm = {
      name: CRYPTO_ALGORITHMS.SYMMETRIC.name,
      length: CRYPTO_ALGORITHMS.SYMMETRIC.length
    };
  } else if (algorithmType === 'RSA-OAEP') {
    algorithm = {
      name: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.name,
      hash: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.hash
    };
  } else if (algorithmType === 'ECDSA') {
    algorithm = {
      name: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.name,
      namedCurve: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.namedCurve
    };
  } else {
    throw new Error(`Unsupported algorithm type for JWK import: ${algorithmType}`);
  }

  return subtle.importKey(
    'jwk',
    jwk,
    algorithm,
    true,
    usages
  );
}

// ============================================================================
// PIN-BASED LOCAL PRIVATE KEY WRAPPING (PBKDF2 + AES-256-GCM)
// ============================================================================

/**
 * Derives a 256-bit AES wrapping key from a PIN using PBKDF2 (HMAC-SHA-256, 100,000 iterations).
 * Note: A PIN alone is NEVER a key exchange mechanism; it is strictly used for local storage credential wrapping.
 * @param {string} pin - User authorization PIN
 * @param {Uint8Array} salt - 128-bit cryptographic salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKeyFromPin(pin, salt) {
  const subtle = getSubtle();
  const pinBuffer = new TextEncoder().encode(pin);
  const baseKey = await subtle.importKey(
    'raw',
    pinBuffer,
    { name: CRYPTO_ALGORITHMS.KEY_DERIVATION.name },
    false,
    KEY_USAGES.PIN_DERIVATION
  );

  return subtle.deriveKey(
    {
      name: CRYPTO_ALGORITHMS.KEY_DERIVATION.name,
      salt: salt,
      iterations: CRYPTO_ALGORITHMS.KEY_DERIVATION.iterations,
      hash: CRYPTO_ALGORITHMS.KEY_DERIVATION.hash
    },
    baseKey,
    {
      name: CRYPTO_ALGORITHMS.KEY_WRAPPING.name,
      length: CRYPTO_ALGORITHMS.KEY_WRAPPING.length
    },
    false,
    KEY_USAGES.STORAGE_WRAPPING
  );
}

/**
 * Wraps/encrypts a private key JWK with a PIN-derived key for storage in IndexedDB.
 * @param {JsonWebKey} privateKeyJwk
 * @param {string} pin
 * @returns {Promise<Object>}
 */
export async function wrapPrivateKeyWithPin(privateKeyJwk, pin) {
  const crypto = getCrypto();
  const subtle = getSubtle();

  const salt = crypto.getRandomValues(new Uint8Array(CRYPTO_ALGORITHMS.KEY_DERIVATION.saltByteLength));
  const iv = crypto.getRandomValues(new Uint8Array(CRYPTO_ALGORITHMS.KEY_WRAPPING.ivByteLength));
  const wrappingKey = await deriveKeyFromPin(pin, salt);

  const serializedJwk = JSON.stringify(privateKeyJwk);
  const encodedData = new TextEncoder().encode(serializedJwk);

  const encryptedBuffer = await subtle.encrypt(
    {
      name: CRYPTO_ALGORITHMS.KEY_WRAPPING.name,
      iv: iv,
      tagLength: CRYPTO_ALGORITHMS.KEY_WRAPPING.tagLength
    },
    wrappingKey,
    encodedData
  );

  const tagByteLength = CRYPTO_ALGORITHMS.KEY_WRAPPING.tagLength / 8;
  const ciphertextBytes = new Uint8Array(encryptedBuffer, 0, encryptedBuffer.byteLength - tagByteLength);
  const authTagBytes = new Uint8Array(encryptedBuffer, encryptedBuffer.byteLength - tagByteLength, tagByteLength);

  return {
    saltBase64: bufferToBase64(salt),
    ivBase64: bufferToBase64(iv),
    ciphertextBase64: bufferToBase64(ciphertextBytes),
    authTagBase64: bufferToBase64(authTagBytes),
    iterations: CRYPTO_ALGORITHMS.KEY_DERIVATION.iterations
  };
}

/**
 * Unwraps/decrypts a stored private key using the authorization PIN.
 * Throws an error if the PIN is incorrect or storage record was tampered.
 * @param {Object} wrappedCredential
 * @param {string} pin
 * @param {'RSA-OAEP' | 'ECDSA'} algorithmType
 * @param {KeyUsage[]} usages
 * @returns {Promise<CryptoKey>}
 */
export async function unwrapPrivateKeyWithPin(wrappedCredential, pin, algorithmType, usages) {
  const subtle = getSubtle();
  const salt = base64ToBytes(wrappedCredential.saltBase64);
  const iv = base64ToBytes(wrappedCredential.ivBase64);
  const ciphertext = base64ToBytes(wrappedCredential.ciphertextBase64);
  const authTag = base64ToBytes(wrappedCredential.authTagBase64);

  const wrappingKey = await deriveKeyFromPin(pin, salt);

  // Combine ciphertext and authTag for Web Crypto subtle.decrypt
  const combinedBuffer = new Uint8Array(ciphertext.length + authTag.length);
  combinedBuffer.set(ciphertext, 0);
  combinedBuffer.set(authTag, ciphertext.length);

  let decryptedBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      {
        name: CRYPTO_ALGORITHMS.KEY_WRAPPING.name,
        iv: iv,
        tagLength: CRYPTO_ALGORITHMS.KEY_WRAPPING.tagLength
      },
      wrappingKey,
      combinedBuffer
    );
  } catch (err) {
    throw new Error('Authorization PIN verification failed: Unable to unwrap local private key.');
  }

  const decryptedJwkString = new TextDecoder().decode(decryptedBuffer);
  const privateKeyJwk = JSON.parse(decryptedJwkString);

  return importKeyJwk(privateKeyJwk, algorithmType, usages, true);
}

// ============================================================================
// ENCRYPTED REFERRAL ENVELOPE SEPARATION & DIGITAL SIGNING
// ============================================================================

/**
 * Builds the canonical Authenticated Additional Data (AAD) string for AES-GCM.
 * Cryptographically binds header metadata to ciphertext preventing envelope field tampering.
 * @param {Object} meta
 * @returns {Uint8Array}
 */
export function buildAadBuffer(meta) {
  const aadString = `${meta.version}|${meta.referralId}|${meta.senderFacilityId}|${meta.recipientFacilityId}|${meta.timestamp}|${meta.symmetricAlgorithm}`;
  return new TextEncoder().encode(aadString);
}

/**
 * Builds the canonical string to sign using ECDSA P-256.
 * Covers all metadata and encrypted payloads (including wrapped session key and auth tag).
 * @param {Object} envelopeFields
 * @returns {Uint8Array}
 */
export function buildSignableEnvelopeData(envelopeFields) {
  const signableObject = {
    version: envelopeFields.version,
    referralId: envelopeFields.referralId,
    senderFacilityId: envelopeFields.senderFacilityId,
    recipientFacilityId: envelopeFields.recipientFacilityId,
    timestamp: envelopeFields.timestamp,
    algorithms: envelopeFields.algorithms,
    nonce: envelopeFields.nonce,
    ciphertext: envelopeFields.ciphertext,
    authTag: envelopeFields.authTag,
    wrappedSessionKey: envelopeFields.wrappedSessionKey,
    senderKeyFingerprint: envelopeFields.senderKeyFingerprint
  };

  const canonical = canonicalizeJson(signableObject);
  return new TextEncoder().encode(canonical);
}

/**
 * Encrypts a clinical referral record into a sealed, digitally signed referral envelope.
 * 
 * Cryptographic workflow:
 * 1. Generates ephemeral 256-bit AES key & 96-bit nonce.
 * 2. Serializes clinical record to canonical JSON.
 * 3. Encrypts payload with AES-256-GCM with AAD binding metadata.
 * 4. Encapsulates AES key with recipient Hospital's RSA-OAEP public key.
 * 5. Deterministically canonicalizes envelope metadata & payload.
 * 6. Digitally signs canonical envelope with sender PHC's ECDSA P-256 private key.
 * 
 * @param {Object} params
 * @param {Object} params.referralPayload - Raw clinical referral object
 * @param {JsonWebKey | CryptoKey} params.recipientPublicKey - Hospital's RSA public key
 * @param {CryptoKey} params.senderPrivateKey - PHC's ECDSA private key
 * @param {string} params.senderFacilityId - Sender facility ID (e.g., 'PHC-DHAR-04')
 * @param {string} params.recipientFacilityId - Recipient facility ID (e.g., 'DH-INDORE-01')
 * @param {string} params.referralId - UUIDv4 referral identifier
 * @param {string} [params.timestamp] - ISO timestamp
 * @param {string} [params.senderKeyFingerprint] - Fingerprint of sender key
 * @returns {Promise<Object>} Sealed EncryptedReferralEnvelope
 */
export async function encryptReferralEnvelope({
  referralPayload,
  recipientPublicKey,
  senderPrivateKey,
  senderFacilityId,
  recipientFacilityId,
  referralId,
  timestamp = new Date().toISOString(),
  senderKeyFingerprint
}) {
  const crypto = getCrypto();
  const subtle = getSubtle();

  // 1. Prepare Recipient RSA Public Key
  let rsaPubKey = recipientPublicKey;
  if (!(rsaPubKey instanceof CryptoKey)) {
    rsaPubKey = await importKeyJwk(
      recipientPublicKey,
      'RSA-OAEP',
      KEY_USAGES.RSA_ENVELOPE_ENCRYPT,
      false
    );
  }

  // 2. Generate Ephemeral Symmetric AES-256-GCM Key & 96-bit Nonce
  const aesKey = await generateAesKey();
  const nonceBytes = crypto.getRandomValues(new Uint8Array(CRYPTO_ALGORITHMS.SYMMETRIC.ivByteLength));
  const nonceBase64 = bufferToBase64(nonceBytes);

  // 3. Serialize Clinical Payload to canonical JSON
  const canonicalPayload = canonicalizeJson(referralPayload);
  const payloadBuffer = new TextEncoder().encode(canonicalPayload);

  // 4. Construct Authenticated Additional Data (AAD)
  const aadBuffer = buildAadBuffer({
    version: PROTOCOL_VERSION,
    referralId,
    senderFacilityId,
    recipientFacilityId,
    timestamp,
    symmetricAlgorithm: ALGORITHM_IDENTIFIERS.SYMMETRIC
  });

  // 5. Encrypt with AES-256-GCM + AAD
  const encryptedBuffer = await subtle.encrypt(
    {
      name: CRYPTO_ALGORITHMS.SYMMETRIC.name,
      iv: nonceBytes,
      additionalData: aadBuffer,
      tagLength: CRYPTO_ALGORITHMS.SYMMETRIC.tagLength
    },
    aesKey,
    payloadBuffer
  );

  const tagByteLength = CRYPTO_ALGORITHMS.SYMMETRIC.tagLength / 8; // 16 bytes (128 bits)
  const ciphertextBytes = new Uint8Array(encryptedBuffer, 0, encryptedBuffer.byteLength - tagByteLength);
  const authTagBytes = new Uint8Array(encryptedBuffer, encryptedBuffer.byteLength - tagByteLength, tagByteLength);

  const ciphertextBase64 = bufferToBase64(ciphertextBytes);
  const authTagBase64 = bufferToBase64(authTagBytes);

  // 6. Encapsulate Ephemeral AES Key via RSA-OAEP (SHA-256)
  const rawAesKeyBuffer = await subtle.exportKey('raw', aesKey);
  const wrappedKeyBuffer = await subtle.encrypt(
    {
      name: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.name
    },
    rsaPubKey,
    rawAesKeyBuffer
  );
  const wrappedSessionKeyBase64 = bufferToBase64(wrappedKeyBuffer);

  // 7. Determine Sender Key Fingerprint if not provided
  let fingerprint = senderKeyFingerprint;
  if (!fingerprint) {
    fingerprint = await computeSha256Fingerprint(senderFacilityId);
  }

  // 8. Assemble Unsigned Envelope Fields
  const envelope = {
    version: PROTOCOL_VERSION,
    referralId,
    senderFacilityId,
    recipientFacilityId,
    timestamp,
    algorithms: {
      symmetric: ALGORITHM_IDENTIFIERS.SYMMETRIC,
      keyEncapsulation: ALGORITHM_IDENTIFIERS.KEY_ENCAPSULATION,
      signature: ALGORITHM_IDENTIFIERS.SIGNATURE
    },
    nonce: nonceBase64,
    ciphertext: ciphertextBase64,
    authTag: authTagBase64,
    wrappedSessionKey: wrappedSessionKeyBase64,
    senderKeyFingerprint: fingerprint
  };

  // 9. Digitally Sign Canonical Envelope with Sender's ECDSA Private Key
  const dataToSign = buildSignableEnvelopeData(envelope);
  const signatureBuffer = await subtle.sign(
    {
      name: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.name,
      hash: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.hash
    },
    senderPrivateKey,
    dataToSign
  );

  envelope.digitalSignature = bufferToBase64(signatureBuffer);
  return envelope;
}

/**
 * Verifies and decrypts an incoming encrypted referral envelope.
 * 
 * Strict Verification Pipeline:
 * 1. Checks recipient facility ID matches current hospital node.
 * 2. Canonicalizes envelope fields and verifies ECDSA signature using sender's public key.
 * 3. Decrypts wrapped session key using recipient Hospital's RSA-OAEP private key.
 * 4. Decrypts AES-256-GCM ciphertext using unwrapped session key, nonce, auth tag, and AAD.
 * 5. Returns parsed clinical record.
 * 
 * Rejects and throws immediately on ANY signature invalidity, auth tag mismatch, or corrupted fields.
 * 
 * @param {Object} params
 * @param {Object} params.envelope - The received EncryptedReferralEnvelope
 * @param {CryptoKey} params.recipientPrivateKey - Hospital's RSA private key
 * @param {JsonWebKey | CryptoKey} params.trustedSenderPublicKey - PHC's ECDSA public key
 * @param {string} [params.expectedRecipientFacilityId] - Local hospital facility ID
 * @returns {Promise<Object>} Decrypted clinical referral record
 */
export async function decryptReferralEnvelope({
  envelope,
  recipientPrivateKey,
  trustedSenderPublicKey,
  expectedRecipientFacilityId
}) {
  const subtle = getSubtle();

  if (!envelope || typeof envelope !== 'object') {
    throw new Error('Decryption Failed: Invalid or empty referral envelope.');
  }

  // 1. Verify Destination Facility Boundary
  if (expectedRecipientFacilityId && envelope.recipientFacilityId !== expectedRecipientFacilityId) {
    throw new Error(
      `Access Violation: Referral is addressed to '${envelope.recipientFacilityId}', but this facility node is '${expectedRecipientFacilityId}'. Decryption aborted.`
    );
  }

  // 2. Prepare Trusted Sender ECDSA Public Key
  let ecdsaPubKey = trustedSenderPublicKey;
  if (!(ecdsaPubKey instanceof CryptoKey)) {
    ecdsaPubKey = await importKeyJwk(
      trustedSenderPublicKey,
      'ECDSA',
      KEY_USAGES.ECDSA_VERIFY,
      false
    );
  }

  // 3. Verify ECDSA Digital Signature (Origin Authenticity & Envelope Integrity)
  const dataToVerify = buildSignableEnvelopeData(envelope);
  const signatureBytes = base64ToBuffer(envelope.digitalSignature);

  const isSignatureValid = await subtle.verify(
    {
      name: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.name,
      hash: CRYPTO_ALGORITHMS.DIGITAL_SIGNATURE.hash
    },
    ecdsaPubKey,
    signatureBytes,
    dataToVerify
  );

  if (!isSignatureValid) {
    throw new Error(
      'Security Exception: Digital signature verification failed! The referral envelope has been tampered with or was signed by an untrusted key.'
    );
  }

  // 4. Unwrap / Decrypt Ephemeral AES Session Key via RSA-OAEP
  const wrappedSessionKeyBytes = base64ToBuffer(envelope.wrappedSessionKey);
  let rawAesKeyBuffer;
  try {
    rawAesKeyBuffer = await subtle.decrypt(
      {
        name: CRYPTO_ALGORITHMS.KEY_ENCAPSULATION.name
      },
      recipientPrivateKey,
      wrappedSessionKeyBytes
    );
  } catch (err) {
    throw new Error(
      'Decryption Failed: Unable to decrypt session key. The recipient private key does not match the target public key.'
    );
  }

  const aesKey = await subtle.importKey(
    'raw',
    rawAesKeyBuffer,
    {
      name: CRYPTO_ALGORITHMS.SYMMETRIC.name,
      length: CRYPTO_ALGORITHMS.SYMMETRIC.length
    },
    false,
    KEY_USAGES.AES_CONTENT
  );

  // 5. Reconstruct Authenticated Additional Data (AAD)
  const aadBuffer = buildAadBuffer({
    version: envelope.version,
    referralId: envelope.referralId,
    senderFacilityId: envelope.senderFacilityId,
    recipientFacilityId: envelope.recipientFacilityId,
    timestamp: envelope.timestamp,
    symmetricAlgorithm: envelope.algorithms?.symmetric || ALGORITHM_IDENTIFIERS.SYMMETRIC
  });

  // 6. Decrypt Payload via AES-256-GCM + Auth Tag Verification
  const ciphertextBytes = base64ToBytes(envelope.ciphertext);
  const authTagBytes = base64ToBytes(envelope.authTag);
  const nonceBytes = base64ToBytes(envelope.nonce);

  const combinedBuffer = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
  combinedBuffer.set(ciphertextBytes, 0);
  combinedBuffer.set(authTagBytes, ciphertextBytes.length);

  let decryptedBuffer;
  try {
    decryptedBuffer = await subtle.decrypt(
      {
        name: CRYPTO_ALGORITHMS.SYMMETRIC.name,
        iv: nonceBytes,
        additionalData: aadBuffer,
        tagLength: CRYPTO_ALGORITHMS.SYMMETRIC.tagLength
      },
      aesKey,
      combinedBuffer
    );
  } catch (err) {
    throw new Error(
      'Security Exception: AES-GCM authentication tag verification failed! Ciphertext or metadata has been corrupted or modified.'
    );
  }

  const decryptedJsonString = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decryptedJsonString);
}
