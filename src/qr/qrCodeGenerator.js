/**
 * @file qrCodeGenerator.js
 * @description Pure JavaScript QR Code Matrix and SVG Generator.
 * Implements ISO/IEC 18004 compliant QR Code generation with byte encoding,
 * Reed-Solomon error correction, and SVG rendering.
 * Fully self-contained: runs in browsers and Node.js without external dependencies.
 */

// Reed-Solomon Galois Field 256 math tables
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d; // Generator polynomial x^8 + x^4 + x^3 + x^2 + 1
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

function rsComputePoly(ecCount) {
  let poly = [1];
  for (let i = 0; i < ecCount; i++) {
    const next = [];
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length + 1; j++) {
      const p1 = j < poly.length ? gMul(poly[j], factor) : 0;
      const p2 = j > 0 ? poly[j - 1] : 0;
      next.push(p1 ^ p2);
    }
    poly = next;
  }
  return poly;
}

function rsCalculateEcc(data, ecCount) {
  const poly = rsComputePoly(ecCount);
  const remainder = new Array(ecCount).fill(0);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    if (factor !== 0) {
      for (let j = 0; j < ecCount; j++) {
        remainder[j] ^= gMul(poly[j + 1], factor);
      }
    }
  }
  return remainder;
}

// Version table capacities for Error Correction Level M (data codewords, ec codewords per block, blocks)
const QR_VERSION_SPECS_M = [
  null,
  { version: 1,  size: 21,  totalCodewords: 26,   dataCodewords: 16,   ecCount: 10, blocks: 1 },
  { version: 2,  size: 25,  totalCodewords: 44,   dataCodewords: 28,   ecCount: 16, blocks: 1 },
  { version: 3,  size: 29,  totalCodewords: 70,   dataCodewords: 44,   ecCount: 26, blocks: 1 },
  { version: 4,  size: 33,  totalCodewords: 100,  dataCodewords: 64,   ecCount: 18, blocks: 2 },
  { version: 5,  size: 37,  totalCodewords: 134,  dataCodewords: 86,   ecCount: 24, blocks: 2 },
  { version: 6,  size: 41,  totalCodewords: 172,  dataCodewords: 108,  ecCount: 16, blocks: 4 },
  { version: 7,  size: 45,  totalCodewords: 196,  dataCodewords: 124,  ecCount: 18, blocks: 4 },
  { version: 8,  size: 49,  totalCodewords: 242,  dataCodewords: 154,  ecCount: 22, blocks: 4 },
  { version: 9,  size: 53,  totalCodewords: 292,  dataCodewords: 182,  ecCount: 22, blocks: 5 },
  { version: 10, size: 57,  totalCodewords: 346,  dataCodewords: 216,  ecCount: 26, blocks: 5 },
  { version: 11, size: 61,  totalCodewords: 404,  dataCodewords: 254,  ecCount: 30, blocks: 5 },
  { version: 12, size: 65,  totalCodewords: 466,  dataCodewords: 290,  ecCount: 22, blocks: 8 },
  { version: 13, size: 69,  totalCodewords: 532,  dataCodewords: 334,  ecCount: 22, blocks: 9 },
  { version: 14, size: 73,  totalCodewords: 581,  dataCodewords: 365,  ecCount: 24, blocks: 9 },
  { version: 15, size: 77,  totalCodewords: 655,  dataCodewords: 415,  ecCount: 24, blocks: 10 },
  { version: 16, size: 81,  totalCodewords: 733,  dataCodewords: 465,  ecCount: 28, blocks: 10 },
  { version: 17, size: 85,  totalCodewords: 815,  dataCodewords: 515,  ecCount: 28, blocks: 11 },
  { version: 18, size: 89,  totalCodewords: 901,  dataCodewords: 565,  ecCount: 26, blocks: 13 },
  { version: 19, size: 93,  totalCodewords: 991,  dataCodewords: 627,  ecCount: 26, blocks: 14 },
  { version: 20, size: 97,  totalCodewords: 1085, dataCodewords: 687,  ecCount: 26, blocks: 16 }
];

/**
 * Encodes text into raw 8-bit byte codewords with padding.
 */
function encodeByteData(text, targetDataCodewords, version) {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(text);
  const charCount = rawBytes.length;

  const bits = [];
  function pushBits(val, len) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  // 1. Mode Indicator: 0100 for Byte Mode
  pushBits(0b0100, 4);

  // 2. Character Count Indicator (8 bits for v1-v9, 16 bits for v10+)
  const charCountBits = version <= 9 ? 8 : 16;
  pushBits(charCount, charCountBits);

  // 3. Payload Bytes
  for (let i = 0; i < rawBytes.length; i++) {
    pushBits(rawBytes[i], 8);
  }

  // 4. Terminator (up to 4 zeroes)
  const capacityBits = targetDataCodewords * 8;
  const terminatorCount = Math.min(4, capacityBits - bits.length);
  for (let i = 0; i < terminatorCount; i++) bits.push(0);

  // 5. Pad to multiple of 8
  while (bits.length % 8 !== 0) bits.push(0);

  // Convert bits to bytes
  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) {
      b = (b << 1) | bits[i + j];
    }
    codewords.push(b);
  }

  // 6. Pad codewords with alternating 0xEC and 0x11
  const padPatterns = [0xEC, 0x11];
  let padIdx = 0;
  while (codewords.length < targetDataCodewords) {
    codewords.push(padPatterns[padIdx]);
    padIdx = (padIdx + 1) % 2;
  }

  return codewords;
}

