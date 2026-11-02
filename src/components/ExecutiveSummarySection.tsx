import React, { useState } from 'react';
import { EXECUTIVE_SUMMARY } from '../data/architectureData';
import { CheckCircle2, Search, ArrowRight, Shield, Zap, Globe, Cpu } from 'lucide-react';

export const ExecutiveSummarySection: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');

  const coreDifferentiators = [
    {
      title: "MCP-Native Streamable HTTP Gateway",
      desc: "Zero-allocation Go proxy understanding JSON-RPC 2.0 lifecycle (initialize, tools/list, tools/call) with bidirectional SSE chunk streaming and client cancellation relays.",
      icon: Cpu
    },
    {
      title: "Stateless Sub-Cent x402 Engine",
      desc: "Generates signed HTTP 402 Payment Required challenges and verifies cryptographic signatures (<12ms) with atomic Redis nonce replay protection without touching slow relational databases.",
      icon: Zap
    },
    {
      title: "Hybrid Semantic Discovery",
      desc: "OpenSearch cluster combining BM25 full-text keyword indexing and dense vector embeddings so agents query capabilities naturally ('validate Indian GST and produce invoices').",
      icon: Globe
    },
    {
      title: "Strict Zero-Trust Kernel SSRF Defense",
      desc: "Custom Go network dialer enforcing pre-connect IP hook rejecting loopback, link-local (169.254), RFC1918 private ranges, and validating DNS rebinds on every retry.",
      icon: Shield
    }
  ];

  const functionalRequirements = [
    { id: "FR-MCP-01", group: "MCP Protocol", title: "Streamable HTTP Transport", detail: "Strict adherence to official MCP 2024-11-05+ specification over streamable HTTP with fallback for legacy HTTP+SSE." },
    { id: "FR-MCP-02", group: "MCP Protocol", title: "Protocol Disambiguation", detail: "Unmarshals JSON-RPC 2.0 body. Free operations (tools/list, resources/list) bypass billing; tools/call triggers monetization." },
    { id: "FR-MCP-03", group: "MCP Protocol", title: "Progress & Cancellation Relay", detail: "Relays notifications/progress and propagates notifications/cancelled to upstream provider servers immediately." },
    { id: "FR-REST-01", group: "REST Gateway", title: "Dynamic Reverse Proxying", detail: "Exposes upstream APIs at /g/{provider}/{service}/{endpoint} with credential vault injection and header sanitization." },
    { id: "FR-DISC-01", group: "Discovery", title: "Hybrid BM25 + Vector Search", detail: "Sub-50ms search across tool names, natural language prompts, argument schemas, and provider domain tags." },
    { id: "FR-DISC-02", group: "Discovery", title: "Meta-MCP Discovery Tool", detail: "Exposes tollary_discover_tools as an in-band MCP tool so agents discover capabilities without leaving their MCP session." },
    { id: "FR-MON-01", group: "Monetization", title: "Dynamic HTTP 402 Generation", detail: "Responds with 402 + X-Payment-Requirements, amount, asset, recipient address, nonce, and facilitator endpoint." },
    { id: "FR-MON-02", group: "Monetization", title: "Cryptographic Proof Verification", detail: "Validates payment signatures via Coinbase Facilitator or Base L2 on-chain attestation before upstream execution." },
    { id: "FR-MON-03", group: "Monetization", title: "Atomic Replay & Double-Spend Protection", detail: "Uses Redis SETNX on nonces with 10-minute TTL and unique database constraints to guarantee zero double-spends." },
    { id: "FR-CTRL-01", group: "Multi-Tenancy", title: "Hierarchical Organizations & Projects", detail: "Multi-tenant workspaces with RBAC (Owner, Admin, Engineer, Auditor), per-project spending caps, and key rotation." },
  ];

  const filteredReqs = functionalRequirements.filter(r => 
    r.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.detail.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.group.toLowerCase().includes(filterQuery.toLowerCase()) ||
    r.id.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-100">
      {/* Hero Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Tollary Infrastructure</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">Master Architecture v1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Executive Product Summary & PRD
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Unified infrastructure platform enabling autonomous AI agents and developers to discover, connect to, execute, and monetize Model Context Protocol (MCP) tools and REST APIs with native x402 micro-settlement.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded font-mono text-xs">
              <span className="text-slate-500">TAGLINE:</span> <span className="text-cyan-300 font-medium">{EXECUTIVE_SUMMARY.tagline}</span>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreDifferentiators.map((diff, idx) => {
            const Icon = diff.icon;
            return (
              <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded p-4 flex flex-col justify-between">
                <div>
                  <div className="w-8 h-8 rounded bg-cyan-950/50 border border-cyan-800/50 flex items-center justify-center text-cyan-400 mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-semibold text-slate-200">{diff.title}</h2>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{diff.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target User Personas */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Target Personas & Value Delivery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXECUTIVE_SUMMARY.primaryTargets.map((target, idx) => (
            <div key={idx} className="border-l-2 border-cyan-500/80 bg-slate-950/40 p-3.5 rounded-r">
              <div className="text-xs font-semibold text-slate-200">{target.label}</div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">{target.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Non-Functional Engineering SLA Targets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Non-Functional Requirements & Engineering Targets</h2>
            <p className="text-xs text-slate-400">Strict SLA budgets enforced across Data Plane and Control Plane</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
            99.95% Availability Target
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Performance Dimension</th>
                <th className="py-2.5 px-3">Phase 1-3 (MVP / Beta)</th>
                <th className="py-2.5 px-3">Phase 4-6 (Production Scale)</th>
                <th className="py-2.5 px-3">Enforcement Subsystem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Gateway Sustained Throughput</td>
                <td className="py-2.5 px-3 text-cyan-300">1,000 RPS</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">10,000+ RPS</td>
                <td className="py-2.5 px-3 text-slate-400">Go 1.23 net/http connection pool</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Discovery Search Throughput</td>
                <td className="py-2.5 px-3 text-cyan-300">100 RPS</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">1,000+ RPS</td>
                <td className="py-2.5 px-3 text-slate-400">OpenSearch 3-node replica cluster</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Gateway Processing Overhead (P50)</td>
                <td className="py-2.5 px-3">&le; 2.5 ms</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">&le; 1.2 ms</td>
                <td className="py-2.5 px-3 text-slate-400">Zero-alloc fastjson + In-memory pricing</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Gateway Processing Overhead (P99)</td>
                <td className="py-2.5 px-3">&le; 12.0 ms</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">&le; 5.0 ms</td>
                <td className="py-2.5 px-3 text-slate-400">Redis sliding-window rate limit</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Financial Ledger Correctness</td>
                <td className="py-2.5 px-3 text-amber-300">ACID + Redis SETNX nonces</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">Zero Double-Spend Guaranteed</td>
                <td className="py-2.5 px-3 text-slate-400">Compensating transactional ledger</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-200">Telemetry Ingestion Lag</td>
                <td className="py-2.5 px-3">&le; 1,000 ms</td>
                <td className="py-2.5 px-3 text-emerald-300 font-bold">&le; 200 ms</td>
                <td className="py-2.5 px-3 text-slate-400">Redpanda Kafka bus -&gt; ClickHouse</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Functional Requirements Search & Filter */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Key Functional Requirements Specification</h2>
            <p className="text-xs text-slate-400">Traceable system requirements for MVP validation</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search requirements..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredReqs.map((req) => (
            <div key={req.id} className="bg-slate-950/70 border border-slate-800/80 rounded p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] text-cyan-400 font-bold">{req.id}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{req.group}</span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200">{req.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{req.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
