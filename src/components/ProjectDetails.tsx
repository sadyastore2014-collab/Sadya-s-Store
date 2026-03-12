import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onInvest: (projectId: string, amount: number) => void;
}

export const ProjectDetails = ({ project, onClose, onInvest }: ProjectDetailsProps) => {
  const [amount, setAmount] = useState<number>(25000);
  const pct = Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100));

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-noir/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-6xl bg-creme rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <Plus className="w-6 h-6 rotate-45" />
        </button>

        <div className="lg:w-1/2 h-64 lg:h-auto relative">
          <img 
            src={project.images[0] || "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1000"} 
            alt={project.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="lg:w-1/2 p-8 md:p-12 overflow-y-auto bg-white">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-vert-pale text-vert text-[10px] font-bold uppercase tracking-widest">
                {project.category}
              </span>
              <span className="text-gris text-xs font-medium">📍 {project.location}</span>
            </div>
            <h2 className="font-display text-4xl font-black text-noir mb-4 leading-tight">{project.title}</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vert to-or p-0.5">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-noir text-xs">
                  {project.farmerName.substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gris uppercase tracking-wider font-bold">Agriculteur</div>
                <div className="text-sm font-bold text-noir">{project.farmerName}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-creme border border-black/5">
              <div className="text-[10px] text-gris uppercase font-bold mb-1">ROI Estimé</div>
              <div className="text-xl font-black text-vert">+18%</div>
            </div>
            <div className="p-4 rounded-2xl bg-creme border border-black/5">
              <div className="text-[10px] text-gris uppercase font-bold mb-1">Durée</div>
              <div className="text-xl font-black text-noir">6 mois</div>
            </div>
            <div className="p-4 rounded-2xl bg-creme border border-black/5">
              <div className="text-[10px] text-gris uppercase font-bold mb-1">Risque</div>
              <div className="text-xl font-black text-or">Modéré</div>
            </div>
          </div>

          <div className="mb-10">
            <h4 className="font-bold text-noir mb-3 uppercase text-xs tracking-widest">À propos du projet</h4>
            <p className="text-gris leading-relaxed">{project.description}</p>
          </div>

          <div className="p-8 rounded-3xl bg-noir text-white shadow-2xl shadow-vert/20">
            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Progression</div>
                <div className="text-3xl font-black text-or">{project.raisedAmount.toLocaleString()} <span className="text-sm font-normal text-white/60">FCFA</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Objectif</div>
                <div className="text-lg font-bold">{project.targetAmount.toLocaleString()} FCFA</div>
              </div>
            </div>
            
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                className="h-full bg-gradient-to-r from-vert to-or rounded-full"
              />
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-or/50"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-xs">FCFA</span>
                </div>
                <button 
                  onClick={() => {
                    onInvest(project.id, amount);
                  }}
                  className="px-8 py-4 bg-or text-noir font-black rounded-xl hover:bg-or-clair transition-all"
                >
                  Investir maintenant
                </button>
              </div>
              <p className="text-[10px] text-white/30 text-center italic leading-relaxed">
                * En investissant, vous acceptez que l'agriculture comporte des risques climatiques et biologiques. AgroInvest SN sécurise vos fonds via un compte séquestre.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
