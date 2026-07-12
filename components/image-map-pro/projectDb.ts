// Image Map Pro project persistence — IndexedDB backed.
//
// Maps embed a full background image as a base64 data URI (often several MB
// once encoded), so a handful of saved projects can easily total tens of MB.
// localStorage caps out around 5-10MB per origin (Safari is closer to 5MB),
// so storing projects there throws QuotaExceededError well before a real
// user would expect trouble. IndexedDB has no such practical limit, which is
// why the rest of the site already stores project data there (see
// utils/projectStorage.ts) — this gives Image Map Pro its own small store in
// a dedicated database so it doesn't need to touch that shared schema.
import type { ImapDocument } from "./types";

export interface StoredProject {
  id: string;
  name: string;
  doc: ImapDocument;
  updatedAt: number;
}

const DB_NAME = "imap_projects_db";
const DB_VERSION = 1;
const STORE_NAME = "projects";
const LEGACY_LOCALSTORAGE_KEY = "imp-projects-v2";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

/**
 * One-time migration for users who saved maps before this switched from
 * localStorage to IndexedDB. Safe to call on every load: it no-ops once the
 * legacy key is gone.
 */
async function migrateFromLocalStorage(): Promise<void> {
  let legacyRaw: string | null;
  try {
    legacyRaw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
  } catch {
    return;
  }
  if (!legacyRaw) return;

  try {
    const legacyProjects: StoredProject[] = JSON.parse(legacyRaw);
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      for (const p of legacyProjects) store.put(p);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY);
  } catch (error) {
    console.error("Image Map Pro: failed to migrate legacy projects", error);
    // Leave the legacy key in place — better to retry next load than lose data.
  }
}

export async function loadAllProjects(): Promise<StoredProject[]> {
  await migrateFromLocalStorage();
  try {
    const db = await openDb();
    const result = await new Promise<StoredProject[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Image Map Pro: failed to load projects", error);
    return [];
  }
}

export async function saveProjectRecord(entry: StoredProject): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function deleteProjectRecord(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Turns a storage failure into a message worth showing the user. */
export function describeStorageError(error: unknown): string {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Not enough storage space. Delete an old project or use a smaller image, then try saving again.";
  }
  return "Couldn't save the project. Your browser storage may be full or unavailable.";
}
