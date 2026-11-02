import React, { useState } from 'react';
import { SAMPLE_TOOLS } from '../data/architectureData';
import { Terminal, Play, RotateCcw, CheckCircle, AlertOctagon, HelpCircle, ShieldCheck, Zap, Copy, Check } from 'lucide-react';

export const McpProtocolInspector: React.FC = () => {
  const [selectedOperation, setSelectedOperation] = useState<'initialize' | 'tools/list' | 'tools/call'>('tools/call');
  const [selectedToolId, setSelectedToolId] = useState<string>(SAMPLE_TOOLS[0].id);
  const [paymentScenario, setPaymentScenario] = useState<'unpaid' | 'paid_valid' | 'replay_attack' | 'invalid_sig'>('unpaid');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    status: number;
    headers: Record<string, string>;
    body: Record<string, any>;
    logs: { time: string; stage: string; detail: string; status: 'ok' | 'warn' | 'error' }[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const currentTool = SAMPLE_TOOLS.find(t => t.id === selectedToolId) || SAMPLE_TOOLS[0];

  const handleRunSimulation = () => {
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      const logs: { time: string; stage: string; detail: string; status: 'ok' | 'warn' | 'error' }[] = [
        { time: "+0.12ms", stage: "Connection Ingress", detail: "HTTP/2 stream accepted from client IP 198.51.100.44", status: 'ok' },
        { time: "+0.38ms", stage: "Token Verification", detail: "API key hash sha256:4a1b... matched active project 'Acme Agent Alpha'", status: 'ok' },
        { time: "+0.61ms", stage: "Rate Limiter", detail: "Sliding window token bucket: 14/100 RPS remaining. Passed.", status: 'ok' },
        { time: "+0.94ms", stage: "JSON-RPC Inspection", detail: `Unmarshaled JSON-RPC 2.0. Method identified: '${selectedOperation}'`, status: 'ok' }
      ];

      if (selectedOperation === 'initialize') {
        logs.push(
          { time: "+1.24ms", stage: "Policy Check", detail: "Protocol handshake is free. Forwarding to upstream MCP server.", status: 'ok' },
          { time: "+18.4ms", stage: "Upstream Handshake", detail: "Upstream returned protocolVersion: 2024-11-05 with capabilities: tools, resources.", status: 'ok' }
        );
        setExecutionOutput({
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Tollary-Gateway": "go-data-plane/1.23",
            "X-Tollary-Trace-ID": "trc_init_89fa12b"
          },
          body: {
            jsonrpc: "2.0",
            id: 1,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: { listChanged: true },
                resources: { subscribe: true }
              },
              serverInfo: {
                name: "tollary-mcp-gateway",
                version: "1.0.0"
              }
            }
          },
          logs
        });
        setIsExecuting(false);
        return;
      }

      if (selectedOperation === 'tools/list') {
        logs.push(
          { time: "+1.15ms", stage: "Policy Check", detail: "Tool discovery is non-billable. Serving tool schemas from Redis cache.", status: 'ok' },
          { time: "+2.10ms", stage: "Schema Serialization", detail: `Returning 4 registered tools with active pricing metadata.`, status: 'ok' }
        );
        setExecutionOutput({
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Tollary-Cache": "HIT (Redis 0.4ms)",
            "X-Tollary-Trace-ID": "trc_list_77c210e"
          },
          body: {
            jsonrpc: "2.0",
            id: 2,
            result: {
              tools: SAMPLE_TOOLS.map(t => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
                _tollary_meta: {
                  provider: t.provider,
                  unit_price_usd: t.pricing.unitPriceUsd,
                  currency: t.pricing.currency
                }
              }))
            }
          },
          logs
        });
        setIsExecuting(false);
        return;
      }

      // tools/call execution logic
      logs.push(
        { time: "+1.05ms", stage: "Operation Disambiguation", detail: `Operation is 'tools/call' for '${currentTool.name}'. Priced at $${currentTool.pricing.unitPriceUsd} ${currentTool.pricing.currency}.`, status: 'ok' }
      );

      if (paymentScenario === 'unpaid') {
        logs.push(
          { time: "+1.35ms", stage: "x402 Interceptor", detail: "Missing 'Payment-Signature' header on billable operation.", status: 'warn' },
          { time: "+1.72ms", stage: "Challenge Generation", detail: "Generated cryptographic nonce '4f3a8b21...'. Issuing HTTP 402 challenge.", status: 'ok' }
        );
        setExecutionOutput({
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "X-Payment-Cost": `${currentTool.pricing.unitPriceUsd.toFixed(6)}`,
            "X-Payment-Asset": "USDC",
            "X-Payment-Chain": "Base",
            "X-Payment-Recipient": "0x71C80917E251E6476b77",
            "X-Payment-Nonce": "4f3a8b21-89d2-4e55-bc11-a89e47260cf3",
            "X-Payment-Facilitator": "https://pay.tollary.com/facilitator/coinbase",
            "X-Tollary-Trace-ID": "trc_402_901bfa2"
          },
          body: {
            error: {
              code: -32402,
              message: "Payment Required for tool execution",
              data: {
                tool: currentTool.name,
                cost_usd: currentTool.pricing.unitPriceUsd,
                settlement: {
                  network: "base",
                  asset: "USDC",
                  recipient: "0x71C80917E251E6476b77",
                  nonce: "4f3a8b21-89d2-4e55-bc11-a89e47260cf3",
                  valid_until: "2026-11-02T09:45:00Z",
                  facilitator: "https://pay.tollary.com/facilitator/coinbase"
                }
              }
            }
          },
          logs
        });
      } else if (paymentScenario === 'replay_attack') {
        logs.push(
          { time: "+1.30ms", stage: "x402 Interceptor", detail: "Detected 'Payment-Signature: 0x8a9f...'.", status: 'ok' },
          { time: "+1.85ms", stage: "Replay Protection", detail: "Redis SETNX returned 0 for nonce '4f3a8b21...'. Nonce was already spent at 01:28:10 UTC!", status: 'error' },
          { time: "+2.10ms", stage: "Security Halt", detail: "Double-spend attempt blocked immediately. Emitted security alert.", status: 'error' }
        );
        setExecutionOutput({
          status: 409,
          headers: {
            "Content-Type": "application/json",
            "X-Tollary-Security": "DUPLICATE_PAYMENT_NONCE",
            "X-Tollary-Trace-ID": "trc_replay_002b8"
          },
          body: {
            error: {
              code: -32409,
              message: "Conflict: Payment nonce has already been settled and invalidated."
            }
          },
          logs
        });
      } else if (paymentScenario === 'invalid_sig') {
        logs.push(
          { time: "+1.30ms", stage: "x402 Interceptor", detail: "Detected 'Payment-Signature: 0xinvalid...'.", status: 'ok' },
          { time: "+4.12ms", stage: "Facilitator Verification", detail: "Coinbase Facilitator reported ECDSA signature verification failed (amount mismatch).", status: 'error' }
        );
        setExecutionOutput({
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "X-Tollary-Security": "INVALID_SIGNATURE",
            "X-Tollary-Trace-ID": "trc_invalidsig_11a"
          },
          body: {
            error: {
              code: -32403,
              message: "Forbidden: Cryptographic payment proof signature could not be verified."
            }
          },
          logs
        });
      } else {
        // paid_valid
        logs.push(
          { time: "+1.30ms", stage: "x402 Interceptor", detail: "Detected valid 'Payment-Signature: 0x9b1c7f...'.", status: 'ok' },
          { time: "+1.70ms", stage: "Replay Guard", detail: "Redis SETNX successful for nonce. Locked for 600s.", status: 'ok' },
          { time: "+5.40ms", stage: "Facilitator Verification", detail: `Coinbase Facilitator confirmed $${currentTool.pricing.unitPriceUsd} USDC transfer authorized to provider address.`, status: 'ok' },
          { time: "+5.80ms", stage: "SSRF Egress Check", detail: "Target upstream verified: 192.0.2.1 (Public routable). Kernel dialer approved.", status: 'ok' },
          { time: "+78.2ms", stage: "Upstream Execution", detail: "Upstream returned HTTP 200 with result payload.", status: 'ok' },
          { time: "+78.9ms", stage: "Telemetry Emitter", detail: `UsageEvent buffered (cost: $${currentTool.pricing.unitPriceUsd}, duration: 78ms). Flushing to Redpanda.`, status: 'ok' }
        );
        setExecutionOutput({
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Payment-Settlement": "CONFIRMED_BASE_USDC",
            "X-Tollary-Latency": "78ms",
            "X-Tollary-Trace-ID": "trc_success_99d14"
          },
          body: {
            jsonrpc: "2.0",
            id: 3,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(currentTool.sampleResponse, null, 2)
                }
              ],
              isError: false
            }
          },
          logs
        });
      }

      setIsExecuting(false);
    }, 400);
  };

  const handleCopyJson = () => {
    if (!executionOutput) return;
    navigator.clipboard.writeText(JSON.stringify(executionOutput.body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Interactive Protocol Laboratory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              MCP Gateway & Streamable HTTP Inspector
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Inspect how the Go Data Plane disassembles JSON-RPC 2.0 payloads, separates free discovery from monetized calls, issues HTTP 402 challenges, and verifies cryptographic payment proofs.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1.5 rounded hidden sm:block">
            MCP Spec 2024-11-05
          </span>
        </div>

        {/* Control Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 bg-slate-950/70 border border-slate-800 rounded-lg p-4">
          {/* Operation Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              1. MCP Method
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['initialize', 'tools/list', 'tools/call'] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setSelectedOperation(op)}
                  className={`py-1.5 px-2 text-xs font-mono rounded transition-colors text-center ${
                    selectedOperation === op
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {selectedOperation === 'tools/call' ? 'Billable execution operation' : 'Free protocol negotiation'}
            </p>
          </div>

          {/* Tool Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              2. Target MCP Tool
            </label>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              disabled={selectedOperation !== 'tools/call'}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              {SAMPLE_TOOLS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (${t.pricing.unitPriceUsd} {t.pricing.currency})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Provider: {currentTool.provider}
            </p>
          </div>

          {/* Payment Scenario */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              3. x402 Proof Scenario
            </label>
            <select
              value={paymentScenario}
              onChange={(e) => setPaymentScenario(e.target.value as any)}
              disabled={selectedOperation !== 'tools/call'}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="unpaid">Unpaid (Triggers HTTP 402 Challenge)</option>
              <option value="paid_valid">Paid: Valid Coinbase Facilitator Proof (200 OK)</option>
              <option value="replay_attack">Attack: Reused Nonce Replay (409 Conflict)</option>
              <option value="invalid_sig">Attack: Bad / Expired Signature (403 Forbidden)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Tests gateway verification and replay guards
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-cyan-400">POST</span>
            <span>https://api.tollary.com/mcp/srv_fintech_mcp</span>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded shadow transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isExecuting ? 'Processing in Gateway...' : 'Execute Request in Go Gateway'}</span>
          </button>
        </div>
      </div>

      {/* Execution Results View */}
      {executionOutput && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gateway Pipeline Trace Logs */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Go Data Plane Pipeline Trace
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Sub-millisecond latency</span>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto pr-1">
              {executionOutput.logs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-900">
                  <span className="text-slate-400 text-[11px] w-14 shrink-0">{log.time}</span>
                  <div className="flex-1">
                    <span className="text-slate-300 font-semibold text-[11px]">{log.stage}: </span>
                    <span className={log.status === 'error' ? 'text-rose-400' : log.status === 'warn' ? 'text-amber-400' : 'text-slate-400'}>
                      {log.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HTTP Response & JSON-RPC Payload */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                    executionOutput.status === 200 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    executionOutput.status === 402 ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    HTTP {executionOutput.status}
                  </span>
                  <span className="text-xs font-mono text-slate-400">Response Payload</span>
                </div>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Response Headers */}
              <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-400 mb-3 space-y-0.5 border border-slate-900">
                {Object.entries(executionOutput.headers).map(([k, v]) => (
                  <div key={k} className="flex">
                    <span className="text-cyan-400/90 w-36 shrink-0">{k}:</span>
                    <span className="text-slate-300 truncate">{v}</span>
                  </div>
                ))}
              </div>

              {/* Response JSON */}
              <pre className="bg-slate-950 p-3 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-60 border border-slate-900">
                {JSON.stringify(executionOutput.body, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
