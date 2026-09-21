'use client';

import { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Tabs, TabList, Tab, TabPanel } from '@/components/UI/Tabs';
import {
  PenTool,
  Palette,
  Code2,
  Bot,
  Settings,
  ExternalLink,
  CheckCircle,
  Copy,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FigmaIntegrationPage() {
  const [figmaToken, setFigmaToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    if (!figmaToken.trim()) {
      toast.error('Please enter your Figma access token');
      return;
    }
    // In production, this would validate the token with Figma API
    setIsConnected(true);
    toast.success('Figma connected successfully!');
  };

  const copyMcpConfig = () => {
    const config = JSON.stringify({
      mcpServers: {
        figma: {
          command: 'npx',
          args: ['-y', 'figma-developer-mcp', `--figma-api-key=${figmaToken || 'YOUR_TOKEN'}`],
        },
      },
    }, null, 2);
    navigator.clipboard.writeText(config);
    toast.success('MCP config copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Figma Integration</h1>
          <p className="text-ink-muted mt-2">
            Connect Figma designs to your workflow with MCP server for AI-powered design-to-code
          </p>
        </div>
        <a
          href="https://www.figma.com/mcp-catalog/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-ink hover:bg-bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Figma MCP Docs
        </a>
      </div>

      {/* Connection Status */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isConnected ? 'bg-success/10' : 'bg-bg-muted'}`}>
            <PenTool className={`h-6 w-6 ${isConnected ? 'text-success' : 'text-ink-muted'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink">Figma Connection</h3>
            <p className="text-sm text-ink-muted mt-1">
              {isConnected
                ? 'Your Figma account is connected. You can now use design context in AI workflows.'
                : 'Enter your Figma personal access token to enable design-to-code features.'}
            </p>
            {!isConnected && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Input
                  label="Figma Access Token"
                  type="password"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
                  className="flex-1"
                />
                <Button onClick={handleConnect} className="mt-auto">
                  Connect
                </Button>
              </div>
            )}
            {isConnected && (
              <div className="mt-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Connected</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConnected(false)}
                  className="ml-auto"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="mcp">
        <TabList aria-label="Figma integration sections">
          <Tab value="mcp">MCP Server</Tab>
          <Tab value="workflows">Workflows</Tab>
          <Tab value="ai">AI Assistant</Tab>
        </TabList>

        <TabPanel value="mcp">
          <div className="space-y-6">
            {/* MCP Configuration */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold text-ink">MCP Server Configuration</h3>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                Configure the Figma MCP server to connect your AI coding agents (Claude Code, Cursor, Codex, VS Code) to Figma designs.
              </p>

              <div className="bg-bg-muted rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ink-muted">mcp_config.json</span>
                  <Button variant="outline" size="sm" onClick={copyMcpConfig}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="text-ink overflow-x-auto">
{`{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": [
        "-y",
        "figma-developer-mcp",
        "--figma-api-key=\${YOUR_TOKEN}"
      ]
    }
  }
}`}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-info/10 border border-info/20 rounded-lg">
                <p className="text-sm text-info">
                  <strong>Remote Server (Recommended):</strong> For production use, consider the remote MCP server hosted by Figma. See the{' '}
                  <a href="https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/" target="_blank" rel="noopener noreferrer" className="underline">
                    Figma Developer Docs
                  </a>{' '}
                  for setup instructions.
                </p>
              </div>
            </Card>

            {/* Quick Setup Guides */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink mb-4">Quick Setup by Tool</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Claude Code', icon: Bot, color: 'text-brand' },
                  { name: 'Cursor', icon: Code2, color: 'text-success' },
                  { name: 'VS Code', icon: Layers, color: 'text-info' },
                  { name: 'Codex', icon: Sparkles, color: 'text-warning' },
                ].map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3 p-4 bg-bg-muted rounded-lg">
                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                    <div>
                      <p className="text-sm font-medium text-ink">{tool.name}</p>
                      <p className="text-xs text-ink-muted">Install Figma MCP plugin</p>
                    </div>
                    <a
                      href={`https://help.figma.com/hc/en-us/articles/39888612464151`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-ink-muted hover:text-brand"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="workflows">
          <div className="space-y-6">
            {/* Design-to-Code Workflows */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink mb-4">Design-to-Code Workflows</h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Component Generation',
                    description: 'Generate React/Vue components directly from Figma components',
                    steps: ['Select component in Figma', 'Share URL with AI agent', 'AI reads design tokens and generates code'],
                    icon: Palette,
                  },
                  {
                    title: 'Page Layout Generation',
                    description: 'Convert entire Figma pages to responsive layouts',
                    steps: ['Design page in Figma', 'Provide page URL to AI', 'AI generates HTML/CSS/JS with proper spacing and typography'],
                    icon: Layers,
                  },
                  {
                    title: 'Design System Sync',
                    description: 'Keep your code design system in sync with Figma',
                    steps: ['Update design system in Figma', 'AI detects changes', 'Updates code components and tokens'],
                    icon: RefreshCw,
                  },
                ].map((workflow) => (
                  <div key={workflow.title} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-brand/10 rounded-lg">
                        <workflow.icon className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-ink">{workflow.title}</h4>
                        <p className="text-xs text-ink-muted">{workflow.description}</p>
                      </div>
                    </div>
                    <ol className="ml-12 space-y-1">
                      {workflow.steps.map((step, i) => (
                        <li key={i} className="text-sm text-ink-secondary flex items-center gap-2">
                          <span className="text-ink-muted">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value="ai">
          <div className="space-y-6">
            {/* AI Assistant with Figma */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="h-5 w-5 text-brand" />
                <h3 className="text-lg font-semibold text-ink">AI Assistant + Figma</h3>
              </div>
              <p className="text-sm text-ink-muted mb-4">
                The AI assistant can now read Figma designs and generate code. Use natural language to describe what you want, and the AI will use Figma context to generate accurate implementations.
              </p>

              <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-ink">Example Prompts:</h4>
                <div className="space-y-2">
                  {[
                    '"Generate a React component from this Figma design: [paste Figma URL]"',
                    '"Convert this Figma page layout to responsive HTML/CSS"',
                    '"Create a design system token file from the Figma design tokens"',
                    '"Update the Button component to match the new Figma variant"',
                    '"Generate accessibility attributes for this Figma form design"',
                  ].map((prompt, i) => (
                    <div key={i} className="text-sm text-ink-secondary bg-surface p-2 rounded border border-border">
                      {prompt}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={() => window.location.href = '/ui-ux-designer/ai'}>
                  Open AI Assistant
                </Button>
              </div>
            </Card>

            {/* Capabilities */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink mb-4">AI Capabilities with Figma MCP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Design Token Extraction', description: 'Automatically extract colors, typography, spacing from Figma' },
                  { title: 'Component Props Mapping', description: 'Map Figma component properties to code props' },
                  { title: 'Responsive Breakpoints', description: 'Generate responsive layouts based on Figma auto-layout' },
                  { title: 'Animation & Interaction', description: 'Convert Figma prototypes to code animations' },
                  { title: 'Accessibility Annotations', description: 'Generate ARIA labels from Figma accessibility annotations' },
                  { title: 'Design QA', description: 'Compare code output against Figma designs for accuracy' },
                ].map((capability) => (
                  <div key={capability.title} className="p-3 bg-bg-muted rounded-lg">
                    <p className="text-sm font-medium text-ink">{capability.title}</p>
                    <p className="text-xs text-ink-muted mt-1">{capability.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
