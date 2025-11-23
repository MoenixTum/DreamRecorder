import React, { useState, useEffect, useMemo } from 'react';
import { List, Mic, Wind, Search, X, Brain, CheckCircle, Circle, Sparkles, LayoutGrid, AlignJustify, Moon } from 'lucide-react';
import Particles from './components/Particles';
import RecorderButton from './components/RecorderButton';
import DreamCard from './components/DreamCard';
import { DreamEntry, AppView } from './types';
import { analyzeDreamAudio, interpretDreams } from './services/geminiService';

// --- Helper Functions ---
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGridView, setIsGridView] = useState(false);
  
  // Interpretation State
  const [selectedDreamIds, setSelectedDreamIds] = useState<string[]>([]);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretationResult, setInterpretationResult] = useState<string | null>(null);

  // Hardcoded settings since config tab is removed
  const themeIntensity = 0.8; 
  const autoTranscribe = true;

  // Load dreams from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dream_journal');
    if (saved) {
      try {
        setDreams(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse dreams", e);
      }
    }
  }, []);

  // Save dreams whenever they change
  useEffect(() => {
    localStorage.setItem('dream_journal', JSON.stringify(dreams));
  }, [dreams]);

  // Handler to update a single dream entry
  const handleUpdateDream = (updatedDream: DreamEntry) => {
    setDreams(prev => prev.map(d => d.id === updatedDream.id ? updatedDream : d));
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    // Convert blob to base64 for storage/API
    const base64Audio = await blobToBase64(audioBlob);
    
    const newDream: DreamEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      audioBase64: base64Audio,
      transcription: "Processing...",
      tags: [],
      mood: "",
      lucidityScore: 0,
      isProcessing: true,
    };

    // Add immediate temporary entry
    setDreams(prev => [newDream, ...prev]);

    if (autoTranscribe) {
      // Process with Gemini
      const analysis = await analyzeDreamAudio(base64Audio, audioBlob.type || 'audio/webm');
      
      setDreams(prev => prev.map(d => 
        d.id === newDream.id ? {
          ...d,
          ...analysis,
          isProcessing: false
        } : d
      ));
    } else {
      // Manual save without transcription
      setDreams(prev => prev.map(d => 
        d.id === newDream.id ? {
          ...d,
          transcription: "Audio Log (Untranscribed)",
          mood: "Recorded",
          isProcessing: false
        } : d
      ));
    }

    setIsProcessing(false);
    setView('list'); // Auto go to list to see result
  };

  const toggleDreamSelection = (id: string) => {
    setSelectedDreamIds(prev => 
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  const handleInterpretSelected = async () => {
    if (selectedDreamIds.length === 0) return;
    setIsInterpreting(true);
    setInterpretationResult(null);

    const selectedDreams = dreams.filter(d => selectedDreamIds.includes(d.id));
    const result = await interpretDreams(selectedDreams);
    
    setInterpretationResult(result);
    setIsInterpreting(false);
  };

  // --- Filtering & Grouping Logic ---
  const groupedDreams = useMemo(() => {
    // 1. Filter
    const query = searchQuery.toLowerCase();
    const filtered = dreams.filter(d => {
        if (!query) return true;
        const dateStr = new Date(d.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toLowerCase();
        const tagsStr = d.tags.join(" ").toLowerCase();
        const text = (d.transcription || "").toLowerCase();
        return text.includes(query) || tagsStr.includes(query) || dateStr.includes(query);
    });

    // 2. Group by Date
    // Using reduce to maintain sort order (newest first)
    const groups = filtered.reduce((acc, dream) => {
        const dateKey = new Date(dream.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        
        const existingGroup = acc.find(g => g.date === dateKey);
        if (existingGroup) {
            existingGroup.dreams.push(dream);
        } else {
            acc.push({ date: dateKey, dreams: [dream] });
        }
        return acc;
    }, [] as { date: string, dreams: DreamEntry[] }[]);

    return groups;
  }, [dreams, searchQuery]);


  // --- Views ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center h-full w-full relative z-10 px-6">
      <div className="mb-8 md:mb-14 text-center animate-in fade-in zoom-in duration-700">
        <h1 className="text-5xl font-medium text-slate-100 tracking-widest mb-3 drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] font-['Cinzel']">
          Dream<br/><span className="text-4xl text-violet-200">Recorder</span>
        </h1>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-violet-500 to-transparent mx-auto my-6"></div>
        <p className="text-slate-400 text-xs tracking-[0.3em] uppercase font-light font-['Quicksand']">Echos from the Void</p>
      </div>

      <RecorderButton onRecordingComplete={handleRecordingComplete} isProcessing={isProcessing} />
    </div>
  );

  const renderList = () => (
    <div className="flex flex-col h-full w-full relative z-10">
      {/* Header & Search */}
      <div className="flex flex-col pt-8 pb-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 shadow-2xl px-4 gap-4">
        <div className="flex items-center justify-between relative">
            <h2 className="text-2xl text-violet-100 tracking-widest font-['Cinzel'] drop-shadow-md w-full text-center pl-8">Chronicles</h2>
            {/* View Toggle */}
            <button 
                onClick={() => setIsGridView(!isGridView)}
                className="p-2 rounded-full hover:bg-white/10 text-violet-300 transition-colors absolute right-0 top-0"
                aria-label="Toggle View"
            >
                {isGridView ? <AlignJustify className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />}
            </button>
        </div>
        
        <div className="relative w-full max-w-sm mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-violet-400/50" />
            </div>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dreams..."
                className="block w-full pl-10 pr-10 py-2 border border-white/5 rounded-full leading-5 bg-black/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:bg-black/60 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 sm:text-sm transition-all"
            />
            {searchQuery && (
                <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pb-40 relative custom-scrollbar overscroll-contain">
        
        {dreams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/20 font-['Quicksand']">
                <Moon className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-light tracking-wide">The void is silent.</p>
                <p className="text-sm opacity-50 mt-2">Record a dream to begin.</p>
            </div>
        ) : groupedDreams.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-white/40 font-['Quicksand']">
                <p className="font-light tracking-wide">No dreams found.</p>
            </div>
        ) : (
            <div className={isGridView ? "" : "pl-4 pb-20"}>
                 {/* Timeline Line Base (Only in List View) */}
                 {!isGridView && (
                    <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gradient-to-b from-violet-900/10 via-violet-900/40 to-transparent rounded-full z-0" />
                )}

              {groupedDreams.map((group) => (
                <div key={group.date} className="mb-8">
                    {/* Date Header */}
                    <div className={`sticky top-0 z-20 mb-4 pt-2 ${isGridView ? 'px-2' : '-ml-4 pl-4'}`}>
                        <span className="inline-block px-3 py-1 rounded-r-full bg-violet-950/80 border-l-4 border-violet-500/50 backdrop-blur-md text-violet-100 text-xs font-['Cinzel'] font-semibold shadow-lg uppercase tracking-wider">
                            {group.date}
                        </span>
                    </div>
                    {/* Dreams for this date */}
                    <div className={isGridView ? "grid grid-cols-2 gap-4" : "space-y-6"}>
                        {group.dreams.map(dream => (
                            <DreamCard 
                                key={dream.id} 
                                dream={dream} 
                                onUpdate={handleUpdateDream} 
                                layout={isGridView ? 'grid' : 'list'}
                            />
                        ))}
                    </div>
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );

  const renderInterpretation = () => (
    <div className="flex flex-col h-full w-full relative z-10">
      <div className="flex flex-col pt-8 pb-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-30 shadow-lg px-4">
        <h2 className="text-2xl text-violet-100 tracking-wider font-['Cinzel'] drop-shadow-md text-center">Oracle</h2>
        <p className="text-center text-xs text-slate-400 mt-2 font-['Quicksand']">Select memories to seek hidden truths</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-40 custom-scrollbar">
        {interpretationResult ? (
           <div className="animate-in fade-in zoom-in duration-500">
             <div className="bg-gradient-to-br from-indigo-950/40 to-violet-950/40 border border-violet-500/20 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain className="w-20 h-20 text-white" /></div>
                <h3 className="text-lg font-['Cinzel'] text-violet-200 mb-4 border-b border-violet-500/20 pb-2">Interpretation</h3>
                <p className="font-['Quicksand'] text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">
                  {interpretationResult}
                </p>
                <button 
                  onClick={() => setInterpretationResult(null)}
                  className="mt-6 w-full py-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-lg text-xs text-violet-300 uppercase tracking-widest transition-colors"
                >
                  Close & Select Others
                </button>
             </div>
           </div>
        ) : (
          <div className="space-y-3">
             {dreams.length === 0 && (
                <div className="text-center text-white/30 py-10">Record dreams first to interpret them.</div>
             )}
             {dreams.map(dream => (
               <div 
                  key={dream.id} 
                  onClick={() => toggleDreamSelection(dream.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer active:scale-[0.98] ${selectedDreamIds.includes(dream.id) ? 'bg-violet-900/30 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
               >
                  <div className="flex-1 pr-4 overflow-hidden">
                     <div className="text-xs text-violet-400/60 mb-1">{new Date(dream.timestamp).toLocaleDateString()}</div>
                     <div className="text-sm text-slate-300 line-clamp-2 font-['Quicksand']">{dream.transcription}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${selectedDreamIds.includes(dream.id) ? 'border-violet-500 bg-violet-500/20 text-violet-300' : 'border-slate-700 text-transparent'}`}>
                     <CheckCircle className="w-4 h-4" />
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Action Bar for Interpretation */}
      {!interpretationResult && selectedDreamIds.length > 0 && (
        <div className="absolute bottom-24 left-0 right-0 p-4 flex justify-center z-40 animate-in slide-in-from-bottom-4">
           <button
             onClick={handleInterpretSelected}
             disabled={isInterpreting}
             className="flex items-center space-x-2 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-600 hover:to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg shadow-violet-900/40 font-semibold tracking-wide border border-white/10 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait font-['Cinzel']"
           >
             {isInterpreting ? (
               <><Wind className="w-5 h-5 animate-spin" /> <span>Consulting the Stars...</span></>
             ) : (
               <><Sparkles className="w-5 h-5" /> <span>Interpret ({selectedDreamIds.length})</span></>
             )}
           </button>
        </div>
      )}
    </div>
  );


  return (
    // h-[100dvh] ensures full height on mobile browsers including iOS Safari
    // pt-safe and pb-safe handle the notch and home indicator areas from the root
    <div className="h-[100dvh] w-full bg-black text-slate-200 font-sans relative overflow-hidden pt-safe pb-safe">
      {/* Dynamic Background - Darker/Night */}
      <div 
        className="absolute inset-0 z-0 bg-gradient-to-br from-slate-950 via-black to-indigo-950 transition-opacity duration-1000"
        style={{ opacity: 0.9 }} 
      />
      {/* Subtle radial glow in center */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent pointer-events-none" />
      
      <Particles intensity={themeIntensity} />

      {/* Main Content Area */}
      <main className="h-full w-full relative z-10 md:max-w-md mx-auto bg-black/20 shadow-2xl overflow-hidden flex flex-col md:border-x border-white/5">
        <div className="flex-1 overflow-hidden relative">
            {view === 'home' && renderHome()}
            {view === 'list' && renderList()}
            {view === 'interpretation' && renderInterpretation()}
        </div>

        {/* Navigation Bar (Bottom) - Only show if not recording/processing */}
        {!isProcessing && (
          <nav className="h-24 pb-2 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-6 relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <button 
                onClick={() => setView('list')}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300 ${view === 'list' ? 'text-violet-300' : 'text-slate-600 hover:text-slate-400'}`}
                aria-label="Journal"
            >
                <List className={`w-6 h-6 ${view === 'list' ? 'scale-110 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : ''}`} />
                <span className="text-[10px] tracking-widest uppercase font-semibold">Journal</span>
            </button>

            <button 
                onClick={() => setView('home')}
                className={`-mt-12 w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center text-white transition-all duration-300 active:scale-95 ${view === 'home' ? 'ring-4 ring-violet-500/20' : ''}`}
                aria-label="Record"
            >
                <Mic className="w-8 h-8 fill-current" />
            </button>

             <button 
                onClick={() => setView('interpretation')}
                className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300 ${view === 'interpretation' ? 'text-indigo-300' : 'text-slate-600 hover:text-slate-400'}`}
                aria-label="Interpret"
            >
                <Brain className={`w-6 h-6 ${view === 'interpretation' ? 'scale-110 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]' : ''}`} />
                <span className="text-[10px] tracking-widest uppercase font-semibold">Oracle</span>
            </button>
            
          </nav>
        )}
      </main>
    </div>
  );
}