import React, { useState } from 'react';
import { Calculator, DollarSign, TrendingUp, Cpu, Server, Database, Cloud } from 'lucide-react';

export const CostCalculatorSection: React.FC = () => {
  const [targetRps, setTargetRps] = useState<number>(1000);
  const [dailyActiveAgents, setDailyActiveAgents] = useState<number>(5000);
  const [avgToolPrice, setAvgToolPrice] = useState<number>(0.02);
  const [paidToolCallsPerDay, setPaidToolCallsPerDay] = useState<number>(200000);

  // Dynamic Infrastructure Cost Calculations based on RPS
  const k8sNodeCount = Math.max(2, Math.ceil(targetRps / 1500));
  const k8sCost = k8sNodeCount * 120; // $120 per 8vCPU node

  const dbCost = targetRps > 5000 ? 900 : targetRps > 1000 ? 320 : 120;
  const redisCost = targetRps > 5000 ? 450 : targetRps > 1000 ? 160 : 60;
  const eventBusCost = targetRps > 5000 ? 800 : targetRps > 1000 ? 220 : 80;
  const clickhouseCost = targetRps > 5000 ? 950 : targetRps > 1000 ? 300 : 100;
  const cloudflareCost = targetRps > 5000 ? 2000 : targetRps > 1000 ? 250 : 20;

  const totalMonthlyInfraCost = k8sCost + dbCost + redisCost + eventBusCost + clickhouseCost + cloudflareCost;

  // Monthly Revenue & Margin Projections
  const monthlyPaidInvocations = paidToolCallsPerDay * 30;
  const grossMonthlyVolumeUsd = monthlyPaidInvocations * avgToolPrice;
  const platformFeeRate = 0.05; // 5% take rate
  const monthlyPlatformRevenue = grossMonthlyVolumeUsd * platformFeeRate;
  const monthlyGrossProfit = monthlyPlatformRevenue - totalMonthlyInfraCost;
  const grossMarginPercent = monthlyPlatformRevenue > 0 
    ? Math.max(0, Math.round((monthlyGrossProfit / monthlyPlatformRevenue) * 100))
    : 0;

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Infrastructure & Commercial Economics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Dynamic Cost Modeler & Margin Calculator
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              Model server capacity, multi-tier hosting expenses (Kubernetes, PostgreSQL, Redis, ClickHouse, Cloudflare), and projected 5% platform take-rate margins across traffic levels.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded hidden sm:block">
            5% Platform Take Rate
          </span>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 bg-slate-950/70 border border-slate-800 rounded-lg p-5">
          {/* Slider 1: Target RPS */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">Target Gateway RPS:</span>
              <span className="text-cyan-400 font-bold">{targetRps.toLocaleString()} RPS</span>
            </div>
            <input
              type="range"
              min="50"
              max="15000"
              step="50"
              value={targetRps}
              onChange={(e) => setTargetRps(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>50 RPS</span>
              <span>15,000 RPS</span>
            </div>
          </div>

          {/* Slider 2: Daily Active Agents */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">Daily Active Agents:</span>
              <span className="text-cyan-400 font-bold">{dailyActiveAgents.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="100"
              value={dailyActiveAgents}
              onChange={(e) => setDailyActiveAgents(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>100</span>
              <span>50,000</span>
            </div>
          </div>

          {/* Slider 3: Paid Tool Invocations / Day */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">Paid Invocations / Day:</span>
              <span className="text-cyan-400 font-bold">{(paidToolCallsPerDay / 1000).toFixed(0)}k</span>
            </div>
            <input
              type="range"
              min="10000"
              max="2000000"
              step="10000"
              value={paidToolCallsPerDay}
              onChange={(e) => setPaidToolCallsPerDay(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>10k / day</span>
              <span>2M / day</span>
            </div>
          </div>

          {/* Slider 4: Avg Tool Price */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">Avg Tool Price (USD):</span>
              <span className="text-cyan-400 font-bold">${avgToolPrice.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.002"
              max="0.20"
              step="0.002"
              value={avgToolPrice}
              onChange={(e) => setAvgToolPrice(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>$0.002</span>
              <span>$0.200</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Projections Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Monthly GMV (Gross Volume)
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${grossMonthlyVolumeUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {monthlyPaidInvocations.toLocaleString()} monthly tool calls
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            Platform Revenue (5%)
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            ${monthlyPlatformRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Pure transaction fee capture
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
            Est. Monthly Hosting Cost
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">
            ${totalMonthlyInfraCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Sized for {targetRps} sustained RPS
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1">
            Gross Contribution Margin
          </div>
          <div className={`text-2xl font-bold font-mono ${grossMarginPercent > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {grossMarginPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Net: ${monthlyGrossProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / mo
          </div>
        </div>
      </div>

      {/* Sized Infrastructure Itemization Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
        <h2 className="text-base font-semibold text-slate-200 mb-4">Infrastructure Cost Itemization Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">Kubernetes Node Pool</div>
              <div className="text-slate-400 text-[11px]">{k8sNodeCount} nodes (8 vCPU / 16GB RAM)</div>
            </div>
            <div className="text-cyan-400 font-bold">${k8sCost}/mo</div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">Managed PostgreSQL</div>
              <div className="text-slate-400 text-[11px]">Primary + Standby Read Replica</div>
            </div>
            <div className="text-cyan-400 font-bold">${dbCost}/mo</div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">Redis 7 Cluster</div>
              <div className="text-slate-400 text-[11px]">In-memory cache & rate limiter</div>
            </div>
            <div className="text-cyan-400 font-bold">${redisCost}/mo</div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">Redpanda (Kafka) Cluster</div>
              <div className="text-slate-400 text-[11px]">Zero-JVM telemetry event stream</div>
            </div>
            <div className="text-cyan-400 font-bold">${eventBusCost}/mo</div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">ClickHouse Cluster</div>
              <div className="text-slate-400 text-[11px]">Columnar analytics & telemetry</div>
            </div>
            <div className="text-cyan-400 font-bold">${clickhouseCost}/mo</div>
          </div>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-slate-200 font-bold">Cloudflare Edge & WAF</div>
              <div className="text-slate-400 text-[11px]">DDoS mitigation + R2 asset storage</div>
            </div>
            <div className="text-cyan-400 font-bold">${cloudflareCost}/mo</div>
          </div>
        </div>
      </div>
    </div>
  );
};
