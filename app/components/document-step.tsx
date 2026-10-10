"use client";

import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_TYPES,
  DOC_KIND_LABEL,
  MAX_BYTES,
  deleteDoc,
  getDoc,
  putDoc,
  type DocKind,
  type StoredDoc,
} from "@/lib/doc-store";

type Loaded = { doc: StoredDoc; url: string };

export function DocumentStep({ storageKey }: { storageKey: string }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [kind, setKind] = useState<DocKind>("avs");
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const urlRef = useRef<string | null>(null);

  function show(doc: StoredDoc | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = doc ? URL.createObjectURL(doc.blob) : null;
    setLoaded(doc && urlRef.current ? { doc, url: urlRef.current } : null);
    setText("");
    if (doc?.mime === "text/plain") doc.blob.text().then(setText);
  }

  useEffect(() => {
    let cancelled = false;
    getDoc(storageKey)
      .then((doc) => {
        if (!cancelled) show(doc ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [storageKey]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a PDF, PNG, JPG or plain-text (.txt) file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 10 MB.");
      return;
    }
    const doc: StoredDoc = {
      key: storageKey,
      blob: file,
      name: file.name,
      mime: file.type,
      kind,
      uploadedAt: Date.now(),
    };
    try {
      await putDoc(doc);
      show(doc);
    } catch {
      setError(
        "Couldn't save the file in this browser (private mode may block storage).",
      );
    }
  }

  async function remove() {
    await deleteDoc(storageKey).catch(() => {});
    show(null);
  }

  if (status === "loading")
    return <p className="text-sm text-muted">Loading…</p>;

  if (!loaded) {
    return (
      <div>
        <label htmlFor="doc-kind" className="block text-sm font-medium">
          What kind of document is it?
        </label>
        <select
          id="doc-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as DocKind)}
          className="field mt-1 max-w-xs"
        >
          {Object.entries(DOC_KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k} className="text-black">
              {label}
            </option>
          ))}
        </select>
        <label
          htmlFor="doc-file"
          className="mt-4 flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-black/25 p-8 text-center hover:bg-teal-700/5 dark:border-white/30"
        >
          <span className="font-medium">Choose a file</span>
          <span className="text-sm text-muted">
            PDF, PNG, JPG or .txt · up to 10 MB
          </span>
        </label>
        <input
          id="doc-file"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        {error && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          Optional. Your file is stored only in this browser. It is not sent to
          our servers.
        </p>
      </div>
    );
  }

  const { doc, url } = loaded;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>
          <span className="font-medium">{DOC_KIND_LABEL[doc.kind]}</span>
          <span className="text-sm text-muted">
            {" "}
            · {doc.name} · added{" "}
            {new Date(doc.uploadedAt).toLocaleDateString("en-US")}
          </span>
        </p>
        <div className="flex gap-3 text-sm print:hidden">
          <a href={url} target="_blank" rel="noreferrer" className="link">
            Open in new tab
          </a>
          <button type="button" onClick={remove} className="link">
            Remove
          </button>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-black/15 dark:border-white/20 print:hidden">
        {doc.mime === "application/pdf" && (
          <iframe
            src={url}
            title={doc.name}
            className="h-[28rem] w-full bg-white"
          />
        )}
        {doc.mime.startsWith("image/") && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimizable
          <img
            src={url}
            alt={`Preview of ${doc.name}`}
            className="mx-auto max-h-[28rem]"
          />
        )}
        {doc.mime === "text/plain" && (
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap p-3 text-sm">
            {text}
          </pre>
        )}
      </div>
    </div>
  );
}
