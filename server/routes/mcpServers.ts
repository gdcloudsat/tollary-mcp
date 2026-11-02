import { Router, Request, Response } from 'express';
import { controlStore } from '../control/store';
import { mcpRegistry } from '../mcp/registry';

export const mcpServersRouter = Router();

/**
 * GET /v1/mcp/servers - List all registered MCP servers with capabilities and tool count
 */
mcpServersRouter.get('/servers', (_req: Request, res: Response) => {
  const servers = mcpRegistry.getAllServers().map((s) => ({
    id: s.id,
    name: s.name,
    provider: s.provider,
    protocolVersion: s.protocolVersion,
    transportType: s.transportType,
    toolsCount: s.tools.size,
    tools: Array.from(s.tools.keys()),
    endpoint: `/mcp/${s.id}`,
  }));

  res.status(200).json({
    total: servers.length,
    servers,
  });
});

/**
 * POST /v1/mcp/servers - Register a new remote MCP server and auto-ingest tools
 */
mcpServersRouter.post('/servers', (req: Request, res: Response) => {
  const { name, providerId, baseUrl, transportType, initialTools } = req.body;

  if (!name || !providerId) {
    res.status(400).json({
      error: {
        code: 'MISSING_FIELDS',
        message: 'name and providerId are required.',
      },
    });
    return;
  }

  try {
    const server = controlStore.registerMcpServer({
      name,
      providerId,
      baseUrl: baseUrl || 'http://localhost:8080/mcp',
      transportType: transportType || 'streamable_http',
      initialTools,
    });

    res.status(201).json({
      status: 'success',
      message: `MCP Server '${server.name}' successfully registered and published.`,
      server: {
        id: server.id,
        name: server.name,
        provider: server.provider,
        gatewayUrl: `/mcp/${server.id}`,
        protocolVersion: server.protocolVersion,
        toolsCount: server.tools.size,
        tools: Array.from(server.tools.keys()),
      },
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: 'REGISTRATION_FAILED',
        message: err.message,
      },
    });
  }
});
