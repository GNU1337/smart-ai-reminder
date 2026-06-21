import React from 'react';
import { Heart, Mic, Sparkles, ShieldCheck, Sun, Bookmark } from 'lucide-react';
import { motion } from 'motion/react';

interface IntroGuideProps {
  onClose: () => void;
  userName: string;
}

export default function IntroGuide({ onClose, userName }: IntroGuideProps) {
  const benefits = [
    {
      icon: <Sparkles className="text-amber-400" />,
      title: "Din personliga morgontidning",
      description: "Varje morgon och kväll får du en lugn sammanfattning av allt som hänt. Inget brus, bara det som är viktigt för just dig."
    },
    {
      icon: <Mic className="text-rose-400" />,
      title: "Bara prata – jag skriver",
      description: "Har du svårt att skriva på skärmen? Tryck på mikrofonen och berätta vad du vill komma ihåg, så sparar jag det åt dig."
    },
    {
      icon: <Heart className="text-rose-500" />,
      title: "Nära dina kära",
      description: "Jag håller extra koll på meddelanden från Anna och andra viktiga personer, så att deras ord alltid hamnar överst."
    },
    {
      icon: <ShieldCheck className="text-sky-400" />,
      title: "Trygghet i minnet",
      description: "Portkoder, mediciner eller var du laggt reservnyckeln? Skriv ner det en gång – jag påminner dig precis när det behövs."
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Hero Section */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent border-b border-slate-800 relative">
          <div className="absolute top-6 right-8 opacity-20">
            <Sun size={80} className="text-sky-400 animate-spin-slow" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
            Välkommen till ditt <span className="text-sky-400 italic">digitala lugn</span>, {userName}.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md">
            Det här är inte bara en app. Det är din personliga assistent som hjälper dig att sortera vardagen, komma ihåg det viktiga och aldrig missa en puss från de du älskar.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-1">{benefit.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            Din data är säker och privat
          </div>
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 uppercase tracking-wider text-sm cursor-pointer"
          >
            Börja din lugna vardag
          </button>
        </div>
      </div>
    </motion.div>
  );
}
