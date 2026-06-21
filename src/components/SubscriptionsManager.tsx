import React, { useState } from 'react';
import { SubscriptionItem } from '../types';
import { Rss, Plus, Trash2, Globe, Mail, Link2, PlusCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SubscriptionsManagerProps {
  subscriptions: SubscriptionItem[];
  onAddSubscription: (sub: SubscriptionItem) => void;
  onDeleteSubscription: (id: string) => void;
}

export default function SubscriptionsManager({
  subscriptions,
  onAddSubscription,
  onDeleteSubscription,
}: SubscriptionsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'rss' | 'website' | 'newsletter'>('website');
  const [description, setDescription] = useState('');

  const preSeeds = [
    { name: 'SVT Nyheter - Riks', url: 'https://www.svt.se/nyheter', type: 'rss' as const, description: 'Lokal och global nyhetsöversikt' },
    { name: 'SMHI Väderservice', url: 'https://www.smhi.se', type: 'website' as const, description: 'Väderprognoser för din plats' },
    { name: 'MorgonNyheter Digest', url: 'newsletter@morgon.se', type: 'newsletter' as const, description: 'Viktiga dagsrubriker via mejl' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    onAddSubscription({
      id: Date.now().toString(),
      name,
      url,
      type,
      description: description || 'Bevakas automatiskt',
    });

    setName('');
    setUrl('');
    setType('website');
    setDescription('');
    setShowForm(false);
  };

  const handleApplySeed = (seed: typeof preSeeds[0]) => {
    onAddSubscription({
      id: Date.now().toString(),
      name: seed.name,
      url: seed.url,
      type: seed.type,
      description: seed.description,
    });
  };

  const getTypeIcon = (subType: string) => {
    switch (subType) {
      case 'rss':
        return <Rss size={13} className="text-amber-400" />;
      case 'newsletter':
        return <Mail size={13} className="text-sky-400" />;
      default:
        return <Globe size={13} className="text-sky-400" />;
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Intro Description */}
      <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-2.5">
        <div className="p-1.5 bg-slate-900 rounded-xl text-sky-400 mt-0.5 border border-slate-800">
          <Rss size={14} />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          Lägg till hemsidor, nyhetsbrev och RSS-flöden du vill att appen håller koll på.
          Vid morgon-/kvällssammanfattning sammanfogar AI informationen från dessa källor åt dig.
        </p>
      </div>

      {/* Trigger addition form */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Aktiva Bevakningar</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-bold tracking-tight cursor-pointer"
          id="btn-add-subscription"
        >
          <Plus size={14} className="stroke-[2.5]" /> Lägg till
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onSubmit={handleSubmit}
          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
          id="add-subscription-form"
        >
          <div className="flex justify-between items-center pb-1 border-b border-slate-900">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ny källa</span>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Avbryt
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Namn</label>
              <input
                type="text"
                placeholder="Ex. 'SVT'"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Källtyp</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500"
              >
                <option value="website">Sajt</option>
                <option value="rss">RSS</option>
                <option value="newsletter">Mejlbrev</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Källans Adress (URL / Mejl)</label>
            <input
              type="text"
              placeholder="Ex. svt.se"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-sans">Egen notering</label>
            <input
              type="text"
              placeholder="Ex: 'Kollas vid frukost'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-500 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-sky-400 transition-colors cursor-pointer"
          >
            Spara källa
          </button>
        </motion.form>
      )}

      {/* Suggested Subscriptions helper for quicker start */}
      {subscriptions.length === 0 && (
        <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-2">
          <p className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">Snabba exempel att lägga till:</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            {preSeeds.map((seed, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySeed(seed)}
                className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left rounded-xl text-[10px] transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="truncate pr-1">
                  <p className="font-bold text-slate-200 truncate">{seed.name}</p>
                  <p className="text-[8px] text-slate-500 font-mono uppercase mt-0.5">{seed.type}</p>
                </div>
                <PlusCircle size={12} className="text-slate-500 group-hover:text-sky-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions lists */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {subscriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-805 flex flex-col items-center justify-center"
            >
              <div className="p-2.5 bg-slate-900 rounded-full mb-2.5 text-slate-550 border border-slate-800">
                <Globe size={16} />
              </div>
              <p className="text-xs font-bold text-slate-300">Inga bevakningar än</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Använd snabbknappen ovan eller lägg till dina personliga hemsidor och nyheter.
              </p>
            </motion.div>
          ) : (
            subscriptions.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -15 }}
                className="p-3 bg-slate-950/40 hover:bg-slate-900/40 border border-slate-800 rounded-2xl shadow-sm transition-all flex items-center justify-between gap-3"
                id={`sub-${sub.id}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                    {getTypeIcon(sub.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-200 truncate">{sub.name}</h4>
                      <span className="text-[8px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded-md font-bold uppercase tracking-wide border border-slate-700/50">
                        {sub.type}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono truncate mt-0.5">{sub.url}</p>
                    {sub.description && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5 leading-tight font-sans">"{sub.description}"</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteSubscription(sub.id)}
                  className="text-slate-600 hover:text-slate-400 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  aria-label="Ta bort hemsida"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
