import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface FigmaDesignTokens {
  colors: DesignToken[];
  typography: DesignToken[];
  spacing: DesignToken[];
  shadows: DesignToken[];
  borders: DesignToken[];
  raw: Record<string, any>;
}

export interface DesignToken {
  name: string;
  value: string | number;
  type: string;
  description?: string;
}

export interface FigmaFile {
  key: string;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: any;
  components: Record<string, any>;
  styles: Record<string, any>;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  style?: any;
  characters?: string;
  children?: FigmaNode[];
}

@Injectable()
export class FigmaService {
  private readonly logger = new Logger(FigmaService.name);
  private apiToken: string | null = null;
  private webhookSecret: string | null = null;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('FIGMA_API_KEY') || null;
    this.webhookSecret = this.configService.get<string>('FIGMA_WEBHOOK_SECRET') || null;
  }

  isConfigured(): boolean {
    return this.apiToken !== null;
  }

  /**
   * Make authenticated Figma API request
   */
  private async figmaApiRequest(path: string): Promise<any> {
    if (!this.apiToken) {
      throw new BadRequestException('Figma API not configured');
    }

    const response = await fetch(`https://api.figma.com/v1${path}`, {
      headers: {
        'X-Figma-Token': this.apiToken,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Figma API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get Figma file by key
   */
  async getFile(fileKey: string, nodeIds?: string[]): Promise<FigmaFile> {
    const nodeParam = nodeIds ? `&ids=${nodeIds.join(',')}` : '';
    const result = await this.figmaApiRequest(`/files/${fileKey}?depth=2${nodeParam}`);

    return {
      key: result.key,
      name: result.name,
      lastModified: result.lastModified,
      thumbnailUrl: result.thumbnailUrl,
      version: result.version,
      document: result.document,
      components: result.components || {},
      styles: result.styles || {},
    };
  }

  /**
   * Get specific nodes from a Figma file
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNode[]> {
    const result = await this.figmaApiRequest(
      `/files/${fileKey}/nodes?ids=${nodeIds.join(',')}`,
    );

    const nodes: FigmaNode[] = [];
    for (const nodeId of nodeIds) {
      const nodeData = result.nodes[nodeId];
      if (nodeData?.document) {
        nodes.push(this.mapFigmaNode(nodeData.document));
      }
    }

    return nodes;
  }

  /**
   * Map Figma API node to our interface
   */
  private mapFigmaNode(node: any): FigmaNode {
    return {
      id: node.id,
      name: node.name,
      type: node.type,
      fills: node.fills,
      strokes: node.strokes,
      effects: node.effects,
      style: node.style,
      characters: node.characters,
      children: node.children?.map((child: any) => this.mapFigmaNode(child)),
    };
  }

  /**
   * Extract design tokens from a Figma file
   */
  async extractDesignTokens(fileKey: string): Promise<FigmaDesignTokens> {
    const file = await this.getFile(fileKey);

    const tokens: FigmaDesignTokens = {
      colors: [],
      typography: [],
      spacing: [],
      shadows: [],
      borders: [],
      raw: {},
    };

    // Extract from styles
    if (file.styles) {
      for (const [styleId, style] of Object.entries(file.styles)) {
        const styleData = style as any;
        if (styleData.style_type === 'FILL') {
          tokens.colors.push({
            name: styleData.name,
            value: styleData.description || 'complex',
            type: 'color',
            description: styleData.description,
          });
        } else if (styleData.style_type === 'TEXT') {
          tokens.typography.push({
            name: styleData.name,
            value: styleData.description || 'complex',
            type: 'typography',
            description: styleData.description,
          });
        } else if (styleData.style_type === 'EFFECT') {
          tokens.shadows.push({
            name: styleData.name,
            value: styleData.description || 'complex',
            type: 'effect',
            description: styleData.description,
          });
        }
      }
    }

    // Extract from document nodes
    if (file.document?.children) {
      this.extractTokensFromNodes(file.document.children, tokens);
    }

    return tokens;
  }

  /**
   * Recursively extract tokens from Figma nodes
   */
  private extractTokensFromNodes(nodes: any[], tokens: FigmaDesignTokens): void {
    for (const node of nodes) {
      // Extract colors from fills
      if (node.fills && Array.isArray(node.fills)) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            const { r, g, b, a } = fill.color;
            const hex = this.rgbaToHex(r, g, b, a);
            tokens.colors.push({
              name: node.name,
              value: hex,
              type: 'color',
            });
          }
        }
      }

      // Extract typography from text nodes
      if (node.type === 'TEXT' && node.style) {
        tokens.typography.push({
          name: node.name,
          value: `${node.style.fontFamily} ${node.style.fontSize}px ${node.style.fontWeight}`,
          type: 'typography',
        });
      }

      // Extract spacing from auto-layout
      if (node.layoutMode) {
        tokens.spacing.push({
          name: node.name,
          value: `${node.layoutMode} gap:${node.itemSpacing}px padding:${node.paddingLeft}px`,
          type: 'spacing',
        });
      }

      // Extract shadows from effects
      if (node.effects && Array.isArray(node.effects)) {
        for (const effect of node.effects) {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            tokens.shadows.push({
              name: node.name,
              value: effect,
              type: 'shadow',
            });
          }
        }
      }

      // Recurse into children
      if (node.children) {
        this.extractTokensFromNodes(node.children, tokens);
      }
    }
  }

  /**
   * Convert RGBA (0-1 range) to hex
   */
  private rgbaToHex(r: number, g: number, b: number, a?: number): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    if (a !== undefined && a < 1) {
      return `${hex}${toHex(a)}`;
    }
    return hex;
  }

  /**
   * Get component metadata from Figma file
   */
  async getComponents(fileKey: string): Promise<Record<string, any>> {
    const file = await this.getFile(fileKey);
    return file.components;
  }

  /**
   * Get images from Figma file
   */
  async getImages(fileKey: string, nodeIds: string[], format: 'png' | 'svg' | 'jpg' = 'png'): Promise<Record<string, string>> {
    const result = await this.figmaApiRequest(
      `/images/${fileKey}?ids=${nodeIds.join(',')}&format=${format}`,
    );

    return result.images || {};
  }

  /**
   * Verify Figma webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      this.logger.warn('Figma webhook secret not configured');
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    const digest = hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  /**
   * Process Figma webhook event
   */
  async processWebhookEvent(event: any): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Processing Figma webhook event: ${event.event_type}`);

    switch (event.event_type) {
      case 'FILE_UPDATE':
        await this.handleFileUpdate(event);
        break;
      case 'FILE_VERSION_UPDATE':
        await this.handleFileVersionUpdate(event);
        break;
      case 'FILE_DELETE':
        await this.handleFileDelete(event);
        break;
      case 'LIBRARY_PUBLISH':
        await this.handleLibraryPublish(event);
        break;
      default:
        this.logger.log(`Unhandled Figma event type: ${event.event_type}`);
    }

    return { success: true, message: `Processed ${event.event_type}` };
  }

  private async handleFileUpdate(event: any): Promise<void> {
    this.logger.log(`File updated: ${event.file_key}`);
    // In production, trigger design token sync, notify designers, etc.
  }

  private async handleFileVersionUpdate(event: any): Promise<void> {
    this.logger.log(`File version updated: ${event.file_key}`);
    // In production, create snapshot, update version history
  }

  private async handleFileDelete(event: any): Promise<void> {
    this.logger.log(`File deleted: ${event.file_key}`);
    // In production, cleanup cached data, notify team
  }

  private async handleLibraryPublish(event: any): Promise<void> {
    this.logger.log(`Library published: ${event.file_key}`);
    // In production, sync design system, update component library
  }

  /**
   * Generate CSS from design tokens
   */
  generateCssFromTokens(tokens: FigmaDesignTokens): string {
    let css = ':root {\n';

    // Colors
    for (const color of tokens.colors) {
      const varName = `--${color.name.toLowerCase().replace(/\s+/g, '-')}`;
      css += `  ${varName}: ${color.value};\n`;
    }

    // Typography
    for (const typo of tokens.typography) {
      const varName = `--${typo.name.toLowerCase().replace(/\s+/g, '-')}`;
      css += `  ${varName}: ${typo.value};\n`;
    }

    // Spacing
    for (const space of tokens.spacing) {
      const varName = `--${space.name.toLowerCase().replace(/\s+/g, '-')}`;
      css += `  ${varName}: ${space.value}px;\n`;
    }

    css += '}\n';
    return css;
  }

  /**
   * Generate Tailwind config from design tokens
   */
  generateTailwindConfig(tokens: FigmaDesignTokens): Record<string, any> {
    const colors: Record<string, string> = {};
    for (const color of tokens.colors) {
      const key = color.name.toLowerCase().replace(/\s+/g, '-');
      colors[key] = color.value as string;
    }

    const fontSize: Record<string, string> = {};
    for (const typo of tokens.typography) {
      const key = typo.name.toLowerCase().replace(/\s+/g, '-');
      fontSize[key] = typo.value as string;
    }

    return {
      theme: {
        extend: {
          colors,
          fontSize,
        },
      },
    };
  }
}
