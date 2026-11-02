import React from 'react';
import { TabType } from '../types';
import { 
  ShieldCheck, 
  Layers, 
  Terminal, 
  CreditCard, 
  Database, 
  AlertTriangle, 
  Calculator, 
  Code2, 
  CheckSquare, 
  FileText 
} from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'summary', label: 'Executive & PRD', icon: FileText },
    { id: 'architecture', label: 'Control vs Data Plane', icon: Layers },
    { id: 'mcp-protocol', label: 'MCP Protocol Inspector', icon: Terminal },
    { id: 'x402-ledger', label: 'x402 & Ledger', icon: CreditCard },
    { id: 'database-er', label: 'Database ER (19 Tables)', icon: Database },
    { id: 'threat-model', label: 'Security & SSRF Matrix', icon: AlertTriangle },
    { id: 'cost-calculator', label: 'Cost Modeler', icon: Calculator },
    { id: 'api-contracts', label: 'API Contracts', icon: Code2 },
    { id: 'founder-decisions', label: 'Founder Decisions', icon: CheckSquare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white text-base tracking-wider shadow-sm">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-slate-100 tracking-tight">Tollary</span>
                <span className="text-xs font-mono text-slate-400">· v1.0 Architecture & Discovery</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Unified MCP Gateway, Agent Discovery & x402 Monetization</p>
            </div>
          </div>

          {/* Status & Review indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>DISCOVERY SPEC REVIEW</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-slate-800/80 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
