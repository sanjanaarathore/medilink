/**
 * @file dbService.js
 * @description Application service wrapper for IndexedDB operations with transactional safety.
 * Includes universal fallback for non-browser/Node test environments, automated synthetic seeding,
 * schema migration handling, persistent storage requests, and data backup/recovery.
 */

import { DB_NAME, DB_VERSION, STORES, STORE_SCHEMAS } from '../db/schema.js';
import { SYNTHETIC_FACILITIES, SYNTHETIC_USERS, SYNTHETIC_PATIENTS } from '../utils/syntheticData.js';

let dbInstance = null;

// In-Memory Storage Driver for environments where native IndexedDB is unavailable
const memoryStores = new Map();
Object.values(STORES).forEach((store) => memoryStores.set(store, new Map()));

function isIndexedDBAvailable() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

/**
 * Initializes and opens the IndexedDB database.
 * Seeds initial synthetic data if stores are empty.
 * @returns {Promise<IDBDatabase | Object>}
 */
export async function getDatabase() {
  if (dbInstance) return dbInstance;

  if (!isIndexedDBAvailable()) {
    // Return lightweight memory driver interface
    dbInstance = {
      isMemory: true,
      name: DB_NAME,
      version: DB_VERSION
    };
    await seedInitialData();
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Schema Migration & Creation
      Object.entries(STORE_SCHEMAS).forEach(([storeName, config]) => {
        let store;
        if (!db.objectStoreNames.contains(storeName)) {
          store = db.createObjectStore(storeName, {
            keyPath: config.keyPath,
            autoIncrement: config.autoIncrement || false
          });
        } else {
          store = event.target.transaction.objectStore(storeName);
        }

        // Create or migrate indexes
        if (config.indexes && store) {
          config.indexes.forEach((idx) => {
            if (!store.indexNames.contains(idx.name)) {
              store.createIndex(idx.name, idx.keyPath, { unique: idx.unique });
            }
          });
        }
      });
    };

    request.onsuccess = async (event) => {
      dbInstance = event.target.result;
      await seedInitialData();
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error(`Failed to open IndexedDB: ${event.target.error?.message}`));
    };
  });
}

/**
 * Seeds initial synthetic facilities, users, and patients if the local database is fresh.
 */
async function seedInitialData() {
  const existingFacilities = await getAllRecords(STORES.FACILITIES);
  if (existingFacilities.length === 0) {
    for (const f of SYNTHETIC_FACILITIES) {
      await putRecord(STORES.FACILITIES, f);
    }
  }

  const existingUsers = await getAllRecords(STORES.USERS);
  if (existingUsers.length === 0) {
    for (const u of SYNTHETIC_USERS) {
      // Store with hashed PIN verification token instead of plaintext PIN
      await putRecord(STORES.USERS, {
        ...u,
        pinSalt: 'a7b8c9d0e1f2a3b4',
        pinHash: 'b5d03a11684813ef7753ab4ecfa7d760773f3fbfaeef6d42df4914c67ec80b72'
      });
    }
  }

  const existingPatients = await getAllRecords(STORES.PATIENTS);
  if (existingPatients.length === 0) {
    for (const p of SYNTHETIC_PATIENTS) {
      await putRecord(STORES.PATIENTS, p);
    }
  }
}

/**
 * Executes an atomic readwrite transaction across specified object stores.
 * @param {string[]} storeNames - Array of store identifiers
 * @param {(transaction: IDBTransaction) => Promise<any>} callback
 * @returns {Promise<any>}
 */
export async function executeTransaction(storeNames, callback) {
  const db = await getDatabase();
  
  if (db.isMemory) {
    return callback(memoryStores);
  }

  const tx = db.transaction(storeNames, 'readwrite');
  
  return new Promise((resolve, reject) => {
    tx.onabort = () => reject(new Error('IndexedDB Transaction aborted'));
    tx.onerror = (event) => {
      if (event.target.error?.name === 'QuotaExceededError') {
        reject(new Error('Storage Limit Exceeded: Browser storage quota has been reached. Please free up device space.'));
      } else {
        reject(event.target.error);
      }
    };
    
    Promise.resolve(callback(tx))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
      })
      .catch((err) => {
        try { tx.abort(); } catch (_) {}
        reject(err);
      });
  });
}

/**
 * Generic helper to get a record by primary key.
 * @param {string} storeName
 * @param {IDBValidKey} key
 */
