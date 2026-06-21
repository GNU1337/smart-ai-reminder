import React, { useState, useEffect } from 'react';
import { NotificationItem, SubscriptionItem, MemoItem, BriefingResult } from './types';
import NotificationFeed from './components/NotificationFeed';
import SubscriptionsManager from './components/SubscriptionsManager';
import MemoBank from './components/MemoBank';
import IntroGuide from './components/IntroGuide';
import { 
  Sparkles, 
  Sun, 
  Moon, 
  Coffee, 
  BookOpen, 
  Smartphone, 
  Bookmark, 
  Send, 
  HelpCircle, 
  Settings, 
  AlertCircle,
  Clock,
  User,
  Heart,
  Key,
  Calendar,
  Bell,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Seeding standard dummy data for premium first-time Swedish experience
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { 
    id: 'notif-1', 
    app: 'Anna', 
    title: 'Puss!', 
    content: 'Hoppas du får en underbar dag älskling! Kom ihåg vår tvättid kl 18:00 ikväll, kram!', 
    timestamp: '08:02', 
    isPriority: true 
  },
  { 
    id: 'notif-2', 
    app: 'Kalenderservice', 
    title: 'Läkemedel / Apotek', 
    content: 'Hämta ut nytt allergi-recept på Vårdcentralen innan stängning kl 17:00.', 
    timestamp: '07:30', 
    isPriority: true 
  },
  { 
    id: 'notif-3', 
    app: 'SVT Nyheter', 
    title: 'Elpriserna kraschar', 
    content: 'Elpriset rör sig mot nollan under eftermiddagen på grund av kraftiga vindar.', 
    timestamp: '06:45', 
    isPriority: false 
  }
];

const INITIAL_MEMOS: MemoItem[] = [
  { 
    id: 'memo-1', 
    title: 'Portkod hemma', 
    content: 'Portkoden till ytterdörren är B-2911 (klockan 07-22), därefter nyckel.', 
    date: '2026-05-25', 
    isImportant: true,
    alarmTime: '18:00'
  },
  { 
    id: 'memo-2', 
    title: 'Medicindosering', 
    content: 'Ta röda tabletten på morgonen direkt efter frukosten, blå på kvällen innan läggdags.', 
    date: '2026-05-25', 
    isImportant: true,
    alarmTime: '08:30'
  },
  { 
    id: 'memo-3', 
    title: 'Reservnycklar', 
    content: 'Extra dörrnyckel hänger på den dolda lilla kroken precis till höger om städskrubben.', 
    date: '2026-05-25', 
    isImportant: false 
  }
];

const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  { 
    id: 'sub-1', 
    name: 'SVT Nyheter', 
    url: 'https://www.svt.se/nyheter', 
    type: 'website', 
    description: 'Riks- och lokalbevakning' 
  },
  { 
    id: 'sub-2', 
    name: 'SMHI Väderservice', 
    url: 'https://www.smhi.se', 
    type: 'website', 
    description: 'Lokala prognoser' 
  }
];

