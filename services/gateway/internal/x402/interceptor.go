package x402

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Requirement struct {
	CostUSD          float64
	CostString       string
	Asset            string
	Chain            string
	RecipientAddress string
	Nonce            string
	FacilitatorURL   string
	ValidUntil       time.Time
}

// ReplayGuard provides atomic in-memory SETNX nonce locking
type ReplayGuard struct {
	mu     sync.Mutex
	nonces map[string]time.Time
}

func NewReplayGuard() *ReplayGuard {
	return &ReplayGuard{
		nonces: make(map[string]time.Time),
	}
}

func (g *ReplayGuard) AcquireNonce(nonce string, ttl time.Duration) bool {
	g.mu.Lock()
	defer g.mu.Unlock()

	now := time.Now()
	if exp, exists := g.nonces[nonce]; exists && exp.After(now) {
		return false // Replay attack detected
	}

	g.nonces[nonce] = now.Add(ttl)
	return true
}

func GenerateNonce() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// Write402Challenge writes the RFC standard x402 headers and JSON-RPC error
func Write402Challenge(w http.ResponseWriter, reqID []byte, toolName string, costUSD float64) {
	nonce := GenerateNonce()
	costStr := fmt.Sprintf("%.6f", costUSD)
	recipient := "0x71C80917E251E6476b77b7891c92F8d91024b82"
	facilitator := "https://pay.tollary.com/facilitator/coinbase"

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Payment-Cost", costStr)
	w.Header().Set("X-Payment-Asset", "USDC")
	w.Header().Set("X-Payment-Chain", "Base")
	w.Header().Set("X-Payment-Recipient", recipient)
	w.Header().Set("X-Payment-Nonce", nonce)
	w.Header().Set("X-Payment-Facilitator", facilitator)
	w.Header().Set("X-Payment-Valid-Until", time.Now().Add(10*time.Minute).Format(time.RFC3339))

	w.WriteHeader(http.StatusPaymentRequired)

	idStr := "null"
	if len(reqID) > 0 {
		idStr = string(reqID)
	}

	responseJson := fmt.Sprintf(`{
  "jsonrpc": "2.0",
  "id": %s,
  "error": {
    "code": -32402,
    "message": "Payment Required for tool '%s' execution ($%.2f USDC).",
    "data": {
      "tool": "%s",
      "costUsd": %.6f,
      "settlement": {
        "asset": "USDC",
        "chain": "Base",
        "recipient": "%s",
        "nonce": "%s",
        "facilitator": "%s"
      }
    }
  }
}`, idStr, toolName, costUSD, toolName, costUSD, recipient, nonce, facilitator)

	_, _ = w.Write([]byte(responseJson))
}
