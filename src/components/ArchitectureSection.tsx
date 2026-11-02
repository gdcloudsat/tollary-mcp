import React, { useState } from 'react';
import { SERVICES_MATRIX } from '../data/architectureData';
import { Layers, Search, Server, Cpu, ArrowRight, ShieldCheck, Database, RefreshCw, Zap } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const [planeFilter, setPlaneFilter] = useState<'all' | 'Control Plane' | 'Data Plane'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = SERVICES_MATRIX.filter((svc) => {
    const matchesPlane = planeFilter === 'all' || svc.plane === planeFilter;
    const matchesQuery = 
      svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.techStack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      svc.responsibilities.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPlane && matchesQuery;
  });

  return (
    <div className="space-y-8 text-slate-100">
      {/* Plane Split Concept Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Core Architectural Paradigm</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Control Plane vs. Data Plane Decoupling
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              High-throughput data plane execution MUST NEVER depend on slow relational control plane databases. The system is split into two asynchronous runtime domains.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1.5 rounded">
            <Zap className="w-3.5 h-3.5" />
            <span>Zero DB Queries in Data Plane Path</span>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Data Plane */}
          <div className="bg-slate-950/70 border border-cyan-900/40 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">DATA PLANE (Runtime Gateway)</h2>
                  <p className="text-[11px] font-mono text-cyan-400">High-Volume Synchronous Traffic</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2 py-0.5 rounded">
                Go 1.23+ net/http
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Zero Direct Database Queries:</strong> Reads policy & pricing exclusively from in-memory cache and Redis.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Microsecond JSON-RPC Inspection:</strong> Inspects MCP payloads in &lt;1.0ms to separate free discovery from billable calls.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Stateless x402 Interceptor:</strong> Issues HTTP 402 challenge headers & verifies signatures on-the-fly.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Lock-Free Telemetry:</strong> Emits usage events to local ring buffers, batched to Redpanda without blocking requests.</span>
              </li>
            </ul>
          </div>

          {/* Control Plane */}
          <div className="bg-slate-950/70 border border-indigo-900/40 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">CONTROL PLANE (Management API)</h2>
                  <p className="text-[11px] font-mono text-indigo-400">Asynchronous Administration</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded">
                NestJS / TypeScript
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Relational Truth (PostgreSQL):</strong> Strict multi-tenant RBAC, organization schemas, and immutable ledger entries.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Provider & MCP Ingestion:</strong> Probes upstream servers, tests connectivity, and introspects JSON schemas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Cache Invalidation Pub/Sub:</strong> Broadcasts price card updates and key revocations to Redis channels.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">&bull;</span>
                <span><strong className="text-slate-100">Analytics Aggregation:</strong> Queries ClickHouse columnar tables to populate developer revenue dashboards.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Complete Service Responsibility Matrix */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Complete Service Responsibility Matrix</h2>
            <p className="text-xs text-slate-400">Comprehensive breakdown of all 24 modular subsystem services</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Plane Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md">
              <button
                onClick={() => setPlaneFilter('all')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  planeFilter === 'all' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All (24)
              </button>
              <button
                onClick={() => setPlaneFilter('Data Plane')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  planeFilter === 'Data Plane' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Data Plane (12)
              </button>
              <button
                onClick={() => setPlaneFilter('Control Plane')}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  planeFilter === 'Control Plane' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Control Plane (12)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-48"
              />
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Plane</th>
                <th className="py-2.5 px-3">Primary Tech Stack</th>
                <th className="py-2.5 px-3">Latency SLA</th>
                <th className="py-2.5 px-3">Core Responsibilities</th>
                <th className="py-2.5 px-3">Resiliency Pattern</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredServices.map((svc, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{svc.name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                      svc.plane === 'Data Plane' 
                        ? 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60' 
                        : 'text-indigo-300 bg-indigo-950/50 border-indigo-800/60'
                    }`}>
                      {svc.plane}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{svc.techStack}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">{svc.latencyBudget}</td>
                  <td className="py-2.5 px-3">
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                      {svc.responsibilities.map((r, rIdx) => (
                        <li key={rIdx} className="leading-tight">{r}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{svc.resiliency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
