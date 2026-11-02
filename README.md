# Tollary — Unified MCP Gateway, Agent Discovery & Monetization Platform

> **Discover. Connect. Execute. Monetize.**

Tollary is a high-scale infrastructure platform that enables autonomous AI agents, developers, and enterprises to discover, connect to, execute, and monetize Model Context Protocol (MCP) tools, REST APIs, and digital datasets with native sub-cent **x402** (HTTP 402 Payment Required) payment facilitation.

---

## ⚡ Key Highlights

- **MCP-Native Streamable HTTP Gateway:** High-performance Go Data Plane inspecting JSON-RPC 2.0 payloads in real-time, separating free protocol operations (`initialize`, `tools/list`) from billable executions (`tools/call`).
- **x402 Payment Engine:** Stateless issuance of signed HTTP 402 Payment Required challenges, cryptographic proof verification via Coinbase Facilitator / Base L2, and atomic Redis `SETNX` nonce replay protection.
- **Hybrid Semantic Discovery Engine:** OpenSearch cluster combining BM25 keyword search with dense vector embeddings so agents query tools naturally (e.g., *"validate Indian GST numbers and generate compliant invoices"*).
- **Strict Kernel SSRF & Prompt Injection Defense:** Pre-dialer kernel socket hook blocking loopback, link-local (`169.254.169.254`), and RFC1918 private IP ranges; taint neutralization stripping adversarial system override prompts in tool descriptions.
- **Strict Control / Data Plane Decoupling:** Zero relational database queries in the synchronous data plane request path; asynchronous usage telemetry flushed via Redpanda (Kafka) into ClickHouse.

---

## 🏛️ System Architecture

```
                  +-------------------------------------------------+
                  |      Autonomous AI Agents / Developer Clients   |
                  +-------------------------------------------------+
                                           |
                                           v
                  +-------------------------------------------------+
                  |         Cloudflare Global Edge & WAF / R2       |
                  +-------------------------------------------------+
                                           |
             +-----------------------------+-----------------------------+
             |                                                           |
             v (Sync High-Throughput)                                    v (Async Management)
+---------------------------------------+               +---------------------------------------+
|        GO 1.23 DATA PLANE             |               |      NESTJS CONTROL PLANE             |
| - Streamable HTTP MCP Listener        |               | - Organization & Multi-Tenancy (RBAC) |
| - JSON-RPC 2.0 Protocol Inspector     |               | - Provider & MCP Server Registry      |
| - x402 Interceptor & Nonce Guard      |               | - Pricing Rule Engine & Rate Cards    |
| - In-Memory Rule Cache (<0.2ms)       |               | - Search Ingestion Pipeline           |
+---------------------------------------+               +---------------------------------------+
             |                     |                                     |
             v                     v                                     v
+-----------------------+ +-----------------------+     +---------------------------------------+
|  REDIS CLUSTER 7.2    | | REDPANDA EVENT BUS    |     |   POSTGRESQL 16 (19 Relational Tables)|
| - Policy & Auth Cache | | - Usage Event Stream  |     | - ACID Financial Ledger               |
| - Replay Nonce Guard  | | - Telemetry & Meters  |     | - Row-Level Tenant Security           |
+-----------------------+ +-----------------------+     +---------------------------------------+
                                   |                                     |
                                   v                                     v
                        +-----------------------+               +-----------------------+
                        |  CLICKHOUSE CLUSTER   |               |   OPENSEARCH 2.14     |
                        | - Columnar Telemetry  |               | - BM25 + Dense Vectors|
                        +-----------------------+               +-----------------------+
```

---

## 📁 Repository Structure

```text
tollary/
├── docs/
│   └── architecture/
│       └── MASTER_DISCOVERY_ARCHITECTURAL_SPECIFICATION.md
├── src/
│   ├── components/
│   │   ├── ApiContractsSection.tsx
│   │   ├── ArchitectureSection.tsx
│   │   ├── CostCalculatorSection.tsx
│   │   ├── DatabaseSchemaSection.tsx
│   │   ├── ExecutiveSummarySection.tsx
│   │   ├── FounderDecisionDeck.tsx
│   │   ├── Header.tsx
│   │   ├── McpProtocolInspector.tsx
│   │   ├── ThreatModelSection.tsx
│   │   └── X402LedgerSection.tsx
│   ├── data/
│   │   └── architectureData.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or pnpm
- Git

### Installation & Local Development
```bash
# Clone the repository
git clone <YOUR_GITHUB_REPO_URL>
cd tollary

# Install dependencies
npm install

# Start the interactive Engineering Workbench & Discovery Portal
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the interactive workbench with:
- **MCP Protocol Inspector:** Interactive simulation of `initialize`, `tools/list`, and `tools/call` with HTTP 402 challenge/response inspection.
- **x402 & Ledger:** Compensating transaction state machine and double-entry financial ledger records.
- **Database ER Schema:** 19 PostgreSQL normalized tables with full column attributes and SQL migration preview.
- **STRIDE Threat Matrix:** Pre-dialer SSRF defense code and prompt injection guards.
- **Dynamic Cost Modeler:** Infrastructure capacity planning and 5% take-rate margin modeling.
- **Founder Decision Deck:** Technical trade-offs and sign-off exports.

---

## 📜 Specifications & Standards

- **Model Context Protocol (MCP):** [modelcontextprotocol.io](https://modelcontextprotocol.io/) (Spec 2024-11-05+)
- **x402 Payment Required Protocol:** [x402.org](https://www.x402.org/)
- **OpenAPI 3.1 & JSON-RPC 2.0**

---

## 📄 License

Apache-2.0. Copyright (c) 2026 Tollary Infrastructure.
