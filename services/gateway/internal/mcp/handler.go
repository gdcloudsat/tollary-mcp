package mcp

import (
	"encoding/json"
	"fmt"
	"sync"
)

// ServerRegistry stores in-memory MCP servers and their tools for the Go Data Plane
type ServerRegistry struct {
	mu      sync.RWMutex
	servers map[string]*Server
}

type Server struct {
	ID       string
	Name     string
	Provider string
	Tools    map[string]Tool
}

func NewServerRegistry() *ServerRegistry {
	reg := &ServerRegistry{
		servers: make(map[string]*Server),
	}
	reg.seedDefaults()
	return reg
}

func (r *ServerRegistry) seedDefaults() {
	fintechTools := make(map[string]Tool)
	fintechTools["gst_validator_pro"] = Tool{
		Name:        "gst_validator_pro",
		Description: "Validates 15-digit Indian GSTIN identification numbers and generates compliant e-invoice JSON.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"gstin": map[string]any{"type": "string"},
			},
			"required": []string{"gstin"},
		},
		PriceUsd: 0.02,
		Currency: "USDC",
	}
	fintechTools["currency_fx_rates"] = Tool{
		Name:        "currency_fx_rates",
		Description: "Fetches live foreign exchange rates across major fiat currencies and stablecoins.",
		InputSchema: map[string]any{
			"type": "object",
		},
		PriceUsd: 0.00,
		Currency: "USDC",
	}

	r.servers["srv_fintech_mcp"] = &Server{
		ID:       "srv_fintech_mcp",
		Name:     "Acme FinTech Server",
		Provider: "Acme FinTech Systems",
		Tools:    fintechTools,
	}

	scraperTools := make(map[string]Tool)
	scraperTools["extract_article_ai"] = Tool{
		Name:        "extract_article_ai",
		Description: "Crawls any web URL, strips ads, and outputs clean markdown.",
		InputSchema: map[string]any{
			"type": "object",
			"properties": map[string]any{
				"url": map[string]any{"type": "string"},
			},
			"required": []string{"url"},
		},
		PriceUsd: 0.002,
		Currency: "USDC",
	}

	r.servers["srv_web_scraper"] = &Server{
		ID:       "srv_web_scraper",
		Name:     "DataForge Scraper Server",
		Provider: "DataForge Labs",
		Tools:    scraperTools,
	}
}

func (r *ServerRegistry) GetServer(id string) (*Server, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	srv, ok := r.servers[id]
	return srv, ok
}

// HandleRpc processes an MCP JSON-RPC 2.0 request
func HandleRpc(srv *Server, req *JsonRpcRequest) *JsonRpcResponse {
	resp := &JsonRpcResponse{
		JsonRpc: "2.0",
		ID:      req.ID,
	}

	switch req.Method {
	case "initialize":
		resp.Result = InitializeResult{
			ProtocolVersion: "2024-11-05",
			Capabilities: ServerCapabilities{
				Tools: &ToolsCapability{ListChanged: true},
			},
			ServerInfo: ServerInfo{
				Name:    fmt.Sprintf("tollary-gateway/%s", srv.Name),
				Version: "1.0.0",
			},
			Instructions: "Tollary Managed Go MCP Gateway. Tools are metered with x402 payment facilitation.",
		}
		return resp

	case "ping":
		resp.Result = map[string]any{}
		return resp

	case "tools/list":
		var toolList []map[string]any
		for _, t := range srv.Tools {
			toolList = append(toolList, map[string]any{
				"name":        t.Name,
				"description": t.Description,
				"inputSchema": t.InputSchema,
				"_tollary_meta": map[string]any{
					"price_usd": t.PriceUsd,
					"currency":  t.Currency,
					"provider":  srv.Provider,
				},
			})
		}
		resp.Result = map[string]any{"tools": toolList}
		return resp

	case "tools/call":
		var callParams CallToolParams
		if err := json.Unmarshal(req.Params, &callParams); err != nil {
			resp.Error = &JsonRpcError{
				Code:    ErrCodeInvalidParams,
				Message: "Failed to parse call parameters",
			}
			return resp
		}

		tool, exists := srv.Tools[callParams.Name]
		if !exists {
			resp.Error = &JsonRpcError{
				Code:    ErrCodeInvalidParams,
				Message: fmt.Sprintf("Tool '%s' not found on server", callParams.Name),
			}
			return resp
		}

		// Mock execution response for demonstration
		resp.Result = CallToolResult{
			Content: []ContentItem{
				{
					Type: "text",
					Text: fmt.Sprintf(`{"status":"success","tool":"%s","executedAt":"live","provider":"%s"}`, tool.Name, srv.Provider),
				},
			},
		}
		return resp

	default:
		resp.Error = &JsonRpcError{
			Code:    ErrCodeMethodNotFound,
			Message: fmt.Sprintf("Method '%s' not supported by server", req.Method),
		}
		return resp
	}
}
