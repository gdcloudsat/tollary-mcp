import { McpTool, RegisteredMcpServer, CallToolResult } from './types';

export class McpServerRegistry {
  private servers: Map<string, RegisteredMcpServer> = new Map();

  constructor() {
    this.seedDefaultServers();
  }

  public getServer(serverId: string): RegisteredMcpServer | undefined {
    return this.servers.get(serverId);
  }

  public getAllServers(): RegisteredMcpServer[] {
    return Array.from(this.servers.values());
  }

  public registerServer(server: RegisteredMcpServer): void {
    this.servers.set(server.id, server);
  }

  private seedDefaultServers(): void {
    // 1. Acme FinTech MCP Server
    const fintechTools = new Map<string, McpTool>();
    
    fintechTools.set('gst_validator_pro', {
      name: 'gst_validator_pro',
      description: 'Validates 15-digit Indian GSTIN identification numbers, checks active registration status against GSTN servers, and produces compliant e-invoice JSON.',
      inputSchema: {
        type: 'object',
        properties: {
          gstin: {
            type: 'string',
            description: '15-character Goods and Services Tax Identification Number (e.g. 27AABCU9603R1ZM)',
            pattern: '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$',
          },
          includeFilings: {
            type: 'boolean',
            description: 'Whether to attach filing compliance history for the last 12 months',
            default: false,
          },
        },
        required: ['gstin'],
      },
      pricing: {
        model: 'fixed_per_call',
        unitPriceUsd: 0.02,
        currency: 'USDC',
      },
    });

    fintechTools.set('currency_fx_rates', {
      name: 'currency_fx_rates',
      description: 'Fetches real-time institutional foreign exchange rates across major fiat currency pairs and stablecoins.',
      inputSchema: {
        type: 'object',
        properties: {
          baseCurrency: { type: 'string', description: '3-letter base currency (e.g. USD, EUR, INR)', default: 'USD' },
          targetCurrencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of target currency codes (e.g. ["EUR", "GBP", "JPY", "INR"])',
          },
        },
      },
      pricing: {
        model: 'free',
        unitPriceUsd: 0.0,
        currency: 'USDC',
      },
    });

