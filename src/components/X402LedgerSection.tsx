import React, { useState } from 'react';
import { CreditCard, ShieldCheck, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Lock, DollarSign } from 'lucide-react';

interface LedgerRow {
  txId: string;
  timestamp: string;
  agentProject: string;
  tool: string;
  grossAmount: number;
  platformFee: number;
  providerNet: number;
  status: 'SETTLED' | 'REFUNDED_COMPENSATING' | 'VOIDED';
  facilitator: string;
}

export const X402LedgerSection: React.FC = () => {
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([
    {
      txId: "tx_01jm9v_881a",
      timestamp: "2026-11-02 01:28:14 UTC",
      agentProject: "Autonomous Accounting Bot #4",
      tool: "gst_validator_pro",
      grossAmount: 0.020000,
      platformFee: 0.001000,
      providerNet: 0.019000,
      status: "SETTLED",
      facilitator: "Coinbase Base USDC"
    },
    {
      txId: "tx_01jm9v_992c",
      timestamp: "2026-11-02 01:29:40 UTC",
      agentProject: "ResearchCrawler Alpha",
      tool: "extract_article_ai",
      grossAmount: 0.002000,
      platformFee: 0.000100,
      providerNet: 0.001900,
      status: "SETTLED",
      facilitator: "Coinbase Base USDC"
    },
    {
      txId: "tx_01jm9v_331b",
      timestamp: "2026-11-02 01:30:02 UTC",
      agentProject: "ResearchCrawler Alpha",
      tool: "deep_research_v2",
      grossAmount: 0.050000,
      platformFee: 0.002500,
      providerNet: 0.047500,
      status: "REFUNDED_COMPENSATING",
      facilitator: "Coinbase Base USDC"
    }
  ]);

  const [activeSimulation, setActiveSimulation] = useState<'normal' | 'upstream_failure'>('normal');
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const runLedgerSimulation = (scenario: 'normal' | 'upstream_failure') => {
    setActiveSimulation(scenario);
    setSimulationLog([]);

    const steps = scenario === 'normal' ? [
      "1. [Auth Intent]: Agent initiated execution request for 'gst_validator_pro' ($0.02 USDC).",
      "2. [Challenge Nonce]: Gateway issued HTTP 402 challenge with nonce 'nonce_88a91b...'.",
      "3. [Proof Validation]: Received Payment-Signature; Coinbase Facilitator attested valid $0.02 Base USDC escrow.",
      "4. [Upstream Call]: Forwarded to upstream MCP server. Received 200 OK with valid result.",
      "5. [Settlement Commit]: Committed ledger transaction tx_new_...: Gross $0.020000, Fee $0.001000 (5%), Provider Net $0.019000.",
      "6. [Response Release]: JSON-RPC response successfully streamed to calling agent."
    ] : [
      "1. [Auth Intent]: Agent initiated execution request for 'deep_research_v2' ($0.05 USDC).",
      "2. [Challenge Nonce]: Gateway issued HTTP 402 challenge with nonce 'nonce_fail_99...'.",
      "3. [Proof Validation]: Received Payment-Signature; Facilitator confirmed valid escrow hold.",
      "4. [Upstream Call]: Upstream MCP provider timed out after 30,000ms (HTTP 504 Gateway Timeout).",
      "5. [COMPENSATING TRANSACTION]: Upstream failure detected! Gateway voids settlement and calls Facilitator Release Escrow.",
      "6. [Ledger Audit]: Appended compensating credit row. Status: REFUNDED_COMPENSATING. Zero cost incurred by agent."
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimulationLog(prev => [...prev, step]);
      }, (idx + 1) * 250);
    });
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Overview Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Decentralized Financial Subsystem</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              x402 Protocol & Financial Ledger Architecture
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Tollary integrates the open x402 specification (HTTP 402 Payment Required) with an immutable, append-only double-entry financial ledger guaranteeing zero double-spends and automated upstream failure compensation.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded hidden sm:block">
            Strict Non-Custodial Architecture
          </span>
        </div>

        {/* The 4-Phase Transaction Guarantee */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="text-cyan-400 font-mono text-xs font-bold mb-1">PHASE 1</div>
            <h2 className="text-xs font-bold text-slate-200">1. Authorization Intent</h2>
            <p className="text-xs text-slate-400 mt-1">
              Agent encounters 402 challenge with cryptographic nonce, exact decimal price, and destination address.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="text-cyan-400 font-mono text-xs font-bold mb-1">PHASE 2</div>
            <h2 className="text-xs font-bold text-slate-200">2. Proof Verification</h2>
            <p className="text-xs text-slate-400 mt-1">
              Gateway checks Redis SETNX for single-use nonce uniqueness, then verifies facilitator ECDSA signature.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="text-cyan-400 font-mono text-xs font-bold mb-1">PHASE 3</div>
            <h2 className="text-xs font-bold text-slate-200">3. Service Execution</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sanitized request proxied to upstream MCP/REST server. If provider fails, settlement is aborted immediately.
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-lg">
            <div className="text-cyan-400 font-mono text-xs font-bold mb-1">PHASE 4</div>
            <h2 className="text-xs font-bold text-slate-200">4. Settlement & Ledger</h2>
            <p className="text-xs text-slate-400 mt-1">
              On verified upstream success, escrow is settled. Immutable transaction row recorded with 5% platform fee split.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Simulation: Normal vs Upstream Failure */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Compensating Transaction Simulator</h2>
            <p className="text-xs text-slate-400">See how Tollary handles provider timeout without charging the agent</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runLedgerSimulation('normal')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                activeSimulation === 'normal' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Simulate Successful Call ($0.02)
            </button>
            <button
              onClick={() => runLedgerSimulation('upstream_failure')}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
                activeSimulation === 'upstream_failure' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Simulate Upstream 504 Timeout (Refund)
            </button>
          </div>
        </div>

        {/* Simulation Output Terminal */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 min-h-36">
          {simulationLog.length === 0 ? (
            <p className="text-slate-400">Click a button above to run the financial state machine simulation...</p>
          ) : (
            <div className="space-y-1.5">
              {simulationLog.map((log, idx) => (
                <div key={idx} className={log.includes('COMPENSATING') || log.includes('Refund') ? 'text-amber-400 font-semibold' : log.includes('Settlement Commit') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Immutable Financial Ledger Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Append-Only PostgreSQL Transaction Ledger</h2>
            <p className="text-xs text-slate-400">Sample immutable records stored with arbitrary decimal precision (NUMERIC 18, 6)</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">DB Table: transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Agent Workspace</th>
                <th className="py-2.5 px-3">Tool</th>
                <th className="py-2.5 px-3">Gross (USD)</th>
                <th className="py-2.5 px-3">Fee (5%)</th>
                <th className="py-2.5 px-3">Provider Net</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {ledgerRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40">
                  <td className="py-2.5 px-3 font-semibold text-cyan-400">{row.txId}</td>
                  <td className="py-2.5 px-3 text-slate-400">{row.timestamp}</td>
                  <td className="py-2.5 px-3 text-slate-200">{row.agentProject}</td>
                  <td className="py-2.5 px-3 text-slate-300">{row.tool}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">${row.grossAmount.toFixed(6)}</td>
                  <td className="py-2.5 px-3 text-cyan-400">${row.platformFee.toFixed(6)}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">${row.providerNet.toFixed(6)}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      row.status === 'SETTLED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      row.status === 'REFUNDED_COMPENSATING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
