import { Topic, Badge, CommunitySubmission } from "./types";

export const PREDEFINED_TOPICS: Topic[] = [
  {
    id: "transportation",
    title: "🚦 Traffic & Travel",
    description: "How can daily travel become less stressful?",
    trendingTag: "TRAFFIC",
    activityCount: 0,
    iconName: "Car",
    color: "from-blue-600 to-brand-primary/80",
  },
  {
    id: "college-life",
    title: "🎓 Student Life",
    description: "What would make college life actually easier?",
    trendingTag: "CAMPUS",
    activityCount: 0,
    iconName: "GraduationCap",
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "social-media",
    title: "📱 Social Media",
    description: "Can we make scrolling less addictive?",
    trendingTag: "SOCIAL",
    activityCount: 0,
    iconName: "Sparkles",
    color: "from-violet-600 to-brand-primary/60",
  },
  {
    id: "mental-health",
    title: "🧠 Mental Health",
    description: "How do we make students feel less overwhelmed?",
    trendingTag: "WELLNESS",
    activityCount: 0,
    iconName: "Heart",
    color: "from-rose-600 to-orange-500",
  },
  {
    id: "food-problems",
    title: "🍔 Food & Lifestyle",
    description: "How can students eat better without spending more?",
    trendingTag: "FOOD",
    activityCount: 0,
    iconName: "Apple",
    color: "from-green-600 to-emerald-500",
  },
  {
    id: "public-safety",
    title: "🛡️ Public Safety",
    description: "How do we make public spaces feel safer?",
    trendingTag: "SAFETY",
    activityCount: 0,
    iconName: "ShieldCheck",
    color: "from-amber-600 to-red-500",
  },
  {
    id: "climate-change",
    title: "🌍 Climate & Cities",
    description: "How can cities become cleaner and greener?",
    trendingTag: "CLIMATE",
    activityCount: 0,
    iconName: "Globe",
    color: "from-brand-primary to-brand-primary/80",
  },
  {
    id: "sleep-burnout",
    title: "🌙 Sleep & Burnout",
    description: "How can we get better sleep and feel less exhausted?",
    trendingTag: "SLEEP",
    activityCount: 0,
    iconName: "Moon",
    color: "from-indigo-600 to-sky-400",
  },
  {
    id: "study-stress",
    title: "📚 Study Stress",
    description: "How do we make studying feel less like a chore?",
    trendingTag: "STUDY",
    activityCount: 0,
    iconName: "BookOpen",
    color: "from-amber-600 to-yellow-500",
  },
  {
    id: "campus-friendships",
    title: "👥 Campus Friendships",
    description: "How do we make it easier to meet real friends on campus?",
    trendingTag: "FRIENDSHIP",
    activityCount: 0,
    iconName: "Users",
    color: "from-pink-600 to-rose-400",
  }
];

export const BADGES: Badge[] = [
  {
    id: "problem-hunter",
    name: "Problem Hunter",
    description: "Collected 4+ diverse user perspectives and explored hidden frustrations.",
    icon: "Compass",
    unlocked: true,
  },
  {
    id: "idea-stormer",
    name: "Idea Stormer",
    description: "Brainstormed 5+ ideas and successfully sorted them using the HOW/WOW/NOW matrix.",
    icon: "Zap",
    unlocked: false,
  },
  {
    id: "future-thinker",
    name: "Future Thinker",
    description: "Selected a bold futuristic 'HOW' idea to expand and redesign.",
    icon: "Rocket",
    unlocked: false,
  },
  {
    id: "prototype-builder",
    name: "Prototype Builder",
    description: "Visualized and mapped your solution using digital whiteboarding canvas tools.",
    icon: "PenTool",
    unlocked: false,
  },
  {
    id: "evaluation-leader",
    name: "Innovation Leader",
    description: "Completed the full simulator, surviving the WHAT-IF stress-test engine.",
    icon: "Award",
    unlocked: false,
  },
  {
    id: "collaborator",
    name: "Empathetic Creator",
    description: "Customized user perspectives and solved problems for unaddressed human minorities.",
    icon: "Users",
    unlocked: false,
  },
];

export const STATIC_LEVELS = [
  { rank: "Explorer", reqXp: 0 },
  { rank: "Observer", reqXp: 150 },
  { rank: "Problem Finder", reqXp: 350 },
  { rank: "Innovator", reqXp: 600 },
  { rank: "Visionary", reqXp: 950 },
  { rank: "System Thinker", reqXp: 1400 },
];

export const MOCK_COMMUNITY_SUBMISSIONS: CommunitySubmission[] = [
  {
    id: "comm_1",
    username: "Elena_Zup",
    college: "Stanford Design Lab",
    topicTitle: "Transportation",
    refinedProblem: "How might we supply secure, real-time shared commuting maps for female students returning to dorms after midnight?",
    prototypeTitle: "GuardianNet Peer Rideshare",
    prototypeDescription: "An ambient security companion that routes student groups into mutual-walking or buddy pools backed by physical NFC validation checkposts around campus.",
    likes: 42,
    likedByUser: false,
    comments: [
      { username: "Hitesh_Redesign", text: "Brilliant checkpost approach, very tangible for physical spaces!", date: "2 hrs ago" },
      { username: "Kai_Space", text: "What if dorm checking triggers delayed entry? NFC solves that seamlessly though.", date: "1 hr ago" }
    ],
    category: "WOW"
  },
  {
    id: "comm_2",
    username: "Alex_Tech_99",
    college: "IIT Bombay",
    topicTitle: "College Life",
    refinedProblem: "How might we redesign food pantry systems for freshers to eliminate the social anxiety of queueing in public spaces?",
    prototypeTitle: "PantryLocker Express",
    prototypeDescription: "A blind-allocation locker system where users reserve meal ingredients via an unidentifiable student app and collect items using discrete QR tokens.",
    likes: 29,
    likedByUser: false,
    comments: [
      { username: "Sarah_S", text: "This targets emotional pride perfectly. Massive empathy score!", date: "Yesterday" }
    ],
    category: "WOW"
  },
  {
    id: "comm_3",
    username: "Maya_Visionary",
    college: "MIT Media Lab",
    topicTitle: "Mental Health",
    refinedProblem: "How might we configure sensory stress relief pads in crowded student dorms that remove dependency on standard mental health support queues?",
    prototypeTitle: "Oasis Sensory Micro-Pods",
    prototypeDescription: "A lightweight, acoustic pop-up bubble with ambient audio haptics and color frequencies triggered by a pressure physical plate.",
    likes: 56,
    likedByUser: false,
    comments: [
      { username: "Dev_Redesigner", text: "Very HOW category! Fits perfectly into high-concept tech.", date: "3 hrs ago" }
    ],
    category: "HOW"
  }
];

export const IDEA_STORM_PROMPTS = [
  "Reduce cost of deploying this solution by 95%",
  "Make it completely offline-friendly (no internet or 5G)",
  "Explain it simply so a 6-year-old child can operate it",
  "Rethink this with zero electronic parts (strictly physical/biological)",
  "Make it accessible for citizens over 85 years of age",
  "Repurpose this specifically for highly remote rural colleges",
];
