'use client';

import { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { useFigma, extractFigmaFileKey, extractFigmaNodeId } from '@/hooks/useFigma';
import {
  Palette,
  Type,
  Box,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Link,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FigmaContextPanelProps {
  onContextReady: (context: string) => void;
}

export function FigmaContextPanel({ onContextReady }: FigmaContextPanelProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [context, setContext] = useState<any>(null);
  const { loading, error, getFigmaContext, getDesignTokens } = useFigma();

  const handleLoadContext = async () => {
    const fileKey = extractFigmaFileKey(figmaUrl);
    if (!fileKey) {
      toast.error('Invalid Figma URL. Please paste a valid Figma file link.');
      return;
    }

    const nodeId = extractFigmaNodeId(figmaUrl);

    try {
      const ctx = await getFigmaContext(fileKey, nodeId || undefined);
      setContext(ctx);
      toast.success('Figma context loaded!');

      // Build context string for AI
      const contextStr = buildContextString(ctx);
      onContextReady(contextStr);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Figma context');
    }
  };

  const handleExtractTokens = async () => {
    const fileKey = extractFigmaFileKey(figmaUrl);
    if (!fileKey) {
      toast.error('Invalid Figma URL');
      return;
    }

    try {
      const tokens = await getDesignTokens(fileKey);
      const css = generateCssVariables(tokens);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(css);
      toast.success('CSS variables copied to clipboard!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract tokens');
    }
  };

  if (error) {
    return (
      <Card className="p-4 border-danger/20">
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-semibold text-ink">Figma Context</h3>
      </div>

      <div className="flex gap-2">
        <Input
          value={figmaUrl}
          onChange={(e) => setFigmaUrl(e.target.value)}
          placeholder="Paste Figma file URL..."
          className="flex-1"
        />
        <Button
          onClick={handleLoadContext}
          loading={loading}
          size="sm"
        >
          Load
        </Button>
      </div>

      {context && (
        <div className="space-y-3">
          <div className="p-3 bg-bg-muted rounded-lg">
            <p className="text-xs font-medium text-ink-muted mb-1">File</p>
            <p className="text-sm text-ink">{context.file.name}</p>
            <p className="text-xs text-ink-muted mt-1">
              Last modified: {new Date(context.file.lastModified).toLocaleDateString()}
            </p>
          </div>

          {context.node && (
            <div className="p-3 bg-bg-muted rounded-lg">
              <p className="text-xs font-medium text-ink-muted mb-1">Selected Element</p>
              <p className="text-sm text-ink">{context.node.name}</p>
              <p className="text-xs text-ink-muted">{context.node.type}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-bg-muted rounded text-center">
              <p className="text-lg font-semibold text-ink">{context.componentsCount}</p>
              <p className="text-xs text-ink-muted">Components</p>
            </div>
            <div className="p-2 bg-bg-muted rounded text-center">
              <p className="text-lg font-semibold text-ink">{context.stylesCount}</p>
              <p className="text-xs text-ink-muted">Styles</p>
            </div>
          </div>

          {context.designTokens.colors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-ink-muted mb-2">Colors</p>
              <div className="flex flex-wrap gap-1">
                {context.designTokens.colors.slice(0, 8).map((color: any, i: number) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: color.value }}
                    title={`${color.name}: ${color.value}`}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExtractTokens}
              className="flex-1"
            >
              <Palette className="h-3 w-3 mr-1" />
              Extract CSS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadContext}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {!context && !loading && (
        <p className="text-xs text-ink-muted text-center py-4">
          Paste a Figma URL to load design context for the AI assistant.
          The AI will use this context to generate accurate code from your designs.
        </p>
      )}
    </Card>
  );
}

function buildContextString(context: any): string {
  const lines = [
    '# Figma Design Context',
    '',
    `File: ${context.file.name}`,
    `Last Modified: ${context.file.lastModified}`,
    '',
  ];

  if (context.node) {
    lines.push('## Selected Element');
    lines.push(`Name: ${context.node.name}`);
    lines.push(`Type: ${context.node.type}`);
    lines.push('');
  }

  if (context.designTokens.colors.length > 0) {
    lines.push('## Available Colors');
    for (const color of context.designTokens.colors) {
      lines.push(`- ${color.name}: ${color.value}`);
    }
    lines.push('');
  }

  if (context.designTokens.typography.length > 0) {
    lines.push('## Typography');
    for (const typo of context.designTokens.typography) {
      lines.push(`- ${typo.name}: ${typo.value}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateCssVariables(tokens: any): string {
  let css = ':root {\n';

  // Colors
  for (const color of tokens.colors || []) {
    const varName = `--${color.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    css += `  ${varName}: ${color.value};\n`;
  }

  // Typography
  for (const typo of tokens.typography || []) {
    const varName = `--${typo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    css += `  ${varName}: ${typo.value};\n`;
  }

  css += '}\n';
  return css;
}
