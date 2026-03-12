/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc,
  orderBy,
  where,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Project, Investment, ProductionUpdate, UserRole } from './types';
import { 
  Leaf, 
  TrendingUp, 
  Users, 
  MapPin, 
  Plus, 
  ChevronRight, 
  LogOut, 
  LayoutDashboard, 
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wallet,
  Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Components ---
import { ProjectDetails } from './components/ProjectDetails';
import { FarmerOnboarding } from './components/FarmerOnboarding';
import { FarmerDashboard } from './components/FarmerDashboard';
import { InvestorDashboard } from './components/InvestorDashboard';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Navbar = ({ user, profile, onLogin, onLogout, onNavigate }: { 
  user: User | null, 
  profile: UserProfile | null, 
  onLogin: () => void, 
  onLogout: () => void,
  onNavigate: (page: string) => void
}) => (
  <nav className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-between px-6 md:px-12 py-4 bg-noir/95 backdrop-blur-md border-b border-or/20">
    <div 
      className="flex items-center gap-3 cursor-pointer font-display text-2xl font-black text-or tracking-tight" 
      onClick={() => onNavigate('home')}
    >
      🌾 AgroInvest<span className="text-vert-clair">SN</span>
    </div>

    <ul className="hidden lg:flex items-center gap-8 list-none">
      <li><button onClick={() => onNavigate('home')} className="text-white/75 hover:text-or-clair text-sm font-medium tracking-wide transition-colors">Accueil</button></li>
      <li><button onClick={() => onNavigate('projets')} className="text-white/75 hover:text-or-clair text-sm font-medium tracking-wide transition-colors">Projets</button></li>
      <li><button onClick={() => onNavigate('agriculteur')} className="text-white/75 hover:text-or-clair text-sm font-medium tracking-wide transition-colors">Soumettre un projet</button></li>
      <li><button onClick={() => onNavigate('dashboard')} className="text-white/75 hover:text-or-clair text-sm font-medium tracking-wide transition-colors">Mon Espace</button></li>
    </ul>

    <div className="flex items-center gap-3">
      {user ? (
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <div className="text-white text-xs font-bold">{profile?.displayName}</div>
            <div className="text-white/40 text-[10px] uppercase tracking-wider">{profile?.role}</div>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-vert to-or p-0.5">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
              alt="Profile" 
              className="w-full h-full rounded-full bg-noir object-cover"
              referrerPolicy="no-referrer" 
            />
          </div>
          <button onClick={onLogout} className="p-2 text-white/40 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="hidden sm:block px-6 py-2.5 rounded border border-or/50 text-or-clair text-sm font-semibold hover:bg-or/10 transition-all">
            Se connecter
          </button>
          <button onClick={() => onNavigate('agriculteur')} className="px-6 py-2.5 rounded bg-or text-noir text-sm font-bold hover:bg-or-clair transition-all shadow-lg shadow-or/20">
            Commencer
          </button>
        </div>
      )}
    </div>
  </nav>
);

const Hero = ({ onNavigate }: { onNavigate: (page: string) => void }) => (
  <div className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 py-16 overflow-hidden bg-gradient-to-br from-noir/92 via-vert/80 to-black/85">
    <div className="absolute inset-0 pointer-events-none opacity-30">
      {Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i}
          className="particle bg-or/30"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 5}px`,
            height: `${2 + Math.random() * 5}px`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`
          }}
        />
      ))}
    </div>

    <div className="relative z-10 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-or/15 border border-or/40 text-or-clair text-xs font-medium uppercase tracking-widest mb-6"
      >
        🌱 Plateforme N°1 d'investissement agrobusiness au Sénégal
      </motion.div>
      
      <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[1.05] tracking-tight mb-6">
        Investissez dans<br />
        <em className="italic text-or not-italic">l'agriculture sénégalaise</em>
      </h1>
      
      <p className="text-white/70 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-10">
        Connectez-vous aux meilleures opportunités agricoles du Sénégal. Financez des projets, suivez la production en temps réel, et partagez les bénéfices.
      </p>
      
      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => onNavigate('projets')}
          className="px-10 py-4 rounded-md bg-or text-noir font-bold text-lg hover:bg-or-clair hover:-translate-y-1 transition-all shadow-xl shadow-or/40"
        >
          Voir les projets 🌱
        </button>
        <button 
          onClick={() => onNavigate('agriculteur')}
          className="px-10 py-4 rounded-md bg-transparent text-white border-2 border-white/30 font-semibold text-lg hover:border-white hover:bg-white/10 transition-all"
        >
          Soumettre mon projet
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-16">
        {[
          { label: "Projets financés", value: "127", id: "cnt1" },
          { label: "Investisseurs actifs", value: "1,247", id: "cnt2" },
          { label: "Millions FCFA investis", value: "342", id: "cnt3" },
          { label: "% Rendement moyen", value: "18%", id: "cnt4" },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="font-mono text-3xl md:text-4xl font-bold text-or">{stat.value}</div>
            <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-full fill-creme">
        <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
      </svg>
    </div>
  </div>
);

const Features = () => (
  <section className="max-w-7xl mx-auto px-6 py-24">
    <span className="text-vert-clair text-xs font-bold uppercase tracking-[0.15em] mb-4 block">Pourquoi AgroInvest SN ?</span>
    <h2 className="font-display text-4xl md:text-5xl font-black text-noir mb-4 leading-tight">
      Une plateforme pensée pour<br /><span className="text-vert-clair">l'avenir de l'agriculture</span>
    </h2>
    <p className="text-gris text-lg max-w-xl mb-16 leading-relaxed">
      Nous créons le pont entre les terres fertiles du Sénégal et les capitaux disponibles, pour une agriculture prospère et moderne.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { icon: "🤝", title: "Financement Collaboratif", desc: "Investissez seul ou en groupe dans des projets agricoles vérifiés. À partir de 25 000 FCFA seulement." },
        { icon: "📡", title: "Suivi en Temps Réel", desc: "Recevez des rapports de production hebdomadaires : photos, météo, état des cultures, estimations de récolte." },
        { icon: "💰", title: "Partage des Bénéfices", desc: "Vos bénéfices sont calculés automatiquement et virés sur votre compte mobile money ou bancaire dès la récolte." },
        { icon: "🔒", title: "Projets Vérifiés", desc: "Chaque projet passe par notre processus de validation : visite terrain, vérification foncière, plan de production." },
        { icon: "🌍", title: "Impact Social", desc: "Vous soutenez de jeunes agriculteurs sénégalais et contribuez à la souveraineté alimentaire du pays." },
        { icon: "📊", title: "Tableau de Bord", desc: "Gérez votre portefeuille agricole, analysez vos rendements et prenez des décisions éclairées avec notre espace investisseur." },
      ].map((f, i) => (
        <div key={i} className="group relative bg-white rounded-2xl p-8 border border-black/5 hover:border-vert/15 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-vert/10 transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-vert to-or opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-4xl mb-6">{f.icon}</div>
          <h3 className="font-display text-xl font-bold text-noir mb-3">{f.title}</h3>
          <p className="text-gris text-sm leading-relaxed">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const ProjectCard = ({ project, onClick }: { project: Project, onClick: () => void, key?: string }) => {
  const pct = Math.min(100, Math.round((project.raisedAmount / project.targetAmount) * 100));
  
  const typeClasses: Record<string, string> = {
    riz: 'from-[#2d6a4f] to-[#52b788]',
    tomate: 'from-[#a4133c] to-[#e63946]',
    mil: 'from-[#c77dff] to-[#7b2d8b]',
    arachide: 'from-[#d4a017] to-[#f4a261]',
    mangue: 'from-[#fb8500] to-[#ffb703]',
    elevage: 'from-[#6b4226] to-[#a0522d]',
  };

  const statusLabels = {
    open: 'Ouvert',
    funded: 'Financé',
    completed: 'Récolte'
  };

  const statusClasses = {
    open: 'bg-[#d4edda] text-[#155724]',
    funded: 'bg-[#cce5ff] text-[#004085]',
    completed: 'bg-[#f8d7da] text-[#721c24]'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className={cn(
        "relative h-44 flex items-center justify-center text-6xl bg-gradient-to-br",
        typeClasses[project.category.toLowerCase()] || 'from-vert to-vert-clair'
      )}>
        <span>{project.category === 'Céréales' ? '🌾' : project.category === 'Maraîchage' ? '🍅' : '🌱'}</span>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
          {project.category}
        </div>
        <div className={cn(
          "absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider",
          statusClasses[project.status]
        )}>
          {statusLabels[project.status]}
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="text-[10px] text-gris font-medium uppercase tracking-widest mb-1">📍 {project.location}</div>
        <h3 className="font-display text-xl font-extrabold text-noir mb-2 leading-tight">{project.title}</h3>
        <p className="text-gris text-sm leading-relaxed mb-5 line-clamp-2">{project.description}</p>
        
        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-vert-clair">{pct}%</span>
              <span className="text-gris">{project.raisedAmount.toLocaleString()} / {project.targetAmount.toLocaleString()} FCFA</span>
            </div>
            <div className="h-1.5 bg-vert-pale rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-vert to-or rounded-full transition-all duration-1000" 
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-black/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-vert to-or flex items-center justify-center text-white text-[10px] font-bold">
                {project.farmerName.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-noir">{project.farmerName}</span>
            </div>
            <div className="bg-vert-pale text-vert-clair text-[10px] font-bold px-2 py-1 rounded">
              +18% ROI
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: any }> {
  public state: { hasError: boolean, error: any };
  public props: { children: ReactNode };

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Une erreur inattendue est survenue.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) displayMessage = `Erreur Firestore: ${parsed.error}`;
      } catch (e) {
        if (this.state.error && this.state.error.message) displayMessage = this.state.error.message;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-red-100 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 rotate-45" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 mb-4">Oups ! Quelque chose a mal tourné</h2>
            <p className="text-stone-500 mb-8">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        let docSnap;
        try {
          docSnap = await getDoc(docRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          return;
        }
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // New user, default to investor
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Utilisateur',
            role: 'investor',
            photoURL: user.photoURL || undefined
          };
          try {
            await setDoc(docRef, newProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          }
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setInvestments([]);
      return;
    }
    const q = query(collection(db, 'investments'), where('investorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const investmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investment));
      setInvestments(investmentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'investments');
    });

    return () => unsubscribe();
  }, [user]);

  // Connection test as required by instructions
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleInvest = async (projectId: string, amount: number) => {
    if (!user) return handleLogin();
    
    try {
      const investment: Omit<Investment, 'id'> = {
        projectId,
        investorId: user.uid,
        amount,
        timestamp: Timestamp.now(),
        status: 'confirmed'
      };
      
      await addDoc(collection(db, 'investments'), investment);
      
      // Update project raised amount
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        const currentAmount = projectSnap.data().raisedAmount || 0;
        await updateDoc(projectRef, {
          raisedAmount: currentAmount + amount
        });
      }
      
      alert("Investissement réussi !");
      setSelectedProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'investments');
    }
  };

  const createSampleProject = async () => {
    if (!user || profile?.role !== 'farmer') {
      alert("Seuls les agriculteurs peuvent créer des projets.");
      return;
    }

    const sample: Omit<Project, 'id'> = {
      title: "Culture de Riz à Saint-Louis",
      description: "Projet d'extension de 10 hectares pour la riziculture irriguée dans la vallée du fleuve Sénégal.",
      farmerId: user.uid,
      farmerName: profile.displayName,
      targetAmount: 5000000,
      raisedAmount: 0,
      status: 'open',
      location: "Saint-Louis, Sénégal",
      category: "Céréales",
      createdAt: Timestamp.now(),
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"]
    };

    try {
      await addDoc(collection(db, 'projects'), sample);
      alert("Projet créé avec succès !");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projects');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Chargement d'AgroInvest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme font-sans text-noir selection:bg-or selection:text-noir">
      <Navbar 
        user={user} 
        profile={profile} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
      />
      
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Hero onNavigate={setCurrentPage} />
              <Features />
              
              <section className="max-w-7xl mx-auto px-6 py-24 border-t border-black/5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                  <div>
                    <span className="text-or text-xs font-bold uppercase tracking-[0.15em] mb-4 block">Opportunités</span>
                    <h2 className="font-display text-4xl md:text-5xl font-black text-noir leading-tight">
                      Projets en cours de<br /><span className="text-or">financement</span>
                    </h2>
                  </div>
                  <button 
                    onClick={() => setCurrentPage('projets')}
                    className="group flex items-center gap-2 text-noir font-bold hover:text-or transition-colors"
                  >
                    Voir tout le catalogue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[450px] bg-white rounded-2xl animate-pulse border border-black/5" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.filter(p => p.status === 'open').slice(0, 3).map(project => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        onClick={() => setSelectedProject(project)} 
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="bg-noir py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                      <h2 className="font-display text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                        Prêt à faire germer<br /><span className="text-or">votre capital ?</span>
                      </h2>
                      <p className="text-white/60 text-lg mb-10 leading-relaxed">
                        Rejoignez des milliers d'investisseurs qui transforment l'agriculture sénégalaise tout en générant des revenus passifs.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={handleLogin}
                          className="px-8 py-4 rounded bg-or text-noir font-bold hover:bg-or-clair transition-all"
                        >
                          Créer mon compte
                        </button>
                        <button className="px-8 py-4 rounded border border-white/20 text-white font-semibold hover:bg-white/5 transition-all">
                          Parler à un conseiller
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="aspect-square rounded-3xl overflow-hidden rotate-3 shadow-2xl shadow-or/20">
                        <img 
                          src="https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&q=80&w=1000" 
                          alt="Agriculture" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl max-w-[240px] -rotate-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-vert-pale flex items-center justify-center text-vert text-xl">🌱</div>
                          <div>
                            <div className="text-[10px] text-gris uppercase font-bold tracking-wider">Dernier investissement</div>
                            <div className="text-sm font-bold text-noir">Projet Rizière Casamance</div>
                          </div>
                        </div>
                        <div className="text-2xl font-black text-vert">500 000 FCFA</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentPage === 'projets' && (
            <motion.div
              key="projets"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto px-6 py-12"
            >
              <div className="mb-12">
                <h1 className="font-display text-5xl font-black text-noir mb-4">Catalogue des Projets</h1>
                <p className="text-gris text-lg">Découvrez et financez les meilleures opportunités agricoles du moment.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-12">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gris w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un projet, une localité..." 
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-black/5 bg-white focus:outline-none focus:ring-2 focus:ring-vert/20 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  {['Tous', 'Céréales', 'Maraîchage', 'Élevage'].map(cat => (
                    <button 
                      key={cat}
                      className={cn(
                        "px-6 py-4 rounded-xl font-bold text-sm transition-all",
                        cat === 'Tous' ? "bg-vert text-white" : "bg-white text-noir border border-black/5 hover:bg-black/5"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    onClick={() => setSelectedProject(project)} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {currentPage === 'agriculteur' && (
            <motion.div
              key="agriculteur"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto px-6 py-12"
            >
              <FarmerOnboarding onComplete={() => setCurrentPage('dashboard')} />
            </motion.div>
          )}

          {currentPage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-6 py-12"
            >
              {profile?.role === 'farmer' ? (
                <FarmerDashboard profile={profile} projects={projects} />
              ) : (
                <InvestorDashboard profile={profile} investments={investments} projects={projects} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-creme border-t border-black/5 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="font-display text-2xl font-black text-or mb-6">🌾 AgroInvest<span className="text-vert-clair">SN</span></div>
              <p className="text-gris text-sm leading-relaxed mb-6">
                La première plateforme de financement participatif dédiée à l'agriculture au Sénégal. Ensemble, construisons la souveraineté alimentaire.
              </p>
              <div className="flex gap-4">
                {['fb', 'tw', 'ig', 'ln'].map(s => (
                  <div key={s} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-noir hover:bg-or hover:text-noir transition-all cursor-pointer">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-noir mb-6">Navigation</h4>
              <ul className="space-y-4 text-sm text-gris">
                <li><button onClick={() => setCurrentPage('home')} className="hover:text-or transition-colors">Accueil</button></li>
                <li><button onClick={() => setCurrentPage('projets')} className="hover:text-or transition-colors">Projets</button></li>
                <li><button onClick={() => setCurrentPage('agriculteur')} className="hover:text-or transition-colors">Soumettre un projet</button></li>
                <li><button onClick={() => setCurrentPage('dashboard')} className="hover:text-or transition-colors">Mon Espace</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-noir mb-6">Légal</h4>
              <ul className="space-y-4 text-sm text-gris">
                <li><a href="#" className="hover:text-or transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-or transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-or transition-colors">Mentions légales</a></li>
                <li><a href="#" className="hover:text-or transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-noir mb-6">Newsletter</h4>
              <p className="text-gris text-sm mb-4">Recevez les nouveaux projets en priorité.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Votre email" className="flex-1 bg-black/5 border-none rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-or" />
                <button className="bg-noir text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-vert transition-colors">OK</button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-black/5 text-center text-gris text-xs">
            © 2024 AgroInvest Sénégal. Tous droits réservés. Développé avec ❤️ pour le Sénégal.
          </div>
        </div>
      </footer>

      {/* Project Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectDetails 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
            onInvest={handleInvest} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

