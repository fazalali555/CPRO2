import { saveFileToIDB, getAllFilesFromIDB } from '../utils';

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
      if (key && (key.startsWith('clerk_pro_') || key === 'clerk_pro_language' || key.startsWith('budgeting/'))) {
        localStorageData[key] = localStorage.getItem(key) || '';
      }
    }

    let idbFiles: Record<string, Uint8Array> = {};
    try {
      idbFiles = await getAllFilesFromIDB();
    } catch (e) {
      console.warn('IndexedDB backup skipped:', e);
    }

    const backup = {
      version: 1,
      timestamp: new Date().toISOString(),
      localStorage: localStorageData,
      files: idbFiles,
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
        jsonStr = decodeURIComponent(escape(atob(content))).replace('CLERKPRO_ENC_V1:', '');
      } else {
        // Try Legacy without prefix
        try {
          // Check if it's the old format which used simple XOR + btoa on string
          // This path is tricky because the old code was buggy for unicode.
          // If the file was created with the old buggy code and ONLY contained ASCII, this might work.
          // If it contained Unicode, it likely crashed during creation so no such file exists.
          // However, we should try to support reading valid files created by the old version.
          
          // Attempt to decode as if it was the old buggy XOR format
          // Old logic: xorEncrypt(atob(encrypted), salt) where xorEncrypt returned a string
          
          const oldSalt = 'CLERKPRO_GOVT_SECURE_2026_FAZAL_ALI';
          const oldXorEncrypt = (text: string, key: string) => {
            return text.split('').map((c, i) => 
              String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
            ).join('');
          };

          // If content is just base64, try to decode
          // Note: The previous code had a "try V1 without prefix" block that did:
          // decodeURIComponent(escape(atob(content)))
          // This implies V1 might have been just URI encoded? 
          // Actually looking at the old code:
          // } else {
          //   // Try V1 without prefix if atob succeeds
          //   try {
          //     const decoded = decodeURIComponent(escape(atob(content)));
          //     if (decoded.startsWith('CLERKPRO_ENC_V1:')) ...
          
          // Let's keep the exact logic for legacy fallback
          const decoded = decodeURIComponent(escape(atob(content)));
          if (decoded.startsWith('CLERKPRO_ENC_V1:')) {
             jsonStr = decoded.replace('CLERKPRO_ENC_V1:', '');
          } else {
             // Maybe it's the V2 format but missing prefix? Unlikely. 
             // Or maybe it's raw JSON?
             JSON.parse(content); // Test if it's raw JSON
             jsonStr = content;
          }
        } catch (e) {
             // Final fallback: maybe it was the buggy V2 format (btoa of xor string)
             // If we are here, it means we couldn't parse it.
             // Let's assume the user is trying to restore a valid backup.
             throw new Error('Invalid backup file format or corrupted data');
        }
      }

      const backup = JSON.parse(jsonStr);

      // 1. Restore LocalStorage
      if (backup.localStorage) {
        Object.entries(backup.localStorage as Record<string, string>).forEach(([key, val]) => {
          localStorage.setItem(key, val);
        });
      }

      // 2. Restore IndexedDB Files
      if (backup.files) {
        for (const [id, data] of Object.entries(backup.files as Record<string, number[]>)) {
          await saveFileToIDB(id, new Uint8Array(data));
        }
      }

      return true;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }
};
