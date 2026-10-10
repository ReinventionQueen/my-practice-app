// Browser-only IndexedDB store for the uploaded clinical document.
// The file never leaves the device: there is no upload to any server.

export type DocKind = "avs" | "discharge" | "visit-note" | "other";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  avs: "After Visit Summary",
  discharge: "Discharge notes",
  "visit-note": "Visit note",
  other: "Other",
};

export type StoredDoc = {
  key: string;
  blob: Blob;
  name: string;
  mime: string;
  kind: DocKind;
  uploadedAt: number;
};

export const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];
export const MAX_BYTES = 10 * 1024 * 1024;

const DB = "visit-prep";
const STORE = "documents";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { keyPath: "key" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export const getDoc = (key: string) =>
  run<StoredDoc | undefined>("readonly", (s) => s.get(key));
export const putDoc = (doc: StoredDoc) => run("readwrite", (s) => s.put(doc));
export const deleteDoc = (key: string) =>
  run("readwrite", (s) => s.delete(key));
