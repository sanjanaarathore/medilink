/**
 * @file qrScannerEngine.js
 * @description Ingestion parser, frame deduplication, out-of-order buffer, and multi-part reassembly engine.
 * Handles camera stream frames, uploaded barcode images, manual paste transfers, and CRC32 verification.
 */

import { parseFrame, QR_PROTOCOL } from './protocol.js';

export class MultiPartReassemblyManager {
  constructor(timeoutMs = 120000) {
    this.timeoutMs = timeoutMs;
    this.activeRefId = null;
    this.totalFrames = 0;
    this.chunks = new Map(); // seq (number) -> data (string)
    this.lastActivity = Date.now();
  }

  /**
   * Resets the active reassembly session.
   */
  reset() {
    this.activeRefId = null;
    this.totalFrames = 0;
    this.chunks.clear();
    this.lastActivity = Date.now();
  }

  /**
   * Returns completion percentage (0 - 100).
   * @returns {number}
   */
  getPercentComplete() {
    if (!this.totalFrames) return 0;
    return Math.round((this.chunks.size / this.totalFrames) * 100);
  }

  /**
   * Returns list of sequence numbers missing from the sequence.
   * @returns {number[]}
   */
  getMissingFrames() {
    if (!this.totalFrames) return [];
    const missing = [];
    for (let i = 1; i <= this.totalFrames; i++) {
      if (!this.chunks.has(i)) {
        missing.push(i);
      }
    }
    return missing;
  }

  /**
   * Ingests a raw QR frame string.
   * Performs MLO1 header validation, CRC32 verification, deduplication, and completion check.
   * 
   * @param {string} rawString
   * @returns {{status: 'COMPLETE' | 'BUFFERING' | 'DUPLICATE' | 'CORRUPTED' | 'IGNORED_OTHER_SESSION' | 'INVALID' | 'PARSE_ERROR', refIdShort?: string, seq?: number, total?: number, receivedCount?: number, missingFrames?: number[], percentComplete?: number, envelope?: Object, error?: string}}
   */
  ingestFrame(rawString) {
    this.lastActivity = Date.now();

    const parsed = parseFrame(rawString);
    if (!parsed.isValid) {
      if (parsed.error && parsed.error.includes('CRC32 checksum mismatch')) {
        return {
          status: 'CORRUPTED',
          error: parsed.error
        };
      }
      return {
        status: 'INVALID',
        error: parsed.error || 'Invalid MLO1 frame'
      };
    }

    const { refIdShort, seq, total, data } = parsed.frame;

    // Check if new referral session
    if (!this.activeRefId) {
      this.activeRefId = refIdShort;
      this.totalFrames = total;
    } else if (this.activeRefId !== refIdShort) {
      // Frame belongs to another referral
      return {
        status: 'IGNORED_OTHER_SESSION',
        refIdShort,
        error: `Frame belongs to referral ${refIdShort}, but current session is tracking ${this.activeRefId}`
      };
    }

    // Check for duplicate frame
    if (this.chunks.has(seq)) {
      return {
        status: 'DUPLICATE',
        refIdShort,
        seq,
        total,
        receivedCount: this.chunks.size,
        missingFrames: this.getMissingFrames(),
        percentComplete: this.getPercentComplete()
      };
    }

    // Store new chunk
    this.chunks.set(seq, data);

    // Check if all frames have been collected
    if (this.chunks.size === this.totalFrames) {
      // Reassemble in exact sequence order (1 .. total)
      const segments = [];
      for (let i = 1; i <= this.totalFrames; i++) {
        segments.push(this.chunks.get(i));
      }
      const fullSerialized = segments.join('');

      try {
        const envelope = JSON.parse(fullSerialized);
        return {
          status: 'COMPLETE',
          refIdShort,
          total: this.totalFrames,
          receivedCount: this.chunks.size,
          percentComplete: 100,
          missingFrames: [],
          envelope
        };
      } catch (err) {
        return {
          status: 'PARSE_ERROR',
          refIdShort,
          error: `Failed to parse reassembled envelope JSON: ${err.message}`
        };
      }
    }

    return {
      status: 'BUFFERING',
      refIdShort,
      seq,
      total: this.totalFrames,
      receivedCount: this.chunks.size,
      missingFrames: this.getMissingFrames(),
      percentComplete: this.getPercentComplete()
    };
  }

  /**
   * Returns current status summary of the assembly session.
   * @returns {Object}
   */
  getStatus() {
    return {
      activeRefId: this.activeRefId,
      totalFrames: this.totalFrames,
      receivedCount: this.chunks.size,
      receivedFrames: Array.from(this.chunks.keys()).sort((a, b) => a - b),
      missingFrames: this.getMissingFrames(),
      percentComplete: this.getPercentComplete(),
      isComplete: this.totalFrames > 0 && this.chunks.size === this.totalFrames
    };
  }
}

/**
 * Creates and returns a new MultiPartReassemblyManager instance.
 * @param {number} [timeoutMs]
 * @returns {MultiPartReassemblyManager}
 */
export function createReassemblySession(timeoutMs) {
  return new MultiPartReassemblyManager(timeoutMs);
}

/**
 * Ingests a batch of multi-line frames (e.g. from file upload or manual paste).
 * @param {string} text - Multi-line string of frames
 * @returns {{isComplete: boolean, manager: MultiPartReassemblyManager, lastResult: Object}}
 */
export function ingestBatchFrames(text) {
  const manager = new MultiPartReassemblyManager();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.startsWith(QR_PROTOCOL.MAGIC_PREFIX));

  let lastResult = null;
  for (const line of lines) {
    lastResult = manager.ingestFrame(line);
    if (lastResult.status === 'COMPLETE') break;
  }

  return {
    isComplete: manager.getStatus().isComplete,
    manager,
    lastResult
  };
}

