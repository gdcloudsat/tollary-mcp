import React, { useState } from 'react';
import { TabType } from './types';
import { Header } from './components/Header';
import { ExecutiveSummarySection } from './components/ExecutiveSummarySection';
import { ArchitectureSection } from './components/ArchitectureSection';
import { McpProtocolInspector } from './components/McpProtocolInspector';
import { X402LedgerSection } from './components/X402LedgerSection';
import { DatabaseSchemaSection } from './components/DatabaseSchemaSection';
import { ThreatModelSection } from './components/ThreatModelSection';
import { CostCalculatorSection } from './components/CostCalculatorSection';
import { ApiContractsSection } from './components/ApiContractsSection';
import { FounderDecisionDeck } from './components/FounderDecisionDeck';
import { Shield, Cpu, Zap, Database, Terminal, FileCode2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Engineering Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workbench Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'summary' && <ExecutiveSummarySection />}
        {activeTab === 'architecture' && <ArchitectureSection />}
        {activeTab === 'mcp-protocol' && <McpProtocolInspector />}
        {activeTab === 'x402-ledger' && <X402LedgerSection />}
        {activeTab === 'database-er' && <DatabaseSchemaSection />}
        {activeTab === 'threat-model' && <ThreatModelSection />}
        {activeTab === 'cost-calculator' && <CostCalculatorSection />}
        {activeTab === 'api-contracts' && <ApiContractsSection />}
        {activeTab === 'founder-decisions' && <FounderDecisionDeck />}
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Tollary Infrastructure Engine</span>
            <span>·</span>
            <span>Go 1.23 Data Plane</span>
            <span>·</span>
            <span>Model Context Protocol 2024-11-05</span>
            <span>·</span>
            <span>x402 RFC Specification</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Status: Phase 1 Discovery Complete</span>
            <span>·</span>
            <span className="text-cyan-400">Awaiting Founder Approval on 4 Decisions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