    this.registerServer({
      id: 'srv_fintech_mcp',
      name: 'Acme FinTech Server',
      provider: {
        id: 'prov_acme',
        name: 'Acme FinTech Systems',
        verified: true,
      },
      transportType: 'streamable_http',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true },
        prompts: { listChanged: true },
      },
      tools: fintechTools,
      executeTool: async (toolName: string, args: Record<string, any>): Promise<CallToolResult> => {
        if (toolName === 'gst_validator_pro') {
          const gstin = String(args.gstin || '').toUpperCase();
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          
          if (!gstRegex.test(gstin)) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    valid: false,
                    error: `Invalid GSTIN checksum format: ${gstin}. Expected 15 alphanumeric characters.`,
                  }, null, 2),
                },
              ],
              isError: true,
            };
          }

          const stateCode = gstin.substring(0, 2);
          const pan = gstin.substring(2, 12);
          const stateMap: Record<string, string> = {
            '27': 'Maharashtra',
            '29': 'Karnataka',
            '07': 'Delhi',
            '33': 'Tamil Nadu',
            '06': 'Haryana',
            '24': 'Gujarat',
            '19': 'West Bengal',
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  valid: true,
                  gstin,
                  legalName: 'Acme Cloud Solutions Private Limited',
                  tradeName: 'Acme FinTech Services',
                  status: 'Active',
                  registrationDate: '2018-07-01',
                  pan,
                  stateJurisdiction: stateMap[stateCode] || 'State Code ' + stateCode,
                  taxpayerType: 'Regular',
                  eInvoiceEnabled: true,
                  filingComplianceScore: '99.2%',
                }, null, 2),
              },
            ],
            isError: false,
            _meta: {
              cached: false,
              source: 'GSTN Live Gateway v2',
              latencyMs: 78,
            },
          };
        }

        if (toolName === 'currency_fx_rates') {
          const base = (args.baseCurrency || 'USD').toUpperCase();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  base,
                  timestamp: new Date().toISOString(),
                  rates: {
                    EUR: 0.92,
                    GBP: 0.79,
                    INR: 84.15,
                    JPY: 154.20,
                    USDC: 1.0001,
                  },
                }, null, 2),
              },
            ],
            isError: false,
          };
        }

        throw new Error(`Tool '${toolName}' not found on server.`);
      },
    });

    // 2. DataForge Web Scraper MCP Server
    const scraperTools = new Map<string, McpTool>();
    scraperTools.set('extract_article_ai', {
      name: 'extract_article_ai',
      description: 'Crawls any arbitrary web URL, strips navigational ads, cookie banners, and boilerplate, and outputs clean structured markdown.',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Target website URL to extract' },
          extractImages: { type: 'boolean', default: false },
        },
        required: ['url'],
      },
      pricing: {
        model: 'fixed_per_call',
        unitPriceUsd: 0.002,
        currency: 'USDC',
      },
    });

    this.registerServer({
      id: 'srv_web_scraper',
      name: 'DataForge Article Extractor',
      provider: {
        id: 'prov_dataforge',
        name: 'DataForge Labs',
        verified: true,
      },
      transportType: 'streamable_http',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
      },
      tools: scraperTools,
      executeTool: async (toolName: string, args: Record<string, any>): Promise<CallToolResult> => {
        if (toolName === 'extract_article_ai') {
          const url = String(args.url || 'https://example.com');
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  sourceUrl: url,
                  title: 'Autonomous Multi-Agent Architecture for Modern Enterprise Infrastructure',
                  author: 'Engineering Research Group',
                  wordCount: 1420,
                  readingTimeMinutes: 5,
                  markdown: '# Autonomous Multi-Agent Architecture\n\nModern agentic workflows require decentralized micro-settlement and standardized protocol boundaries (MCP).\n\n## 1. Protocol Harmonization\nModel Context Protocol standardizes tools and prompts...',
                }, null, 2),
              },
            ],
            isError: false,
            _meta: { wordCount: 1420 },
          };
        }
        throw new Error(`Tool '${toolName}' not found.`);
      },
    });

    // 3. OmniIntelligence Deep Research Server
    const researchTools = new Map<string, McpTool>();
    researchTools.set('deep_research_v2', {
      name: 'deep_research_v2',
      description: 'Executes recursive multi-hop synthesis across scholarly literature, patent databases, and news archives.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Research query or hypothesis' },
          depth: { type: 'string', enum: ['standard', 'comprehensive', 'academic'], default: 'comprehensive' },
        },
        required: ['query'],
      },
      pricing: {
        model: 'fixed_per_call',
        unitPriceUsd: 0.05,
        currency: 'USDC',
      },
    });

    this.registerServer({
      id: 'srv_research_ai',
      name: 'OmniIntelligence Deep Research',
      provider: {
        id: 'prov_omni',
        name: 'OmniIntelligence Inc.',
        verified: true,
      },
      transportType: 'streamable_http',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
      },
      tools: researchTools,
      executeTool: async (toolName: string, args: Record<string, any>): Promise<CallToolResult> => {
        if (toolName === 'deep_research_v2') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  query: args.query,
                  depth: args.depth || 'comprehensive',
                  executiveSummary: 'Synthesis across 42 verified academic sources shows accelerating transition toward decentralized x402 payment facilitation and MCP agent gateways.',
                  citationsCount: 18,
                  confidenceScore: 0.96,
                }, null, 2),
              },
            ],
            isError: false,
          };
        }
        throw new Error(`Tool '${toolName}' not found.`);
      },
    });

    // 4. Tollary System Meta-MCP Server (In-Band Agent Tool Discovery)
    const systemTools = new Map<string, McpTool>();
    systemTools.set('tollary_discover_tools', {
      name: 'tollary_discover_tools',
      description: 'Discovers available MCP tools and REST APIs matching natural language queries, price limits, and capability tags without leaving the MCP session.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language capability query (e.g. "invoice", "article crawler", "research")' },
          protocol: { type: 'string', enum: ['mcp', 'rest', 'all'], default: 'all' },
          maxPriceUsd: { type: 'number', description: 'Maximum budget per invocation in USD' },
          category: { type: 'string', description: 'Filter by category (e.g. "Financial & Tax", "Web & Scraping")' },
        },
      },
      pricing: {
        model: 'free',
        unitPriceUsd: 0.0,
        currency: 'USDC',
      },
    });

    this.registerServer({
      id: 'srv_tollary_system',
      name: 'Tollary Global Discovery Registry',
      provider: {
        id: 'prov_tollary',
        name: 'Tollary Infrastructure Platform',
        verified: true,
      },
      transportType: 'streamable_http',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
      },
      tools: systemTools,
      executeTool: async (toolName: string, args: Record<string, any>): Promise<CallToolResult> => {
        if (toolName === 'tollary_discover_tools') {
          // Dynamic import of discoveryEngine to avoid circular dependency
          const { discoveryEngine } = await import('../discovery/engine');
          const results = discoveryEngine.search({
            query: args.query,
            protocol: args.protocol || 'all',
            maxPriceUsd: args.maxPriceUsd,
            category: args.category,
            limit: 10,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
            isError: false,
          };
        }
        throw new Error(`System tool '${toolName}' not found.`);
      },
    });
  }
}

export const mcpRegistry = new McpServerRegistry();
