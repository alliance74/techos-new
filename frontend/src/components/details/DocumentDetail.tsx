'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, FileText, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';
import { fetchDocumentBlob, useAttachDocumentFile } from '@/hooks/useDocuments';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import {
  DetailHeader,
  DetailLoading,
  DetailNotFound,
  useDetailMutations,
  useDetailRecord,
  type DetailViewProps,
} from './DetailShell';

function isRemoteUrl(url?: string | null) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

function isPlaceholderContent(content?: string | null) {
  if (!content) return true;
  return /^(upload|local):\/\//i.test(content) || content.trim() === '';
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
  if (mime === 'application/json') return true;
  return Boolean(name && /\.(txt|md|csv|json|log)$/i.test(name));
}

function formatBytes(size?: number) {
  if (!size || size <= 0) return '';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Document detail: loads and displays the actual file (PDF / image / text) in-page.
 * If the record has no stored bytes (legacy placeholder), allows attaching a file.
 */
export function DocumentDetail(props: DetailViewProps) {
  const { entityKey, detailId, title, breadcrumbs, basePath } = props;
  const { data, isLoading, isError } = useDetailRecord(entityKey, detailId);
  const { removeAndBack } = useDetailMutations(entityKey);
  const attachFile = useAttachDocumentFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mime, setMime] = useState('');
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [needsUpload, setNeedsUpload] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const blobUrlRef = useRef<string | null>(null);

  const label = data?.title || data?.name || title;
  const fileMime = mime || String(data?.file_mime || data?.file_type || '') || '';

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!data?.id) return;

    let cancelled = false;

    const load = async () => {
      setLoadingFile(true);
      setNeedsUpload(false);
      setTextPreview(null);
      setBlobUrl(null);

      const content = String(data.content || '');
      const hasLocal = Boolean(data.storage_path);
      const hasRemote = isRemoteUrl(String(data.file_url || '')) || isRemoteUrl(content);
      const placeholder = isPlaceholderContent(content) && !hasLocal && !hasRemote;

      if (placeholder) {
        if (!cancelled) {
          setNeedsUpload(true);
          setLoadingFile(false);
        }
        return;
      }

      try {
        const { blob, mime: blobMime } = await fetchDocumentBlob(data.id);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = url;
        setBlobUrl(url);
        setMime(blobMime || String(data.file_mime || data.file_type || blob.type || ''));

        const resolvedMime = blobMime || blob.type;
        if (isTextMime(resolvedMime, label)) {
          const text = await blob.text();
          if (!cancelled) setTextPreview(text);
        }
      } catch {
        const remote = isRemoteUrl(String(data.file_url || ''))
          ? String(data.file_url)
          : isRemoteUrl(content)
            ? content
            : null;
        if (remote && !cancelled) {
          setBlobUrl(remote);
          setMime(String(data.file_mime || data.file_type || ''));
        } else if (!cancelled) {
          setNeedsUpload(true);
        }
      } finally {
        if (!cancelled) setLoadingFile(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, data?.storage_path, data?.content, data?.file_url, reloadKey]);

  if (isLoading) return <DetailLoading />;
  if (!data || isError) return <DetailNotFound entityKey={entityKey} detailId={detailId} />;

  const showImage = Boolean(blobUrl && isImageMime(fileMime));
  const showPdf = Boolean(blobUrl && isPdfMime(fileMime, label));
  const showText = Boolean(textPreview != null && isTextMime(fileMime, label));
  const isPlainTextDoc =
    data.type !== 'file' &&
    typeof data.content === 'string' &&
    data.content &&
    !isPlaceholderContent(data.content) &&
    !isRemoteUrl(data.content);

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = label || 'download';
    a.click();
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File must be 25MB or smaller');
      return;
    }
    await attachFile.mutateAsync({ id: detailId, file });
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <DetailHeader
        title={label}
        subtitle={`${data.type || 'document'}${data.file_size ? ` · ${formatBytes(Number(data.file_size))}` : ''}`}
        breadcrumbs={breadcrumbs}
        basePath={basePath}
        badges={
          <>
            <Badge variant={data.statusVariant}>{data.status}</Badge>
            {fileMime ? <Badge variant="info">{fileMime}</Badge> : null}
          </>
        }
        actions={
          <>
            {blobUrl && !needsUpload ? (
              <>
                <Button size="sm" variant="secondary" onClick={download}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <a href={blobUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open tab
                  </Button>
                </a>
              </>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              {needsUpload ? 'Upload file' : 'Replace file'}
            </Button>
            <Button size="sm" variant="danger" onClick={() => removeAndBack(detailId)}>
              Delete
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                void onPickFile(e.target.files?.[0] || null);
                e.target.value = '';
              }}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <FileText className="h-4 w-4 text-ink-muted" />
              <p className="text-sm font-medium text-ink">Preview</p>
            </div>

            <div className="min-h-[420px] bg-bg-muted/30">
              {loadingFile || attachFile.isPending ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-2 text-ink-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm">{attachFile.isPending ? 'Uploading file…' : 'Loading file…'}</p>
                </div>
              ) : needsUpload ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <Upload className="h-10 w-10 text-ink-muted" />
                  <div>
                    <p className="text-sm font-medium text-ink">No file stored for this document</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      This record was saved without the actual PDF/file bytes. Upload the file to view it here.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    loading={attachFile.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {label}
                  </Button>
                </div>
              ) : showImage && blobUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blobUrl}
                  alt={label}
                  className="mx-auto max-h-[75vh] w-auto max-w-full object-contain p-4"
                />
              ) : showPdf && blobUrl ? (
                <iframe
                  title={label}
                  src={blobUrl}
                  className="h-[75vh] w-full border-0 bg-white"
                />
              ) : showText && textPreview != null ? (
                <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-sm text-ink">
                  {textPreview}
                </pre>
              ) : isPlainTextDoc ? (
                <div className="prose prose-sm max-w-none p-6 text-ink">
                  <p className="whitespace-pre-wrap leading-relaxed">{String(data.content)}</p>
                </div>
              ) : blobUrl ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
                  <FileText className="h-10 w-10 text-ink-muted" />
                  <p className="text-sm text-ink-muted">
                    Preview isn’t available for this file type. Download or open it in a new tab.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={download}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <a href={blobUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open tab
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm text-ink-muted">No file content attached to this document.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Details</p>
            <Row label="Owner" value={String(data.owner || data.created_by_name || '—')} />
            <Row label="Type" value={String(data.type || '—')} />
            <Row label="Folder" value={String(data.folder || '—')} />
            <Row
              label="Size"
              value={data.file_size ? formatBytes(Number(data.file_size)) : '—'}
            />
            <Row label="Version" value={String(data.version ?? 1)} />
            <Row
              label="Created"
              value={data.createdAt ? formatDate(String(data.createdAt)) : '—'}
            />
            <Row
              label="Updated"
              value={data.updatedAt ? formatDate(String(data.updatedAt)) : '—'}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[60%] break-words text-right font-medium text-ink">{value}</span>
    </div>
  );
}
