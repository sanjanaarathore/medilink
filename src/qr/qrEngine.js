/**
 * @file qrEngine.js
 * @description QR Code generation and payload fragmentation engine for MediLink Offline.
 * Implements MLO1 multi-part protocol framing, size calculation, animated playback models,
 * and high-density SVG barcode generation.
 */

import { QR_PROTOCOL, formatFrame, calculateCRC32 } from './protocol.js';
import { generateQrSvg, generateQrMatrix } from './qrCodeGenerator.js';
import { canonicalizeJson } from '../crypto/webCryptoEngine.js';

/**
 * Fragments a sealed referral envelope into sequential MLO1 frames.
 * Supports single frame if payload is small, or multi-part sequential framing.
 * 
 * @param {Object} envelope - Sealed EncryptedReferralEnvelope
 * @param {number} [chunkSize=QR_PROTOCOL.DEFAULT_CHUNK_SIZE_BYTES]
 * @returns {{refIdShort: string, totalFrames: number, rawLength: number, frames: Array<{seq: number, total: number, crc32: string, frameString: string, svg: string}>}}
 */
export function chunkReferralEnvelope(envelope, chunkSize = QR_PROTOCOL.DEFAULT_CHUNK_SIZE_BYTES) {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('QR Engine: Invalid referral envelope provided for chunking.');
  }

  const serialized = canonicalizeJson(envelope);
  const refId = envelope.referralId || '00000000-0000-0000-0000-000000000000';
  const refIdShort = refId.replace(/-/g, '').slice(0, 8);

  const rawLength = serialized.length;
  const chunkDataList = [];

  // If payload is <= 450 bytes, keep as single QR frame
  if (rawLength <= 450) {
    chunkDataList.push(serialized);
  } else {
    for (let i = 0; i < rawLength; i += chunkSize) {
      chunkDataList.push(serialized.slice(i, i + chunkSize));
    }
  }

  const totalFrames = chunkDataList.length;
  if (totalFrames > QR_PROTOCOL.MAX_FRAMES) {
    throw new Error(
      `Payload exceeds maximum frame capacity: ${totalFrames} frames required, limit is ${QR_PROTOCOL.MAX_FRAMES}.`
    );
  }

  const frames = chunkDataList.map((chunk, index) => {
    const seq = index + 1;
    const frameString = formatFrame(refIdShort, seq, totalFrames, chunk);
    const crc32 = calculateCRC32(chunk);
    const svg = generateQrSvg(frameString, { moduleSize: 4, margin: 4 });

    return {
      seq,
      total: totalFrames,
      crc32,
      chunkLength: chunk.length,
      frameString,
      svg
    };
  });

  return {
    refIdShort,
    referralId: envelope.referralId,
    totalFrames,
    rawLength,
    frames
  };
}

/**
 * Generates an SVG QR Code for a given raw string.
 * @param {string} text
 * @param {Object} [options]
 * @returns {string} SVG markup
 */
export function renderQrSvg(text, options) {
  return generateQrSvg(text, options);
}

/**
 * Downloads an SVG markup string as an image file in the browser.
 * @param {string} svgString
 * @param {string} filename
 */
export function downloadSvgImage(svgString, filename = 'medilink_qr_frame.svg') {
  if (typeof window === 'undefined' || !window.document) return;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

