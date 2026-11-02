import crypto from 'crypto';
import { ProviderEntity, PricingRuleEntity, UsageMetricRecord, McpServerRegistrationInput } from './types';
import { mcpRegistry } from '../mcp/registry';
import { McpTool, RegisteredMcpServer } from '../mcp/types';

export class ControlPlaneStore {
  private providers: Map<string, ProviderEntity> = new Map();
  private pricingRules: Map<string, PricingRuleEntity> = new Map();
  private usageEvents: UsageMetricRecord[] = [];

  constructor() {
    this.seedDefaults();
  }

  // --- PROVIDERS ---
  public getProviders(): ProviderEntity[] {
    return Array.from(this.providers.values());
  }

  public getProviderById(id: string): ProviderEntity | undefined {
    return this.providers.get(id);
  }

  public createProvider(data: {
    name: string;
    legalEntityName: string;
    contactEmail: string;
    payoutAddress: string;
  }): ProviderEntity {
    const id = `prov_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 16)}_${crypto.randomBytes(2).toString('hex')}`;
    const provider: ProviderEntity = {
      id,
      name: data.name,
      legalEntityName: data.legalEntityName,
      contactEmail: data.contactEmail,
      payoutAddress: data.payoutAddress,
      verified: true,
      reputationScore: 100.0,
      status: 'active',
      createdAt: new Date().toISOString(),
      serverCount: 0,
      toolCount: 0,
    };

    this.providers.set(id, provider);
    return provider;
  }

