import React, { useState } from 'react';
import { NotificationItem } from '../types';
import { Bell, Trash2, Plus, Smartphone, Sparkles, AlertCircle, Sparkle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationFeedProps {
  notifications: NotificationItem[];
  onAddNotification: (notification: NotificationItem) => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
}

export default function NotificationFeed({
  notifications,
  onAddNotification,
  onDeleteNotification,
  onClearAll,
}: NotificationFeedProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [app, setApp] = useState('Anna');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPriority, setIsPriority] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      app,
      title,
      content,
      timestamp: new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      isPriority,
    };

    onAddNotification(newNotif);
    setTitle('');
    setContent('');
    setIsPriority(false);
    setShowAddForm(false);
  };

  const getAppBadgeStyle = (appName: string) => {
    const name = appName.toLowerCase();
    if (name.includes('anna')) return 'bg-rose-500/10 border-rose-500/20 text-rose-300';
    if (name.includes('kalender')) return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
    if (name.includes('sms')) return 'bg-sky-500/10 border-sky-500/20 text-sky-300';
    if (name.includes('nyheter') || name.includes('svt')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
    return 'bg-slate-800 border-slate-700/50 text-slate-300';
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Background service bar */}
      <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Aktivt bakgrundsflöde</p>
            <p className="text-[10px] text-slate-500">Söker av Android-notiser...</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold tracking-tight transition-colors transition-shadow hover:shadow-lg hover:shadow-sky-500/10 cursor-pointer"
          id="btn-simulate-notification"
        >
          <Plus size={12} className="stroke-[3]" />
          <span>Simulera</span>
        </button>
      </div>

      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          onSubmit={handleSubmit}
          className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 shadow-xl"
          id="simulate-notification-form"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Smartphone size={13} className="text-sky-400" /> Simulerad Mobil-inkorg
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Avbryt
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Källa</label>
              <select
                value={app}
                onChange={(e) => setApp(e.target.value)}
                className="w-full text-xs p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="Anna">Anna (SMS / Puss)</option>
                <option value="Kalenderservice">Kalender</option>
                <option value="SVT Nyheter">Nyheter (SVT)</option>
                <option value="SMS">Normal SMS</option>
                <option value="E-post">E-post</option>
                <option value="Facebook/Messenger">Messenger</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 font-sans">Prioritet</label>
              <button
                type="button"
                onClick={() => setIsPriority(!isPriority)}
                className={`w-full text-xs p-2 font-bold border rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                  isPriority
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertCircle size={13} />
                {isPriority ? 'Akut info' : 'Normal'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Rubrik</label>
            <input
              type="text"
              placeholder="Ex: 'Ring mig!'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-sans placeholder-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Innehåll</label>
            <textarea
              placeholder="T.ex: 'Anna skickade: Glöm inte mjölken...'"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="w-full text-xs p-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500 font-sans placeholder-slate-600"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-sky-500 text-slate-950 rounded-xl text-xs font-extrabold hover:bg-sky-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkle size={12} className="fill-slate-950 text-slate-950" /> Släpp in notis
          </button>
        </motion.form>
      )}

      {/* Notifications list */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            {notifications.length} notiser i kön
          </span>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              id="btn-clear-notifications"
            >
              <Trash2 size={12} />
              Rensa alla
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center"
            >
              <div className="p-2.5 bg-slate-900 rounded-full mb-2.5 text-slate-500 border border-slate-800">
                <Bell size={16} />
              </div>
              <p className="text-xs font-bold text-slate-300">Inga nya notiser</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Alla notiser färdiglästa. Klicka på "Simulera" för att testa AI-sammanfattningen!
              </p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                layoutId={`notif-${notif.id}`}
                className={`p-3 bg-slate-950/60 hover:bg-slate-900 border rounded-2xl transition-all flex items-start gap-2.5 ${
                  notif.isPriority ? 'border-amber-500/30' : 'border-slate-800/80'
                }`}
                id={`notif-${notif.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-extrabold tracking-wider uppercase ${getAppBadgeStyle(notif.app)}`}>
                      {notif.app}
                    </span>
                    {notif.isPriority && (
                      <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-lg text-[8px] font-bold border border-amber-500/20 flex items-center gap-0.5">
                        <AlertCircle size={8} /> Prioritet
                      </span>
                    )}
                    <span className="text-[9px] font-mono text-slate-500 ml-auto">{notif.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 leading-tight">{notif.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">{notif.content}</p>
                </div>
                <button
                  onClick={() => onDeleteNotification(notif.id)}
                  className="text-slate-600 hover:text-slate-400 p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label="Ta bort notis"
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