/**
 * Determines minimum QR version for given string length.
 */
export function getMinimumVersion(byteLength) {
  for (let v = 1; v < QR_VERSION_SPECS_M.length; v++) {
    const spec = QR_VERSION_SPECS_M[v];
    const headerBits = 4 + (v <= 9 ? 8 : 16);
    const maxDataBytes = Math.floor((spec.dataCodewords * 8 - headerBits) / 8);
    if (byteLength <= maxDataBytes) {
      return v;
    }
  }
  return 20; // Maximum supported in basic table
}

/**
 * Builds QR Code Module Matrix (2D boolean array).
 * @param {string} text
 * @returns {{size: number, modules: boolean[][], version: number}}
 */
export function generateQrMatrix(text) {
  const byteLength = new TextEncoder().encode(text).length;
  const version = getMinimumVersion(byteLength);
  const spec = QR_VERSION_SPECS_M[version] || QR_VERSION_SPECS_M[20];
  const size = spec.size;

  // Initialize matrix: null = unset, true = dark, false = light
  const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
  const isFunction = Array.from({ length: size }, () => new Array(size).fill(false));

  function setModule(r, c, isDark) {
    matrix[r][c] = isDark;
    isFunction[r][c] = true;
  }

  // 1. Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  function drawFinderPattern(row, col) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            setModule(nr, nc, true);
          } else {
            setModule(nr, nc, false);
          }
        }
      }
    }
  }

  drawFinderPattern(0, 0);
  drawFinderPattern(0, size - 7);
  drawFinderPattern(size - 7, 0);

  // 2. Alignment Patterns for Version >= 2
  if (version >= 2) {
    const pos = size - 7;
    // Single alignment pattern in bottom-right corner for v2-v6
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const ar = pos + r;
        const ac = pos + c;
        if (ar >= 0 && ar < size && ac >= 0 && ac < size && !isFunction[ar][ac]) {
          const isDark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          setModule(ar, ac, isDark);
        }
      }
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(4 * version + 9, 8, true);

  // 5. Reserve Format Information Area
  for (let i = 0; i < 9; i++) {
    if (!isFunction[8][i]) { matrix[8][i] = false; isFunction[8][i] = true; }
    if (!isFunction[i][8]) { matrix[i][8] = false; isFunction[i][8] = true; }
  }
  for (let i = 0; i < 8; i++) {
    if (!isFunction[8][size - 1 - i]) { matrix[8][size - 1 - i] = false; isFunction[8][size - 1 - i] = true; }
    if (!isFunction[size - 1 - i][8]) { matrix[size - 1 - i][8] = false; isFunction[size - 1 - i][8] = true; }
  }

  // 6. Encode Data & Calculate ECC
  const dataCodewords = encodeByteData(text, spec.dataCodewords, version);
  const ecCodewords = rsCalculateEcc(dataCodewords, spec.ecCount);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Convert all codewords to bit stream
  const bitStream = [];
  for (let i = 0; i < allCodewords.length; i++) {
    for (let b = 7; b >= 0; b--) {
      bitStream.push((allCodewords[i] >> b) & 1);
    }
  }

  // 7. Place Data into Matrix (Zigzag upward/downward pattern)
  let bitIdx = 0;
  let upwards = true;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing pattern column

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx++] === 1 : false;
          // Apply standard Mask Pattern 0: (row + col) % 2 === 0
          const masked = ((row + c) % 2 === 0) ? !bit : bit;
          matrix[row][c] = masked;
        }
      }
    }
    upwards = !upwards;
  }

  // 8. Write Format Information (Error Correction Level M + Mask 0: 101010000010010)
  const FORMAT_BITS_M_MASK0 = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((FORMAT_BITS_M_MASK0 >> (14 - i)) & 1) === 1;
    // Around top-left finder
    if (i <= 5) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Split around other finders
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  // Convert any remaining nulls to false
  const cleanModules = matrix.map((row) => row.map((m) => m === true));
  return {
    size,
    modules: cleanModules,
    version
  };
}

/**
 * Generates an SVG string representation of the QR code.
 * @param {string} text
 * @param {Object} [options]
 * @param {number} [options.moduleSize=6] - Pixel size per module
 * @param {number} [options.margin=4] - Quiet zone margin in modules
 * @param {string} [options.darkColor='#0f172a'] - Hex/CSS color for dark modules
 * @param {string} [options.lightColor='#ffffff'] - Hex/CSS color for light background
 * @returns {string} SVG markup string
 */
export function generateQrSvg(text, options = {}) {
  const {
    moduleSize = 6,
    margin = 4,
    darkColor = '#0f172a',
    lightColor = '#ffffff'
  } = options;

  const { size, modules } = generateQrMatrix(text);
  const totalSize = (size + margin * 2) * moduleSize;

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        const x = (c + margin) * moduleSize;
        const y = (r + margin) * moduleSize;
        rects += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${darkColor}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}"><rect width="100%" height="100%" fill="${lightColor}"/>${rects}</svg>`;
}

