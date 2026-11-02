import React, { useState } from 'react';
import { DATABASE_TABLES } from '../data/architectureData';
import { Database, Search, Key, Link2, Copy, Check, FileCode, Layers } from 'lucide-react';

export const DatabaseSchemaSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>(DATABASE_TABLES[0].name);
  const [copiedSql, setCopiedSql] = useState(false);

  const categories = ['all', 'Identity & Tenancy', 'Provider & Registry', 'Financial & Ledger', 'Telemetry'];

  const filteredTables = DATABASE_TABLES.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.columns.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeTableData = DATABASE_TABLES.find(t => t.name === selectedTable) || DATABASE_TABLES[0];

  const sampleSqlMigration = `-- ==========================================================
-- TOLLARY MASTER POSTGRESQL SCHEMA MIGRATION: 001_initial_schema.sql
-- High-Scale Multi-Tenant MCP Gateway & x402 Ledger
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    monthly_spend_limit_usd NUMERIC(12, 2) DEFAULT NULL,
    rate_limit_rps INTEGER NOT NULL DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent API Keys
CREATE TABLE agent_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL,
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    allowed_ips INET[] DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL
);

-- Providers
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    display_name VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    reputation_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- MCP Servers
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    name VARCHAR(255) NOT NULL,
    base_url TEXT NOT NULL,
    transport_type VARCHAR(50) NOT NULL DEFAULT 'streamable_http',
    capabilities JSONB NOT NULL DEFAULT '{}',
    health_status VARCHAR(50) NOT NULL DEFAULT 'healthy'
);

-- MCP Tools
CREATE TABLE mcp_tools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    input_schema JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pricing Rules (Arbitrary Precision Numeric 18, 6)
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mcp_tool_id UUID REFERENCES mcp_tools(id) ON DELETE CASCADE,
    pricing_model VARCHAR(50) NOT NULL DEFAULT 'fixed_per_call',
    unit_price_usd NUMERIC(18, 6) NOT NULL DEFAULT 0.000000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable Transactions Ledger
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_verification_id UUID NOT NULL,
    gross_amount NUMERIC(18, 6) NOT NULL,
    platform_fee NUMERIC(18, 6) NOT NULL,
    provider_net NUMERIC(18, 6) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'settled',
    settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Microsecond Resolution
CREATE INDEX idx_agent_keys_hash ON agent_keys (key_hash);
CREATE INDEX idx_mcp_tools_server ON mcp_tools (mcp_server_id);
CREATE INDEX idx_transactions_settled_at ON transactions (settled_at DESC);
`;

  const copySql = () => {
    navigator.clipboard.writeText(sampleSqlMigration);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">PostgreSQL Relational Schema</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Database Architecture (19 Normalized Tables)
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              PostgreSQL 16+ transactional schema enforcing tenant isolation, arbitrary-precision decimal currencies (NUMERIC 18,6), and immutable audit logs. High-volume clickstreams are separated into ClickHouse.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1.5 rounded hidden sm:block">
            ACID Ledger Invariants
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Tables' : cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table or column..."
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Table List + Table Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Selector Sidebar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
            Entities ({filteredTables.length})
          </div>
          <div className="space-y-1">
            {filteredTables.map((tbl) => (
              <button
                key={tbl.name}
                onClick={() => setSelectedTable(tbl.name)}
                className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-colors flex items-center justify-between ${
                  selectedTable === tbl.name
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                }`}
              >
                <span>{tbl.name}</span>
                <span className="text-[10px] text-slate-400">{tbl.columns.length} cols</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Table Column Details */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-mono font-bold text-slate-100">{activeTableData.name}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeTableData.description}</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
              {activeTableData.category}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2 px-2.5">Column</th>
                  <th className="py-2 px-2.5">Data Type</th>
                  <th className="py-2 px-2.5">Attributes</th>
                  <th className="py-2 px-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {activeTableData.columns.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40">
                    <td className="py-2.5 px-2.5 font-semibold text-slate-200 flex items-center gap-1.5">
                      {col.isPrimary && <Key className="w-3 h-3 text-amber-400 shrink-0" />}
                      {col.isForeign && <Link2 className="w-3 h-3 text-cyan-400 shrink-0" />}
                      <span>{col.name}</span>
                    </td>
                    <td className="py-2.5 px-2.5 text-cyan-400">{col.type}</td>
                    <td className="py-2.5 px-2.5">
                      <div className="flex flex-wrap gap-1">
                        {col.isPrimary && <span className="text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800 px-1.5 rounded">PK</span>}
                        {col.isForeign && <span className="text-[10px] bg-cyan-950/80 text-cyan-400 border border-cyan-800 px-1.5 rounded">FK</span>}
                        {col.isUnique && <span className="text-[10px] bg-purple-950/80 text-purple-400 border border-purple-800 px-1.5 rounded">UNIQUE</span>}
                        {col.nullable === false && <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-1.5 rounded">NOT NULL</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-400 text-xs">{col.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SQL Migration Preview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-200">PostgreSQL DDL Migration Preview: 001_initial_schema.sql</h2>
          </div>
          <button
            onClick={copySql}
            className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copied SQL' : 'Copy Migration SQL'}</span>
          </button>
        </div>
        <pre className="bg-slate-950 p-4 rounded font-mono text-xs text-slate-300 overflow-x-auto max-h-72 border border-slate-900">
          {sampleSqlMigration}
        </pre>
      </div>
    </div>
  );
};
