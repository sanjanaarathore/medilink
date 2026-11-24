# Changelog

All notable changes to **MediLink Offline** are documented in this file.

## [1.0.0] - 2026-11-25

### Phase 5 — Offline Integration, PWA & Deployment
- Implemented production PWA Service Worker (`public/sw.js`, cache `medilink-v1.0.0`) with zero-PII HTTP cache bypass and offline fallback (`public/offline.html`).
- Upgraded IndexedDB schema to Version 2 (`sync_queue` store, automated migration, persistent storage quota hooks, sanitized JSON backup/recovery).
- Built background synchronization service (`src/services/syncService.js`) with idempotent merging, hospital-intake precedence conflict resolution, and retry telemetry.
- Added React `ErrorBoundary`, relative-path GitHub Pages deployment support, CI workflow, and local HTTP deployment server (`server.js`).

### Phase 4 — Security & Encrypted QR Referral Engine
- Implemented standards-compliant W3C Web Crypto engine (`src/crypto/webCryptoEngine.js`): AES-256-GCM with AAD binding, RSA-OAEP (SHA-256), ECDSA P-256 digital signatures, RFC 8785 canonical JSON serialization, and PBKDF2 (100,000 iterations) private key wrapping.
- Built facility key provisioning, trust directory enforcement (`ACTIVE`/`REVOKED`/`EXPIRED`), and `.mldir` air-gap bundle export/import (`src/services/keyManagementService.js`).
- Implemented pure JavaScript ISO/IEC 18004 QR matrix/SVG generator (`src/qr/qrCodeGenerator.js`), MLO1 multi-part protocol framing (`src/qr/protocol.js`), and out-of-order CRC32 reassembler (`src/qr/qrScannerEngine.js`).

### Phase 3 — Core Application & Patient Management
- Implemented role-based authentication (`src/services/authService.js`) and strict RBAC enforcement (`src/config/roles.js`) isolating clinical PHI from Admin accounts.
- Implemented patient enrollment with ABHA ID uniqueness & format validation, vital signs bounds checking, referral creation with UUIDv4, disposition tracking, and immutable audit logging.

### Phase 2 — UI/UX & Three-Portal Frontend
- Built unified React 18 + Tailwind CSS frontend across three portals: **Admin** (10 views), **PHC** (13 views), and **District Hospital** (11 views) with collapsible sidebars, Lucide SVG icons, and clinical status badges.

### Phase 1 — System Architecture & Foundation
- Authored comprehensive technical architecture documentation (`docs/01`–`10` and `ARCHITECTURE_DECISION_RECORDS.md`) and established project layout standards (`AGENTS.md`).
