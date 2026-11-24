/**
 * @file protocol.js
 * @description Multi-Part QR Code Chunking and Frame Assembly Protocol Specification.
 * Implements MLO1 (MediLink Offline Protocol v1) framing, sequencing, and CRC32 verification.
 */

export const QR_PROTOCOL = Object.freeze({
  MAGIC_PREFIX: 'MLO1',
  DELIMITER: '|',
  // Recommended chunk sizes:
  // Version 40 QR with Error Correction Level 'M' can hold ~2331 alphanumeric or ~1663 byte chars.
  // For reliable scanning via budget smartphone cameras and webcams under suboptimal lighting,
  // optimal chunk size is constrained to 350-450 bytes.
  DEFAULT_CHUNK_SIZE_BYTES: 400,
  MIN_CHUNK_SIZE_BYTES: 200,
  MAX_CHUNK_SIZE_BYTES: 600,
  MAX_FRAMES: 30, // Practical limit for referral transmission
  DEFAULT_FPS: 2, // Slideshow playback frame rate for multi-part QR transmission (2-3 FPS)
});

/**
 * Calculates a simple, robust 32-bit CRC checksum for chunk integrity validation.
 * @param {string} str - Raw input chunk string
 * @returns {string} Hex-encoded 8-character CRC32 checksum
 */
export function calculateCRC32(str) {
  let crc = -1;
  for (let i = 0; i < str.length; i++) {
    let byte = str.charCodeAt(i) & 0xFF;
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ byte) & 0xFF];
  }
  return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
}

// Precomputed CRC32 Lookup Table
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c;
}

/**
 * Protocol Frame Format:
 * MLO1|<refIdShort>|<seq>|<total>|<crc32>|<chunkData>
 *
 * Example:
 * MLO1|8f3a9e21|1|4|a94f01c2|eyJ2ZXIiOiIxLjAiLCJyZWZJZCI...
 */
export function formatFrame(refIdShort, seq, total, chunkData) {
  const crc = calculateCRC32(chunkData);
  return `${QR_PROTOCOL.MAGIC_PREFIX}${QR_PROTOCOL.DELIMITER}${refIdShort}${QR_PROTOCOL.DELIMITER}${seq}${QR_PROTOCOL.DELIMITER}${total}${QR_PROTOCOL.DELIMITER}${crc}${QR_PROTOCOL.DELIMITER}${chunkData}`;
}

/**
 * Parses an incoming QR frame string.
 * @param {string} rawString
 * @returns {{isValid: boolean, error?: string, frame?: {refIdShort: string, seq: number, total: number, crc32: string, data: string}}}
 */
export function parseFrame(rawString) {
  if (!rawString || typeof rawString !== 'string') {
    return { isValid: false, error: 'Empty or invalid frame string' };
  }

  const parts = rawString.split(QR_PROTOCOL.DELIMITER);
  if (parts.length < 6 || parts[0] !== QR_PROTOCOL.MAGIC_PREFIX) {
    return { isValid: false, error: 'Unrecognized protocol header. Expected MLO1 prefix.' };
  }

  const [, refIdShort, seqStr, totalStr, expectedCrc, ...dataParts] = parts;
  const seq = parseInt(seqStr, 10);
  const total = parseInt(totalStr, 10);
  const data = dataParts.join(QR_PROTOCOL.DELIMITER);

  if (isNaN(seq) || isNaN(total) || seq < 1 || seq > total) {
    return { isValid: false, error: `Invalid frame sequence indices: ${seq} of ${total}` };
  }

  const actualCrc = calculateCRC32(data);
  if (actualCrc !== expectedCrc) {
    return { isValid: false, error: `CRC32 checksum mismatch: expected ${expectedCrc}, got ${actualCrc}` };
  }

  return {
    isValid: true,
    frame: {
      refIdShort,
      seq,
      total,
      crc32: expectedCrc,
      data
    }
  };
}

