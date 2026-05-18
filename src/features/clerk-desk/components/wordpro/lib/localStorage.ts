/**
 * Local storage utilities for document persistence
 */

export interface StoredDocument {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  metadata: {
    wordCount: number;
    characterCount: number;
    createdAt: number;
  };
}

const STORAGE_KEY = "word-2026-documents";
const AUTOSAVE_KEY = "word-2026-autosave";

/**
 * Save document to local storage
 */
export function saveDocumentToStorage(doc: StoredDocument): void {
  try {
    const documents = getAllDocuments();
    const index = documents.findIndex((d) => d.id === doc.id);

    if (index >= 0) {
      documents[index] = doc;
    } else {
      documents.push(doc);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  } catch (error) {
    console.error("Failed to save document to storage:", error);
  }
}

/**
 * Load document from local storage
 */
export function loadDocumentFromStorage(id: string): StoredDocument | null {
  try {
    const documents = getAllDocuments();
    return documents.find((d) => d.id === id) || null;
  } catch (error) {
    console.error("Failed to load document from storage:", error);
    return null;
  }
}

/**
 * Get all documents from local storage
 */
export function getAllDocuments(): StoredDocument[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get documents from storage:", error);
    return [];
  }
}

/**
 * Delete document from local storage
 */
export function deleteDocumentFromStorage(id: string): void {
  try {
    const documents = getAllDocuments();
    const filtered = documents.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete document from storage:", error);
  }
}

/**
 * Save autosave draft
 */
export function saveAutosaveDraft(content: string, title: string): void {
  try {
    const autosave = {
      content,
      title,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosave));
  } catch (error) {
    console.error("Failed to save autosave draft:", error);
  }
}

/**
 * Load autosave draft
 */
export function loadAutosaveDraft(): { content: string; title: string; timestamp: number } | null {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load autosave draft:", error);
    return null;
  }
}

/**
 * Clear autosave draft
 */
export function clearAutosaveDraft(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (error) {
    console.error("Failed to clear autosave draft:", error);
  }
}

/**
 * Check if autosave draft exists
 */
export function hasAutosaveDraft(): boolean {
  try {
    return localStorage.getItem(AUTOSAVE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
