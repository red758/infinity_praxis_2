
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Database, Brain, Activity, ChevronLeft, Terminal, Code, Quote, Rocket,
  Fingerprint, ShieldAlert, Cpu, TrendingUp, Layers, MousePointer2, Box, Command, Search, AlertTriangle, X, ShieldX, Info, Key, ShieldCheck, RefreshCcw, Wifi, WifiOff, ExternalLink, ArrowRight, MousePointer, Github, CheckCircle
} from 'lucide-react';
import { MOCK_SEGMENTS, MOCK_REVIEWS } from './constants';
import { ShopperSegment, MerchandisingRecommendation, PerspectiveMode, Review, LearnedDomainContext, CampaignManifest } from './types';
import { 
  generateMerchandisingRecommendations, getPersonaDetails, discoverSegments, 
  analyzeFriction, generateContextualReviews, synthesizeDomainDNA, generateCampaignManifest, 
  QuotaError, AuthError, SafetyError 
} from './services/geminiService';
import BehavioralMap from './components/BehavioralMap';
import SegmentGrid from './components/SegmentGrid';
import DataUploader from './components/DataUploader';
import NeuralWorkspace from './components/NeuralWorkspace';
import LandingView from './components/LandingView';
import Logo from './components/Logo';
import Walkthrough from './components/Walkthrough';
import TacticalManifestView from './components/TacticalManifestView';

