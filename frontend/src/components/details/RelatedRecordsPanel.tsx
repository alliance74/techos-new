'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import {
  Download,
  Eye,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { DetailRelated } from '@/mocks/detailExtras';
import type { Document as DocRecord } from '@/types/document';
import {
  fetchDocumentBlob,
  useDeleteDocument,
  useRelatedDocuments,
  useUploadDocument,
} from '@/hooks/useDocuments';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { cn } from '@/lib/utils';

function formatBytes(size?: number) {
  if (!size || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function relatedFolder(entityKey: string, recordId: string) {
  return `related/${entityKey}/${recordId}`;
}

function isRemoteUrl(url?: string | null) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function canViewDoc(doc: DocRecord) {
  if (doc.can_view) return true;
  if (doc.storage_path) return true;
  if (isRemoteUrl(doc.file_url) || isRemoteUrl(doc.content)) return true;
  return false;
}

function isImageMime(mime?: string) {
  return Boolean(mime && mime.startsWith('image/'));
}

function isPdfMime(mime?: string, name?: string) {
  if (mime === 'application/pdf') return true;
  return Boolean(name && /\.pdf$/i.test(name));
}

function isTextMime(mime?: string, name?: string) {
  if (mime?.startsWith('text/')) return true;
  return Boolean(name && /\.(txt|md|csv|json|log)$/i.test(name));
}

type PreviewState = {
  doc: DocRecord;
  url: string;
  mime: string;
};

type RelatedRecordsPanelProps = {
  entityKey: string;
  recordId: string;
  /** Optional seed links from mock extras */
  seed?: DetailRelated[];
};

/**
 * Related tab panel: upload files against the current record (Notion/Linear-style attachments).
 * Files are stored as documents under folder `related/{entity}/{id}`.
 */
export function RelatedRecordsPanel({ entityKey, recordId, seed = [] }: RelatedRecordsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const docsQuery = useRelatedDocuments(entityKey, recordId);
  const upload = useUploadDocument();
  const removeDoc = useDeleteDocument();

  const docs = docsQuery.data || [];

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreview(null);
  };

  const openDocument = async (doc: DocRecord) => {
    const remote = isRemoteUrl(doc.file_url) ? doc.file_url : isRemoteUrl(doc.content) ? doc.content : null;
    if (remote && !doc.storage_path) {
      window.open(remote, '_blank', 'noopener,noreferrer');
      return;
    }

    setOpeningId(doc.id);
    try {
      const { blob, mime } = await fetchDocumentBlob(doc.id);
      const url = URL.createObjectURL(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = url;
      setPreview({ doc, url, mime: mime || doc.file_type || doc.file_mime || blob.type });
    } catch {
      toast.error('Could not open file');
    } finally {
      setOpeningId(null);
    }
  };

  const downloadPreview = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = preview.doc.title || preview.doc.name || 'download';
    a.click();
  };

  const onFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    for (const file of list) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 25MB`);
        continue;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('folder', relatedFolder(entityKey, recordId));
      formData.append('related_entity_type', entityKey);
      formData.append('related_entity_id', recordId);
      await upload.mutateAsync(formData);
    }
    docsQuery.refetch();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) {
      void onFiles(e.dataTransfer.files);
    }
  };

  const previewLabel = preview?.doc.title || preview?.doc.name || 'File';
  const previewMime = preview?.mime;
  const showImage = preview && isImageMime(previewMime);
  const showPdf = preview && isPdfMime(previewMime, previewLabel);
  const showText = preview && isTextMime(previewMime, previewLabel);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-xl border border-dashed px-4 py-8 text-center transition-colors',
          dragging ? 'border-brand bg-brand/5' : 'border-border bg-bg-muted/40',
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-ink-muted" />
        <p className="mt-3 text-sm font-medium text-ink">Upload related files</p>
        <p className="mt-1 text-xs text-ink-muted">
          Drag and drop, or browse — PDF, images, spreadsheets, docs (max 25MB)
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Choose files
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {docsQuery.isLoading ? (
        <p className="text-sm text-ink-muted">Loading related files…</p>
      ) : docs.length === 0 && seed.length === 0 ? (
        <p className="text-sm text-ink-muted">No related records yet. Upload a file to attach it here.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => {
            const viewable = canViewDoc(doc);
            const label = doc.title || doc.name || 'File';
            return (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  disabled={!viewable || openingId === doc.id}
                  onClick={() => void openDocument(doc)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-muted text-ink-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink hover:underline">{label}</p>
                    <p className="text-xs text-ink-muted">
                      File
                      {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                      {doc.created_at
                        ? ` · ${new Date(doc.created_at).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  {viewable ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      type="button"
                      loading={openingId === doc.id}
                      onClick={() => void openDocument(doc)}
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Badge size="sm" variant="default">
                      Unavailable
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    loading={removeDoc.isPending}
                    onClick={async () => {
                      await removeDoc.mutateAsync(doc.id);
                      docsQuery.refetch();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--danger)]" />
                  </Button>
                </div>
              </li>
            );
          })}
          {seed.map((r) => (
            <li
              key={`${r.kind}-${r.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs text-ink-muted">{r.kind}</p>
                <p className="truncate text-sm font-medium text-ink">{r.title}</p>
              </div>
              <Badge variant="default" size="sm">
                {r.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={Boolean(preview)}
        onClose={closePreview}
        title={previewLabel}
        size="xl"
      >
        {preview ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" type="button" onClick={downloadPreview}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <a href={preview.url} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" type="button">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open tab
                </Button>
              </a>
              {previewMime ? (
                <span className="text-xs text-ink-muted">{previewMime}</span>
              ) : null}
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-bg-muted/30 p-2">
              {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt={previewLabel}
                  className="mx-auto max-h-[65vh] w-auto max-w-full object-contain"
                />
              ) : showPdf ? (
                <iframe
                  title={previewLabel}
                  src={preview.url}
                  className="h-[65vh] w-full rounded-md bg-white"
                />
              ) : showText ? (
                <iframe
                  title={previewLabel}
                  src={preview.url}
                  className="h-[65vh] w-full rounded-md bg-white"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <FileText className="h-10 w-10 text-ink-muted" />
                  <p className="text-sm text-ink">Preview not available for this file type.</p>
                  <p className="text-xs text-ink-muted">Download or open in a new tab to view it.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
