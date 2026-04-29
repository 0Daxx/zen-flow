// IndexedDB wrapper for Guidance Guru extension

const DB_NAME = 'GuidanceGuruDB';
const DB_VERSION = 1;

const STORES = {
  EMOTION_SESSIONS: 'emotion_sessions',
  POSTURE_RECORDS: 'posture_records',
  WEBSITE_ACTIVITY: 'website_activity',
  BREAK_HISTORY: 'break_history',
  MEDITATION_LOGS: 'meditation_logs'
};

let db = null;

/**
 * Initialize IndexedDB database
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Emotion Sessions Store
      if (!database.objectStoreNames.contains(STORES.EMOTION_SESSIONS)) {
        const emotionStore = database.createObjectStore(STORES.EMOTION_SESSIONS, { keyPath: 'id' });
        emotionStore.createIndex('timestamp', 'timestamp', { unique: false });
        emotionStore.createIndex('session_date', 'session_date', { unique: false });
        emotionStore.createIndex('emotion', 'emotion', { unique: false });
      }

      // Posture Records Store
      if (!database.objectStoreNames.contains(STORES.POSTURE_RECORDS)) {
        const postureStore = database.createObjectStore(STORES.POSTURE_RECORDS, { keyPath: 'id' });
        postureStore.createIndex('timestamp', 'timestamp', { unique: false });
        postureStore.createIndex('session_date', 'session_date', { unique: false });
      }

      // Website Activity Store
      if (!database.objectStoreNames.contains(STORES.WEBSITE_ACTIVITY)) {
        const websiteStore = database.createObjectStore(STORES.WEBSITE_ACTIVITY, { keyPath: 'id' });
        websiteStore.createIndex('website_domain', 'website_domain', { unique: false });
        websiteStore.createIndex('date', 'date', { unique: false });
      }

      // Break History Store
      if (!database.objectStoreNames.contains(STORES.BREAK_HISTORY)) {
        const breakStore = database.createObjectStore(STORES.BREAK_HISTORY, { keyPath: 'id' });
        breakStore.createIndex('timestamp', 'timestamp', { unique: false });
        breakStore.createIndex('break_type', 'break_type', { unique: false });
      }

      // Meditation Logs Store
      if (!database.objectStoreNames.contains(STORES.MEDITATION_LOGS)) {
        const meditationStore = database.createObjectStore(STORES.MEDITATION_LOGS, { keyPath: 'id' });
        meditationStore.createIndex('timestamp', 'timestamp', { unique: false });
        meditationStore.createIndex('session_date', 'session_date', { unique: false });
      }
    };
  });
}

/**
 * Add a record to a store
 */
export async function addRecord(storeName, record) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(record);

    request.onsuccess = () => resolve(record.id);
    request.onerror = () => reject(new Error(`Failed to add record to ${storeName}`));
  });
}

/**
 * Get all records from a store with optional filtering
 */
export async function getRecords(storeName, options = {}) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      let records = request.result;
      
      // Apply filters if provided
      if (options.index && options.value) {
        records = records.filter(r => r[options.index] === options.value);
      }
      
      if (options.startDate || options.endDate) {
        records = records.filter(r => {
          const timestamp = r.timestamp || 0;
          const afterStart = !options.startDate || timestamp >= options.startDate;
          const beforeEnd = !options.endDate || timestamp <= options.endDate;
          return afterStart && beforeEnd;
        });
      }
      
      resolve(records);
    };
    
    request.onerror = () => reject(new Error(`Failed to get records from ${storeName}`));
  });
}

/**
 * Update a record in a store
 */
export async function updateRecord(storeName, record) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(record);

    request.onsuccess = () => resolve(record.id);
    request.onerror = () => reject(new Error(`Failed to update record in ${storeName}`));
  });
}

/**
 * Delete a record from a store
 */
export async function deleteRecord(storeName, id) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(new Error(`Failed to delete record from ${storeName}`));
  });
}

/**
 * Clear all records from a store
 */
export async function clearStore(storeName) {
  if (!db) await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
  });
}

/**
 * Purge old data beyond retention period
 */
export async function purgeOldData(retentionDays = 90) {
  const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  
  const stores = Object.values(STORES);
  
  for (const storeName of stores) {
    try {
      const records = await getRecords(storeName);
      const oldRecords = records.filter(r => r.timestamp < cutoffDate);
      
      for (const record of oldRecords) {
        await deleteRecord(storeName, record.id);
      }
    } catch (error) {
      console.error(`Error purging ${storeName}:`, error);
    }
  }
  
  return true;
}

export { STORES, DB_NAME };
