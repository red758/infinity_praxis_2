
import React from 'react';
import { X, Code, Copy, Rocket, Terminal, CheckCircle2, Zap, BarChart3, ShieldCheck } from 'lucide-react';
import { CampaignManifest, ShopperSegment } from '../types';

interface Props {
  segment: ShopperSegment;
  onClose: () => void;
}

const TacticalManifestView: React.FC<Props> = ({ segment, onClose }) => {
  const manifest = segment.manifest;
  if (!manifest) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 sm:p-10">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-[#020617] border border-indigo-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.2)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
              <Rocket size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">Tactical Activation Manifest</h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Target: {segment.name}</span>
                <div className="h-3 w-px bg-slate-800" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Sequence: Active</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Activation Sequence */}
            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" /> Activation Sequence
                </h3>
                <div className="space-y-6">
                  {manifest.activationPlan.map((step, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={12} />
                        </div>
                        {i < manifest.activationPlan.length - 1 && <div className="w-px h-full bg-white/5" />}
                      </div>
                      <div className="flex flex-col gap-1 pb-4">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight">{step.step}</span>
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{step.delay} Latency</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10 shadow-inner">
                <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                  <BarChart3 size={14} /> Projected Alpha
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Conversion Lift</span>
                    <span className="text-xl font-black text-white mono">{manifest.projectedMetrics.conversionLift}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Target ROI</span>
                    <span className="text-xl font-black text-white mono">{manifest.projectedMetrics.roi}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Est. Reach</span>
                    <span className="text-xl font-black text-white mono">{manifest.projectedMetrics.reach}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Volatility</span>
                    <span className="text-xl font-black text-rose-500 mono">{manifest.projectedMetrics.volatilityRisk}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Technical Assets */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Ad Copy */}
              <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Terminal size={14} /> High-Fidelity Ad Copy
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(manifest.adCopyDraft)}
                    className="flex items-center gap-2 text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-all"
                  >
                    <Copy size={12} /> Copy Draft
                  </button>
                </div>
                <div className="bg-[#020617] p-8 rounded-2xl border border-white/5 text-lg font-bold text-slate-300 italic tracking-tight leading-relaxed">
                  "{manifest.adCopyDraft}"
                </div>
              </div>

              {/* Technical Hook */}
              <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Code size={14} /> Technical Targeting Hook
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(manifest.technicalHook)}
                    className="flex items-center gap-2 text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-all"
                  >
                    <Copy size={12} /> Copy Snippet
                  </button>
                </div>
                <pre className="bg-[#020617] p-8 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
                  <code className="text-[11px] font-bold text-emerald-400 mono">
                    {manifest.technicalHook}
                  </code>
                </pre>
              </div>

              {/* Implementation JSON */}
              <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <ShieldCheck size={14} /> Implementation JSON (Production Ready)
                  </h3>
                  <button 
                    onClick={() => copyToClipboard(manifest.implementationJson)}
                    className="flex items-center gap-2 text-[9px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-all"
                  >
                    <Copy size={12} /> Copy JSON
                  </button>
                </div>
                <pre className="bg-[#020617] p-8 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar h-48">
                  <code className="text-[10px] font-bold text-indigo-300 mono whitespace-pre-wrap">
                    {manifest.implementationJson}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Action */}
        <div className="p-10 bg-indigo-600 border-t border-indigo-500/30 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Activation Protocol Locked</span>
            <span className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">Sovereign Data Protection Active</span>
          </div>
          <button 
            onClick={onClose}
            className="px-12 py-4 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            Confirm Deployment
          </button>
        </div>
      </div>
    </div>
  );
};

export default TacticalManifestView;
