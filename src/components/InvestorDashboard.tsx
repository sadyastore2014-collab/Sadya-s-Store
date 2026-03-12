import React from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, Clock, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { Investment, Project, UserProfile } from '../types';

export const InvestorDashboard = ({ profile, investments, projects }: { profile: UserProfile, investments: Investment[], projects: Project[] }) => {
  const myInvestments = investments.filter(i => i.investorId === profile.uid);
  const totalInvested = myInvestments.reduce((acc, i) => acc + i.amount, 0);
  
  const getProject = (id: string) => projects.find(p => p.id === id);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-5xl font-black text-noir mb-2">Mon Espace Investisseur</h1>
        <p className="text-gris text-lg">Suivez vos investissements et vos rendements en temps réel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <Wallet className="w-6 h-6" />, label: "Total Investi", value: `${totalInvested.toLocaleString()} FCFA`, color: "bg-vert-pale text-vert" },
          { icon: <TrendingUp className="w-6 h-6" />, label: "Rendement Estimé", value: `${Math.round(totalInvested * 0.18).toLocaleString()} FCFA`, color: "bg-or/10 text-or" },
          { icon: <CheckCircle2 className="w-6 h-6" />, label: "Projets Soutenus", value: myInvestments.length.toString(), color: "bg-noir/5 text-noir" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className={stat.color + " w-12 h-12 rounded-2xl flex items-center justify-center mb-6"}>
              {stat.icon}
            </div>
            <div className="text-xs text-gris uppercase font-bold tracking-widest mb-1">{stat.label}</div>
            <div className="text-3xl font-black text-noir">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-noir">Mes Investissements</h2>
        <div className="grid grid-cols-1 gap-4">
          {myInvestments.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-black/10 text-center">
              <div className="text-4xl mb-4">🌱</div>
              <p className="text-gris">Vous n'avez pas encore d'investissement. Découvrez nos projets !</p>
            </div>
          ) : (
            myInvestments.map(investment => {
              const project = getProject(investment.projectId);
              if (!project) return null;
              
              return (
                <div key={investment.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 bg-creme flex items-center justify-center text-4xl">
                    {project.category === 'Céréales' ? '🌾' : '🍅'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gris font-bold uppercase tracking-wider">📍 {project.location}</span>
                      <span className="w-1 h-1 rounded-full bg-gris/30" />
                      <span className="text-[10px] text-vert font-bold uppercase tracking-wider">Confirmé</span>
                    </div>
                    <h3 className="text-lg font-bold text-noir mb-2 truncate">{project.title}</h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-noir font-bold">
                        <Wallet className="w-3.5 h-3.5" />
                        {investment.amount.toLocaleString()} FCFA
                      </div>
                      <div className="flex items-center gap-1.5 text-gris">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(investment.timestamp?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-wider text-gris">
                      <span>Progression Projet</span>
                      <span>{Math.round((project.raisedAmount / project.targetAmount) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-noir/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-or transition-all duration-1000" 
                        style={{ width: `${(project.raisedAmount / project.targetAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3 bg-noir text-white rounded-xl font-bold text-sm hover:bg-vert transition-all flex items-center justify-center gap-2">
                    Détails <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