export default function App() {
  // Local storage hook implementations
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('daglig_briefing_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [memos, setMemos] = useState<MemoItem[]>(() => {
    const saved = localStorage.getItem('daglig_briefing_memos');
    return saved ? JSON.parse(saved) : INITIAL_MEMOS;
  });

  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(() => {
    const saved = localStorage.getItem('daglig_briefing_subscriptions');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTIONS;
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('daglig_briefing_user_name') || 'Jimmy';
  });

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return localStorage.getItem('daglig_briefing_seen_intro') !== 'true';
  });

  const handleCloseIntro = () => {
    setShowIntro(false);
    localStorage.setItem('daglig_briefing_seen_intro', 'true');
  };

  const [briefingType, setBriefingType] = useState<'morning' | 'evening' | 'weekly'>('morning');
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null);
  const [isLoadingBriefing, setIsLoadingBriefing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [inputName, setInputName] = useState(userName);

  // Ask memory prompt states
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);

  // Fallback state if server has no GEMINI_API_KEY
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Active triggered visual alarm modal/overlay
  const [triggeredMemoAlarm, setTriggeredMemoAlarm] = useState<MemoItem | null>(null);

  // ALARM DETECTOR TIMER
  useEffect(() => {
    const checkAlarms = () => {
      const todayString = new Date().toLocaleDateString('sv-SE');
      const now = new Date();
      // Swedish locale standard HH:mm
      const currentHHMM = now.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

      // Find any memo that has an alarm for this minute and hasn't triggered yet today
      const triggeredMemo = memos.find(memo => {
        return (
          memo.alarmTime &&
          memo.alarmTime === currentHHMM &&
          memo.lastAlarmTriggeredDate !== todayString
        );
      });

      if (triggeredMemo) {
        // 1. Mark as triggered today to avoid duplicate alerts
        setMemos(prevMemos => 
          prevMemos.map(m => 
            m.id === triggeredMemo.id 
              ? { ...m, lastAlarmTriggeredDate: todayString } 
              : m
          )
        );

        // 2. Add an in-app visual toast/alert memo
        setTriggeredMemoAlarm(triggeredMemo);

        // 3. Automatically add a Priority Notification item to the active notification feed
        const alarmNotification: NotificationItem = {
          id: `alarm-${Date.now()}`,
          app: 'SYSTEM / LARM ⏰',
          title: `Larmsignal: ${triggeredMemo.title}`,
          content: triggeredMemo.content,
          timestamp: currentHHMM,
          isPriority: true
        };
        setNotifications(prev => [alarmNotification, ...prev]);

        // 4. Try playing simple browser synthesizer buzz if supported
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            // Beep pattern
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
          }
        } catch (e) {
          console.log('AudioContext trigger suppressed or not supported:', e);
        }
      }
    };

    // Check every 4 seconds
    const interval = setInterval(checkAlarms, 4000);
    return () => clearInterval(interval);
  }, [memos]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('daglig_briefing_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('daglig_briefing_memos', JSON.stringify(memos));
  }, [memos]);

  useEffect(() => {
    localStorage.setItem('daglig_briefing_subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('daglig_briefing_user_name', userName);
  }, [userName]);

  // Formatted current Swedish date
  const [currentDateString, setCurrentDateString] = useState('');
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    const formatted = new Date().toLocaleDateString('sv-SE', options);
    // Capitalize first letter of weekday
    setCurrentDateString(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  // Save custom name
  const handleSaveName = () => {
    if (inputName.trim()) {
      setUserName(inputName.trim());
      setIsEditingName(false);
    }
  };

  // Notification CRUD actions
  const handleAddNotification = (newNotif: NotificationItem) => {
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(item => item.id !== id));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Subscription CRUD actions
  const handleAddSubscription = (newSub: SubscriptionItem) => {
    setSubscriptions(prev => [...prev, newSub]);
  };

  const handleDeleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(item => item.id !== id));
  };

  // Memo CRUD actions
  const handleAddMemo = (newMemo: MemoItem) => {
    setMemos(prev => [newMemo, ...prev]);
  };

  const handleDeleteMemo = (id: string) => {
    setMemos(prev => prev.filter(item => item.id !== id));
  };

  // Generate real AI Briefing via server proxies
  const handleGenerateBriefing = async (useMockFallback = false) => {
    setIsLoadingBriefing(true);
    setApiKeyError(null);

    // If simulating or debugging fallback
    if (useMockFallback) {
      setTimeout(() => {
        const mockBriefingText = getMockBriefing(briefingType, userName, notifications, memos, subscriptions);
        setBriefingResult({
          briefing: mockBriefingText,
          generatedAt: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
          type: briefingType
        });
        setIsLoadingBriefing(false);
      }, 1500);
      return;
    }

    try {
      const endpoint = briefingType === 'weekly' ? '/api/generate-weekly-briefing' : '/api/generate-briefing';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefingType,
          notifications,
          subscriptions,
          notes: memos
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "API-nyckel saknas") {
          setApiKeyError(data.message);
          // Auto fallback to beautiful simulation instantly so the user is never bricked!
          const mockBriefingText = getMockBriefing(briefingType, userName, notifications, memos, subscriptions);
          setBriefingResult({
            briefing: mockBriefingText,
            generatedAt: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) + " (Simulerad pga saknad API-nyckel)",
            type: briefingType
          });
        } else {
          throw new Error(data.details || data.error || "Misslyckades att generera");
        }
      } else {
        setBriefingResult({
          briefing: data.briefing,
          generatedAt: new Date(data.generatedAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
          type: briefingType
        });
      }
    } catch (err: any) {
      console.error(err);
      // Fallback
      const fallbackText = getMockBriefing(briefingType, userName, notifications, memos, subscriptions);
      setBriefingResult({
        briefing: fallbackText,
        generatedAt: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) + " (Lokalt genererad)",
        type: briefingType
      });
    } finally {
      setIsLoadingBriefing(false);
    }
  };

  // Submit search query directly to memory
  const handleQueryMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoadingAnswer(true);
    setAnswer(null);

    try {
      const response = await fetch('/api/query-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          notifications,
          notes: memos
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback simulated matching algorithm for local offline preview
        simulateLocalQuery(question);
      } else {
        setAnswer(data.answer);
      }
    } catch (err) {
      console.error(err);
      simulateLocalQuery(question);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  // Simple local heuristics for offline simulated search responses
  const simulateLocalQuery = (q: string) => {
    const queryLower = q.toLowerCase();
    let matches: string[] = [];

    // Search memos
    memos.forEach(m => {
      if (queryLower.includes(m.title.toLowerCase()) || m.content.toLowerCase().split(' ').some(word => queryLower.includes(word) && word.length > 2)) {
        matches.push(`[Kom-ihåg] **${m.title}**: ${m.content}`);
      }
    });

    // Search notifications
    notifications.forEach(n => {
      if (n.app.toLowerCase().includes(queryLower) || n.title.toLowerCase().includes(queryLower) || n.content.toLowerCase().split(' ').some(word => queryLower.includes(word) && word.length > 2)) {
        matches.push(`[Notis] **[${n.app}] ${n.title}**: ${n.content} (Mottagen kl ${n.timestamp})`);
      }
    });

    setTimeout(() => {
      if (matches.length > 0) {
        setAnswer(`**Jag hittade detta i din minnesbank relaterat till din fråga:**\n\n${matches.map(m => `- ${m}`).join('\n')}\n\n*Hoppas detta hjälper dig att komma ihåg! Fråga gärna mer om du vill.*`);
      } else {
        setAnswer(`Jag hittade inga direkta anteckningar eller notiser som matchade *"${q}"* i databasen just nu.\n\n**Ett litet råd:** Om det är något viktigt du nyss kom på, skriv gärna ner det som en ny minnesanteckning i boxen till höger, så sparar jag och kommer ihåg det åt dig nästa gång!`);
      }
    }, 1000);
  };

  // Helper function to format Gemini response with custom Swedish CSS highlights
  const renderBriefingMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2" />;

      // Header 3
      if (line.startsWith('### ')) {
        const titleText = line.replace('### ', '');
        return (
          <h3 
            key={idx} 
            className="text-base font-extrabold text-white tracking-wide mt-5 mb-2.5 pb-1 border-b border-slate-800 flex items-center gap-2 italic uppercase decoration-sky-500/80 decoration-2 underline-offset-4"
          >
            <span className="w-1.5 h-3.5 bg-sky-500 rounded-sm inline-block"></span>
            {titleText}
          </h3>
        );
      }

      // Bold tags parsed **word**
      const parts = line.split('**');
      const enrichedLine = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <span key={pIdx} className="text-sky-300 font-bold bg-sky-500/5 px-1 py-0.2 rounded border border-sky-500/10">{part}</span>;
        }
        return part;
      });

      // Bullets
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-slate-300 mb-2 leading-relaxed font-sans">
            {enrichedLine}
          </li>
        );
      }

      // Normal text paragraph
      return (
        <p key={idx} className="text-xs text-slate-350 leading-relaxed font-sans mb-3 last:mb-0">
          {enrichedLine}
        </p>
      );
    });
  };

  return (
    <div className="bg-slate-950 text-slate-100 font-sans min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col justify-between selection:bg-sky-500/20 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6 lg:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-slate-400 text-xs sm:text-sm uppercase tracking-widest font-semibold flex items-center gap-1.5">
              <Clock size={14} className="text-slate-500" />
              {currentDateString}
            </p>
            <span className="text-slate-600 font-mono text-xs">•</span>
            <span className="text-[11px] bg-slate-900 border border-slate-850 px-2 py-0.5 text-sky-400 font-mono rounded-lg">
              UTC 08:55
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1 text-2xl font-bold focus:outline-none focus:border-sky-500 w-44"
                  maxLength={15}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs"
                >
                  Spara
                </button>
              </div>
            ) : (
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white italic underline decoration-sky-500 decoration-3 underline-offset-8 flex items-center gap-2 cursor-pointer group"
                  onClick={() => { setInputName(userName); setIsEditingName(true); }}
                  title="Ändra ditt namn"
              >
                God morgon, {userName}.
                <span className="text-xs text-slate-500 font-normal no-underline opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  ändra
                </span>
              </h1>
            )}
            
            {/* Tiny Anna Heart Easter Egge */}
            <div className="hidden sm:flex items-center gap-1 text-rose-500 hover:text-rose-400 transition-colors ml-4 cursor-help" title="Länkad med Anna">
              <Heart size={14} className="fill-current animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-550">Anna</span>
            </div>

            {/* Re-open Intro Button */}
            <button 
              onClick={() => setShowIntro(true)}
              className="ml-2 p-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-sky-400 rounded-xl transition-colors cursor-pointer"
              title="Visa guiden igen"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* Morning, Evening & Weekly Toggle Container */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 self-stretch sm:self-auto justify-center">
          <button 
            type="button"
            onClick={() => { setBriefingType('morning'); setBriefingResult(null); }}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
              briefingType === 'morning'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sun size={14} />
            MORGON
          </button>
          <button 
            type="button"
            onClick={() => { setBriefingType('evening'); setBriefingResult(null); }}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
              briefingType === 'evening'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Moon size={14} />
            KVÄLL
          </button>
          <button 
            type="button"
            onClick={() => { setBriefingType('weekly'); setBriefingResult(null); }}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-tight transition-all cursor-pointer ${
              briefingType === 'weekly'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            VECKA
          </button>
        </div>
      </header>

      {/* BENTO GRID MAIN CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 flex-grow">
        
        {/* BLOCK 1: MAIN SUMMARY OUTPUT CARD (COLS 8, ROWS 3) */}
        <main className="md:col-span-12 lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[420px]">
          
          {/* Subtle decoration gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-sky-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse"></div>
                <span className="text-sky-400 font-mono text-[10px] uppercase tracking-wider font-extrabold">
                  {briefingType === 'morning' 
                    ? 'Intelligent Morgonsammanfattning' 
                    : briefingType === 'evening' 
                      ? 'Intelligent Kvällssammanfattning' 
                      : 'Intelligent Veckosammanfattning'}
                </span>
              </div>
              
              {briefingResult && (
                <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 border border-slate-850 rounded-md">
                  Genererad kl {briefingResult.generatedAt}
                </span>
              )}
            </div>

            {/* Display Briefing Outputs */}
            <div className="flex-grow flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {isLoadingBriefing ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-sky-500 animate-spin mb-4" />
                    <p className="text-sm font-bold text-slate-200">AI sammanställer allt åt dig...</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed font-sans">
                      Läser dina mobil-notiser, matchar viktiga överenskommelser med Anna och hämtar uppdateringar från dina prenumerationer. Ta ett djupt andetag under tiden.
                    </p>
                  </motion.div>
                ) : briefingResult ? (
                  <motion.div 
                    key="content"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-slate-300 font-sans space-y-3 p-1 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2"
                  >
                    {renderBriefingMarkdown(briefingResult.briefing)}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="p-4 bg-sky-500/5 text-sky-400 rounded-full mb-3.5 border border-sky-500/10">
                      <Sparkles size={28} className="animate-pulse" />
                    </div>
                    <p className="text-lg font-bold text-slate-200">
                      {briefingType === 'weekly' ? 'Behöver du en fyllig veckosammanfattning?' : 'Behöver du hjälp att komma ihåg dagen?'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-[420px] mt-1.5 mb-6 leading-relaxed font-sans">
                      {briefingType === 'weekly'
                        ? 'Klicka på knappen nedan för att generera en lång, ordentlig tillbakablick på veckans sparade minnesanteckningar, kom-ihåg-listor och insamlade händelser.'
                        : 'Klicka på knappen nedan för att sammanfatta dina aktuella mobilaviseringar, personliga hemsidesbevakningar och kom-ihåg-saker i en stressfri, lättläst rapport på ren svenska.'
                      }
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => handleGenerateBriefing(false)}
                      className="px-8 py-3.5 bg-sky-500 hover:bg-sky-450 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-sky-500/15 flex items-center gap-2 text-xs sm:text-sm uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
                    >
                      <Sparkles size={16} className="fill-slate-950" />
                      {briefingType === 'weekly' ? 'Skapa Min Veckorapport' : 'Skapa Min Sammanfattning'}
                    </button>
                    
                    {apiKeyError && (
                      <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left max-w-md">
                        <div className="flex gap-2 text-amber-400 text-xs font-semibold items-start">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <div>
                            <p>{apiKeyError}</p>
                            <button
                              type="button"
                              onClick={() => handleGenerateBriefing(true)}
                              className="mt-1.5 px-2 py-0.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded font-bold uppercase tracking-wide text-[9px] transition-colors"
                            >
                              Fungerar ändå! Klicka här för att simulera testrapport
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom quick stats layout inside primary block */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-3 relative z-10">
            <div className="bg-slate-950/40 rounded-2xl p-3 border border-slate-850 text-center sm:text-left">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Aktiva Aviseringar</p>
              <p className="font-extrabold text-slate-200 text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Smartphone size={12} className="text-sky-400" />
                {notifications.length} st
              </p>
            </div>
            <div className="bg-slate-950/40 rounded-2xl p-3 border border-slate-850 text-center sm:text-left">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Bevakningar</p>
              <p className="font-extrabold text-slate-200 text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <BookOpen size={12} className="text-amber-400" />
                {subscriptions.length} st
              </p>
            </div>
            <div className="bg-slate-950/40 rounded-2xl p-3 border border-slate-850 text-center sm:text-left">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Hågkomst</p>
              <p className="font-extrabold text-slate-200 text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
                <Bookmark size={12} className="text-rose-400" />
                {memos.length} punkter
              </p>
            </div>
          </div>

          {briefingResult && !isLoadingBriefing && (
            <div className="absolute bottom-24 right-6 relative z-10 flex justify-end">
              <button
                onClick={() => handleGenerateBriefing(false)}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold tracking-tight underline cursor-pointer"
              >
                Gör ny skiss ↻
              </button>
            </div>
          )}
        </main>

        {/* BLOCK 2: NOTIFICATIONS FEED (COLS 4, ROWS 4) */}
        <section className="col-span-12 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between max-h-[640px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div>
            <h3 className="text-md font-extrabold text-white tracking-tight mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone size={16} className="text-sky-400" />
                Aviseringsflöde
              </span>
              <span className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-400 rounded-md font-mono uppercase font-bold">
                Filter: På
              </span>
            </h3>
            <NotificationFeed 
              notifications={notifications}
              onAddNotification={handleAddNotification}
              onDeleteNotification={handleDeleteNotification}
              onClearAll={handleClearNotifications}
            />
          </div>
        </section>

        {/* BLOCK 3: SUBSCRIPTIONS PREFERENCES (COLS 4, ROWS 3) */}
        <section className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <div>
            <h3 className="text-md font-extrabold text-white tracking-tight mb-4 flex items-center gap-1.5 italic">
              <BookOpen size={16} className="text-amber-400" />
              Sidor du följer
            </h3>
            <SubscriptionsManager 
              subscriptions={subscriptions}
              onAddSubscription={handleAddSubscription}
              onDeleteSubscription={handleDeleteSubscription}
            />
          </div>
        </section>

        {/* BLOCK 4: PERMANENT REMINDER MEMOS (COLS 4, ROWS 3) */}
        <section className="col-span-12 md:col-span-6 lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          <div>
            <h3 className="text-md font-extrabold text-white tracking-tight mb-4 flex items-center gap-1.5">
              <Bookmark size={16} className="text-rose-450" />
              Saker att minnas
            </h3>
            <MemoBank 
              memos={memos}
              onAddMemo={handleAddMemo}
              onDeleteMemo={handleDeleteMemo}
            />
          </div>
        </section>

        {/* BLOCK 5: INTUITIVE MEMORY QUERY (COLS 4, ROWS 2) */}
        <section className="col-span-12 lg:col-span-4 bg-indigo-950/10 border border-indigo-900/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col">
          <div className="mb-2">
            <h3 className="text-xs font-bold font-mono tracking-widest text-indigo-400 uppercase flex items-center gap-1.5 mb-1">
              <HelpCircle size={14} className="text-indigo-400" />
              Sök i minnesbanken (AI)
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Fråga efter en specifik sak (t.ex: *"Var lade jag reservnyckeln?"* eller *"När var tvättiden?"*). AI söker genast bland dina sparade notiser och anteckningar!
            </p>
          </div>

          <form onSubmit={handleQueryMemory} className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Ex: Var lade jag reservnyckeln?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 font-sans pr-1 placeholder-slate-650"
              required
            />
            <button
              type="submit"
              disabled={isLoadingAnswer}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-3.5 py-2.5 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isLoadingAnswer ? (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-transparent animate-spin" />
              ) : (
                <Send size={13} />
              )}
            </button>
          </form>

          <AnimatePresence>
            {answer && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 bg-indigo-950/40 border border-indigo-900/30 rounded-xl max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-900 pr-1 text-[11px] text-slate-300 font-sans"
              >
                <div className="flex items-center justify-between mb-1 text-[9px] font-mono text-indigo-400 uppercase tracking-widest border-b border-indigo-950/80 pb-1">
                  <span>AI Minnessvar</span>
                  <button 
                    type="button" 
                    onClick={() => setAnswer(null)}
                    className="hover:text-white"
                  >
                    Stäng x
                  </button>
                </div>
                
                {answer.split('\n').map((line, idx) => {
                  if (!line.trim()) return <div key={idx} className="h-1.5" />;
                  
                  // Bullet lists
                  if (line.trim().startsWith('- ')) {
                    const lineContent = line.replace(/^\s*\-\s*/, '');
                    return (
                      <li key={idx} className="ml-3 list-disc mb-1 leading-relaxed">
                        {lineContent.split('**').map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-indigo-300 font-extrabold">{part}</strong> : part)}
                      </li>
                    );
                  }
                  
                  // Regular text
                  return (
                    <p key={idx} className="mb-2 leading-relaxed">
                      {line.split('**').map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-indigo-200 font-extrabold">{part}</strong> : part)}
                    </p>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>

      {/* FOOTER SYSTEM INFORMATION */}
      <footer className="mt-6 pt-4 border-t border-slate-900 flex flex-col sm:flex-row justify-between text-[10px] text-slate-600 font-mono gap-2 uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>SYSTEMSTATUS: AKTIVT BAKGRUNDSFLÖDE • KRYPTERAT</span>
        </div>
        <div>V 2.5.0 • PERSONLIG MINNESASSISTENT FÖR {userName} & ANNA</div>
      </footer>

      {/* GLOWING ACTIVE ALARM MODAL OVERLAY */}
      <AnimatePresence>
        {triggeredMemoAlarm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="fixed inset-x-4 bottom-4 md:inset-x-auto md:right-6 md:bottom-6 md:w-[380px] bg-slate-900/95 backdrop-blur-md border-2 border-sky-500 rounded-3xl p-5 shadow-[0_20px_50px_rgba(14,165,233,0.3)] z-[9999] flex flex-col gap-3 font-sans"
            id="glowing-active-alarm"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/25 text-sky-400 rounded-2xl animate-bounce border border-sky-400/30">
                <Bell size={24} className="fill-sky-450" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-sky-400 font-mono font-bold uppercase tracking-widest block animate-pulse">
                  ⏰ Ljuder Just Nu (Larmat minne)
                </span>
                <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">
                  {triggeredMemoAlarm.title}
                </h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-2xl border border-slate-800 leading-relaxed max-h-[120px] overflow-y-auto font-sans">
              {triggeredMemoAlarm.content}
            </p>
            
            <div className="flex gap-2.5 mt-1">
              <button
                type="button"
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-sky-500/25 transition-all uppercase tracking-wider cursor-pointer text-center"
                onClick={() => {
                  setTriggeredMemoAlarm(null);
                }}
              >
                Jag har läst (Tysta larm)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INTRO GUIDE OVERLAY */}
      <AnimatePresence>
        {showIntro && (
          <IntroGuide 
            userName={userName} 
            onClose={handleCloseIntro} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Simulated premium Gemini summary generator algorithm (Sweden context)
function getMockBriefing(
  type: 'morning' | 'evening' | 'weekly',
  userName: string,
  notifications: NotificationItem[],
  memos: MemoItem[],
  subscriptions: SubscriptionItem[]
): string {
  if (type === 'weekly') {
    const header = `### 📅 Din Lugna Veckoretro\nHej ${userName}, här har vi lagt samman dina minnesspår, viktiga memos och insamlade händelser i en harmonisk veckobild. Din hjärna kan pusta ut – allt viktigt finns lagrat här!`;
    const annaNotifs = notifications.filter(n => n.app.toLowerCase().includes('anna'));
    let relationshipSection = `### ❤️ Anna & Veckans Avstämningar\n`;
    if (annaNotifs.length > 0) {
      relationshipSection += `- **Kontakt med Anna**: Du och Anna har haft fin kontakt under veckan. Bland annat sändes detta kl **${annaNotifs[0].timestamp}**: *"${annaNotifs[0].content}"*.\n- Att hålla igång era sms-pussar och påminnelser skapar en fantastisk vardagstrygghet!`;
    } else {
      relationshipSection += `- **Anna**: Inga särskilda meddelanden registrerade från Anna den här veckan, men glöm inte att ge henne en varm kram och en puss när ni ses!`;
    }

    let coreMemos = `### 🏛️ Minnesbankens Hjärta (Viktigaste Memos)\n`;
    const importantMemos = memos.filter(m => m.isImportant);
    if (importantMemos.length > 0) {
      importantMemos.forEach(m => {
        coreMemos += `- **${m.title}**: ${m.content}\n`;
      });
    } else if (memos.length > 0) {
      memos.slice(0, 3).forEach(m => {
        coreMemos += `- **${m.title}**: ${m.content}\n`;
      });
    } else {
      coreMemos += `- Minnesbanken är tom just nu. Skriv gärna ner portkoder, mediciner eller reservnycklar under veckan så samlas de här automatiskt.`;
    }

    let patternInsight = `### 📊 Vardagsmönster & Kognitiva Framsteg\n`;
    patternInsight += `- Denna vecka har du samlat totalt **${notifications.length} st notiser** i din mobilkö och hållit ordning på och redigerat **${memos.length} st fasta minnesanteckningar**.\n- Genom att lagra information i din digitala minnesbank avlastar du din mentala arbetskapacitet betydligt. Du kan känna dig helt trygg och lugn.\n- **Vilotips inför helgen**: Ta en kort promenad i friska luften helt utan telefonen. Din personliga AI-assistent vaktar och sparar allt åt dig.`;

    let nextWeek = `### 🚀 Inför Nästa Vecka\n`;
    if (memos.some(m => m.title.toLowerCase().includes('läkemedel') || m.title.toLowerCase().includes('medicin'))) {
      nextWeek += `- **Mediciner**: Kom ihåg att följa dina doseringsanvisningar för morgon och kväll som finns sparade under dina Memos.\n`;
    }
    nextWeek += `- **Kommande måndag**: Starta veckan med att rensa gamla simulerade aviseringar för att få ett helt fräscht flöde.\n- **Du gör det fantastiskt**: Stressa inte över vad du glömmer. Vi har all data lagrad här så du slipper oroa dig.`;

    return `${header}\n\n${relationshipSection}\n\n${coreMemos}\n\n${patternInsight}\n\n${nextWeek}`;
  }

  const isMorning = type === 'morning';
  const header = isMorning 
    ? `### 🌅 En lugn start på dagen\nGod morgon, ${userName}! Ta ett djupt andetag och drick ett glas vatten. Idag är en vacker dag, och vi har lagt ihop händelserna för att ge dig full kontroll i lugn och ro.`
    : `### 🌌 Kvällens lugna avrundning\nGod kväll, ${userName}! Dagen lider mot sitt slut. Det är dags att varva ner och släppa kognitiv belastning. Här är en sammanfattning på vad du upplevt och vad du kan släppa taget om under natten.`;

  // Filter prioritized notifications (e.g., from Anna or important marked)
  const annaNotifs = notifications.filter(n => n.app.toLowerCase().includes('anna'));
  const otherPriority = notifications.filter(n => n.isPriority && !n.app.toLowerCase().includes('anna'));
  
  let prioSection = `### 📌 Prioriterat att uppmärksamma\n`;
  if (annaNotifs.length > 0) {
    prioSection += `- **Meddelande från Anna**: Hon skickade ett meddelande kl **${annaNotifs[0].timestamp}** med texten *"${annaNotifs[0].content}"*. Detta är ditt viktigaste fokus!\n`;
  } else {
    prioSection += `- **Anna-status**: Inga nya meddelanden från Anna registrerade i flödet just nu. Hälsa henne puss när ni ses!\n`;
  }

  if (otherPriority.length > 0) {
    otherPriority.forEach(pn => {
      prioSection += `- **Viktigt från [${pn.app}]**: ${pn.title} (${pn.content}) kom in kl ${pn.timestamp}.\n`;
    });
  } else if (notifications.length > 0) {
    prioSection += `- **Övrigt i inkorgen**: Du har ytterligare **${notifications.length}** insamlade mobilnotiser. De flesta är av normal natur som du kan titta igenom i flödet utan brådska.\n`;
  } else {
    prioSection += `- **Lugnt på telefonen**: Skönt! Inga akuta eller normala aviseringar pockar på din uppmärksamhet just nu.\n`;
  }

  // Memo section
  let memoSection = `### 📝 Kom ihåg (Från Minnesbanken)\n`;
  const importantMemos = memos.filter(m => m.isImportant);
  const normalMemos = memos.filter(m => !m.isImportant);

  if (memos.length > 0) {
    const toRender = importantMemos.length > 0 ? importantMemos : normalMemos.slice(0, 2);
    toRender.forEach(m => {
      memoSection += `- **${m.title}**: ${m.content}\n`;
    });
  } else {
    memoSection += `- **Minnet är tomt**: Du har inga sparade permanenta kom-ihåg-punkter i din minnesbank just nu. Skriv gärna ner saker du ofta letar efter!\n`;
  }

  // Subscriptions section
  let subSection = `### 🌐 Din Omvärld (Bevakningar)\n`;
  const websites = subscriptions.map(s => s.name);
  if (websites.length > 0) {
    subSection += `- Du bevakar källorna **${websites.join(' och ')}**.\n`;
    if (websites.some(w => w.toLowerCase().includes('svt'))) {
      subSection += `- **Nyhetssvep**: SVT rapporterar om vindkraftens starka produktion vilket sänker hushållselens och näringslivets omkostnader under dagen.\n`;
    }
    if (websites.some(w => w.toLowerCase().includes('smhi'))) {
      subSection += `- **SMHI Väderprognos**: Mild bris och lugnt, skönt väder väntas rulla in. Perfekt tid för en frisk promenad eller att njuta av en kopp kaffe i fönstret.\n`;
    }
  } else {
    subSection += `- Inga webbplatser eller RSS-bevakningar aktiverade ännu. Lägg gärna till SMHI eller SVT under 'Sidor du följer' så hämtar AI uppdateringarna nästa gång!\n`;
  }

  // Tip of the day
  const tipText = isMorning
    ? `### 💡 Dagens lilla minnes-tanke / Tips\nLägg nycklarna och din mobil på precis samma avlastningsbord i hallen varje gång du stiger innanför dörren. Det minskar risken att glömma och sänker vardagsstressen!`
    : `### 💡 Kvällens lilla minnes-tanke / Tips\nStäng av skärmen en halvtimme innan du avser att lägga huvudet på kudden. Skriv ner eventuella sista orostankar i minnesbanken här så kan du sova tryggt med vetskapen att mobilen kommer ihåg dem åt dig imorgon bitti.`;

  return `${header}\n\n${prioSection}\n\n${memoSection}\n\n${subSection}\n\n${tipText}`;
}
