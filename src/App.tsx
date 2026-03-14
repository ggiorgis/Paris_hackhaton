import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, ArrowRight, Lightbulb, FlaskConical, Loader2, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { generateSynthesisMap, generateBrainstormingCanvas, runCustomExperiment, PdfDocument, PlotData, CustomExperimentResult } from './services/geminiService';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Phase = 0 | 1 | 2 | 3;

export default function App() {
  const [phase, setPhase] = useState<Phase>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 0 Data
  const [goal, setGoal] = useState('');
  const [pdfs, setPdfs] = useState<PdfDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase 1 Data
  const [synthesisMap, setSynthesisMap] = useState('');
  const [idea, setIdea] = useState('');

  // Phase 2 Data
  const [brainstormingCanvas, setBrainstormingCanvas] = useState('');
  const [customExperiment, setCustomExperiment] = useState('');

  // Phase 3 Data
  const [experimentResult, setExperimentResult] = useState<CustomExperimentResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (pdfs.length + files.length > 3) {
      setError("Please upload a maximum of 3 PDFs total.");
      return;
    }
    
    const newPdfs: PdfDocument[] = [...pdfs];
    for (const file of files) {
      if (file.type !== 'application/pdf') {
        setError("Only PDF files are allowed.");
        return;
      }
      const reader = new FileReader();
      const promise = new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          newPdfs.push({
            name: file.name,
            mimeType: file.type,
            data: base64
          });
          resolve();
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      await promise;
    }
    setPdfs(newPdfs);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePhase1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim() || pdfs.length === 0) {
      setError("Please provide a research goal and upload at least 1 PDF.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateSynthesisMap(goal, pdfs);
      setSynthesisMap(result);
      setPhase(1);
    } catch (err: any) {
      setError(err.message || "Failed to generate Synthesis Map.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhase2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) {
      setError("Please propose an idea.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateBrainstormingCanvas(goal, pdfs, synthesisMap, idea);
      setBrainstormingCanvas(result);
      setPhase(2);
    } catch (err: any) {
      setError(err.message || "Failed to generate Brainstorming Canvas.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhase3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customExperiment.trim()) {
      setError("Please describe the experiment you want to try.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await runCustomExperiment(goal, pdfs, synthesisMap, idea, brainstormingCanvas, customExperiment);
      setExperimentResult(result);
      setPhase(3);
    } catch (err: any) {
      setError(err.message || "Failed to run custom experiment.");
    } finally {
      setLoading(false);
    }
  };

  const resetApp = () => {
    setPhase(0);
    setGoal('');
    setPdfs([]);
    setSynthesisMap('');
    setIdea('');
    setBrainstormingCanvas('');
    setCustomExperiment('');
    setExperimentResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="font-mono text-sm font-semibold tracking-widest text-emerald-400 uppercase">
              The Vibe-Research Engine
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className={phase >= 0 ? "text-emerald-400" : ""}>01. SYNTHESIS</span>
            <span className="opacity-50">/</span>
            <span className={phase >= 1 ? "text-emerald-400" : ""}>02. BRAINSTORM</span>
            <span className="opacity-50">/</span>
            <span className={phase >= 2 ? "text-emerald-400" : ""}>03. EXPERIMENT</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}

          {phase === 0 && (
            <motion.div
              key="phase0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-white">Initialize Research Protocol</h2>
                <p className="text-slate-400">Upload 2-3 foundational papers and define your core objective.</p>
              </div>

              <form onSubmit={handlePhase1Submit} className="space-y-8">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Research Goal
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., I want to find a way to optimize attention mechanisms in transformers for long-context windows without quadratic scaling..."
                    className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Foundational Literature (PDFs)
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      multiple
                      accept="application/pdf"
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-400 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500">Maximum 3 PDFs</p>
                  </div>

                  {pdfs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {pdfs.map((pdf, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/50 border border-white/10 rounded-lg p-3 group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span className="text-sm truncate text-slate-300">{pdf.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPdfs(pdfs.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !goal.trim() || pdfs.length === 0}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Extracting Vibe...
                    </>
                  ) : (
                    <>
                      Generate Synthesis Map
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {phase === 1 && (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="font-mono text-sm text-emerald-400">01</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">The Synthesis Map</h2>
                </div>
                <MarkdownRenderer content={synthesisMap} />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-emerald-400" />
                    Propose an Idea
                  </h3>
                  <p className="text-sm text-slate-400">Based on the synthesis above, what's your intuition for a novel approach?</p>
                </div>
                <form onSubmit={handlePhase2Submit} className="space-y-4">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g., What if we use a sparse memory matrix that only updates when the attention entropy drops below a certain threshold?"
                    className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !idea.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Idea...
                      </>
                    ) : (
                      <>
                        Generate Brainstorming Canvas
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="font-mono text-sm text-emerald-400">02</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">The Brainstorming Canvas</h2>
                </div>
                <MarkdownRenderer content={brainstormingCanvas} />
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-emerald-400" />
                    Design Your Custom Experiment
                  </h3>
                  <p className="text-sm text-slate-400">
                    Based on the methodologies above, describe the experiment you'd like me to run. I will write the code, execute it, and plot the results.
                  </p>
                </div>
                <form onSubmit={handlePhase3Submit} className="space-y-4">
                  <textarea
                    value={customExperiment}
                    onChange={(e) => setCustomExperiment(e.target.value)}
                    placeholder="e.g., Let's run a simulation comparing the new sparse memory matrix approach against a standard dense attention mechanism over 1000 iterations..."
                    className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !customExperiment.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Experiment...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Execute Custom Experiment
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {phase === 3 && experimentResult && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="bg-slate-900/30 border border-white/10 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="font-mono text-sm text-emerald-400">03</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Experiment Results</h2>
                </div>
                
                <MarkdownRenderer content={experimentResult.report} />

                {experimentResult.plotData && experimentResult.plotData.data && experimentResult.plotData.data.length > 0 && (
                  <div className="mt-12 space-y-6">
                    <h3 className="text-xl font-semibold text-white border-b border-white/10 pb-2">
                      {experimentResult.plotData.title}
                    </h3>
                    <div className="h-[400px] w-full bg-slate-900/50 rounded-xl p-4 border border-white/10">
                      <ResponsiveContainer width="100%" height="100%">
                        {experimentResult.plotData.plotType === 'line' ? (
                          <LineChart data={experimentResult.plotData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="x" stroke="#94a3b8" label={{ value: experimentResult.plotData.xAxisLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                            <YAxis stroke="#94a3b8" label={{ value: experimentResult.plotData.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Line type="monotone" dataKey="y" stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399', r: 4 }} activeDot={{ r: 6 }} name={experimentResult.plotData.yAxisLabel} />
                          </LineChart>
                        ) : experimentResult.plotData.plotType === 'bar' ? (
                          <BarChart data={experimentResult.plotData.data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="x" stroke="#94a3b8" label={{ value: experimentResult.plotData.xAxisLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                            <YAxis stroke="#94a3b8" label={{ value: experimentResult.plotData.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Bar dataKey="y" fill="#34d399" radius={[4, 4, 0, 0]} name={experimentResult.plotData.yAxisLabel} />
                          </BarChart>
                        ) : (
                          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="x" type="number" stroke="#94a3b8" label={{ value: experimentResult.plotData.xAxisLabel, position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                            <YAxis dataKey="y" type="number" stroke="#94a3b8" label={{ value: experimentResult.plotData.yAxisLabel, angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                            <Legend verticalAlign="top" height={36} />
                            <Scatter name={experimentResult.plotData.yAxisLabel} data={experimentResult.plotData.data} fill="#34d399" />
                          </ScatterChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={resetApp}
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Start New Research Protocol
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
