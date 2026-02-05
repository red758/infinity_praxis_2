
import React, { useState, useCallback } from 'react';
import { Upload, Database, Sparkles, FileText, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  onDataLoaded: (data: any[], schema: string[]) => void;
  isLoading: boolean;
  progressStep: 'idle' | 'parsing' | 'scrubbing' | 'sampling' | 'analyzing';
}

const DataUploader: React.FC<Props> = ({ onDataLoaded, isLoading, progressStep }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const processFileContent = useCallback((content: string, name: string) => {
    try {
      let data: any[] = [];
      let headers: string[] = [];
      
      if (name.endsWith('.json')) {
        data = JSON.parse(content);
        if (!Array.isArray(data)) {
          throw new Error("JSON must be an array of objects.");
        }
        if (data.length > 0) headers = Object.keys(data[0]);
      } else {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) throw new Error("CSV file requires a header and at least one data row.");
        
        headers = lines[0].split(',').map(h => h.trim());
        data = lines.slice(1).map((line, lineIdx) => {
          const values = line.split(',');
          return headers.reduce((obj: any, header, i) => {
            obj[header] = values[i]?.trim() || "";
            return obj;
          }, {});
        });
      }
      
      if (data.length === 0) {
        throw new Error("No valid data rows found.");
      }

      onDataLoaded(data, headers);
    } catch (err: any) {
      setLocalError(`Parsing Error: ${err.message}`);
      setFileName(null);
    }
  }, [onDataLoaded]);

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;
    
    setLocalError(null);
    if (!file.name.endsWith('.json') && !file.name.endsWith('.csv')) {
      setLocalError("Format Unsupported. Use .json or .csv.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setLocalError("Failed to read file contents.");
        setFileName(null);
        return;
      }
      processFileContent(content, file.name);
    };
    reader.onerror = () => {
      setLocalError("File System error during read.");
      setFileName(null);
    };
    reader.readAsText(file);
  };

  const steps = [
    { id: 'parsing', label: 'Schema' },
    { id: 'scrubbing', label: 'PII Scrub' },
    { id: 'sampling', label: 'DNA Synthesis' },
    { id: 'analyzing', label: 'Archetypes' }
  ];

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex-grow flex flex-col relative">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
          className={`relative flex-grow border-2 border-dashed rounded-[2.5rem] p-8 transition-all duration-300 flex flex-col items-center justify-center gap-8 ${
            dragActive ? 'border-indigo-500 bg-indigo-500/5 shadow-2xl' : 'border-slate-800 bg-slate-950/50'
          }`}
        >
          {isLoading ? (
            <div className="w-full max-w-sm text-center">
              <Loader2 size={48} className="text-indigo-500 mx-auto mb-10 animate-spin" />
              <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-10 italic">Status: {progressStep}...</p>
              <div className="flex gap-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                {steps.map((step, i) => {
                  const currentIndex = steps.findIndex(s => s.id === progressStep);
                  return (
                    <div key={step.id} className={`flex-grow transition-all duration-700 ${currentIndex >= i ? 'bg-indigo-500 shadow-[0_0_15px_#6366f1]' : 'bg-slate-700'}`} />
                  );
                })}
              </div>
            </div>
          ) : fileName ? (
            <div className="text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto mb-8">
                <FileText size={48} />
              </div>
              <p className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">{fileName}</p>
              <div className="flex items-center justify-center gap-3 mb-10">
                 <ShieldCheck size={14} className="text-emerald-400" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Validated for AI Processing</span>
              </div>
              <button onClick={() => setFileName(null)} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white transition-all uppercase tracking-[0.3em] border border-slate-700 shadow-lg">
                Flush Buffer
              </button>
            </div>
          ) : (
            <>
              <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-600/30 mb-6 transition-transform hover:scale-110"><Upload size={40} /></div>
              <div className="text-center max-w-sm">
                <p className="text-lg font-black text-white uppercase italic tracking-tight mb-3">Sovereign Data Port</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Drop .CSV or .JSON behavioral telemetry here.
                </p>
              </div>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept=".json,.csv" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
            </>
          )}
        </div>
      </div>
      
      {!isLoading && !fileName && (
        <div className="mt-10 flex flex-col gap-6">
          <button 
            onClick={() => {
              // Synthetic Simulation
              const samples = [];
              for (let i = 0; i < 50; i++) {
                samples.push({
                  cust_id: `A${i}`,
                  val: Math.random() * 100,
                  cat: 'Simulation'
                });
              }
              onDataLoaded(samples, Object.keys(samples[0]));
            }} 
            className="flex items-center justify-center gap-4 w-full py-6 bg-amber-500/5 text-amber-500 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] border border-amber-500/10 hover:bg-amber-500 hover:text-white transition-all shadow-xl group"
          >
            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" /> Simulation Pipeline
          </button>
        </div>
      )}
      
      {localError && <div className="mt-8 text-[11px] font-black text-rose-400 bg-rose-500/5 p-6 rounded-2xl border border-rose-500/10 flex items-center gap-4 animate-in slide-in-from-bottom-2"><AlertCircle size={20} /> {localError}</div>}
    </div>
  );
};

export default DataUploader;
