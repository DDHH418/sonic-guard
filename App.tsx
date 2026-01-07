
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Activity, 
  History as HistoryIcon, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Upload, 
  AlertCircle,
  Quote,
  TrendingUp
} from 'lucide-react';
import DecibelMeter from './components/DecibelMeter';
import NoiseHistoryChart from './components/NoiseHistoryChart';
import Visualizer from './components/Visualizer';
import { DailySummary, AIInsights } from './types';
import { storageService } from './services/storage';
import { getNoiseInsights } from './services/geminiService';
import { FUNNY_QUOTES, DEFAULT_PREVENTION_TIPS } from './constants';

const App: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [dbLevel, setDbLevel] = useState(0);
  const [history, setHistory] = useState<DailySummary[]>([]);
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Buffer for local averaging
  const currentReadings = useRef<number[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const fetchInsights = useCallback(async (data: DailySummary[]) => {
    if (data.length === 0) return;
    setIsLoadingInsights(true);
    try {
      const result = await getNoiseInsights(data);
      setInsights(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      
      setIsMonitoring(true);
      setError(null);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      intervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Simple mapping from 0-255 to roughly 30-110 dB
        const db = Math.max(30, Math.min(110, 30 + (average / 2.5)));
        setDbLevel(db);
        currentReadings.current.push(db);
      }, 100);

    } catch (err) {
      console.error(err);
      setError("Microphone access denied. Please allow permissions.");
    }
  };

  const stopMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Process session for storage
    if (currentReadings.current.length > 0) {
      const avg = currentReadings.current.reduce((a, b) => a + b, 0) / currentReadings.current.length;
      const peak = Math.max(...currentReadings.current);
      const today = new Date().toISOString().split('T')[0];
      
      const newSummary: DailySummary = {
        date: today,
        averageDb: Math.round(avg),
        peakDb: Math.round(peak),
        exposureMinutes: Math.round(currentReadings.current.length / 600) // approx
      };
      
      storageService.addDailyReading(newSummary);
      const updatedHistory = storageService.getHistory();
      setHistory(updatedHistory);
      fetchInsights(updatedHistory);
      currentReadings.current = [];
    }

    setIsMonitoring(false);
    setDbLevel(0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate "upload & analyze"
    setIsLoadingInsights(true);
    setTimeout(() => {
      alert("Noise file analyzed! Adding simulated data to history.");
      const mockSummary: DailySummary = {
        date: new Date().toISOString().split('T')[0],
        averageDb: 72,
        peakDb: 95,
        exposureMinutes: 45
      };
      storageService.addDailyReading(mockSummary);
      const updatedHistory = storageService.getHistory();
      setHistory(updatedHistory);
      fetchInsights(updatedHistory);
      setIsLoadingInsights(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Sonic<span className="text-blue-500">Guard</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Log</span>
              <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*,.csv" />
            </label>
            <button 
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all ${
                isMonitoring 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isMonitoring ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isMonitoring ? 'Stop Recording' : 'Live Monitor'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Real-time & History */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Real-time Monitor Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" /> Live Environment
              </h2>
              {isMonitoring && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Recording</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <DecibelMeter db={dbLevel} />
              <div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  SonicGuard tracks ambient noise in real-time. Continuous exposure above 85dB can cause permanent hearing damage.
                </p>
                <Visualizer analyser={analyserRef.current} />
              </div>
            </div>
          </section>

          {/* History Chart Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Pollution Prediction & Trends
              </h2>
            </div>
            <NoiseHistoryChart data={history} />
          </section>

        </div>

        {/* Right Column: AI Insights & Prevention */}
        <div className="space-y-8">
          
          {/* AI Insights Card */}
          <section className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-bold">Health Insights</h2>
            </div>

            {isLoadingInsights ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Analysis</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {insights?.summary || "Record a session to get personalized AI noise pollution analysis and predictions."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">Weekly Noise Budget</h3>
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                    <p className="text-lg font-bold text-white mono">{insights?.remainingBudget || "7/7 Clear Days"}</p>
                    <p className="text-[10px] text-slate-500 mt-1">BASED ON WHO SAFETY STANDARDS</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3">Preventions</h3>
                  <ul className="space-y-3">
                    {(insights?.preventionTips || DEFAULT_PREVENTION_TIPS).map((tip, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="w-5 h-5 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* Funny Quotes Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 italic text-slate-400 relative overflow-hidden group">
            <Quote className="absolute -top-4 -right-4 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity" />
            <div className="relative z-10">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Sonic Humor</h2>
              <div className="space-y-6">
                {(insights?.funnyQuotes || FUNNY_QUOTES.slice(0, 2)).map((quote, i) => (
                  <p key={i} className="text-sm leading-relaxed">
                    "{quote}"
                  </p>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-4 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <HistoryIcon className="w-3 h-3" /> {history.length} Days Tracked
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3" /> Storage Local
            </span>
          </div>
          <div>
            Powered by Gemini AI 3.0
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
