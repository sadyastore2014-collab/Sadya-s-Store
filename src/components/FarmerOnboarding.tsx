import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, ArrowRight, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

export const FarmerOnboarding = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    experience: '',
    description: ''
  });

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        role: 'farmer',
        farmInfo: formData
      });
      onComplete();
    } catch (error) {
      console.error("Error updating role", error);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-black/5">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-vert-pale flex items-center justify-center text-vert">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-noir">Devenir Agriculteur Partenaire</h2>
          <p className="text-gris text-sm">Étape {step} sur 2</p>
        </div>
      </div>

      {step === 1 ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gris">Nom de l'exploitation</label>
              <input 
                type="text" 
                value={formData.farmName}
                onChange={(e) => setFormData({...formData, farmName: e.target.value})}
                placeholder="Ex: Ferme de la Vallée"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-vert/20 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gris">Localisation</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Ex: Saint-Louis, Podor"
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-vert/20 outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gris">Années d'expérience</label>
            <input 
              type="number" 
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              placeholder="Ex: 5"
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-vert/20 outline-none"
            />
          </div>
          <button 
            onClick={() => setStep(2)}
            className="w-full py-4 bg-noir text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-vert transition-all"
          >
            Continuer <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gris">Description de votre activité</label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez vos cultures, vos méthodes et vos besoins..."
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:ring-2 focus:ring-vert/20 outline-none resize-none"
            />
          </div>
          <div className="p-4 rounded-xl bg-or/10 border border-or/20 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-or shrink-0" />
            <p className="text-xs text-noir/70 leading-relaxed">
              En soumettant ce formulaire, vous demandez l'accès au statut d'agriculteur. Notre équipe examinera votre profil sous 48h.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setStep(1)}
              className="flex-1 py-4 border border-black/10 text-noir font-bold rounded-xl hover:bg-black/5 transition-all"
            >
              Retour
            </button>
            <button 
              onClick={handleSubmit}
              className="flex-[2] py-4 bg-or text-noir font-bold rounded-xl hover:bg-or-clair transition-all shadow-lg shadow-or/20"
            >
              Finaliser mon inscription
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
