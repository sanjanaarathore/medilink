/**
 * @file cryptoConstants.js
 * @description Standardized cryptographic parameters for Web Crypto API.
 * Strict adherence to AES-256-GCM, RSA-OAEP (SHA-256), ECDSA (P-256, SHA-256), and PBKDF2.
 */

export const PROTOCOL_VERSION = '1.0.0';

export const CRYPTO_ALGORITHMS = Object.freeze({
  // Symmetric Content Encryption
  SYMMETRIC: {
    name: 'AES-GCM',
    length: 256, // 256-bit AES
    ivByteLength: 12, // 96-bit standard IV for GCM
    tagLength: 128 // 128-bit authentication tag
  },

  // Asymmetric Key Encapsulation (Recipient District Hospital Public/Private Key)
  KEY_ENCAPSULATION: {
    name: 'RSA-OAEP',
    modulusLength: 2048, // 2048-bit (standard browser support)
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
    hash: { name: 'SHA-256' }
  },

  // Digital Signatures (Originating PHC Public/Private Identity Key)
  DIGITAL_SIGNATURE: {
    name: 'ECDSA',
    namedCurve: 'P-256', // NIST P-256 / secp256r1
    hash: { name: 'SHA-256' }
  },

  // Local Credential & Private Key Wrapping (PIN/Passphrase to Wrapping Key)
  KEY_DERIVATION: {
    name: 'PBKDF2',
    hash: 'SHA-256',
    iterations: 100000, // OWASP recommended minimum for PBKDF2-HMAC-SHA256
    saltByteLength: 16 // 128-bit cryptographic salt
  },

  // Wrapped Key Format for Storage in IndexedDB
  KEY_WRAPPING: {
    name: 'AES-GCM',
    length: 256,
    ivByteLength: 12,
    tagLength: 128
  }
});

export const KEY_USAGES = Object.freeze({
  AES_CONTENT: ['encrypt', 'decrypt'],
  RSA_ENVELOPE_ENCRYPT: ['wrapKey', 'encrypt'],
  RSA_ENVELOPE_DECRYPT: ['unwrapKey', 'decrypt'],
  ECDSA_SIGN: ['sign'],
  ECDSA_VERIFY: ['verify'],
  PIN_DERIVATION: ['deriveKey', 'deriveBits'],
  STORAGE_WRAPPING: ['wrapKey', 'unwrapKey', 'encrypt', 'decrypt']
});

export const ALGORITHM_IDENTIFIERS = Object.freeze({
  SYMMETRIC: 'AES-256-GCM',
  KEY_ENCAPSULATION: 'RSA-OAEP-SHA256',
  SIGNATURE: 'ECDSA-P256-SHA256'
});
