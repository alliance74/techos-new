'use client';

import { useState, useCallback } from 'react';

interface FigmaContext {
  file: {
    name: string;
    lastModified: string;
    version: string;
  };
  node: {
    id: string;
    name: string;
    type: string;
  } | null;
  designTokens: {
    colors: Array<{ name: string; value: string; type: string }>;
    typography: Array<{ name: string; value: string; type: string }>;
    spacing: Array<{ name: string; value: any; type: string }>;
  };
  componentsCount: number;
  stylesCount: number;
}

interface DesignTokens {
  colors: Array<{ name: string; value: string; type: string }>;
  typography: Array<{ name: string; value: string; type: string }>;
  spacing: Array<{ name: string; value: any; type: string }>;
  shadows: Array<{ name: string; value: any; type: string }>;
  borders: Array<{ name: string; value: any; type: string }>;
}

export function useFigma() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFile = useCallback(async (fileKey: string, nodeIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const nodeParam = nodeIds ? `?nodes=${nodeIds.join(',')}` : '';
      const res = await fetch(`/api/figma/file/${fileKey}${nodeParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch Figma file');
      const result = await res.json();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDesignTokens = useCallback(async (fileKey: string, format?: 'json' | 'css' | 'tailwind') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const formatParam = format ? `?format=${format}` : '';
      const res = await fetch(`/api/figma/file/${fileKey}/tokens${formatParam}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to extract design tokens');
      const result = await res.json();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFigmaContext = useCallback(async (fileKey: string, nodeId?: string, prompt?: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/figma/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fileKey, nodeId, prompt }),
      });
      if (!res.ok) throw new Error('Failed to get Figma context');
      const result = await res.json();
      return result.data as FigmaContext;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getComponents = useCallback(async (fileKey: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/figma/file/${fileKey}/components`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch components');
      const result = await res.json();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getImages = useCallback(async (fileKey: string, nodeIds: string[], format: 'png' | 'svg' | 'jpg' = 'png') => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/figma/file/${fileKey}/images?ids=${nodeIds.join(',')}&format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to fetch images');
      const result = await res.json();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getFile,
    getDesignTokens,
    getFigmaContext,
    getComponents,
    getImages,
  };
}

export function extractFigmaFileKey(url: string): string | null {
  // Support URLs like:
  // https://www.figma.com/file/ABC123/Design-Name
  // https://www.figma.com/design/ABC123/Design-Name
  const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function extractFigmaNodeId(url: string): string | null {
  // Support URLs with node-id parameter
  // https://www.figma.com/file/ABC123/Design-Name?node-id=1-2
  const match = url.match(/node-id=([0-9]+-[0-9]+)/);
  if (match) {
    return match[1].replace('-', ':');
  }
  return null;
}
