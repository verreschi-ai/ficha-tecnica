import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCtaClick }) => {
  return (
    <section className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center justify-between py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      
      {/* Top Content: Badge & Headline blending into the upper portion */}
      <div className="relative z-20 text-center max-w-4xl mx-auto space-y-4 pt-4 sm:pt-8">
        
        {/* Badge Informativo */}
        <div className="inline-flex items-center space-x-2 bg-orange-600/30 border border-orange-500/50 text-orange-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-lg">
          <Sparkles size={14} className="text-orange-400" />
          <span>Gestão Gastronômica & Precificação</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white font-fredoka tracking-tight leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
          Descubra o custo real do seu cardápio
        </h1>

      </div>

      {/* Cinematic Video Container (Rodando Direto) */}
      <div className="relative z-10 w-full max-w-5xl my-6 rounded-3xl overflow-hidden shadow-2xl border-4 border-orange-500/30 bg-slate-900 group">
        <img
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
          alt="Planilha de Custos e Precificação"
          className="w-full aspect-[16/9] sm:aspect-[16/10] object-cover filter contrast-[1.05]"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Dark Gradient Overlay over video for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/30 pointer-events-none" />
      </div>

      {/* Bottom Content: Começar a Calcular Button below the video */}
      <div className="relative z-20 text-center pb-8">
        <button
          type="button"
          onClick={onCtaClick}
          className="group relative inline-flex items-center space-x-3 bg-orange-600 hover:bg-orange-500 text-white font-fredoka font-bold text-xl px-10 py-4.5 rounded-2xl shadow-2xl shadow-orange-600/60 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
        >
          <span>Começar a Calcular</span>
          <ArrowRight size={22} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>

    </section>
  );
};
