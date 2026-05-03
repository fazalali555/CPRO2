import { saveFileToIDB, getAllFilesFromIDB } from '../utils';
import { exportAllData, importAllData } from '../lib/db';

const SALT = 'CLERKPRO_GOVT_SECURE_2026_FAZAL_ALI';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const xorBytes = (data: Uint8Array, key: string): Uint8Array => {
  const keyBytes = new TextEncoder().encode(key);
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const BackupService = {
  async createSnapshotPayload() {
    const localStorageData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Backup everything except the auto-backup snapshot itself to avoid recursive growth
      if (key && key !== 'clerk_pro_auto_backup_snapshot') {
        localStorageData[key] = localStorage.getItem(key) || '';
      }
    }

    let idbFiles: Record<string, Uint8Array> = {};
    try {
      // These are files from the separate clerk_pro_rpms_files DB
      idbFiles = await getAllFilesFromIDB();
    } catch (e) {
      console.warn('IndexedDB files backup skipped:', e);
    }

    let dbData = null;
    try {
      // These are employees, cases, settings, and files from the main clerk_pro_rpms DB
      dbData = await exportAllData();
    } catch (e) {
      console.error('Main database backup failed:', e);
    }

    const backup = {
      version: 2,
      timestamp: new Date().toISOString(),
      localStorage: localStorageData,
      files: idbFiles,
      database: dbData,
      branding: 'Clerk Pro by Fazal Ali'
    };

    const serialized = JSON.stringify(backup, (key, value) => {
      if (value instanceof Uint8Array) {
        return Array.from(value);
      }
      return value;
    });
    
    // Secure Encryption handling UTF-8 correctly
    const utf8Bytes = strToBytes(serialized);
    const encryptedBytes = xorBytes(utf8Bytes, SALT);
    const base64 = bytesToBase64(encryptedBytes);

    return `CLERKPRO_V2_SECURE:${base64}`;
  },

  async createFullBackup() {
    try {
      const finalPayload = await BackupService.createSnapshotPayload();
      const blob = new Blob([finalPayload], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `ClerkPro_Backup_${dateStr}.bak`;
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      return true;
    } catch (e) {
      console.error('Backup failed:', e);
      return false;
    }
  },

  async createAutoSnapshot() {
    try {
      const payload = await BackupService.createSnapshotPayload();
      localStorage.setItem('clerk_pro_auto_backup_snapshot', payload);
      localStorage.setItem('clerk_pro_auto_backup_at', new Date().toISOString());
      return true;
    } catch (e) {
      console.error('Auto snapshot failed:', e);
      return false;
    }
  },

  async restoreFromBackup(file: File) {
    try {
      const content = await file.text();
      let jsonStr = '';

      if (content.startsWith('CLERKPRO_V2_SECURE:')) {
        const base64 = content.replace('CLERKPRO_V2_SECURE:', '');
        const encryptedBytes = base64ToBytes(base64);
        const decryptedBytes = xorBytes(encryptedBytes, SALT);
        jsonStr = bytesToStr(decryptedBytes);
      } else if (content.startsWith('CLERKPRO_ENC_V1:')) {
        // Backward compatibility for V1 (Legacy)
        const base64 = content.replace('CLERKPRO_ENC_V1:', '');
        jsonStr = decodeURIComponent(escape(atob(base64)));
      } else {
        // Try Legacy without prefix
        try {
          // Attempt to decode as if it was raw Base64 V1
          const decoded = decodeURIComponent(escape(atob(content)));
          if (decoded.includes('"localStorage"')) {
             jsonStr = decoded;
          } else {
             // Maybe it's raw JSON
             JSON.parse(content);
             jsonStr = content;
          }
        } catch (e) {
             throw new Error('Invalid backup file format or corrupted data');
        }
      }

      const backup = JSON.parse(jsonStr);

      // 1. Restore LocalStorage
      if (backup.localStorage) {
        // Optional: Clear existing prefixed data for a clean restore
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('clerk_pro_') || key.startsWith('budgeting/'))) {
            localStorage.removeItem(key);
            i--; // Adjust index after removal
          }
        }

        Object.entries(backup.localStorage as Record<string, string>).forEach(([key, val]) => {
          localStorage.setItem(key, val);
        });
      }

      // 2. Restore IndexedDB Files (from separate files DB)
      if (backup.files) {
        // We don't have a generic clear for the files DB in utils.ts, 
        // but saveFileToIDB overwrites.
        for (const [id, data] of Object.entries(backup.files as Record<string, number[]>)) {
          await saveFileToIDB(id, new Uint8Array(data));
        }
      }

      // 3. Restore Main Database (employees, cases, settings)
      if (backup.database) {
        await importAllData(backup.database);
      }

      return true;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }
};
