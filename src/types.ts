export type UserRole = 'investor' | 'farmer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  bio?: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  farmerId: string;
  farmerName: string;
  targetAmount: number;
  raisedAmount: number;
  status: 'open' | 'funded' | 'completed';
  location: string;
  category: string;
  createdAt: any;
  images: string[];
}

export interface Investment {
  id: string;
  projectId: string;
  investorId: string;
  amount: number;
  timestamp: any;
  status: 'pending' | 'confirmed';
}

export interface ProductionUpdate {
  id: string;
  projectId: string;
  date: any;
  description: string;
  status: string;
  images: string[];
}
