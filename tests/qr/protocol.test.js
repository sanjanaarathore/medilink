/**
 * @file protocol.test.js
 * @description Protocol specification unit test for MLO1 multi-part QR chunking, framing, and CRC32 verification.
 */

import { formatFrame, parseFrame, calculateCRC32, QR_PROTOCOL } from '../../src/qr/protocol.js';

export function runProtocolSelfTest() {
  const results = [];

  // Test 1: CRC32 Calculation
  const sampleString = "HelloMediLinkOffline2026";
  const crc1 = calculateCRC32(sampleString);
  const crc2 = calculateCRC32(sampleString);
  const isCrcConsistent = crc1 === crc2 && crc1.length === 8;
  results.push({ name: 'CRC32 Consistency & Length', passed: isCrcConsistent, output: crc1 });

  // Test 2: Framing and Parsing
  const refIdShort = "d3b07384";
  const seq = 1;
  const total = 3;
  const chunkData = "eyJ2ZXIiOiIxLjAiLCJyZWZJZCI6ImQzYjA3Mzg0In0=";
  const frameString = formatFrame(refIdShort, seq, total, chunkData);

  const parsed = parseFrame(frameString);
  const isFrameValid = parsed.isValid && 
                       parsed.frame.refIdShort === refIdShort &&
                       parsed.frame.seq === 1 &&
                       parsed.frame.total === 3 &&
                       parsed.frame.data === chunkData;
  results.push({ name: 'MLO1 Framing & Parse Roundtrip', passed: isFrameValid });

  // Test 3: CRC32 Corrupted Chunk Detection
  const corruptedData = chunkData.slice(0, -1) + 'X';
  const corruptedFrame = `${QR_PROTOCOL.MAGIC_PREFIX}|${refIdShort}|${seq}|${total}|${parsed.frame.crc32}|${corruptedData}`;
  const parsedCorrupt = parseFrame(corruptedFrame);
  const isCorruptionDetected = !parsedCorrupt.isValid && parsedCorrupt.error.includes('CRC32 checksum mismatch');
  results.push({ name: 'MLO1 Tamper/Corruption Detection', passed: isCorruptionDetected });

  // Test 4: Invalid Header Rejection
  const invalidHeaderFrame = `BADHDR|${refIdShort}|${seq}|${total}|${crc1}|${chunkData}`;
  const parsedBadHdr = parseFrame(invalidHeaderFrame);
  const isBadHdrRejected = !parsedBadHdr.isValid && parsedBadHdr.error.includes('Unrecognized protocol header');
  results.push({ name: 'MLO1 Invalid Header Rejection', passed: isBadHdrRejected });

  return results;
}

// Auto-run if executed directly via Node CLI
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('protocol.test.js')) {
  console.log('====================================================');
  console.log('   MediLink Offline MLO1 Protocol Test Suite');
  console.log('====================================================\n');
  const results = runProtocolSelfTest();
  let allPassed = true;
  for (const r of results) {
    if (r.passed) {
      console.log(`  [PASS] ${r.name}`);
    } else {
      console.error(`  [FAIL] ${r.name}`);
      allPassed = false;
    }
  }
  if (!allPassed) {
    process.exit(1);
  }
  console.log('\n====================================================');
  console.log(`   ALL ${results.length}/${results.length} PROTOCOL TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

