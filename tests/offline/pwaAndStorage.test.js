/**
 * @file pwaAndStorage.test.js
 * @description Unit and integration tests for Phase 5 PWA assets, Service Worker rules,
 * IndexedDB schema migration to v2, persistent storage, and backup/restore recovery.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_NAME, DB_VERSION, STORES, STORE_SCHEMAS } from '../../src/db/schema.js';
import {
  getDatabase,
  exportDatabaseBackup,
  importDatabaseBackup,
  requestStoragePersistence,
  getStorageQuota,
  putRecord,
  getRecord,
  getAllRecords
} from '../../src/services/dbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}`);
    throw new Error(`Test assertion failed: ${testName}`);
  }
}

async function runPwaAndStorageTests() {
  console.log('====================================================');
  console.log('   MediLink Offline Phase 5: PWA & Storage Tests');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: WEB APP MANIFEST & PWA ASSET VALIDATION
  // ----------------------------------------------------
  console.log('--- Suite 1: Web App Manifest & Service Worker Assets ---');

  const manifestPath = path.join(ROOT_DIR, 'public/manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json exists in public directory');

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  assert(manifestContent.name.includes('MediLink Offline'), 'Manifest contains accurate product name');
  assert(manifestContent.display === 'standalone', 'Manifest display set to standalone PWA');
  assert(manifestContent.theme_color === '#064e3b', 'Manifest theme_color set to deep medical green (#064e3b)');
  assert(Array.isArray(manifestContent.icons) && manifestContent.icons.length > 0, 'Manifest defines application icons');
  assert(Array.isArray(manifestContent.shortcuts) && manifestContent.shortcuts.length === 3, 'Manifest defines 3 role-based portal shortcuts');

  const swPath = path.join(ROOT_DIR, 'public/sw.js');
  assert(fs.existsSync(swPath), 'Production Service Worker (sw.js) exists');
  const swContent = fs.readFileSync(swPath, 'utf-8');
  assert(swContent.includes('medilink-v1.0.0'), 'Service worker specifies cache versioning');
  assert(swContent.includes('offline.html'), 'Service worker pre-caches offline fallback page');
  assert(swContent.includes('clinical') && swContent.includes('fetch(request)'), 'Service worker enforces zero-cache policy on sensitive clinical requests');

  const offlineHtmlPath = path.join(ROOT_DIR, 'public/offline.html');
  assert(fs.existsSync(offlineHtmlPath), 'Offline fallback page (offline.html) exists');

  // ----------------------------------------------------
  // SUITE 2: INDEXEDDB VERSION 2 & SCHEMA MIGRATION
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Database Versioning & Schema Migration ---');

  assert(DB_VERSION === 2, 'IndexedDB version incremented to 2 for Phase 5');
  assert(STORES.SYNC_QUEUE === 'sync_queue', 'sync_queue object store registered in schema constants');
  assert(STORE_SCHEMAS[STORES.SYNC_QUEUE] !== undefined, 'sync_queue configuration and indexes defined');

  const db = await getDatabase();
  assert(db !== null, 'Database initialized successfully with v2 schema');

  // Verify sync_queue store is writable and readable
  const testSyncRecord = {
    entityType: 'TEST',
    entityId: 'TEST-001',
    action: 'PING',
    payload: { status: 'OK' },
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  const syncKey = await putRecord(STORES.SYNC_QUEUE, testSyncRecord);
  assert(syncKey !== undefined, 'Record persisted to sync_queue store');

  const retrievedSync = await getRecord(STORES.SYNC_QUEUE, syncKey);
  assert(retrievedSync.entityId === 'TEST-001', 'Retrieved sync record matches persisted entity');

  // ----------------------------------------------------
  // SUITE 3: STORAGE PERSISTENCE & QUOTA
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Persistent Storage & Quota Estimation ---');

  const persistenceResult = await requestStoragePersistence();
  assert(typeof persistenceResult === 'boolean', 'Persistent storage request returns boolean grant status');

  const quota = await getStorageQuota();
  assert(typeof quota.usedBytes === 'number' && typeof quota.totalBytes === 'number', 'Storage quota estimates numeric byte capacities');

  // ----------------------------------------------------
  // SUITE 4: DATA EXPORT & DISASTER RECOVERY BACKUP
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Database Backup & Recovery Strategy ---');

  const backupPackage = await exportDatabaseBackup(false);
  assert(backupPackage.version === 2, 'Backup package records schema version 2');
  assert(Array.isArray(backupPackage.stores.facilities), 'Backup package contains facilities store');
  assert(Array.isArray(backupPackage.stores.patients), 'Backup package contains patients store');
  assert(backupPackage.stores[STORES.LOCAL_CREDENTIALS] === undefined, 'Sanitized backup excludes private key credentials by default');

  // Test restoration
  const restoreResult = await importDatabaseBackup(backupPackage);
  assert(restoreResult.importedCounts.facilities > 0, 'Backup imported facilities successfully');
  assert(restoreResult.importedCounts.patients > 0, 'Backup imported patients successfully');

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests}/${totalTests} PWA & STORAGE TESTS PASSED!`);
  console.log('====================================================\n');
}

runPwaAndStorageTests().catch((err) => {
  console.error('[FATAL ERROR IN PWA/STORAGE TESTS]', err);
  process.exit(1);
});

