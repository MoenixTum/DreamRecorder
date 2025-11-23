import React, { useState, useEffect, useRef } from 'react';
import { DreamEntry } from '../types';
import { Calendar, ChevronDown, ChevronUp, Sparkles, Moon, Image as ImageIcon, Loader2, X, Plus, Edit2, Maximize2 } from 'lucide-react';
import { generateDreamImage } from '../services/geminiService';

interface DreamCardProps {
  dream: DreamEntry;
  onUpdate?: (dream: DreamEntry) => void;
  layout?: 'list' | 'grid';
}

const DreamCard: React.FC<DreamCardProps> = ({ dream, onUpdate, layout = 'list' }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false); // For grid view details
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editedTranscription, setEditedTranscription] = useState(dream.transcription);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if prop changes
  useEffect(() => {
    setEditedTranscription(dream.transcription);
  }, [dream.transcription]);

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    
    setIsGeneratingImg(true);
    // Use the potentially edited transcription
    const imageBase64 = await generateDreamImage(editedTranscription, dream.mood);
    setIsGeneratingImg(false);

    if (imageBase64) {
      onUpdate({
        ...dream,
        transcription: editedTranscription, // Ensure text is saved if it wasn't already
        generatedImage: imageBase64
      });
    } else {
      alert("Failed to generate image. Please try again.");
    }
  };

  const handleTranscriptionBlur = () => {
    if (onUpdate && editedTranscription !== dream.transcription) {
        onUpdate({
            ...dream,
            transcription: editedTranscription
        });
    }
  };

  const addTag = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (newTag.trim() && onUpdate) {
        onUpdate({
            ...dream,
            tags: [...dream.tags, newTag.trim()]
        });
        setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onUpdate) {
          onUpdate({
              ...dream,
              tags: dream.tags.filter(t => t !== tagToRemove)
          });
      }
  };

  const formattedDate = new Date(dream.timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const formattedTime = new Date(dream.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
  });

  // --- RENDER CONTENT (Shared between List and Modal) ---
  const renderDetails = () => (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Generated Image Section */}
        {dream.generatedImage ? (
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-2xl border border-white/10 group/img bg-black">
                <img src={dream.generatedImage} alt="Dream visual" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                <button 
                    onClick={handleGenerateImage}
                    className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-all opacity-0 group-hover/img:opacity-100"
                    title="Regenerate"
                >
                    {isGeneratingImg ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                </button>
            </div>
        ) : (
            <div className="flex justify-center py-4 bg-black/20 rounded-xl border border-white/5">
            <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImg}
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-violet-900/30 border border-violet-500/30 text-violet-100 text-sm hover:bg-violet-800/40 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] transition-all duration-300 disabled:opacity-50"
            >
                {isGeneratingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <span>{isGeneratingImg ? "Conjuring..." : "Visualize Dream"}</span>
            </button>
            </div>
        )}

        {/* Text Area */}
        <div>
            <label className="text-xs text-violet-300/40 uppercase tracking-widest mb-1 block font-semibold">Transcription</label>
            <textarea
                value={editedTranscription}
                onChange={(e) => setEditedTranscription(e.target.value)}
                onBlur={handleTranscriptionBlur}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-violet-50 text-base font-light leading-relaxed focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-y min-h-[150px] shadow-inner selection:bg-violet-500/30 font-['Quicksand']"
            />
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-white/20 flex items-center"><Edit2 className="w-3 h-3 mr-1"/> Tap to edit</span>
            </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <label className="text-xs text-violet-300/40 uppercase tracking-widest font-semibold">Tags</label>
            <div className="flex flex-wrap gap-2">
                {dream.tags.map((tag, i) => (
                <span key={i} className="flex items-center pl-3 pr-1 py-1.5 rounded-full bg-violet-900/20 text-sm text-violet-100 border border-violet-500/20 shadow-sm">
                    <Sparkles className="w-3 h-3 mr-1.5 opacity-70 text-violet-300" />
                    {tag}
                    <button 
                        onClick={(e) => removeTag(tag, e)}
                        className="ml-1.5 p-1.5 rounded-full hover:bg-red-900/40 text-violet-300 hover:text-red-200 transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
                ))}
            </div>
            {/* Add Tag Input */}
            <div className="flex items-center mt-2">
                <form onSubmit={addTag} className="flex items-center w-full">
                    <input 
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag..."
                        className="flex-1 bg-black/40 border border-white/10 rounded-l-full px-4 py-2 text-base text-white placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-all"
                    />
                    <button 
                        type="submit"
                        className="px-4 py-2 bg-violet-900/20 border border-l-0 border-white/10 rounded-r-full text-violet-200 hover:bg-violet-800/30 transition-colors h-full flex items-center justify-center"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    </div>
  );

  // --- GRID VIEW RENDER ---
  if (layout === 'grid') {
    return (
        <>
            <div 
                onClick={() => setShowModal(true)}
                className="aspect-square relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-lg group cursor-pointer active:scale-95 transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
            >
                {dream.generatedImage ? (
                    <img src={dream.generatedImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-slate-950 to-black flex items-center justify-center opacity-80">
                        <Sparkles className="w-8 h-8 text-white/10 group-hover:text-violet-400/50 transition-colors" />
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-3 flex flex-col items-start">
                    <div className="text-xs text-violet-300 font-['Cinzel'] font-bold mb-1 opacity-90">{formattedDate}</div>
                    <div className="text-sm text-white font-medium line-clamp-2 leading-tight drop-shadow-md">
                        {dream.transcription || "Untitled Dream"}
                    </div>
                    {dream.mood && (
                        <div className="mt-2 text-[10px] px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/70 backdrop-blur-sm">
                            {dream.mood}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Grid Item Details */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-slate-950 border border-violet-500/20 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                            <div>
                                <h3 className="text-violet-100 font-['Cinzel'] font-bold text-lg">Dream Details</h3>
                                <p className="text-xs text-white/40">{formattedDate} • {formattedTime}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto custom-scrollbar">
                            {renderDetails()}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
  }

  // --- LIST VIEW RENDER ---
  return (
    <div className="relative pl-6 mb-6 group font-['Quicksand']">
        {/* Timeline Connector */}
        <div className="absolute left-[-5px] top-6 w-3 h-3 rounded-full bg-violet-950 shadow-[0_0_10px_rgba(139,92,246,0.5)] z-20 border-2 border-slate-700 transition-all duration-500 group-hover:scale-125 group-hover:bg-violet-400 group-hover:border-white" />
        
        {/* Horizontal Line to Card */}
        <div className="absolute left-[-2px] top-[1.85rem] w-6 h-[2px] bg-white/5 z-10" />

        <div 
        onClick={() => setExpanded(!expanded)}
        className={`w-full relative overflow-hidden transition-all duration-500 rounded-tr-3xl rounded-bl-3xl rounded-tl-lg rounded-br-lg shadow-lg border backdrop-blur-md cursor-pointer touch-manipulation
            ${expanded 
            ? 'bg-black/60 border-violet-500/40 scale-[1.01] shadow-[0_0_30px_rgba(139,92,246,0.1)] my-4' 
            : 'bg-slate-900/40 border-white/5 active:bg-slate-900/60 hover:border-violet-500/20 hover:bg-slate-900/50'
            }`}
        >
        
        {/* Expanded Content */}
        {expanded && (
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-gradient-to-r from-violet-900/20 via-transparent to-transparent" />
        )}

        <div className="relative z-10 p-5">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
                <div className="flex items-center space-x-2 text-violet-200 text-sm font-semibold">
                    <Calendar className="w-3 h-3 opacity-50" />
                    <span>{formattedDate}</span>
                </div>
                <span className="text-xs text-white/30 ml-5">{formattedTime}</span>
            </div>
            
            <div className="flex space-x-2">
                {dream.mood && (
                    <span className="px-2 py-0.5 rounded-full bg-violet-950/60 border border-violet-500/20 text-xs text-violet-200 font-medium backdrop-blur-sm">
                    {dream.mood}
                    </span>
                )}
                <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/20 text-xs text-indigo-200 font-medium flex items-center backdrop-blur-sm">
                <Moon className="w-3 h-3 mr-1" /> {dream.lucidityScore}
                </span>
            </div>
            </div>

            {/* Content Preview or Details */}
            <div onClick={(e) => e.stopPropagation()}>
                {expanded ? (
                    renderDetails()
                ) : (
                    // Collapsed: Preview Text
                    <h3 className="text-lg text-slate-200 font-medium leading-snug tracking-wide line-clamp-2 cursor-pointer transition-colors group-hover:text-white" onClick={() => setExpanded(true)}>
                        {dream.transcription || "Audio Recording"}
                    </h3>
                )}
            </div>

            {/* Expand Indicator */}
            <div className="flex justify-center mt-3 p-1">
            {expanded ? <ChevronUp className="w-6 h-6 text-violet-500/60 animate-bounce" /> : <ChevronDown className="w-6 h-6 text-white/10" />}
            </div>
        </div>
        </div>
    </div>
  );
};

export default DreamCard;