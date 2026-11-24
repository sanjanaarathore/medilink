/**
 * @file syncQueue.test.js
 * @description Unit and integration tests for background sync queue, idempotency,
 * conflict resolution rules, exponential retry, and audit preservation.
 */

import {
  enqueueSyncItem,
  getSyncQueue,
  getPendingSyncCount,
  resolveConflict,
  processSyncQueue,
  purgeCompletedSyncRecords,
  SYNC_STATUS,
  SYNC_ENTITY_TYPE
} from '../../src/services/syncService.js';
import { getAuditLogs } from '../../src/services/auditService.js';

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

async function runSyncQueueTests() {
  console.log('====================================================');
  console.log('   MediLink Offline Phase 5: Sync Queue & Conflict');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: IDEMPOTENT ENQUEUE & DEDUPLICATION
  // ----------------------------------------------------
  console.log('--- Suite 1: Idempotency & Sync Queue Operations ---');

  const initialPending = await getPendingSyncCount();

  // Enqueue Item 1
  const item1 = await enqueueSyncItem({
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    entityId: 'REF-SYNC-TEST-001',
    action: 'CREATE',
    payload: { priority: 'URGENT', diagnosis: 'Suspected Meningitis' },
    facilityId: 'PHC-DHAR-04'
  });

  assert(item1.status === SYNC_STATUS.PENDING, 'Item 1 enqueued with PENDING status');
  assert(item1.syncId !== undefined, 'Item 1 has unique syncId');

  const afterFirstPending = await getPendingSyncCount();
  assert(afterFirstPending === initialPending + 1, 'Pending count increments by 1');

  // Enqueue Duplicate Item (Same entityType & entityId)
  const item1Duplicate = await enqueueSyncItem({
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    entityId: 'REF-SYNC-TEST-001',
    action: 'UPDATE',
    payload: { priority: 'EMERGENCY_CRITICAL', diagnosis: 'Bacterial Meningitis Confirmed' },
    facilityId: 'PHC-DHAR-04'
  });

  const afterDupPending = await getPendingSyncCount();
  assert(afterDupPending === afterFirstPending, 'Duplicate sync request merged idempotently without duplicate row');
  assert(item1Duplicate.payload.priority === 'EMERGENCY_CRITICAL', 'Merged payload updated with newer values');

  // ----------------------------------------------------
  // SUITE 2: CLINICAL CONFLICT RESOLUTION RULES
  // ----------------------------------------------------
  console.log('\n--- Suite 2: Clinical Conflict Resolution Strategy ---');

  // Conflict Scenario A: District Hospital Intake Status vs PHC Outgoing Status
  const phcLocalRecord = {
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    updatedAt: '2026-11-24T10:00:00.000Z',
    payload: {
      referralId: 'REF-001',
      status: 'DISPATCHED',
      triageStatus: 'ARRIVING'
    }
  };

  const hospitalRemoteRecord = {
    entityType: SYNC_ENTITY_TYPE.REFERRAL,
    updatedAt: '2026-11-24T10:30:00.000Z',
    payload: {
      referralId: 'REF-001',
      status: 'ADMITTED',
      triageStatus: 'ADMITTED',
      assignedBed: 'ICU Bed 04'
    }
  };

  const resolutionA = resolveConflict(phcLocalRecord, hospitalRemoteRecord);
  assert(resolutionA.winner === 'REMOTE', 'Hospital intake disposition supersedes PHC provisional status');
  assert(resolutionA.resolvedPayload.triageStatus === 'ADMITTED', 'Winning payload contains hospital triage status');

  // Conflict Scenario B: Demographic Conflict (Last-Write-Wins)
  const patientOldRecord = {
    entityType: SYNC_ENTITY_TYPE.PATIENT,
    updatedAt: '2026-11-24T09:00:00.000Z',
    payload: { contactPhone: '+91-9876500000', updatedAt: '2026-11-24T09:00:00.000Z' }
  };
  const patientNewRecord = {
    entityType: SYNC_ENTITY_TYPE.PATIENT,
    updatedAt: '2026-11-24T11:00:00.000Z',
    payload: { contactPhone: '+91-9876599999', updatedAt: '2026-11-24T11:00:00.000Z' }
  };

  const resolutionB = resolveConflict(patientOldRecord, patientNewRecord);
  assert(resolutionB.winner === 'REMOTE', 'Newer ISO timestamp wins demographic conflict');
  assert(resolutionB.resolvedPayload.contactPhone === '+91-9876599999', 'Resolved phone number reflects newer update');

  // ----------------------------------------------------
  // SUITE 3: PROCESS SYNC QUEUE WITH RETRY & MOCK TRANSPORT
  // ----------------------------------------------------
  console.log('\n--- Suite 3: Sync Queue Processing & Retry Resilience ---');

  // Mock Transport Adapter
  let mockShouldFail = true;
  const mockAdapter = {
    transmit: async (item) => {
      if (mockShouldFail) {
        throw new Error('Simulated gateway 503 Service Unavailable');
      }
      return { success: true };
    }
  };

  // Run 1: Failure attempt (triggers retry logic)
  const failResult = await processSyncQueue(mockAdapter);
  assert(failResult.failureCount > 0, 'Transport failure recorded');

  const queueAfterFail = await getSyncQueue();
  const failedItem = queueAfterFail.find((i) => i.entityId === 'REF-SYNC-TEST-001');
  assert(failedItem.retryCount === 1, 'Item retryCount incremented to 1');
  assert(failedItem.lastError.includes('503 Service Unavailable'), 'Error message captured on item');

  // Run 2: Success attempt (gateway restored)
  mockShouldFail = false;
  const successResult = await processSyncQueue(mockAdapter);
  assert(successResult.successCount > 0, 'Subsequent sync pass succeeds after gateway recovery');

  const queueAfterSuccess = await getSyncQueue();
  const syncedItem = queueAfterSuccess.find((i) => i.entityId === 'REF-SYNC-TEST-001');
  assert(syncedItem.status === SYNC_STATUS.SYNCED, 'Item transitioned to SYNCED status');
  assert(syncedItem.syncedAt !== undefined, 'Item has verified syncedAt timestamp');

  // ----------------------------------------------------
  // SUITE 4: AUDIT PRESERVATION & PURGE
  // ----------------------------------------------------
  console.log('\n--- Suite 4: Audit Log Integration & Retention Purge ---');

  const auditLogs = await getAuditLogs();
  const hasSyncFailureAudit = auditLogs.some((l) => l.action === 'SYNC_FAILED');
  const hasSyncSuccessAudit = auditLogs.some((l) => l.action === 'SYNC_COMPLETED');
  assert(hasSyncFailureAudit, 'Audit log preserved SYNC_FAILED event');
  assert(hasSyncSuccessAudit, 'Audit log preserved SYNC_COMPLETED event');

  // Test purge with 0 retention hours (clears immediate)
  const purgedCount = await purgeCompletedSyncRecords(0);
  assert(purgedCount > 0, 'Successfully purged completed sync items');

  console.log('\n====================================================');
  console.log(`   ALL ${passedTests}/${totalTests} SYNC QUEUE TESTS PASSED!`);
  console.log('====================================================\n');
}

runSyncQueueTests().catch((err) => {
  console.error('[FATAL ERROR IN SYNC QUEUE TESTS]', err);
  process.exit(1);
});