type ProgressStep = 'idle' | 'parsing' | 'scrubbing' | 'sampling' | 'analyzing';
type AppView = 'landing' | 'dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [perspective] = useState<PerspectiveMode>('Merchandising');
  const [error, setError] = useState<{ type: 'quota' | 'auth' | 'safety' | 'general', message: string, code?: string } | null>(null);
  const [activeManifestSegment, setActiveManifestSegment] = useState<ShopperSegment | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [apiStatus, setApiStatus] = useState<'connected' | 'missing_key' | 'checking'>('checking');
  
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLogs(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  // Secure API Handshake logic - Essential for the 'Web Form' deployment success
  useEffect(() => {
    const key = process.env.API_KEY;
    const hasValidKey = key && key !== "undefined" && key.length > 10;
    
    if (hasValidKey) {
      setApiStatus('connected');
      addLog(`[AUTH] Neural handshake established via Secure Environment.`);
    } else {
      setApiStatus('missing_key');
      addLog(`[WARN] Handshake pending: Awaiting Environment Variable 'API_KEY'.`);
    }
  }, [addLog]);

  useEffect(() => {
    if (view === 'dashboard') {
      const hasSeenWalkthrough = localStorage.getItem('has_seen_walkthrough');
      if (!hasSeenWalkthrough) {
        setShowWalkthrough(true);
      }
    }
  }, [view]);

  const completeWalkthrough = () => {
    setShowWalkthrough(false);
    localStorage.setItem('has_seen_walkthrough', 'true');
  };
  
  const [learnedContext, setLearnedContext] = useState<LearnedDomainContext | null>(() => {
    const saved = localStorage.getItem('neural_dna');
    return saved ? JSON.parse(saved) : null;
  });

  const [segments, setSegments] = useState<ShopperSegment[]>(() => {
    const saved = localStorage.getItem('affinity_segments');
    if (saved) return JSON.parse(saved);
    return MOCK_SEGMENTS;
  });
  
  const [activeReviews, setActiveReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('active_reviews');
    if (saved) return JSON.parse(saved);
    return MOCK_REVIEWS;
  });

  const [selectedSegmentId, setSelectedSegmentId] = useState(segments[0]?.id || '');
  const [recommendations, setRecommendations] = useState<MerchandisingRecommendation[]>([]);
  const [personaDetails, setPersonaDetails] = useState<any>(null);
  const [frictionData, setFrictionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [profilingLoading, setProfilingLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<ProgressStep>('idle');
  
  useEffect(() => {
    if (logs.length <= 1) {
      addLog(`[SYSTEM] Initializing AffinityGraph Intelligence Hub...`);
      if (learnedContext) {
        addLog(`[SYSTEM] Sequence Restored: ${learnedContext.domainName}.`);
        setIsDemoMode(false);
      }
    }
  }, [learnedContext, logs.length, addLog]);

  const activeSegment = useMemo(() => 
    segments.find(s => s.id === selectedSegmentId) || (segments.length > 0 ? segments[0] : null),
  [segments, selectedSegmentId]);

  const handleImportDNA = (dna: LearnedDomainContext) => {
    setLearnedContext(dna);
    setIsDemoMode(false);
    localStorage.setItem('neural_dna', JSON.stringify(dna));
    addLog(`[IO] Neural DNA Hot-Swapped: ${dna.domainName}.`);
  };

  const handleSegmentUpdate = async (id: string, updates: Partial<ShopperSegment>) => {
    const seg = segments.find(s => s.id === id);
    if (updates.status === 'Active Strategy' && seg) {
      addLog(`[AI] Drafting Tactical Manifest for ${seg.name}...`);
      try {
        const manifest = await generateCampaignManifest(seg, learnedContext);
        const updatedSeg = { ...seg, ...updates, manifest };
        setSegments(prev => prev.map(s => s.id === id ? updatedSeg : s));
        addLog(`[AI] Tactical Manifest Ready for Deployment.`);
        setActiveManifestSegment(updatedSeg);
      } catch (err: any) {
        handleApiError(err, "Manifest Generator");
      }
    } else {
      setSegments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const fetchInsights = useCallback(async (targetSegments: ShopperSegment[], reviews: Review[], ctx: LearnedDomainContext | null) => {
    if (targetSegments.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      addLog(`[AI] Querying cross-segment strategic vectors...`);
      const recs = await generateMerchandisingRecommendations(targetSegments, ctx);
      setRecommendations(recs);
    } catch (err: any) {
      handleApiError(err, "Strategy Synthesis");
    } finally {
      setLoading(false);
      setProgressStep('idle');
    }
  }, [addLog]);

  const handleApiError = (err: any, context: string) => {
    console.error(`Error in ${context}:`, err);
    if (err instanceof AuthError) {
      setError({ type: 'auth', message: `SECURE_HANDSHAKE_FAILED: The application is unable to authorize your API_KEY. Check your Netlify environment variables and trigger a new build.` });
    } else if (err instanceof QuotaError) {
      setError({ type: 'quota', message: `${context}: Gemini API rate limit reached.` });
    } else if (err instanceof SafetyError) {
      setError({ type: 'safety', message: `${context}: Data patterns triggered safety filters.` });
    } else {
      setError({ type: 'general', message: `${context}: ${err.message || "Pipeline error."}` });
    }
    addLog(`[ERROR] ${context} Connection Failure.`);
  };

  useEffect(() => {
    if (recommendations.length === 0 && view === 'dashboard' && segments.length > 0 && !loading) {
       fetchInsights(segments, activeReviews, learnedContext);
    }
  }, [fetchInsights, segments, activeReviews, learnedContext, recommendations.length, view, loading]);

  useEffect(() => {
    if (!activeSegment || view === 'landing' || segments.length === 0) return;
    setProfilingLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [persona, friction] = await Promise.all([
          getPersonaDetails(activeSegment, learnedContext),
          analyzeFriction(activeSegment, activeReviews)
        ]);
        setPersonaDetails(persona);
        setFrictionData(friction);
      } catch (err: any) {
        // Background fail
      } finally {
        setProfilingLoading(false);
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [selectedSegmentId, segments, activeReviews, learnedContext, activeSegment, view]);

  const handleCustomDataLoaded = async (cleanedData: any[], headers: string[]) => {
    addLog(`[IO] Ingested ${cleanedData.length} records.`);
    setLoading(true);
    setError(null);
    setIsDemoMode(false);
    
    setSegments([]);
    setRecommendations([]);
    setPersonaDetails(null);
    setFrictionData(null);
    setLearnedContext(null);
    localStorage.clear(); 

    addLog("[SYSTEM] Initiating Neural Discovery engine...");
    
    try {
      if (apiStatus !== 'connected') {
        throw new AuthError("API_KEY not authorized.");
      }

      setProgressStep('parsing');
      const sampleSize = Math.min(cleanedData.length, 60);
      const stride = Math.max(1, Math.floor(cleanedData.length / sampleSize));
      const sample = cleanedData.filter((_, i) => i % stride === 0).slice(0, sampleSize);
      
      addLog(`[AI] Learning Domain DNA...`);
      const newDna = await synthesizeDomainDNA(sample, headers, null);
      setLearnedContext(newDna);
      localStorage.setItem('neural_dna', JSON.stringify(newDna));
      
      addLog(`[AI] DNA Sequence Locked. Running archetype clustering...`);
      setProgressStep('analyzing');
      const discovered = await discoverSegments(sample, headers, newDna);
      const contextReviews = await generateContextualReviews(discovered, newDna);
      
      setSegments(discovered);
      setActiveReviews(contextReviews);
      localStorage.setItem('affinity_segments', JSON.stringify(discovered));
      localStorage.setItem('active_reviews', JSON.stringify(contextReviews));
      
      if (discovered.length > 0) {
        setSelectedSegmentId(discovered[0].id);
      }

      addLog(`[SUCCESS] Neural synthesis stable.`);
      await fetchInsights(discovered, contextReviews, newDna);
    } catch (err: any) {
      handleApiError(err, "Ingestion Pipeline");
    } finally {
      setLoading(false);
      setProgressStep('idle');
    }
  };

  const resetToDemo = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (view === 'landing') return <LandingView onInitialize={() => setView('dashboard')} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col overflow-x-hidden pb-24 selection:bg-indigo-500/30">
      <Walkthrough isVisible={showWalkthrough} onComplete={completeWalkthrough} />
      
      {activeManifestSegment && (
        <TacticalManifestView segment={activeManifestSegment} onClose={() => setActiveManifestSegment(null)} />
      )}

      {error && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-950/98 backdrop-blur-3xl">
           <div className="max-w-2xl w-full bg-slate-900 border border-rose-500/40 rounded-[3rem] p-12 shadow-3xl animate-in zoom-in-95 duration-500">
             <div className="flex items-center gap-8 mb-12">
               <div className="p-6 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xl">
                 <ShieldX size={48} />
               </div>
               <div>
                 <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-3">System Obstruction</h2>
                 <span className="text-[11px] font-black text-rose-400 uppercase tracking-[0.5em]">Neural Link Broken</span>
               </div>
             </div>
             
             <p className="text-[14px] font-bold text-slate-200 leading-relaxed mb-12 italic border-l-4 border-rose-500/30 pl-8">
                {error.message}
             </p>

             <div className="flex items-center gap-6">
               <button onClick={() => window.location.reload()} className="flex-grow flex items-center justify-center gap-4 py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/30">
                  Re-Sync Hub <RefreshCcw size={18} />
               </button>
               <button onClick={() => setError(null)} className="px-12 py-8 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-[2rem] text-[13px] font-black uppercase tracking-widest transition-all border border-slate-700">
                 Dismiss
               </button>
             </div>
           </div>
        </div>
      )}

      <nav className="sticky top-0 z-[1000] bg-[#020617]/95 backdrop-blur-2xl border-b border-white/5 h-20 flex items-center">
        <div className="max-w-[1600px] w-full mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
              <Logo size={24} className="text-white" />
              <div className="h-6 w-px bg-slate-800" />
              <div className="flex flex-col">
                <h1 className="text-lg font-black tracking-tighter text-white uppercase leading-none">AffinityGraph<span className="text-indigo-500">.</span></h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold tracking-[0.4em] text-slate-500 uppercase italic leading-none">Intelligence Command</span>
                  <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase flex items-center gap-1.5 ${isDemoMode ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <div className={`w-1 h-1 rounded-full ${isDemoMode ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                    {isDemoMode ? 'Synthetic Context' : 'Live Neural Cluster'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all duration-1000 ${apiStatus === 'connected' ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse'}`}>
               {apiStatus === 'connected' ? <CheckCircle size={14} /> : <WifiOff size={14} />}
               <span className="text-[10px] font-black uppercase tracking-widest">{apiStatus === 'connected' ? 'SECURE LINK ACTIVE' : 'AWAITING AUTH HANDSHAKE'}</span>
            </div>
            {!isDemoMode && (
              <button onClick={resetToDemo} className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-400 transition-all">
                <RefreshCcw size={14} /> Reset State
              </button>
            )}
            <button onClick={() => setView('landing')} className="flex items-center gap-3 px-8 py-3 bg-slate-900 border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all shadow-xl">
               <ChevronLeft size={14} /> Exit Core
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] w-full mx-auto px-10 flex-grow py-12 flex flex-col gap-14">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div id="walkthrough-ingestion" className="lg:col-span-4 h-full">
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 flex flex-col shadow-2xl h-full">
              <div className="flex flex-col gap-2 mb-10">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Database size={16} className="text-indigo-500" /> Telemetry Ingestion
                </h3>
              </div>
              <DataUploader onDataLoaded={handleCustomDataLoaded} isLoading={loading} progressStep={progressStep} />
            </div>
          </div>
          <div id="walkthrough-workspace" className="lg:col-span-8 h-full">
            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl h-full">
              <div className="flex flex-col gap-2 mb-10">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Brain size={16} className="text-indigo-500" /> Neural Workspace Hub
                </h3>
              </div>
              <NeuralWorkspace dna={learnedContext} segments={segments} onImport={handleImportDNA} />
            </div>
          </div>
        </section>

        {segments.length > 0 ? (
          <>
            <section id="walkthrough-segments">
              <div className="flex flex-col gap-3 mb-12">
                <div className="flex items-center gap-8">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[1.2em] whitespace-nowrap">Archetype Clusters</h3>
                  <div className="h-px w-full bg-white/5" />
                </div>
              </div>
              <SegmentGrid segments={segments} selectedId={selectedSegmentId} onSelect={setSelectedSegmentId} onUpdate={handleSegmentUpdate} onRefine={() => {}} perspective={perspective} />
            </section>

            <section className="grid grid-cols-1 2xl:grid-cols-12 gap-10 items-stretch">
              <div id="walkthrough-diagnostics" className="2xl:col-span-8 flex flex-col">
                <div className="bg-slate-900/50 border border-white/10 rounded-[3rem] p-12 shadow-3xl flex flex-col h-full">
                  <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10 mb-12 shrink-0">
                    <div className="flex items-center gap-6">
                      <div className={`p-4 rounded-2xl border shadow-2xl transition-all duration-700 ${activeSegment?.status === 'Active Strategy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-indigo-400 border-white/10'}`}>
                        {activeSegment?.status === 'Active Strategy' ? <Rocket size={24} className="animate-pulse" /> : <Command size={24} />}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">{activeSegment?.name} Analytics</h3>
                          {activeSegment?.manifest && (
                            <button onClick={() => setActiveManifestSegment(activeSegment)} className="px-4 py-1.5 bg-indigo-500 text-white text-[9px] font-black uppercase rounded-lg shadow-lg hover:bg-indigo-600 transition-all">
                              View Manifest
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic leading-none">Inferred behavior patterns from telemetry stream.</p>
                      </div>
                    </div>
                  </div>

                  {profilingLoading || !personaDetails ? (
                    <div className="h-[500px] flex-grow flex flex-col items-center justify-center gap-6">
                      <div className="w-12 h-12 border-4 border-slate-900 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-[10px] text-slate-700 font-black uppercase tracking-[0.5em]">Calibrating Profile Nodes...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-[380px_1fr_300px] gap-10 items-stretch flex-grow h-full">
                      <div className="flex flex-col gap-4 bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl h-full">
                        <div className="flex flex-col gap-2 mb-8">
                           <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2"><Search size={14} /> Cognitive Drivers</h4>
                        </div>
                        <p className="text-[13px] font-bold text-slate-300 uppercase leading-relaxed tracking-tight italic border-l-2 border-indigo-500/20 pl-6 mb-10">
                          "{personaDetails?.backstory}"
                        </p>
                        <div className="space-y-3">
                           {activeSegment?.characteristics.map((c, i) => (
                             <div key={i} className="flex items-center justify-between px-5 py-3.5 bg-white/5 rounded-2xl border border-white/5 group shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">{c}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl h-full">
                        <div className="flex flex-col gap-2 mb-10">
                           <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] flex items-center gap-2"><Activity size={14} /> Vector Topography</h4>
                        </div>
                        <div className="space-y-12">
                           <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                 <span className="text-slate-500">Retention Prob.</span>
                                 <span className="text-emerald-400 mono">{activeSegment?.kpis.retentionLikelihood}%</span>
                              </div>
                              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                 <div className="h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" style={{ width: `${activeSegment?.kpis.retentionLikelihood}%` }} />
                              </div>
                           </div>
                           <div className="flex flex-col gap-4">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                 <span className="text-slate-500">Churn Propensity</span>
                                 <span className="text-rose-500 mono">{activeSegment?.kpis.churnPropensity}%</span>
                              </div>
                              <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                 <div className="h-full bg-rose-500/50" style={{ width: `${activeSegment?.kpis.churnPropensity}%` }} />
                              </div>
                           </div>
                           <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                              <div className="flex flex-col gap-2">
                                 <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Inferred AOV</span>
                                 <span className="text-2xl font-black text-white mono tracking-tighter">{activeSegment?.kpis.estimatedAOV}</span>
                              </div>
                              <div className="flex flex-col gap-2 pl-6 border-l border-white/5">
                                 <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Stability Index</span>
                                 <span className="text-2xl font-black text-indigo-400 mono tracking-tighter">{activeSegment?.patternStabilityIndex}%</span>
                              </div>
                           </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 bg-slate-950 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl h-full">
                        <div className="flex flex-col gap-2 mb-10">
                           <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] flex items-center gap-2"><ShieldAlert size={14} /> Friction Analysis</h4>
                        </div>
                        <div className="flex items-center justify-between mb-8">
                           <span className="text-5xl font-black text-white mono italic tracking-tighter">{frictionData?.frictionScore || 0}%</span>
                           <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 border border-rose-500/10">
                              <TrendingUp size={20} className="rotate-180" />
                           </div>
                        </div>
                        <div className="space-y-4">
                           {(frictionData?.primaryGaps || []).slice(0, 3).map((gap: string, i: number) => (
                             <div key={i} className="flex gap-4 items-start group">
                                <span className="text-rose-500 font-black text-xs">!</span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug tracking-tighter group-hover:text-slate-300 transition-colors">{gap}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div id="walkthrough-playbook" className="2xl:col-span-4 flex flex-col h-full">
                <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl h-full">
                  <div className="flex flex-col gap-2 mb-10">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                      <Layers size={16} className="text-indigo-500" /> Strategic Playbook
                    </h3>
                  </div>
                  <div className="space-y-5 flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                      <div key={idx} className="group p-8 rounded-3xl bg-slate-950 border border-white/5 hover:border-indigo-500/40 transition-all shadow-xl">
                        <div className="flex justify-between items-start mb-6">
                           <div className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase rounded border border-indigo-500/20 tracking-widest">
                             {rec.strategyType}
                           </div>
                           <span className="text-[10px] font-black text-emerald-400 italic">+{rec.metricLift?.value} Lift</span>
                        </div>
                        <h4 className="text-sm font-black text-white mb-2 uppercase italic leading-tight">{rec.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mb-8 line-clamp-2">{rec.action}</p>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                           <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Complexity: {rec.complexity}</span>
                           <MousePointer2 size={12} className="text-slate-800 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>
                    )) : (
                      <div className="h-full flex flex-col items-center justify-center opacity-10 py-40">
                        <Box size={40} className="mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Neural Ingestion</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section id="walkthrough-matrix">
              <div className="flex flex-col gap-3 mb-12">
                <div className="flex items-center gap-8">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[1.2em] whitespace-nowrap">Neural Affinity Topography</h3>
                  <div className="h-px w-full bg-white/5" />
                </div>
              </div>
              <BehavioralMap segments={segments} selectedId={selectedSegmentId} onSelect={setSelectedSegmentId} />
            </section>
          </>
        ) : !loading && (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
             <Layers size={64} className="mb-8" />
             <h3 className="text-xl font-black uppercase tracking-[0.5em]">Neural Core Empty</h3>
          </div>
        )}
      </main>
      
      {/* PERSISTENT SYSTEM LOGS */}
      <div className="fixed bottom-6 left-10 z-[3000]">
         <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl w-[480px] font-mono text-[9px] group transition-all hover:bg-slate-900">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
               <span className="text-indigo-400 font-bold tracking-widest uppercase flex items-center gap-2"><Terminal size={12} /> Live Trace Terminal</span>
               <div className="flex gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
               </div>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar-mini pr-2">
               {logs.length === 0 ? (
                 <div className="text-slate-700 italic">Initializing environmental link...</div>
               ) : (
                 logs.map((log, i) => (
                   <div key={i} className={`leading-tight tracking-tight break-all border-l-2 pl-3 transition-colors ${log.includes('[ERROR]') ? 'text-rose-400 border-rose-500' : log.includes('[SUCCESS]') ? 'text-emerald-400 border-emerald-500' : log.includes('[AUTH]') ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-indigo-500/20'}`}>
                     {log}
                   </div>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default App;
