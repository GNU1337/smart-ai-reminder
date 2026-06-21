import React, { useState, useRef } from 'react';
import { MemoItem } from '../types';
import { Bookmark, Plus, Trash2, Calendar, Star, HelpCircle, Bell, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MemoBankProps {
  memos: MemoItem[];
  onAddMemo: (memo: MemoItem) => void;
  onDeleteMemo: (id: string) => void;
}

export default function MemoBank({ memos, onAddMemo, onDeleteMemo }: MemoBankProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [alarmTime, setAlarmTime] = useState('');

  // Speech Recognition States
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningContent, setIsListeningContent] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const toggleSpeechRecognition = (target: 'title' | 'content') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Webb-taligenkänning (Web Speech API) stöds tyvärr inte i din nuvarande webbläsare. Prova Google Chrome eller Safari.');
      setTimeout(() => setSpeechError(null), 5000);
      return;
    }

    const isCurrentlyListening = target === 'title' ? isListeningTitle : isListeningContent;

    if (isCurrentlyListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    // Stop any active recognition before starting a new one
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'sv-SE';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setSpeechError(null);
      if (target === 'title') {
        setIsListeningTitle(true);
        setIsListeningContent(false);
      } else {
        setIsListeningContent(true);
        setIsListeningTitle(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError('Mikrofonåtkomst nekades. Kontrollera behörigheterna för fliken och mikrofonen.');
      } else {
        setSpeechError(`Ett röstigenkänningsfel uppstod: ${event.error}`);
      }
      cleanup();
    };

    recognition.onend = () => {
      cleanup();
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        const formattedText = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        if (target === 'title') {
          setTitle(prev => prev ? `${prev} ${formattedText}` : formattedText);
        } else {
          setContent(prev => prev ? `${prev} ${formattedText}` : formattedText);
        }
      }
    };

    const cleanup = () => {
      setIsListeningTitle(false);
      setIsListeningContent(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      cleanup();
    }
  };

  const preSeeds = [
    { title: 'Tvättid', content: 'Glöm inte vår tvättid kl 18:00 ikväll (bokad i källaren).', isImportant: true, alarmTime: '17:30' },
    { title: 'Mediciner', content: 'Ta de blå vitaminerna i skåpet direkt efter frukost klockan 08:30.', isImportant: true, alarmTime: '08:30' },
    { title: 'Hitta Saker', content: 'Reservnyckeln till ytterdörren hänger på kroken precis innanför skafferiet.', isImportant: false },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    // Shut down active speech recognition if form is submitted
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    onAddMemo({
      id: Date.now().toString(),
      title,
      content,
      date: new Date().toLocaleDateString('sv-SE'),
      isImportant,
      alarmTime: alarmTime || undefined,
    });

    setTitle('');
    setContent('');
    setIsImportant(false);
    setAlarmTime('');
    setShowForm(false);
  };

  const handleApplySeed = (seed: typeof preSeeds[0]) => {
    onAddMemo({
      id: Date.now().toString(),
      title: seed.title,
      content: seed.content,
      date: new Date().toLocaleDateString('sv-SE'),
      isImportant: seed.isImportant,
      alarmTime: seed.alarmTime,
    });
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Description card */}
      <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-2.5">
        <div className="p-1.5 bg-slate-900 rounded-xl text-sky-400 mt-0.5 border border-slate-800 shrink-0">
          <Bookmark size={14} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-200">Dina permanenta kom ihåg-saker</p>
          <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-0.5">
            Saker du brukar glömma bort (t.ex. mediciner, wifi-koder, nycklars placering eller Anna-avtal).
            Dessa bifogas till dina AI-dygnsrapporter automatiskt.
          </p>
        </div>
      </div>

      {/* Trigger addition */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Minnesanteckningar ({memos.length})</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold tracking-tight cursor-pointer"
          id="btn-add-memo"
        >
          <Plus size={14} className="stroke-[2.5]" /> Skapa minne
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onSubmit={handleSubmit}
          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
          id="add-memo-form"
        >
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ny minnespunkt</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Avbryt
            </button>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex justify-between items-center">
              <span>Vad rör det?</span>
              {isListeningTitle && (
                <span className="text-[9px] text-rose-450 animate-pulse font-mono lowercase font-semibold">Tala nu...</span>
              )}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex. 'Medicindos' eller 'Var ligger nyckeln?'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2 pr-10 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-650"
                required
              />
              <button
                type="button"
                onClick={() => toggleSpeechRecognition('title')}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListeningTitle
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'text-slate-500 hover:text-slate-350 hover:bg-slate-850'
                }`}
                title="Diktera med röst"
              >
                {isListeningTitle ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-sans flex justify-between items-center">
              <span>Kom-ihåg text</span>
              {isListeningContent && (
                <span className="text-[9px] text-rose-450 animate-pulse font-mono lowercase font-semibold">Tala nu...</span>
              )}
            </label>
            <div className="relative">
              <textarea
                placeholder="Ex: 'Koden till cykelrummet är 1492.'"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full text-xs p-2 pr-10 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-sans placeholder-slate-650"
                required
              ></textarea>
              <button
                type="button"
                onClick={() => toggleSpeechRecognition('content')}
                className={`absolute right-2 top-2.5 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListeningContent
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'text-slate-500 hover:text-slate-350 hover:bg-slate-850'
                }`}
                title="Diktera med röst"
              >
                {isListeningContent ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
            </div>
          </div>

          {speechError && (
            <div className="text-[10px] text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {speechError}
            </div>
          )}

          {(isListeningTitle || isListeningContent) && (
            <div className="text-[10px] text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl flex items-center gap-1.5 animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-550"></span>
              </span>
              <span>Lyssnar på svenska... Tala nu och tryck på mikrofonen igen när du är klar.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
            <div className="flex items-center py-2">
              <input
                type="checkbox"
                id="isImportant"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="rounded bg-slate-900 border-slate-800 text-sky-550 focus:ring-sky-500 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="isImportant" className="ml-2 text-xs font-medium text-slate-400 select-none cursor-pointer">
                Mycket viktig (visas högst upp)
              </label>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-sans flex items-center gap-1">
                <Bell size={10} className="text-sky-400" /> Sätt dagligt larm
              </label>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full text-xs p-1.5 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-500 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-sky-400 transition-colors cursor-pointer"
          >
            Spara i minnesbanken
          </button>
        </motion.form>
      )}

      {/* Seed helper when empty */}
      {memos.length === 0 && (
        <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-2">
          <p className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">Fordon att minnas (Exempel):</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {preSeeds.map((seed, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySeed(seed)}
                className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left rounded-xl text-[10px] transition-colors flex flex-col justify-between group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <p className="font-bold text-slate-200 truncate">{seed.title}</p>
                  {seed.isImportant && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                </div>
                <p className="text-[9px] text-slate-500 line-clamp-1 mt-1 leading-tight">{seed.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Render list of memos */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {memos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-850 flex flex-col items-center justify-center"
            >
              <div className="p-2.5 bg-slate-900 rounded-full mb-2.5 text-slate-550 border border-slate-800">
                <Bookmark size={16} />
              </div>
              <p className="text-xs font-bold text-slate-300">Minnesbanken är tom</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Skriv ner återkommande eller svåra saker att hålla i huvudet, så påminner AI dig i rapporterna.
              </p>
            </motion.div>
          ) : (
            memos.map((memo) => (
              <motion.div
                key={memo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-3 bg-slate-950/40 hover:bg-slate-900 border rounded-2xl transition-all relative flex flex-col gap-1.5 ${
                  memo.isImportant ? 'border-amber-500/30' : 'border-slate-800/80'
                }`}
                id={`memo-${memo.id}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-slate-500">
                    <Calendar size={11} />
                    <span className="font-mono">{memo.date}</span>
                    {memo.isImportant && (
                      <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded-md text-[8px] font-bold border border-amber-500/10 flex items-center gap-0.5 uppercase tracking-wide">
                        <Star size={8} className="fill-amber-400 text-amber-400" /> Viktig
                      </span>
                    )}
                    {memo.alarmTime && (
                      <span className="px-1.5 py-0.5 bg-sky-500/15 text-sky-400 rounded-md text-[8px] font-bold border border-sky-500/10 flex items-center gap-0.5 uppercase tracking-wide">
                        <Bell size={8} className="text-sky-400 fill-sky-400/10 animate-pulse" /> Larm: {memo.alarmTime}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteMemo(memo.id)}
                    className="text-slate-600 hover:text-slate-400 p-1 rounded-lg transition-colors cursor-pointer"
                    aria-label="Radera minne"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 leading-tight">{memo.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans whitespace-pre-line">{memo.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
