package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/tollary/gateway/internal/mcp"
	"github.com/tollary/gateway/internal/x402"
)

type GatewayApp struct {
	registry    *mcp.ServerRegistry
	replayGuard *x402.ReplayGuard
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	app := &GatewayApp{
		registry:    mcp.NewServerRegistry(),
		replayGuard: x402.NewReplayGuard(),
	}

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"healthy","plane":"data-plane","engine":"go-1.23","protocol":"mcp/2024-11-05"}`))
	})

	// MCP Gateway Endpoint: POST /mcp/{serverId}
	mux.HandleFunc("POST /mcp/{serverId}", app.handleMcpRequest)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	// Graceful shutdown channel
	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[Tollary Go Data Plane] Gateway listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[Tollary Go Data Plane] Listen failed: %v", err)
		}
	}()

	<-stopChan
	log.Println("[Tollary Go Data Plane] Shutting down gateway gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("[Tollary Go Data Plane] Shutdown error: %v", err)
	}
	log.Println("[Tollary Go Data Plane] Gateway successfully stopped.")
}

func (app *GatewayApp) handleMcpRequest(w http.ResponseWriter, r *http.Request) {
	// Add trace header
	traceID := fmt.Sprintf("trc_go_%d", time.Now().UnixNano())
	w.Header().Set("X-Tollary-Trace-ID", traceID)
	w.Header().Set("X-Tollary-Gateway", "go-data-plane/1.23")

	// Extract serverId from path
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 3 {
		http.Error(w, `{"error":"invalid mcp path"}`, http.StatusBadRequest)
		return
	}
	serverID := parts[2]

	server, exists := app.registry.GetServer(serverID)
	if !exists {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"jsonrpc":"2.0","id":null,"error":{"code":%d,"message":"MCP server '%s' not found"}}`, mcp.ErrCodeParseError, serverID)))
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, `{"error":"failed to read request body"}`, http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var rpcReq mcp.JsonRpcRequest
	if err := json.Unmarshal(body, &rpcReq); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"jsonrpc":"2.0","id":null,"error":{"code":%d,"message":"Invalid JSON-RPC 2.0 payload"}}`, mcp.ErrCodeParseError)))
		return
	}

	// Check x402 for tools/call
	if rpcReq.Method == "tools/call" {
		var callParams mcp.CallToolParams
		_ = json.Unmarshal(rpcReq.Params, &callParams)

		if tool, ok := server.Tools[callParams.Name]; ok && tool.PriceUsd > 0 {
			paymentSig := r.Header.Get("Payment-Signature")
			if paymentSig == "" {
				paymentSig = r.Header.Get("X-Payment-Signature")
			}

			// Unpaid -> Issue HTTP 402 challenge
			if paymentSig == "" {
				x402.Write402Challenge(w, rpcReq.ID, tool.Name, tool.PriceUsd)
				return
			}

			// Payment present -> Verify Nonce Replay
			nonce := r.Header.Get("Payment-Nonce")
			if nonce == "" {
				nonce = fmt.Sprintf("nonce_%s", paymentSig[:min(len(paymentSig), 16)])
			}

			if !app.replayGuard.AcquireNonce(nonce, 10*time.Minute) {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-Tollary-Security", "DUPLICATE_PAYMENT_NONCE")
				w.WriteHeader(http.StatusConflict)
				_, _ = w.Write([]byte(fmt.Sprintf(`{"jsonrpc":"2.0","id":%s,"error":{"code":%d,"message":"Payment nonce '%s' already spent. Replay blocked."}}`, string(rpcReq.ID), mcp.ErrCodeReplayConflict, nonce)))
				return
			}

			w.Header().Set("X-Payment-Settlement", "CONFIRMED_BASE_USDC")
		}
	}

	// Dispatch JSON-RPC operation
	rpcResp := mcp.HandleRpc(server, &rpcReq)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	respBytes, _ := json.Marshal(rpcResp)
	_, _ = w.Write(respBytes)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