  // --- MCP SERVERS ---
  public registerMcpServer(input: McpServerRegistrationInput): RegisteredMcpServer {
    const provider = this.providers.get(input.providerId);
    if (!provider) {
      throw new Error(`Provider '${input.providerId}' not found.`);
    }

    const serverId = `srv_${input.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const toolsMap = new Map<string, McpTool>();

    // If initial tools provided, register them
    if (input.initialTools && Array.isArray(input.initialTools)) {
      for (const t of input.initialTools) {
        const price = t.priceUsd !== undefined ? Number(t.priceUsd) : 0.0;
        toolsMap.set(t.name, {
          name: t.name,
          description: t.description,
          inputSchema: (t.inputSchema as any) || { type: 'object' },
          pricing: {
            model: price > 0 ? 'fixed_per_call' : 'free',
            unitPriceUsd: price,
            currency: 'USDC',
          },
        });

        // Register default pricing rule
        this.setPricingRule({
          serverId,
          toolName: t.name,
          unitPriceUsd: price,
          pricingModel: price > 0 ? 'fixed_per_call' : 'free',
        });
      }
    }

    const server: RegisteredMcpServer = {
      id: serverId,
      name: input.name,
      provider: {
        id: provider.id,
        name: provider.name,
        verified: provider.verified,
      },
      transportType: input.transportType || 'streamable_http',
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: true },
        prompts: { listChanged: true },
      },
      tools: toolsMap,
      executeTool: async (toolName: string, args: Record<string, any>) => {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                server: serverId,
                tool: toolName,
                argumentsReceived: args,
                executedAt: new Date().toISOString(),
              }, null, 2),
            },
          ],
          isError: false,
        };
      },
    };

    // Push into runtime gateway registry
    mcpRegistry.registerServer(server);

    // Update provider counts
    provider.serverCount += 1;
    provider.toolCount += toolsMap.size;

    return server;
  }

  // --- PRICING RULES ---
  public getPricingRules(): PricingRuleEntity[] {
    return Array.from(this.pricingRules.values());
  }

  public setPricingRule(data: {
    serverId: string;
    toolName: string;
    unitPriceUsd: number;
    pricingModel?: 'free' | 'fixed_per_call' | 'tiered';
  }): PricingRuleEntity {
    const id = `rule_${data.serverId}_${data.toolName}`;
    const rule: PricingRuleEntity = {
      id,
      serverId: data.serverId,
      toolName: data.toolName,
      pricingModel: data.pricingModel || (data.unitPriceUsd > 0 ? 'fixed_per_call' : 'free'),
      unitPriceUsd: Math.round(data.unitPriceUsd * 1_000_000) / 1_000_000,
      currency: 'USDC',
      effectiveFrom: new Date().toISOString(),
      status: 'active',
    };

    this.pricingRules.set(id, rule);

    // Sync with mcpRegistry tool pricing if present
    const srv = mcpRegistry.getServer(data.serverId);
    if (srv) {
      const tool = srv.tools.get(data.toolName);
      if (tool) {
        tool.pricing = {
          model: rule.pricingModel,
          unitPriceUsd: rule.unitPriceUsd,
          currency: 'USDC',
        };
      }
    }

    return rule;
  }

  // --- USAGE TELEMETRY ---
  public recordUsage(metric: Omit<UsageMetricRecord, 'id' | 'timestamp'>): UsageMetricRecord {
    const record: UsageMetricRecord = {
      id: `use_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ...metric,
    };
    this.usageEvents.unshift(record);
    if (this.usageEvents.length > 500) {
      this.usageEvents.pop();
    }
    return record;
  }

  public getUsageMetrics(limit: number = 50): UsageMetricRecord[] {
    return this.usageEvents.slice(0, limit);
  }

  public getUsageSummary() {
    let totalRequests = this.usageEvents.length;
    let successfulRequests = 0;
    let totalCostUsd = 0;
    let totalDurationMs = 0;

    for (const u of this.usageEvents) {
      if (u.status === 'success') successfulRequests++;
      totalCostUsd += u.costUsd;
      totalDurationMs += u.durationMs;
    }

    return {
      totalRequests,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      successRate: totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 10000) / 100 : 100,
      avgLatencyMs: totalRequests > 0 ? Math.round(totalDurationMs / totalRequests) : 0,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    };
  }

  private seedDefaults(): void {
    // 1. Acme FinTech Systems
    const p1: ProviderEntity = {
      id: 'prov_acme',
      name: 'Acme FinTech Systems',
      legalEntityName: 'Acme Cloud Solutions Inc.',
      contactEmail: 'api@acmefintech.io',
      payoutAddress: '0x71C80917E251E6476b77b7891c92F8d91024b82',
      verified: true,
      reputationScore: 98.5,
      status: 'active',
      createdAt: '2026-10-15T08:00:00Z',
      serverCount: 1,
      toolCount: 2,
    };
    this.providers.set(p1.id, p1);

    // 2. DataForge Labs
    const p2: ProviderEntity = {
      id: 'prov_dataforge',
      name: 'DataForge Labs',
      legalEntityName: 'DataForge Intelligence LLC',
      contactEmail: 'contact@dataforge.ai',
      payoutAddress: '0x32A4B892c9081E2F1899eA91823901b827C80112',
      verified: true,
      reputationScore: 99.2,
      status: 'active',
      createdAt: '2026-10-18T10:30:00Z',
      serverCount: 1,
      toolCount: 1,
    };
    this.providers.set(p2.id, p2);

    // Initial pricing rules
    this.setPricingRule({
      serverId: 'srv_fintech_mcp',
      toolName: 'gst_validator_pro',
      unitPriceUsd: 0.02,
      pricingModel: 'fixed_per_call',
    });

    this.setPricingRule({
      serverId: 'srv_fintech_mcp',
      toolName: 'currency_fx_rates',
      unitPriceUsd: 0.0,
      pricingModel: 'free',
    });

    this.setPricingRule({
      serverId: 'srv_web_scraper',
      toolName: 'extract_article_ai',
      unitPriceUsd: 0.002,
      pricingModel: 'fixed_per_call',
    });

    this.setPricingRule({
      serverId: 'srv_research_ai',
      toolName: 'deep_research_v2',
      unitPriceUsd: 0.05,
      pricingModel: 'fixed_per_call',
    });

    // Seed sample telemetry
    this.recordUsage({
      agentId: 'agent_crawler_alpha',
      tenantId: 'org_enterprise_01',
      providerId: 'prov_acme',
      serverId: 'srv_fintech_mcp',
      toolName: 'gst_validator_pro',
      durationMs: 78,
      status: 'success',
      costUsd: 0.02,
    });
    this.recordUsage({
      agentId: 'agent_crawler_alpha',
      tenantId: 'org_enterprise_01',
      providerId: 'prov_dataforge',
      serverId: 'srv_web_scraper',
      toolName: 'extract_article_ai',
      durationMs: 310,
      status: 'success',
      costUsd: 0.002,
    });
  }
}

export const controlStore = new ControlPlaneStore();
