import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, LayoutDashboard, Users, TrendingUp, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { Project, UserProfile } from '../types';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const FarmerDashboard = ({ profile, projects }: { profile: UserProfile, projects: Project[] }) => {
  const [isCreating, setIsCreating] = useState(false);
  const myProjects = projects.filter(p => p.farmerId === profile.uid);
  
  const totalRaised = myProjects.reduce((acc, p) => acc + p.raisedAmount, 0);
  const totalTarget = myProjects.reduce((acc, p) => acc + p.targetAmount, 0);
  const avgProgress = myProjects.length > 0 ? Math.round((totalRaised / totalTarget) * 100) : 0;

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newProject: Omit<Project, 'id'> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      farmerId: profile.uid,
      farmerName: profile.displayName,
      targetAmount: Number(formData.get('targetAmount')),
      raisedAmount: 0,
      status: 'open',
      location: formData.get('location') as string,
      category: formData.get('category') as string,
      createdAt: Timestamp.now(),
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"]
    };

    try {
      await addDoc(collection(db, 'projects'), newProject);
      setIsCreating(false);
      alert("Projet créé avec succès !");
    } catch (error) {
      console.error("Error creating project", error);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-5xl font-black text-noir mb-2">Tableau de Bord</h1>
          <p className="text-gris text-lg">Gérez vos exploitations et suivez vos financements.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="px-8 py-4 bg-or text-noir font-black rounded-xl flex items-center gap-2 hover:bg-or-clair transition-all shadow-lg shadow-or/20"
        >
          <Plus className="w-5 h-5" /> Nouveau Projet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <TrendingUp className="w-6 h-6" />, label: "Total Collecté", value: `${totalRaised.toLocaleString()} FCFA`, color: "bg-vert-pale text-vert" },
          { icon: <LayoutDashboard className="w-6 h-6" />, label: "Projets Actifs", value: myProjects.length.toString(), color: "bg-or/10 text-or" },
          { icon: <Users className="w-6 h-6" />, label: "Progression Moyenne", value: `${avgProgress}%`, color: "bg-noir/5 text-noir" },
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
        <h2 className="text-2xl font-black text-noir">Mes Projets</h2>
        <div className="grid grid-cols-1 gap-4">
          {myProjects.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed border-black/10 text-center">
              <div className="text-4xl mb-4">🚜</div>
              <p className="text-gris">Vous n'avez pas encore de projet. Commencez par en créer un !</p>
            </div>
          ) : (
            myProjects.map(project => (
              <div key={project.id} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                  <img src={project.images[0]} className="w-full h-full object-cover" alt={project.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 rounded bg-vert-pale text-vert text-[10px] font-bold uppercase tracking-widest">{project.category}</span>
                    <span className="text-xs text-gris">📍 {project.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-noir mb-2 truncate">{project.title}</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-vert" />
                      <span className="text-sm font-bold text-noir">{project.raisedAmount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-or" />
                      <span className="text-sm text-gris">Objectif: {project.targetAmount.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-48 space-y-2">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{Math.round((project.raisedAmount / project.targetAmount) * 100)}%</span>
                    <span className="text-gris">Financé</span>
                  </div>
                  <div className="h-2 bg-noir/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-vert transition-all duration-1000" 
                      style={{ width: `${(project.raisedAmount / project.targetAmount) * 100}%` }}
                    />
                  </div>
                </div>
                <button className="w-full md:w-auto px-6 py-3 border border-black/10 rounded-xl font-bold hover:bg-black/5 transition-all">
                  Gérer
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-noir/80 backdrop-blur-md" onClick={() => setIsCreating(false)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <h2 className="text-3xl font-black text-noir mb-8">Nouveau Projet Agricole</h2>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gris">Titre du projet</label>
                <input name="title" required className="w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-vert/20" placeholder="Ex: Culture de Riz à Podor" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gris">Catégorie</label>
                  <select name="category" className="w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-vert/20">
                    <option>Céréales</option>
                    <option>Maraîchage</option>
                    <option>Élevage</option>
                    <option>Arboriculture</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gris">Localisation</label>
                  <input name="location" required className="w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-vert/20" placeholder="Ex: Saint-Louis" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gris">Objectif de financement (FCFA)</label>
                <input name="targetAmount" type="number" required className="w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-vert/20" placeholder="Ex: 5000000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gris">Description détaillée</label>
                <textarea name="description" rows={4} required className="w-full px-4 py-3 rounded-xl border border-black/10 outline-none focus:ring-2 focus:ring-vert/20 resize-none" placeholder="Décrivez votre projet..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-4 border border-black/10 rounded-xl font-bold hover:bg-black/5">Annuler</button>
                <button type="submit" className="flex-[2] py-4 bg-vert text-white rounded-xl font-bold hover:bg-vert-clair shadow-lg shadow-vert/20">Créer le projet</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
