export interface Topic {
  id: string;
  title: string;
  description: string;
  trendingTag: string;
  activityCount: number;
  iconName: string;
  color: string;
  isCustom?: boolean;
}

export interface Perspective {
  id: string;
  name: string;
  avatar: string; // Lucide icon name, e.g. "User", "Heart", "Briefcase" etc.
  context: string;
  unlocked: boolean;
  insights?: string[];
  frustrations?: string[];
  emotionalPain?: string;
  isCustom?: boolean;
}

export interface ProblemObservation {
  id: string;
  perspectiveName: string;
  text: string;
  cluster: string; // "Tech", "Human", "Policy", "Infrastructure"
  votes: number;
}

export interface IdeaItem {
  id: string;
  text: string;
  category: "HOW" | "WOW" | "NOW" | "UNSORTED";
  reasoning?: string;
  scores?: {
    innovation: number;
    feasibility: number;
    impact: number;
    scalability: number;
  };
  enhanced?: boolean;
  enhancedTitle?: string;
  enhancedDescription?: string;
}

export interface PrototypeData {
  title: string;
  description: string;
  format: string; // "canvas" | "storyboard" | "flow" | "wireframe"
  canvasData?: string; // base64 representation of drawn sketch
  imageUrl?: string;
  storyboardSteps?: string[]; 
  flowSteps?: string[];
}

export interface TestData {
  whatIf: string[];
  whatIfScore: number;
  loadingWhatIf: boolean;
  iLike: string[];
  iLikeScore: boolean | number;
  loadingILike: boolean;
  iWish: string[];
  iWishScore: boolean | number;
  loadingIWish: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
}

export interface CompletedSimulationRecap {
  simulationName: string;
  completionDate: string;
  challenge: string;
  empathizeSummary: string;
  problemStatement: string;
  topIdeas: string[];
  prototypeSummary: string;
  achievements: string[];
  overallScore: number;
  engagementBreakdown?: {
    stageCompletion: number;
    meaningfulInput: number;
    reflectionIteration: number;
    aiThoughtfulness: number;
    feedback: string;
    levelTitle: string;
    levelDesc: string;
  };
  completionTime: number;
}

export interface UserProfile {
  uid?: string;
  username: string; // Used as displayName
  email?: string;
  photoURL?: string;
  level: "Explorer" | "Observer" | "Problem Finder" | "Innovator" | "Visionary" | "System Thinker" | "Creative Thinker" | "Problem Solver" | "Innovation Builder" | "DT Innovation Master";
  xp: number;
  unlockedBadgeIds: string[];
  problemsSolved: number;
  ideasGenerated: number;
  prototypesBuilt: number;
  completedSimulations?: number;
  lastCompletedSimulation?: CompletedSimulationRecap;
  joinedAt?: string;
  // User Onboarding/Profile
  college?: string;
  degree?: string;
  yearOfStudy?: string;
  primaryInterest?: string;
  careerGoal?: string;
  isOnboarded?: boolean;
  phone?: string;
  gender?: string;
  city?: string;
  yearOfBirth?: string;
}

export interface CommunitySubmission {
  id: string;
  username: string;
  college: string;
  topicTitle: string;
  refinedProblem: string;
  prototypeTitle: string;
  prototypeDescription: string;
  likes: number;
  likedByUser?: boolean;
  comments: { username: string; text: string; date: string }[];
  category: string;
}
