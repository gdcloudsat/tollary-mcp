import React, { useState } from 'react';
import { FOUNDER_DECISIONS_DATA } from '../data/architectureData';
import { CheckSquare, AlertCircle, CheckCircle2, ArrowRight, Download, Sparkles } from 'lucide-react';

export const FounderDecisionDeck: React.FC = () => {
  const [decisions, setDecisions] = useState(FOUNDER_DECISIONS_DATA);
  const [exportedStatus, setExportedStatus] = useState(false);

  const handleSelectOption = (decisionId: string, optionId: string) => {
    setDecisions(prev => prev.map(d => {
      if (d.id === decisionId) {
        return { ...d, selectedOption: optionId };
      }
      return d;
    }));
  };

  const exportDecisionsJson = () => {
    const summary = decisions.map(d => {
      const selected = d.options.find(o => o.id === d.selectedOption);
      return {
        id: d.id,
        title: d.title,
        category: d.category,
        founderDecision: selected?.label,
        isRecommendedOption: selected?.recommended
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tollary_founder_architectural_decisions.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 3000);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">Technical Founder Sign-Off</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Prioritized Decisions Requiring Founder Approval
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-3xl">
              As your Principal Software & Infrastructure Architect, I have isolated the 4 architectural crossroad decisions that materially govern costs, legal regulatory exposure, and engineering velocity.
            </p>
          </div>

          <button
            onClick={exportDecisionsJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-medium rounded transition-colors w-fit"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>{exportedStatus ? 'Decisions Exported!' : 'Export Founder Sign-Off JSON'}</span>
          </button>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="space-y-6">
        {decisions.map((decision) => (
          <div key={decision.id} className="bg-slate-900/60 border border-slate-800 rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">{decision.category}</span>
                <h2 className="text-base font-bold text-slate-100 mt-0.5">{decision.title}</h2>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded w-fit ${
                decision.urgency === 'CRITICAL' ? 'bg-rose-950/80 text-rose-400 border border-rose-800' : 'bg-amber-950/80 text-amber-400 border border-amber-800'
              }`}>
                {decision.urgency} SIGN-OFF REQUIRED
              </span>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {decision.options.map((opt) => {
                const isSelected = decision.selectedOption === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(decision.id, opt.id)}
                    className={`cursor-pointer rounded-lg p-4 border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-950 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={decision.id}
                            checked={isSelected}
                            onChange={() => handleSelectOption(decision.id, opt.id)}
                            className="accent-cyan-400"
                          />
                          <span className={`text-xs font-bold font-mono ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {opt.label}
                          </span>
                        </div>
                        {opt.recommended && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                            Architect Pick
                          </span>
                        )}
                      </div>

                      {/* Pros & Cons */}
                      <div className="space-y-1.5 mt-3 text-xs">
                        <div className="text-[11px] font-mono text-slate-400 uppercase">Advantages:</div>
                        <ul className="space-y-0.5 font-mono text-[11px] text-slate-300">
                          {opt.pros.map((pro, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-400">&check;</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="text-[11px] font-mono text-slate-400 uppercase mt-2">Trade-offs & Risks:</div>
                        <ul className="space-y-0.5 font-mono text-[11px] text-slate-400">
                          {opt.cons.map((con, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-1.5">
                              <span className="text-amber-400">&bull;</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 text-[11px] font-mono text-slate-400">
                      <strong className="text-slate-300">Architect Note: </strong>
                      {opt.architecturalNotes}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
