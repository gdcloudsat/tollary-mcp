import React, { useState } from 'react';
import { INITIAL_API_CONTRACTS } from '../data/architectureData';
import { Code2, Copy, Check, Terminal, Globe, ArrowRight } from 'lucide-react';

export const ApiContractsSection: React.FC = () => {
  const [selectedContractIdx, setSelectedContractIdx] = useState<number>(0);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const activeContract = INITIAL_API_CONTRACTS[selectedContractIdx];

  const generateCurlCommand = () => {
    if (activeContract.path.includes('/mcp/')) {
      return `curl -X POST https://api.tollary.com/mcp/srv_fintech_mcp \\
  -H "Content-Type: application/json" \\
  -H "Payment-Signature: 0x9b1c7f8a91b2c3d4e5f6... (after 402 challenge)" \\
  -d '{
    "jsonrpc": "2.0",
    "id": "req-1042",
    "method": "tools/call",
    "params": {
      "name": "gst_validator_pro",
      "arguments": { "gstin": "27AABCU9603R1ZM" }
    }
  }'`;
    } else if (activeContract.path.includes('/discover')) {
      return `curl -X GET "https://api.tollary.com/v1/discover?q=validate%20Indian%20GST&protocol=mcp&max_price=0.05" \\
  -H "Accept: application/json"`;
    } else {
      return `curl -X POST https://api.tollary.com/g/acme-fintech/company/search \\
  -H "Content-Type: application/json" \\
  -H "Payment-Signature: 0x4a8b... " \\
  -d '{ "companyName": "Acme Corp", "country": "US" }'`;
    }
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">External Gateway Specifications</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Public API Contracts & Gateway Endpoints
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Strictly versioned endpoints for Model Context Protocol execution, hybrid agent capability discovery, and generic REST monetization proxies.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1.5 rounded hidden sm:block">
            OpenAPI 3.1 & MCP 2024-11-05
          </span>
        </div>

        {/* Contract Switcher Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {INITIAL_API_CONTRACTS.map((contract, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedContractIdx(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-mono transition-colors ${
                selectedContractIdx === idx
                  ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                contract.method.includes('POST') ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {contract.method}
              </span>
              <span>{contract.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contract Detail Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* Endpoint Heading & cURL */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-cyan-400 font-bold">{activeContract.method}</span>
              <span className="text-slate-200">{activeContract.path}</span>
            </div>
            <button
              onClick={copyCurl}
              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded w-fit"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Copied cURL' : 'Copy cURL'}</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{activeContract.description}</p>
        </div>

        {/* cURL Display */}
        <div className="bg-slate-950 p-4 rounded font-mono text-xs text-cyan-300/90 overflow-x-auto border border-slate-900">
          <pre>{generateCurlCommand()}</pre>
        </div>

        {/* Headers Table */}
        <div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">Required Headers</div>
          <div className="bg-slate-950 border border-slate-900 rounded overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Header Name</th>
                  <th className="py-2 px-3">Description / Accepted Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {activeContract.headers.map((h, i) => (
                  <tr key={i}>
                    <td className="py-2 px-3 text-cyan-400 font-semibold">{h.name}</td>
                    <td className="py-2 px-3 text-slate-400">{h.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request / Response JSON Samples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeContract.requestSample && (
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                Sample Request Payload
              </div>
              <pre className="bg-slate-950 p-3.5 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-64 border border-slate-900">
                {JSON.stringify(activeContract.requestSample, null, 2)}
              </pre>
            </div>
          )}

          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Sample Successful Response (200 OK)
            </div>
            <pre className="bg-slate-950 p-3.5 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-64 border border-slate-900">
              {JSON.stringify(activeContract.responseSample200, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
