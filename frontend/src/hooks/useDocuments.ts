import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Document, Folder, DocumentVersion } from '@/types/document';
import toast from 'react-hot-toast';

// Documents
export function useDocuments(folderId?: string) {
  return useQuery({
    queryKey: ['documents', folderId || 'all'],
    queryFn: async () => {
      const response = await api.get('/documents', {
        params: folderId ? { folder: folderId, folder_id: folderId } : undefined,
      });
      return response.data.data as Document[];
    },
  });
}

export function useRelatedDocuments(entityKey?: string, recordId?: string) {
  const folder =
    entityKey && recordId ? `related/${entityKey}/${recordId}` : undefined;
  return useQuery({
    queryKey: ['documents', 'related', entityKey, recordId],
    queryFn: async () => {
      const response = await api.get('/documents', {
        params: { folder },
      });
      return (response.data.data || []) as Document[];
    },
    enabled: Boolean(folder),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data.data as Document;
    },
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'documents'] });
      toast.success('Document uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    },
  });
}

/** Attach a real file to an existing document (fixes metadata-only / missing blobs). */
export function useAttachDocumentFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/documents/${id}/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data || response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['entity', 'documents', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['documents', vars.id] });
      toast.success('File attached');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to attach file');
    },
  });
}

/** Fetch document bytes with auth for in-app preview / download. */
export async function fetchDocumentBlob(id: string) {
  const response = await api.get(`/documents/${id}/file`, {
    responseType: 'blob',
    maxRedirects: 5,
  });
  const mime =
    (response.headers['content-type'] as string | undefined)?.split(';')[0]?.trim() ||
    response.data?.type ||
    'application/octet-stream';
  const blob =
    response.data instanceof Blob
      ? response.data.type
        ? response.data
        : new Blob([response.data], { type: mime })
      : new Blob([response.data], { type: mime });
  return { blob, mime: blob.type || mime };
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/documents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    },
  });
}

// Folders
export function useFolders() {
  return useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await api.get('/documents/folders');
      return response.data.data as Folder[];
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; parent_folder_id?: string }) => {
      const response = await api.post('/documents/folders', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create folder');
    },
  });
}

// Versions
export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['documents', documentId, 'versions'],
    queryFn: async () => {
      const response = await api.get(`/documents/${documentId}/versions`);
      return response.data.data as DocumentVersion[];
    },
    enabled: !!documentId,
  });
}