export async function getRecord(storeName, key) {
  const db = await getDatabase();

  if (db.isMemory) {
    const store = memoryStores.get(storeName);
    return store ? store.get(key) || null : null;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to put (insert/update) a record.
 * @param {string} storeName
 * @param {any} value
 */
export async function putRecord(storeName, value) {
  const db = await getDatabase();

  if (db.isMemory) {
    const store = memoryStores.get(storeName);
    const schema = STORE_SCHEMAS[storeName];
    const keyPath = schema?.keyPath || 'id';
    let key = value[keyPath];
    if (key === undefined || key === null) {
      if (schema?.autoIncrement) {
        key = store.size + 1;
        value[keyPath] = key;
      } else {
        key = `key_${store.size + 1}_${Date.now()}_${Math.random()}`;
        value[keyPath] = key;
      }
    }
    store.set(key, value);
    return key;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => {
      if (event.target.error?.name === 'QuotaExceededError') {
        reject(new Error('Storage Limit Exceeded: Browser storage quota has been reached.'));
      } else {
        reject(event.target.error);
      }
    };
  });
}

/**
 * Generic helper to delete a record by key.
 * @param {string} storeName
 * @param {IDBValidKey} key
 */
export async function deleteRecord(storeName, key) {
  const db = await getDatabase();

  if (db.isMemory) {
    const store = memoryStores.get(storeName);
    if (store) store.delete(key);
    return true;
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generic helper to get all records from a store.
 * @param {string} storeName
 */
export async function getAllRecords(storeName) {
  const db = await getDatabase();

  if (db.isMemory) {
    const store = memoryStores.get(storeName);
    return store ? Array.from(store.values()) : [];
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Helper to query records by index.
 * @param {string} storeName
 * @param {string} indexName
 * @param {any} queryValue
 */
export async function getRecordsByIndex(storeName, indexName, queryValue) {
  const db = await getDatabase();

  if (db.isMemory) {
    const all = await getAllRecords(storeName);
    const config = STORE_SCHEMAS[storeName]?.indexes?.find((i) => i.name === indexName);
    const keyPath = config?.keyPath || indexName;
    return all.filter((item) => item[keyPath] === queryValue);
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(queryValue);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================================
// STORAGE PERSISTENCE & QUOTA ESTIMATION
// ============================================================================

/**
 * Requests persistent storage from the browser to prevent eviction.
 * @returns {Promise<boolean>} Whether persistent storage was granted
 */
export async function requestStoragePersistence() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    return navigator.storage.persist();
  }
  return false;
}

/**
 * Estimates browser storage usage and quota in bytes.
 * @returns {Promise<{usedBytes: number, totalBytes: number, percentUsed: number}>}
 */
export async function getStorageQuota() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usedBytes = estimate.usage || 0;
    const totalBytes = estimate.quota || 0;
    const percentUsed = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
    return { usedBytes, totalBytes, percentUsed };
  }
  return { usedBytes: 0, totalBytes: 0, percentUsed: 0 };
}

// ============================================================================
// DATA BACKUP & RECOVERY STRATEGY
// ============================================================================

/**
 * Exports complete local database contents for offline disaster recovery.
 * Excludes local wrapped private keys by default for security, unless explicitly included.
 * 
 * @param {boolean} [includeCredentials=false]
 * @returns {Promise<Object>}
 */
export async function exportDatabaseBackup(includeCredentials = false) {
  const backup = {
    version: DB_VERSION,
    databaseName: DB_NAME,
    timestamp: new Date().toISOString(),
    stores: {}
  };

  const storesToExport = [
    STORES.FACILITIES,
    STORES.USERS,
    STORES.TRUSTED_KEYS,
    STORES.PATIENTS,
    STORES.REFERRALS_OUTGOING,
    STORES.REFERRALS_RECEIVED,
    STORES.AUDIT_LOGS,
    STORES.SYNC_QUEUE,
    STORES.APP_CONFIG
  ];

  if (includeCredentials) {
    storesToExport.push(STORES.LOCAL_CREDENTIALS);
  }

  for (const store of storesToExport) {
    backup.stores[store] = await getAllRecords(store);
  }

  return backup;
}

/**
 * Imports a database backup package, transactionally restoring data records.
 * @param {Object} backupData
 * @returns {Promise<{importedCounts: Record<string, number>}>}
 */
export async function importDatabaseBackup(backupData) {
  if (!backupData || !backupData.stores || typeof backupData.stores !== 'object') {
    throw new Error('Invalid backup package format.');
  }

  const importedCounts = {};

  for (const [storeName, records] of Object.entries(backupData.stores)) {
    if (Object.values(STORES).includes(storeName) && Array.isArray(records)) {
      let count = 0;
      for (const record of records) {
        await putRecord(storeName, record);
        count++;
      }
      importedCounts[storeName] = count;
    }
  }

  return { importedCounts };
}

/**
 * Administrative database reset / clear for testing and facility handover.
 * @returns {Promise<void>}
 */
export async function clearDatabase() {
  const db = await getDatabase();

  if (db.isMemory) {
    memoryStores.forEach((store) => store.clear());
    await seedInitialData();
    return;
  }

  for (const storeName of Object.values(STORES)) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  await seedInitialData();
}
