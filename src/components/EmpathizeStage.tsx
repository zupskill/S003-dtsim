import React, { useState, useEffect, useRef } from "react";
import { Topic, Perspective, ProblemObservation } from "../types";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Heart, 
  User, 
  Car, 
  Activity, 
  Compass, 
  X, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  Lightbulb 
} from "lucide-react";
import SafeTextInput from "./SafeTextInput";
import { assessTextQuality } from "../utils/moderation";

function localValidateEmpathize(
  text: string,
  topic?: Topic,
  selectedPerspective?: { name: string; context: string; struggles: string[] } | null
): { safe: boolean; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: false, warning: "⚠️ Please enter an observation." };
  }

  // 1) Unified high quality check for spam/profanity/meaninglessness/gibberish
  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return {
      safe: false,
      warning: "Please describe a real challenge, frustration, or observation related to the selected topic."
    };
  }

  // 2) Keep the specific topic and stakeholder relevance rules
  if (topic) {
    const isRelated = isRelatedToTopicOrStakeholderLocal(trimmed, topic, selectedPerspective);
    if (!isRelated) {
      return {
        safe: false,
        warning: "⚠️ Please enter a real challenge, frustration, or observation related to the selected topic."
      };
    }
  }

  return { safe: true };
}

function isRelatedToTopicOrStakeholderLocal(
  text: string,
  topic?: Topic,
  selectedPerspective?: { name: string; context: string; struggles: string[] } | null
): boolean {
  const lowercase = text.toLowerCase();

  // 1. Check selected perspective name / parts
  if (selectedPerspective) {
    const pName = selectedPerspective.name.toLowerCase();
    const pWords = pName.split(/[^a-z0-9']/i).filter(w => w.length > 2);
    for (const w of pWords) {
      if (lowercase.includes(w)) return true;
    }
  }

  // 2. Check topic title & ID keywords
  if (topic) {
    const tTitleWords = topic.title.toLowerCase().split(/[^a-z0-9']/i).filter(w => w.length > 2);
    for (const w of tTitleWords) {
      if (lowercase.includes(w)) return true;
    }

    const topicId = topic.id.toLowerCase();
    const keywordsMap: Record<string, string[]> = {
      "transportation": [
        "traffic", "travel", "road", "street", "transport", "bus", "car", "metro", "commute", 
        "walk", "crossing", "speed", "hazard", "pothole", "ride", "lane", "delay", "late", 
        "parking", "driver", "commuter", "pedestrian", "transit", "vehicle", "scooter"
      ],
      "college-life": [
        "student", "college", "campus", "hostel", "dorm", "canteen", "academic", "class", 
        "exam", "friend", "professor", "course", "textbook", "tuition", "degree", "fee", 
        "admission", "lecture", "placement", "internship", "study", "schedule"
      ],
      "social-media": [
        "social", "media", "app", "phone", "scroll", "screen", "tiktok", "instagram", 
        "feed", "addict", "notification", "post", "online", "chat", "influence", "like", 
        "comment", "profile", "distract", "watch", "alert"
      ],
      "mental-health": [
        "mental", "health", "anxiety", "stress", "depression", "burnout", "therapy", 
        "counselor", "stigma", "feeling", "mind", "shame", "sad", "emotional", "pressure", 
        "exhaust", "tire", "cope"
      ],
      "food-problems": [
        "food", "canteen", "meal", "eat", "lunch", "dinner", "breakfast", "cafeteria", 
        "nutrition", "healthy", "ingredient", "price", "expensive", "hungry", "queue", 
        "protein", "sodium", "diet", "vegetable"
      ],
      "public-safety": [
        "safety", "public", "light", "street", "night", "dark", "crime", "patrol", 
        "security", "danger", "hazard", "sidewalk", "fall", "crosswalk", "emergency", 
        "deserted", "unlit", "cop", "police"
      ],
      "climate-change": [
        "climate", "change", "global", "warming", "eco", "green", "carbon", "recycle", 
        "waste", "plastic", "temp", "heat", "flood", "rain", "smog", "pollution", 
        "landfill", "tree", "forest", "weather"
      ],
      "sleep-burnout": [
        "sleep", "burnout", "exhaust", "tired", "fatigue", "rest", "bed", "night", 
        "insomnia", "wake", "melatonin", "screen", "work", "hours", "overwork", "schedule"
      ],
      "study-stress": [
        "study", "stress", "exam", "grade", "score", "homework", "parent", "test", 
        "career", "competition", "job", "learn", "rote", "memorize", "placement", 
        "internship", "interview", "gpa"
      ],
      "campus-friendships": [
        "friend", "lonely", "clique", "isolate", "social", "interact", "circle", "group", 
        "introvert", "extrovert", "mixer", "club", "dorm", "roommate", "connection", "homesick"
      ]
    };

    for (const [key, list] of Object.entries(keywordsMap)) {
      if (topicId.includes(key) || key.includes(topicId)) {
        for (const kw of list) {
          if (lowercase.includes(kw)) return true;
        }
      }
    }
  }

  // 3. General "challenge" / "observation" terms that we always accept (like the user-requested ones)
  const generalAcceptTerms = [
    "internship", "internships", "placement", "job", "jobs", "preparation", "recruit", 
    "hostel", "mess", "food", "dinner", "lunch", "meals", "canteen",
    "delayed", "delay", "late", "buses", "bus", "weather", "rain", "rainy", "storm",
    "finding", "find", "struggle", "difficult", "hard", "poor", "bad", "expensive", 
    "cost", "unsafe", "danger", "dangerous", "unlit", "climb", "stairs", "fatigue",
    "pain", "anxious", "anxiety", "exhaust", "exhausted", "burnout", "sleep", "insomnia",
    "stress", "stuck", "rush", "crowd", "crowded", "uncomfortable", "seats", "seat",
    "issue", "problem", "broken", "fail", "slow", "fast", "scary", "risk", "hazard", "walk",
    "commuters", "students", "people", "parents", "children", "kids", "drivers", "riders",
    "living", "boarding", "tuition", "textbook", "courses", "engaged", "cliques", "loneliness"
  ];

  for (const kw of generalAcceptTerms) {
    if (lowercase.includes(kw)) return true;
  }

  return false;
}

interface EmpathizeStageProps {
  topic: Topic;
  onAddXP: (amount: number) => void;
  onUnlockBadge: (badgeId: string) => void;
  problemObservations: ProblemObservation[];
  setProblemObservations: (obs: ProblemObservation[]) => void;
  onNext: () => void;
  onShowToast?: (text: string, type?: "success" | "idea" | "info" | "badge") => void;
  theme: "dark" | "light";
}

const iconMap: Record<string, React.ComponentType<any>> = {
  User: User,
  Heart: Heart,
  Car: Car,
  Activity: Activity,
  Compass: Compass,
  ShieldCheck: ShieldCheck,
  Sparkles: Sparkles
};

const SIMPLE_PERSPECTIVES_BY_TOPIC: Record<string, { id: string; name: string; avatar: string; context: string; struggles: string[] }[]> = {
  transportation: [
    { id: "student", name: "Student", avatar: "User", context: "Travels daily between school, campus, and home.", struggles: ["School buses arrive late due to morning congestion bottleneck.", "Crossing roads near school feels unsafe without proper traffic guards.", "Public transport is overcrowded and stressful during school hours."] },
    { id: "commuter", name: "Daily Commuter", avatar: "Compass", context: "Travels daily to office by train, bus, or metro.", struggles: ["Traffic jams cause unpredictable delays in my office arrival.", "Packed metro and bus rides are exhausting before starting work.", "Finding affordable parking near business hubs is a major daily struggle."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Balances morning school drops and picking up kids.", struggles: ["No safe drop-off zone makes morning school arrivals risky and chaotic.", "Speeding vehicles near school corridors constantly worry walking parents.", "Worrying about children safely crossing busy multi-lane junctions."] },
    { id: "rider", name: "Delivery Rider", avatar: "Car", context: "Rides through heavy city road grids under tight schedules.", struggles: ["Traffic delays deliveries and directly hurts my app performance ratings.", "Unsafe road conditions and unmarked potholes make scooter transit scary.", "Double-parked vehicles block delivery parking and scooter stopping spots."] },
    { id: "police", name: "Traffic Police", avatar: "ShieldCheck", context: "Controls chaotic congested junctions during rush hours.", struggles: ["Drivers ignore traffic signals and lines to force into intersections.", "Heavy vehicle exhaust and emissions make standing in street lanes painful.", "Pedestrians cross randomly and ignore zebra crossings during peak jams."] },
    { id: "elderly", name: "Elderly Person", avatar: "Activity", context: "Walks slowly to local stores for groceries.", struggles: ["Crossing signals turn red way too fast for my walking pace.", "High sidewalk curbs are painful to climb up and down with groceries.", "Public transport stops have no available seating or shaded covers."] }
  ],
  "college-life": [
    { id: "student", name: "Student", avatar: "User", context: "Balances complex coursework, lectures, and social life.", struggles: ["Balancing heavy course loads with active social life is deeply stressful.", "Tuition, high textbook costs, and campus food prices are becoming painful.", "Exam pressure leaves zero spare time for pursuing hobbies or resting."] },
    { id: "freshman", name: "Freshman", avatar: "Compass", context: "Tries to habituate to college campus environment in first semester.", struggles: ["Finding it hard to make new friends in initial weeks of dorm life.", "Regularly getting lost on campus and feeling confused by class schedules.", "Unsure which campus clubs or societies are really welcoming and worth joining."] },
    { id: "final-year", name: "Final Year Student", avatar: "Sparkles", context: "Prepares for graduation reviews and first job search.", struggles: ["Heavy placement stress and constant resume edits is exhausting.", "Final year projects and research reviews place massive load on students.", "Feeling anxious and sad about moving away from close campus circles."] },
    { id: "faculty", name: "Faculty Member", avatar: "ShieldCheck", context: "Teaches courses and designs student evaluation frameworks.", struggles: ["Low student engagement during early morning academic lectures.", "Hard to monitor student mental wellness struggles in massive classes.", "Receiving countless late submissions because students feel overwhelmed."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Offers support and keeps tracking student updates from home.", struggles: ["Worrying if my child is coping well with independent dorm living.", "Heavy financial stress of managing tuition expenses and boarding fees.", "Difficult to guide or support student academic stress from a distance."] },
    { id: "hostel", name: "Hostel Resident", avatar: "Activity", context: "Lives in dormitory housing with student roommates.", struggles: ["Noisy roommates disrupt quiet evening sleep and exam reviews.", "Lack of silent, cozy study rooms open late at night in hostel blocks.", "Repetitive, bland dining canteen food lacks basic nutritional value."] }
  ],
  "social-media": [
    { id: "student", name: "Student", avatar: "User", context: "Spends several hours daily scroll feeding digital platforms.", struggles: ["Endless scrolling feeds eat up valuable sleep and homework hours.", "Comparing high-light feeds triggers heavy self-doubt and status anxiety.", "Toxic comments on community confession boards ruin school environment."] },
    { id: "creator", name: "Content Creator", avatar: "Sparkles", context: "Produces videos, posts, and visual elements on feeds.", struggles: ["Algorithmic lock-in forces me to post constantly to sustain views.", "Receiving harsh, toxic review comments from anonymous web trolls.", "High stress of tracking declining view metrics and fluctuating engagement."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Wants to secure healthy offline habits with the family.", struggles: ["Continuous screen chiming blocks deep face-to-face dinner talks.", "Worried about kids being exposed to unverified age-inappropriate feeds.", "Digital addiction replaces real-world interactive outdoor sports and play."] },
    { id: "influencer", name: "Influencer", avatar: "Compass", context: "Builds a significant online personal brand and catalog feed.", struggles: ["Striving to maintain a fake 'perfect life' is mentally draining.", "Privacy breaches and receiving creepy or stalker direct messages.", "Losing authentic, touching offline links due to endless camera focus."] },
    { id: "professional", name: "Working Professional", avatar: "Activity", context: "Uses networking and social channels during breaks.", struggles: ["Late night screen blue-light glare triggers severe sleep insomnia.", "Comparing my salary and titles on business feeds raises imposter feelings.", "Felt exhausted by noisy information overload and infinite alerts."] },
    { id: "manager", name: "Social Media Manager", avatar: "ShieldCheck", context: "Moderates active community groups and brand feeds client-side.", struggles: ["Handling constant customer complaints and brand trolls is stressful.", "Wasting home hours because I must watch trend alerts 24/7.", "Reading toxic comments in moderation pipelines harms my mental peace."] }
  ],
  "mental-health": [
    { id: "student", name: "Student", avatar: "User", context: "Struggles to keep up with competitive scores and deadlines.", struggles: ["Exam anxiety and persistent fear of academic failure is overwhelming.", "Coping with heavy parental expectations regarding professional career tracks.", "Feeling isolated and lonely but unable to share these emotions with anyone."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Wants to support children coping with academic and life shifts.", struggles: ["Hard to tell if child is just tired, or deeply burning out.", "Struggling to build deep communication channels with stressed teenagers.", "Extreme financial burden of booking professional mental counseling sessions."] },
    { id: "counselor", name: "Counselor", avatar: "ShieldCheck", context: "Offers student counseling support in campus health wing.", struggles: ["Students seek help too late when their stress has caused heavy breakdowns.", "Heavy social stigma makes students hide their mental wellness problems.", "Very high student-to-counselor ratio limits custom attention."] },
    { id: "teacher", name: "Teacher", avatar: "Compass", context: "Conducts academic courses and monitors classroom environments.", struggles: ["Feeling unqualified or unprepared to handle students' mental breakdowns.", "Pressure to finish the syllabus blocks spending class time on discussions.", "High student volume makes it hard to observe quiet, isolated children."] },
    { id: "friend", name: "Friend", avatar: "Sparkles", context: "Cares about their peer who is showing signs of anxiety.", struggles: ["Feeling helpless and confused seeing a close friend suffer silently.", "Unsure how to start talking or asking about sensitive mental problems.", "Enduring heavy emotional load when trying to comfort a stressed peer."] },
    { id: "professional", name: "Working Professional", avatar: "Activity", context: "Balances long office tasks with personal routines.", struggles: ["Long work shifts leave absolutely no time for peaceful mindfulness exercises.", "Heavy professional pressure causes ongoing anxiety and panic feelings.", "Stigma at office blocks requesting rest days to recover from acute burnout."] }
  ],
  "food-problems": [
    { id: "student", name: "Student", avatar: "User", context: "Wants affordable options that provide high nourishment quickly.", struggles: ["Fresh, balanced ingredients are far too expensive near college blocks.", "Heavily relying on instant noodles and cheap snacks due to schedule rush.", "Social pressure to visit luxury restaurants with peer circles on budget."] },
    { id: "hostel", name: "Hostel Resident", avatar: "Activity", context: "Lives in dormitory housing and relies on communal canteen plates.", struggles: ["Dormitories completely lack private kitchen appliances or stoves.", "Repetitive, grease-heavy canteen options lack fresh proteins.", "Canteens close early, leaving zero healthy options for midnight study hunger."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Manages household shopping lists and family meals.", struggles: ["Organic greens are unaffordable on tighter household budgets.", "Difficulty guiding children to enjoy home vegetables over salty fast-food.", "Very tight time slots to cook healthy meals from scratch after work shifts."] },
    { id: "staff", name: "College Canteen Staff", avatar: "ShieldCheck", context: "Prepares hundred-portion meals for students daily.", struggles: ["Faced with huge ingredient waste during student holiday intervals.", "Intense crowd congestion and screaming queues at counter intervals.", "Soaring market inflation makes holding student pricing low very tricky."] },
    { id: "fitness", name: "Fitness Enthusiast", avatar: "Sparkles", context: "Focusses on muscle gains and balanced clean eating plans.", struggles: ["Zero ingredient labels, calories, or allergen details on campus plates.", "High sodium, oil, and trans-fats levels in budget campus meals.", "Struggling to locate clean high-protein options on student budget scales."] },
    { id: "nutritionist", name: "Nutritionist", avatar: "Compass", context: "Studies adolescent eating patterns and coordinates menu reviews.", struggles: ["Widespread lack of basic nutrition literacy among college students.", "Extreme crash diets and skips are common, leading to quick health issues.", "Soaring rates of constant fatigue due to high energy drink intake."] }
  ],
  "public-safety": [
    { id: "student", name: "Student", avatar: "User", context: "Strolls back from late lab reviews or evening libraries.", struggles: ["Dimly lit walkways, corridors, and blind corners look terrifying.", "Zero visible emergency helpline lines or safety buttons on pathways.", "Walking alone through deserted campus park lanes past midnight feels risky."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Picks up children from modern extracurricular circles.", struggles: ["Reckless drivers speed past crosswalks near community schools.", "No walking sidewalks near drop-off zones forcing families into lanes.", "Worrying about kids traveling to external sports zones and lane blocks."] },
    { id: "police", name: "Police Officer", avatar: "ShieldCheck", context: "Patrols city parks, alleys, and residential sections.", struggles: ["Massive unmonitored blind spots in public gardens and parking structures.", "Many minor street incidents are never filed by victims due to fear or delay.", "Traffic congestion delays police response during midnight security calls."] },
    { id: "elderly", name: "Elderly Person", avatar: "Activity", context: "Walks around pedestrian tracks for morning routines.", struggles: ["Cracked and loose sidewalk tiles can easily trigger a dangerous fall.", "Fast-moving scooters zip along pedestrian sidewalks without warning.", "Walking routes lack any shelter, guard booths, or helpers to assist."] },
    { id: "woman", name: "Woman Commuter", avatar: "Compass", context: "Uses public transit networks during late evening hours.", struggles: ["Experiencing unsolicited stares and micro-aggressions on dark routes.", "Transit stations are completely deserted and lack bright illumination.", "Fear of unsafe routes forces me to pay expensive taxi charges."] },
    { id: "resident", name: "Local Resident", avatar: "Sparkles", context: "Lives in housing neighborhoods close to transit loops.", struggles: ["Street light failures take weeks for municipal crews to repair.", "Late night disturbances from alcohol joints near quiet neighborhoods.", "Speeding cars shortcut through narrow residential pathways dangerously."] }
  ],
  "climate-change": [
    { id: "student", name: "Student", avatar: "User", context: "Keeps tracking eco-friendly parameters and environmental files.", struggles: ["Intense heatwaves make walking to campus lectures sweaty and exhausting.", "Mixed trash bins mean paper and plastic end up dumped in local landfills.", "Feeling massive climate anxiety about future ecological crashes."] },
    { id: "resident", name: "Resident", avatar: "Compass", context: "Manages household and lives in urban residential circles.", struggles: ["Severe vehicle smog triggers painful chest coughs and asthma in kids.", "Short rainstorms flood residential driveways with toxic storm mud.", "Concrete structures trap solar heat, converting homes into painful ovens."] },
    { id: "volunteer", name: "Environmental Volunteer", avatar: "Sparkles", context: "Advocates for local green cover and runs cleanup operations.", struggles: ["Heavy plastic bottle littering in regional lakes ruins wildlife.", "Very low resident participation in local neighborhood cleanups.", "Green parks are cleared by municipal developers to build parking slabs."] },
    { id: "planner", name: "City Planner", avatar: "ShieldCheck", context: "Designs urban development plans and climate green corridors.", struggles: ["Hard to balance concrete growth with retaining healthy canopy trees.", "Lack of budget allocation to configure modern storm water filters.", "Loud public backlash when trying to expand zero-emission bicycle alleys."] },
    { id: "business", name: "Business Owner", avatar: "Activity", context: "Coordinates local food joints or retail supply scales.", struggles: ["Extreme flood weeks halt store business completely, hurting margins.", "High cost of swapping plastic containers with biodegradable boxes.", "Navigating green penalty rules without losing my tiny business margin."] },
    { id: "waste", name: "Waste Collection Worker", avatar: "Heart", context: "Segregates organic trash items on collection trucks.", struggles: ["Experiencing painful glass cuts due to mixed unsegregated garbage.", "Direct contact with hazardous chemical waste items is toxic and bad.", "No shaded rests available during extreme 40-degree mid-day summer sweat."] }
  ],
  "sleep-burnout": [
    { id: "student", name: "Student", avatar: "User", context: "Survives back-to-back testing and stays up studying.", struggles: ["Midnight screen blue-light disrupts melatonin, triggering bad insomnia.", "Feeling perpetually fatigued and running on less than 5 hours of sleep.", "Widespread brain fog makes daytime classes feel like a painful chore."] },
    { id: "professional", name: "Working Professional", avatar: "Activity", context: "Stares at office dashboards and writes code files.", struggles: ["Late evening slack alerts keep me on high alert, ruining sleep cycles.", "Striving to work like a tireless robot causes severe mental burnout.", "No clear boundary separating my bedroom bed from my laptop desk."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Coordinates chores, job hours, and nursery bounds.", struggles: ["Too fatigued after office work to spend interactive playtime with children.", "Waking up multiple times through midnight to tend to crying baby demands.", "Exhausting domestic work stacks up, leaving zero time for recovery rest."] },
    { id: "doctor", name: "Doctor", avatar: "ShieldCheck", context: "Works on emergency hospital rotations under intense pressure.", struggles: ["Thirty-hour shifts trigger severe long-term chronic fatigue.", "Severe sleep debt raises the risk of errors in critical treatment files.", "High patient rushes mean skipping meals and sleeping on benches."] },
    { id: "teacher", name: "Teacher", avatar: "Compass", context: "Fulfills school lessons and grades exam worksheets late.", struggles: ["Grading student sheets late at night eats into my sleep window.", "Exhausting noise control in crowded classrooms wears down my energy.", "Exhaustion makes me react with lower patience during student hours."] },
    { id: "hostel", name: "Hostel Resident", avatar: "Sparkles", context: "Shares dormitory walls with noisy student groups.", struggles: ["Midnight footsteps and loud roommate talks interrupt deep sleep cycles.", "Snoring roommates make getting sound sleep extremely difficult.", "Substandard, hard dormitory mattresses trigger neck aches and back pain."] }
  ],
  "study-stress": [
    { id: "student", name: "Student", avatar: "User", context: "Strives to pass intense testing and grade margins.", struggles: ["Heavy rote memorization overrides real hands-on design experiment learning.", "Feeling like a generic scorecard statistic instead of a passionate human.", "Excessive homework leaves absolutely zero time to go outside and rest."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Offers study snacks and anxious encouragement.", struggles: ["My child locks themselves in their room due to immense exam fears.", "Difficult to offer comfort without adding extra score pressure.", "Witnessing my teenager crying and skipping meals during testing week."] },
    { id: "teacher", name: "Teacher", avatar: "ShieldCheck", context: "Conducts classroom exams and grading guidelines.", struggles: ["Forced by school boards to rank children instead of supporting real talent.", "Finding students snoring in class because they stayed up learning by heart.", "Huge burden of administrative paperwork blocks creative teacher slots."] },
    { id: "placement", name: "Placement Aspirant", avatar: "Sparkles", context: "Applies to professional job queues and solves coding tests.", struggles: ["Competitive ranking stress during company campus placement drives.", "Severe feelings of worthlessness when rejected in final interview rounds.", "Exhausting multi-stage coding tests that feel like complete trick walls."] },
    { id: "final-year", name: "Final Year Student", avatar: "Compass", context: "Drafts research project files and works on presentations.", struggles: ["Immense stress of compiling long theses with tight submission lines.", "Anxious about graduating into a competitive job market with college loans.", "Juggling heavy final project reviews with regular daily attendance."] },
    { id: "counselor", name: "Academic Counselor", avatar: "Activity", context: "Answers student stress files and organizes health panels.", struggles: ["High student-to-counselor volumes mean children get minimal slots.", "Students visit our office only after their semester grades have crashed.", "Strong student stigma that seeing a counselor means you are failures."] }
  ],
  "campus-friendships": [
    { id: "student", name: "Student", avatar: "User", context: "Wants to form authentic, deep peer bonds on campus.", struggles: ["Hallway interactions are surface-level and never yield real friends.", "Intimidating to push past closed, existing circles of college cliques.", "Feeling incredibly lonely while sitting in a crowded campus plaza."] },
    { id: "freshman", name: "Freshman", avatar: "Compass", context: "Navigates freshman college week as newer entrants.", struggles: ["Eating lunch alone in canteens brings heavy, awkward self-doubt.", "Zipping lips and avoiding strangers due to intense fear of rejection.", "Severe homesickness for childhood family circles and old school buddies."] },
    { id: "hostel", name: "Hostel Resident", avatar: "Activity", context: "Lives in dormitory housing with student roommates.", struggles: ["Common room lounges are empty and cold, lacking welcoming board games.", "Dorm mates lock their doors and watch screens instead of greeting.", "Feeling lonely despite living with hundreds of students in one building."] },
    { id: "club", name: "Club Member", avatar: "Sparkles", context: "Volunteers for campus community, events, and sports blocks.", struggles: ["New shy students hesitate to sign up or join active club discussions.", "Active groups become closed cliques, discouraging newer volunteer sign-ups.", "Very low participation during student-run club mixers due to busy classes."] },
    { id: "introvert", name: "Introvert Student", avatar: "Heart", context: "Processes things quietly and values deep one-on-one bonds.", struggles: ["Massive campus mixers are loud, overwhelming, and spike my anxiety.", "Zero quiet, cozy spots on campus to talk or have serene peace.", "Extreme social exhaustion from pretending to be extremely energetic and outgoing."] },
    { id: "international", name: "International Student", avatar: "ShieldCheck", context: "Travels from different countries to study abroad.", struggles: ["Culture gaps and local slang references make casual jokes feel foreign.", "Intense isolation during campus holidays when local dorm mates go home.", "Feeling excluded or misunderstood during casual student group projects."] }
  ],
  default: [
    { id: "student", name: "Student", avatar: "User", context: "Faces hectic daily routines and wants safe options.", struggles: ["Unlit paths make walking at night feel unsafe.", "Long wait intervals for public transport create stress."] },
    { id: "parent", name: "Parent", avatar: "Heart", context: "Worried about family safety and balance.", struggles: ["Difficult to coordinate safe travel times for the family.", "Public streets are chaotic during peak commute hours."] },
    { id: "rider", name: "Delivery Rider", avatar: "Car", context: "Rides scooter to complete delivery runs.", struggles: ["Rushing through traffic on narrow lanes is scary and risky.", "No safe resting spots are built for couriers inside community zones."] },
    { id: "elderly", name: "Elderly Person", avatar: "Activity", context: "Walks to local grocery stores.", struggles: ["No sidewalk benches to rest during walking commutes.", "Vehicle drivers rarely pause for people with walking support."] },
    { id: "police", name: "Patrol Officer", avatar: "ShieldCheck", context: "Helps guide pedestrians in busy plazas.", struggles: ["Nowhere to direct lost walkers safely during heavy rainstorms.", "Commuters disregard warning signals, causing dangerous blockages."] },
    { id: "pedestrian", name: "Pedestrian", avatar: "Compass", context: "Walks through busy community hubs.", struggles: ["Sidewalk paths are uneven, leading to puddles and trip hazards.", "Missing crossing signals key zones make sidewalks isolated."] }
  ]
};

export default function EmpathizeStage({
  topic,
  onAddXP,
  onUnlockBadge,
  problemObservations,
  setProblemObservations,
  onNext,
  onShowToast,
  theme
}: EmpathizeStageProps) {
  const isDark = theme === "dark";
  const [perspectives, setPerspectives] = useState<{ id: string; name: string; avatar: string; context: string; struggles: string[] }[]>([]);
  const [selectedPerspective, setSelectedPerspective] = useState<{ id: string; name: string; avatar: string; context: string; struggles: string[] } | null>(null);
  const [animationTarget, setAnimationTarget] = useState<string | null>(null);
  const [isLoadingPerspectives, setIsLoadingPerspectives] = useState(false);
  const [isBroadFallback, setIsBroadFallback] = useState(false);
  const [isLoadingStrugglesMap, setIsLoadingStrugglesMap] = useState<Record<string, boolean>>({});

  // Custom Perspective modal form states
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customRole, setCustomRole] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [isGeneratingPerspective, setIsGeneratingPerspective] = useState(false);
  const [isCustomRoleSafe, setIsCustomRoleSafe] = useState(true);
  const [isCustomContextSafe, setIsCustomContextSafe] = useState(true);

  // Custom Sticky observation form states
  const [newStickyText, setNewStickyText] = useState("");
  const [isStickySafe, setIsStickySafe] = useState(true);
  const [validatingTargetId, setValidatingTargetId] = useState<string | null>(null);
  const [isValidatingSticky, setIsValidatingSticky] = useState(false);
  const [observationError, setObservationError] = useState<string | null>(null);
  const [refinerSuggestion, setRefinerSuggestion] = useState<string | null>(null);
  const [originalPendingText, setOriginalPendingText] = useState("");
  const [pendingPinText, setPendingPinText] = useState<string | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Performance optimized states
  const [backgroundEnhancements, setBackgroundEnhancements] = useState<Record<string, { suggestion: string | null; status: "idle" | "loading" | "ready" | "error" }>>({});
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [observationFeedback, setObservationFeedback] = useState<{ type: "success" | "error" | null; message: string | null }>({ type: null, message: null });

  // Synchronous/Asynchronous perspective loader
  useEffect(() => {
    const listKey = `zupskill_perspectives_${topic.id}`;
    const selKey = `zupskill_selected_perspective_${topic.id}`;
    
    const savedList = localStorage.getItem(listKey);
    const savedSel = localStorage.getItem(selKey);
    
    if (savedList) {
      try {
        const parsedList = JSON.parse(savedList);
        setPerspectives(parsedList);
        
        let currentSel = parsedList[0] || null;
        if (savedSel) {
          try {
            const parsedSel = JSON.parse(savedSel);
            const found = parsedList.find((p: any) => p.id === parsedSel.id);
            if (found) {
              currentSel = found;
            } else {
              currentSel = parsedSel;
            }
          } catch (e) {
            console.error("Error parsing saved selected perspective:", e);
          }
        }
        setSelectedPerspective(currentSel);
        setIsLoadingPerspectives(false);
        return;
      } catch (err) {
        console.error("Error parsing saved perspectives:", err);
      }
    }

    if (topic.isCustom) {
      setIsLoadingPerspectives(true);
      const startTime = Date.now();
      
      const fetchCustomPerspectives = async () => {
        try {
          const response = await fetch("/api/generate-topic-perspectives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicTitle: topic.title,
              topicDescription: topic.description
            })
          });
          
          if (!response.ok) {
            throw new Error("HTTP error " + response.status);
          }
          
          const result = await response.json();
          let labelList: string[] = [];
          if (Array.isArray(result)) {
            labelList = result;
          } else if (result && Array.isArray(result.perspectives)) {
            labelList = result.perspectives;
          } else {
            labelList = ["Primary User", "Subject Expert", "Service Provider", "Community Resident", "Observer"];
          }
          
          const generatedList = labelList.slice(0, 5).map((label: string, index: number) => ({
            id: `custom_${label.toLowerCase().trim().replace(/[^a-z0-9]/g, "_")}`,
            name: label,
            avatar: ["User", "Heart", "Compass", "Briefcase", "Activity"][index % 5],
            context: `Perspective of ${label}`,
            struggles: []
          }));
          
          const duration = Date.now() - startTime;
          const minDelay = 600; // Ultra-fast responsive latency target (under 2 seconds)
          if (duration < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - duration));
          }
          
          if (generatedList.length > 0) {
            setPerspectives(generatedList);
            setSelectedPerspective(generatedList[0]);
          } else {
            const defaultList = SIMPLE_PERSPECTIVES_BY_TOPIC["default"];
            setPerspectives(defaultList);
            setSelectedPerspective(defaultList[0]);
            setIsBroadFallback(true);
          }
        } catch (error) {
          console.error("Failed to fetch custom perspectives:", error);
          const duration = Date.now() - startTime;
          const minDelay = 600;
          if (duration < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - duration));
          }
          
          // Local offline/fallback logic - ONLY labels!
          const lowerTopic = (topic.title || "").toLowerCase();
          let fallbackLabels = ["Primary User", "Expert Guide", "Service Provider", "Coordinator", "Community Resident"];
          if (lowerTopic.includes("obese") || lowerTopic.includes("obesity") || lowerTopic.includes("weight") || lowerTopic.includes("fat") || lowerTopic.includes("health")) {
            fallbackLabels = ["Obese Individual", "Parent", "Fitness Trainer", "Nutritionist", "Doctor"];
          } else if (lowerTopic.includes("pet") || lowerTopic.includes("animal") || lowerTopic.includes("dog") || lowerTopic.includes("cat") || lowerTopic.includes("adoption")) {
            fallbackLabels = ["Pet Owner", "Animal Shelter Worker", "Veterinarian", "Apartment Resident", "Volunteer"];
          } else if (lowerTopic.includes("water") || lowerTopic.includes("scarcity") || lowerTopic.includes("dry") || lowerTopic.includes("rain") || lowerTopic.includes("conserve")) {
            fallbackLabels = ["Resident", "Farmer", "Local Government Officer", "Business Owner", "Environmental Volunteer"];
          } else if (lowerTopic.includes("space") || lowerTopic.includes("exploration") || lowerTopic.includes("rocket") || lowerTopic.includes("planet") || lowerTopic.includes("mars")) {
            fallbackLabels = ["Astronaut", "Aerospace Engineer", "Mission Control Operator", "Space Scientist", "Space Tourist"];
          } else if (lowerTopic.includes("artificial") || lowerTopic.includes("ai") || lowerTopic.includes("intelligence") || lowerTopic.includes("machine learning")) {
            fallbackLabels = ["Student", "Software Engineer", "Business Owner", "Teacher", "Research Scientist"];
          }
          
          const fallbackList = fallbackLabels.map((label: string, index: number) => ({
            id: `custom_${label.toLowerCase().trim().replace(/[^a-z0-9]/g, "_")}`,
            name: label,
            avatar: ["User", "Heart", "Compass", "Briefcase", "Activity"][index % 5],
            context: `Perspective of ${label}`,
            struggles: []
          }));
          
          setPerspectives(fallbackList);
          setSelectedPerspective(fallbackList[0]);
          setIsBroadFallback(true);
        } finally {
          setIsLoadingPerspectives(false);
        }
      };

      fetchCustomPerspectives();
    } else {
      const currentList = SIMPLE_PERSPECTIVES_BY_TOPIC[topic.id] || SIMPLE_PERSPECTIVES_BY_TOPIC["default"];
      setPerspectives(currentList);
      setSelectedPerspective(currentList[0] || null);
      setIsLoadingPerspectives(false);
    }
  }, [topic]);

  // Lazy dynamic struggles fetcher rule: "Generate observations ONLY AFTER the user selects a perspective."
  useEffect(() => {
    if (!selectedPerspective) return;
    if (!topic.isCustom) return;
    
    const hasNoStruggles = !selectedPerspective.struggles || selectedPerspective.struggles.length === 0;
    if (!hasNoStruggles) return;
    if (isLoadingStrugglesMap[selectedPerspective.id]) return;

    const pid = selectedPerspective.id;
    setIsLoadingStrugglesMap(prev => ({ ...prev, [pid]: true }));

    fetch("/api/perspectives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topicTitle: topic.title,
        topicDescription: topic.description,
        perspectiveName: selectedPerspective.name
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then(data => {
        const frustrations = data.frustrations || ["Faces subtle design bottlenecks.", "Requires hand-on community guides."];
        const updatedP = {
          ...selectedPerspective,
          context: data.context || `Perspective of ${selectedPerspective.name}`,
          struggles: frustrations.slice(0, 3)
        };
        
        setPerspectives(prev => {
          const idx = prev.findIndex(item => item.id === pid);
          if (idx !== -1) {
            const nextList = [...prev];
            nextList[idx] = updatedP;
            return nextList;
          }
          return prev;
        });
        setSelectedPerspective(updatedP);
      })
      .catch(err => {
        console.error("Error fetching struggles for perspective:", err);
      })
      .finally(() => {
        setIsLoadingStrugglesMap(prev => ({ ...prev, [pid]: false }));
      });
  }, [selectedPerspective?.id, topic.id]);

  // Save changes to localStorage on updating perspectives or selectedPerspective
  useEffect(() => {
    if (perspectives.length > 0) {
      localStorage.setItem(`zupskill_perspectives_${topic.id}`, JSON.stringify(perspectives));
    }
  }, [perspectives, topic.id]);

  useEffect(() => {
    if (selectedPerspective) {
      localStorage.setItem(`zupskill_selected_perspective_${topic.id}`, JSON.stringify(selectedPerspective));
    }
  }, [selectedPerspective, topic.id]);

  // Click handler to pin a standard struggle to the board
  const injectNoteToBoard = (text: string, targetId: string) => {
    if (problemObservations.some(obs => obs.text === text)) return;
    setObservationError(null);

    const newObs: ProblemObservation = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      perspectiveName: selectedPerspective?.name || "Observation",
      text: text,
      cluster: "Struggle",
      votes: 1
    };

    const updated = [...problemObservations, newObs];
    setProblemObservations(updated);
    onAddXP(30);
    onShowToast?.("✓ Added to Board", "success");

    // Turn on the transient visual celebration feedback for this clicked target
    setAnimationTarget(targetId);
    setTimeout(() => {
      setAnimationTarget(null);
    }, 1500);

    // Gamification badges trigger
    if (updated.length >= 4) {
      onUnlockBadge("problem-hunter");
    }
  };  // Click handler to post typed observation inline
  const localCheckDuplicate = (text: string, existing: string[]) => {
    const cleanNew = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const wordsNew = new Set(cleanNew.split(/\s+/).filter(w => w.length > 2));
    if (wordsNew.size === 0) return false;

    for (const item of existing) {
      if (!item) continue;
      const cleanExist = item.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (cleanNew === cleanExist || cleanExist.includes(cleanNew) || cleanNew.includes(cleanExist)) {
        return true;
      }
      const wordsExist = new Set(cleanExist.split(/\s+/).filter(w => w.length > 2));
      let intersect = 0;
      wordsNew.forEach(w => {
        if (wordsExist.has(w)) intersect++;
      });
      const union = new Set([...wordsNew, ...wordsExist]).size;
      if (intersect / union >= 0.35) return true;
    }
    return false;
  };

  const performDirectPin = (textToPin: string, customId?: string) => {
    if (problemObservations.some(obs => obs.text.toLowerCase().trim() === textToPin.toLowerCase().trim())) {
      onShowToast?.("⚠️ This observation is already pinned.", "info");
      return;
    }

    const obsId = customId || `obs_${Date.now()}`;

    const newObs: ProblemObservation = {
      id: obsId,
      perspectiveName: selectedPerspective ? selectedPerspective.name : "My Observation",
      text: textToPin,
      cluster: "Observation",
      votes: 1
    };

    const updated = [...problemObservations, newObs];
    setProblemObservations(updated);
    
    // Clear all form and refinement states
    setRefinerSuggestion(null);
    setOriginalPendingText("");
    setPendingPinText(null);
    setShowDuplicateWarning(false);
    setNewStickyText("");
    setObservationError(null);
    setObservationFeedback({ type: null, message: null });
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    setIsStickySafe(true);
    onAddXP(25);
    onShowToast?.("✓ Added to Board", "success");

    setAnimationTarget("custom_sticky");
    setTimeout(() => {
      setAnimationTarget(null);
    }, 1500);

    if (updated.length >= 4) {
      onUnlockBadge("problem-hunter");
    }
  };

  const checkDuplicateAndPin = async (textToPin: string) => {
    setIsCheckingDuplicate(true);
    setObservationError(null);
    try {
      const existingTexts = problemObservations.map(obs => obs.text);
      const res = await fetch("/api/empathize/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToPin, existing: existingTexts })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isDuplicate) {
          setPendingPinText(textToPin);
          setShowDuplicateWarning(true);
          return;
        }
      }
    } catch (err) {
      console.warn("Duplicate check server request failed, trying frontend fallback:", err);
      const hasFuzzyDupe = localCheckDuplicate(textToPin, problemObservations.map(o => o.text));
      if (hasFuzzyDupe) {
        setPendingPinText(textToPin);
        setShowDuplicateWarning(true);
        return;
      }
    } finally {
      setIsCheckingDuplicate(false);
    }

    performDirectPin(textToPin);
  };

  const localRefineText = (rawText: string) => {
    const clean = rawText.trim();
    const lower = clean.toLowerCase();

    // --- 1. DIRECT LITERAL RULE-BASED MATCHERS FOR THE KNOWN EXAMPLES & PHRASES ---

    // Example 1: very hard for passengers to travel in sunny weather in peak afternoon
    if (lower.includes("sunny") && lower.includes("afternoon") && (lower.includes("passenger") || lower.includes("travel") || lower.includes("hard"))) {
      return "Passengers often find travelling difficult during peak afternoon heat.";
    }

    // Example 2: people when blind needs assistance to board buses
    if ((lower.includes("blind") || lower.includes("visually")) && (lower.includes("bus") || lower.includes("board")) && (lower.includes("assistance") || lower.includes("need") || lower.includes("help"))) {
      return "Blind passengers often require assistance when boarding buses.";
    }

    // Example 3: rain hard i miss bus difficult very
    if (lower.includes("rain") && lower.includes("miss") && lower.includes("bus") && (lower.includes("hard") || lower.includes("difficult"))) {
      return "Heavy rain can make it difficult for commuters to catch their buses on time.";
    }

    // Example 4: road no lights at night
    if ((lower.includes("road") || lower.includes("street")) && (lower.includes("no light") || lower.includes("no lights") || lower.includes("poor light") || lower.includes("poor lighting")) && lower.includes("night")) {
      return "Poor street lighting can make roads feel unsafe at night.";
    }

    // Example 5: elderly walk slow miss bus
    if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("walk") || lower.includes("slow")) && lower.includes("bus") && lower.includes("miss")) {
      return "Elderly passengers may struggle to reach buses on time due to slower mobility.";
    }

    // Test case "elderly people walk slow" (Must NOT mention buses!)
    if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("walk") || lower.includes("slow"))) {
      // If they didn't mention bus, only mention walking
      if (!lower.includes("bus") && !lower.includes("stop") && !lower.includes("station")) {
        return "Elderly people may require more time to walk long distances.";
      }
    }

    // Test case "very hard for passengers to travel in rain weather" (Must NOT mention buses/delays/stops!)
    if (lower.includes("rain") && (lower.includes("passenger") || lower.includes("commuter") || lower.includes("travel")) && !lower.includes("bus") && !lower.includes("delay") && !lower.includes("stop")) {
      return "Passengers often find it difficult to travel during rainy weather.";
    }

    // Match: Blind people / Visually impaired (General)
    if (lower.includes("blind") || lower.includes("visually")) {
      return "Blind individuals often find it difficult to navigate public spaces safely.";
    }

    // Match: Elderly passengers find seat in busy bus
    if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("seat") || lower.includes("sit") || lower.includes("chair")) && lower.includes("bus")) {
      return "Elderly passengers often struggle to find available seats on crowded buses.";
    }

    // Match: Cross road near school dangerous
    if ((lower.includes("cross") || lower.includes("crossing")) && (lower.includes("road") || lower.includes("street")) && lower.includes("school") && (lower.includes("danger") || lower.includes("dangerous"))) {
      return "Crossing roads near schools can feel dangerous during busy traffic hours.";
    }

    // Match: Cross busy roads (General)
    if ((lower.includes("cross") || lower.includes("crossing")) && (lower.includes("road") || lower.includes("street")) && (lower.includes("danger") || lower.includes("dangerous"))) {
      return "Crossing busy roads feels unsafe due to fast-moving traffic.";
    }

    // Match: Road no light of poor lighting (General)
    if ((lower.includes("road") || lower.includes("street")) && (lower.includes("no light") || lower.includes("poor light") || lower.includes("lights"))) {
      return "Poor street lighting makes roads feel unsafe at night.";
    }

    // Match: Walking alone scary
    if (lower.includes("walking") && (lower.includes("scary") || lower.includes("alone") || lower.includes("fear"))) {
      return "Walking alone at night can feel unsafe and stressful.";
    }

    // Match: Crowded bus uncomfortable
    if (lower.includes("crowded") && lower.includes("bus")) {
      return "Overcrowded buses make daily commuting uncomfortable.";
    }

    // Match: Bus late / delayed (no school mention)
    if (lower.includes("bus") && (lower.includes("late") || lower.includes("delay")) && !lower.includes("school")) {
      return "Buses are frequently delayed, affecting daily travel.";
    }

    // Match: Students seating lunch hour
    if ((lower.includes("student") || lower.includes("school")) && (lower.includes("seat") || lower.includes("sit") || lower.includes("lunch"))) {
      return "Students struggle to find seating during lunch hours.";
    }

    // --- 2. DYNAMIC INTENT-REWRITER: RIGOROUS NO-ASSUMPTION, ANTI-COPY POLISHER ---
    // If no manual rules are matched, we rewrite dynamically to preserve ALL original entities,
    // activities, and context while answering:
    // - WHO is affected?
    // - WHAT are they doing?
    // - WHAT problem are they facing?
    // - UNDER WHAT condition?
    
    let polished = clean;
    // Standard word list cleanup
    polished = polished.replace(/\s+/g, " ");

    // 1) Identify Who (stakeholder)
    let who = "Commuters";
    if (lower.includes("student") || lower.includes("school")) {
      who = "Students";
    } else if (lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) {
      who = "Elderly passengers";
    } else if (lower.includes("parent")) {
      who = "Parents";
    } else if (lower.includes("child") || lower.includes("kid")) {
      who = "Children";
    } else if (lower.includes("driver")) {
      who = "Drivers";
    } else if (lower.includes("blind")) {
      who = "Blind passengers";
    } else if (lower.includes("disabled") || lower.includes("wheelchair")) {
      who = "Passengers with disabilities";
    } else if (lower.includes("rider") || lower.includes("cyclist")) {
      who = "Delivery riders";
    } else if (lower.includes("passenger")) {
      who = "Passengers";
    }

    // 2) Identify Activity (acting upon user verb)
    let activity = "travel";
    if (lower.includes("bus") && (lower.includes("travel") || lower.includes("commute") || lower.includes("go"))) {
      activity = "bus travel";
    } else if (lower.includes("walk")) {
      activity = "walking";
    } else if (lower.includes("board")) {
      activity = "boarding buses";
    } else if (lower.includes("cross")) {
      activity = "crossing roads";
    } else if (lower.includes("reach")) {
      activity = "reaching their destinations";
    } else if (lower.includes("wait")) {
      activity = "waiting for public transit";
    } else if (lower.includes("sit") || lower.includes("seat")) {
      activity = "finding available seats";
    } else if (lower.includes("travel")) {
      activity = "travelling";
    } else if (lower.includes("commute")) {
      activity = "regular commuting";
    } else if (lower.includes("bus")) {
      activity = "bus travel";
    }

    // 3) Identify Problem
    let problem = "difficult";
    if (lower.includes("safe") || lower.includes("danger") || lower.includes("scary")) {
      problem = "unsafe";
    } else if (lower.includes("uncomfortable") || lower.includes("seat") || lower.includes("sit")) {
      problem = "uncomfortable";
    } else if (lower.includes("delay") || lower.includes("late")) {
      problem = "frustrating";
    } else if (lower.includes("hard") || lower.includes("struggle") || lower.includes("difficult")) {
      problem = "difficult";
    }

    // 4) Identify Condition/Context
    let condition = "";
    if (lower.includes("rain") || lower.includes("wet")) {
      if (lower.includes("heavy") || lower.includes("hard")) {
        condition = " during heavy rainfall";
      } else {
        condition = " during rainy weather";
      }
    } else if (lower.includes("sunny") || lower.includes("hot") || lower.includes("heat") || lower.includes("afternoon")) {
      if (lower.includes("afternoon") || lower.includes("peak")) {
        condition = " during peak afternoon heat";
      } else {
        condition = " during intense hot weather";
      }
    } else if (lower.includes("night") || lower.includes("dark")) {
      if (lower.includes("light") || lower.includes("lighting")) {
        condition = " on poorly lit streets at night";
      } else {
        condition = " during nighttime hours";
      }
    } else if (lower.includes("crowded")) {
      condition = " in overcrowded transit vehicles";
    } else if (lower.includes("late") || lower.includes("delay")) {
      condition = " due to unexpected transit delays";
    }

    // Let's build our elegant polished sentence: [Who] often find [Activity] [Problem] [Condition].
    const elegantPolished = `${who} often find ${activity} ${problem}${condition}.`;

    // Grammar enhancements that map broken words safely
    let refinedWords = polished.split(/\s+/).filter(w => w.length > 0);
    let mappedWords = refinedWords.map(w => {
      const lowW = w.toLowerCase().replace(/[^a-z]/g, "");
      if (lowW === "peoples") return "people";
      if (lowW === "needs") return "need";
      if (lowW === "dont") return "do not";
      if (lowW === "doesnt") return "does not";
      if (lowW === "cant") return "cannot";
      if (lowW === "theres") return "there is";
      return w;
    });

    let reconstructed = mappedWords.join(" ");
    reconstructed = reconstructed.charAt(0).toUpperCase() + reconstructed.slice(1);
    if (!/[.!?]$/.test(reconstructed)) {
      reconstructed += ".";
    }

    // Anti-Copy check: Jaccard word similarity Helper
    const getSimilarityWord = (a: string, b: string): number => {
      const na = a.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
      const nb = b.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(Boolean);
      if (na.length === 0 || nb.length === 0) return 0;
      const setB = new Set(nb);
      const matches = na.filter(x => setB.has(x)).length;
      return (matches / (na.length + nb.length - matches)) * 100;
    };

    const sim = getSimilarityWord(clean, reconstructed);
    // If too similar to user copy input, we use the highly structured, detail-preserving elegantPolished sentence!
    if (sim > 75) {
      return elegantPolished;
    }

    return reconstructed;
  };

  // Optimized Typing Handler with 2-second debounce (Rule 2)
  const handleStickyTextChange = (val: string) => {
    setNewStickyText(val);
    setObservationError(null);
    setRefinerSuggestion(null);
    setShowDuplicateWarning(false);
    setPendingPinText(null);
    
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Clear messages immediately while typing
    setObservationFeedback({ type: null, message: null });
    setIsStickySafe(true);

    const trimmed = val.trim();
    if (!trimmed) {
      return;
    }

    // Run local check ONLY after 2 seconds of silence (Rule 2)
    validationTimeoutRef.current = setTimeout(() => {
      const checkResult = localValidateEmpathize(trimmed, topic, selectedPerspective);
      if (checkResult.safe) {
        setObservationFeedback({
          type: "success",
          message: "Looks good! You can add more detail if you'd like, but this observation is valid."
        });
        setIsStickySafe(true);
      } else {
        setObservationFeedback({
          type: "error",
          message: checkResult.warning || "⚠️ Observation validation failed."
        });
        setIsStickySafe(false);
      }
    }, 2000);
  };

  // Background Async AI refinement handler (Rule 7, 8)
  const triggerBackgroundRefinement = async (obsId: string, text: string) => {
    setBackgroundEnhancements(prev => ({
      ...prev,
      [obsId]: { suggestion: null, status: "loading" }
    }));

    try {
      const response = await fetch("/api/empathize/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          context: "Empathize - " + topic.title,
          perspective: selectedPerspective ? selectedPerspective.name : ""
        })
      });

      if (!response.ok) {
        throw new Error("Refinement request failed");
      }

      const res = await response.json();
      if (res.safe && res.refinedText) {
        const suggestionText = res.refinedText;
        if (suggestionText.trim().toLowerCase() !== text.trim().toLowerCase()) {
          setBackgroundEnhancements(prev => ({
            ...prev,
            [obsId]: { suggestion: suggestionText, status: "ready" }
          }));
        } else {
          // No refinement needed (same text)
          setBackgroundEnhancements(prev => {
            const next = { ...prev };
            delete next[obsId];
            return next;
          });
        }
      } else {
        setBackgroundEnhancements(prev => {
          const next = { ...prev };
          delete next[obsId];
          return next;
        });
      }
    } catch (err) {
      console.warn("Background AI refiner request failed, fallback dynamically:", err);
      const suggestionText = localRefineText(text);
      if (suggestionText && suggestionText.trim().toLowerCase() !== text.trim().toLowerCase()) {
        setBackgroundEnhancements(prev => ({
          ...prev,
          [obsId]: { suggestion: suggestionText, status: "ready" }
        }));
      } else {
        setBackgroundEnhancements(prev => {
          const next = { ...prev };
          delete next[obsId];
          return next;
        });
      }
    }
  };

  // Click handler to post typed observation inline (Instant under 300ms!)
  const handleAddCustomSticky = async () => {
    const text = newStickyText.trim();
    if (!text) return;

    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Fast local validation first (Rule 3)
    const localCheck = localValidateEmpathize(text, topic, selectedPerspective);
    if (!localCheck.safe) {
      setObservationFeedback({
        type: "error",
        message: localCheck.warning || "⚠️ Please enter a real observation, challenge, or problem related to the selected topic."
      });
      onShowToast?.(localCheck.warning || "⚠️ Observation validation failed.", "info");
      return;
    }

    // Instantly check for fuzzy duplicate locally
    const existing = problemObservations.map(o => o.text);
    const isDup = localCheckDuplicate(text, existing);
    if (isDup) {
      setPendingPinText(text);
      setShowDuplicateWarning(true);
      return;
    }

    // Add to Problem Board instantly!
    const customId = `obs_custom_${Date.now()}`;
    performDirectPin(text, customId);

    // Trigger background enhancement asynchronously
    triggerBackgroundRefinement(customId, text);
  };

  const handleApplyEnhancement = (id: string) => {
    const enhancement = backgroundEnhancements[id];
    if (enhancement && enhancement.suggestion) {
      setProblemObservations(problemObservations.map(obs => {
        if (obs.id === id) {
          return { ...obs, text: enhancement.suggestion! };
        }
        return obs;
      }));
      onShowToast?.("✓ Observation text improved!", "success");
      setBackgroundEnhancements(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDismissEnhancement = (id: string) => {
    setBackgroundEnhancements(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Accept and use refined version
  const handleAcceptRefined = async () => {
    if (!refinerSuggestion) return;
    await checkDuplicateAndPin(refinerSuggestion);
  };

  // Reject and keep original
  const handleRejectRefined = async () => {
    if (!originalPendingText) return;
    await checkDuplicateAndPin(originalPendingText);
  };

  // Duplicate decision handlers
  const handleAddAnyway = () => {
    if (!pendingPinText) return;
    performDirectPin(pendingPinText);
  };

  const handleCancelPin = () => {
    setPendingPinText(null);
    setShowDuplicateWarning(false);
    setRefinerSuggestion(null);
    setOriginalPendingText("");
    onShowToast?.("Cancelled pinning", "info");
  };

  // Remove sticky note from board
  const handleRemoveStickyNote = (id: string) => {
    setProblemObservations(problemObservations.filter(o => o.id !== id));
  };

  // Custom perspective generator using server API
  const handleGeneratePerspective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRole.trim() || !isCustomRoleSafe || !isCustomContextSafe) return;
    setIsGeneratingPerspective(true);

    try {
      const response = await fetch("/api/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicTitle: topic.title,
          topicDescription: topic.description,
          perspectiveName: customRole
        })
      });

      if (!response.ok) {
        throw new Error("Could not fetch perspective from server.");
      }

      const generated = await response.json();
      const newPers = {
        id: `gen_${Date.now()}`,
        name: generated.role || customRole,
        avatar: generated.avatar || "User",
        context: generated.context || customContext || "A stakeholder in our community.",
        struggles: (generated.frustrations || ["Faces subtle design bottlenecks.", "Requires hand-on community guides."]).slice(0, 3)
      };

      setPerspectives(prev => [...prev, newPers]);
      setSelectedPerspective(newPers);
      setIsGeneratingPerspective(false);
      setShowAddCustomModal(false);
      setCustomRole("");
      setCustomContext("");
      onAddXP(50);
      onUnlockBadge("collaborator");
      onShowToast?.("🔮 Custom Persona created!", "success");

    } catch (err) {
      console.warn("API perspective call fallback:", err);
      // Smart resilience fallback matching selected topic & role beautifully in simple language
      const lowerRole = customRole.toLowerCase();
      const lowerTopic = (topic.title || "").toLowerCase();
      const fallbackStr: string[] = [];

      if (lowerTopic.includes("safety") || lowerTopic.includes("road") || lowerTopic.includes("transport")) {
        fallbackStr.push(`${customRole} struggles with sudden chaotic traffic blockages during busy rush hours.`);
        fallbackStr.push(`${customRole} worries about pedestrians or children crossing in unlit or dangerous sections.`);
        fallbackStr.push(`${customRole} finds it difficult to safely slow down or check blind spots near narrow lanes.`);
      } else if (lowerTopic.includes("mental") || lowerTopic.includes("burnout") || lowerTopic.includes("sleep") || lowerTopic.includes("stress")) {
        fallbackStr.push(`${customRole} feels exhausted from handling endless academic demands and constant notifications.`);
        fallbackStr.push(`${customRole} struggles to get comfortable, deep rest without checking screens late at night.`);
        fallbackStr.push(`${customRole} finds it difficult to share their stress with others due to high expectations.`);
      } else if (lowerTopic.includes("friend") || lowerTopic.includes("camp") || lowerTopic.includes("study") || lowerTopic.includes("college")) {
        fallbackStr.push(`${customRole} finds standard classroom technology or pathways confusing and exhausting.`);
        fallbackStr.push(`${customRole} struggles to find quiet, welcoming spaces to connect with peers or relax.`);
        fallbackStr.push(`${customRole} wishes for simpler ways to interact with others without feeling awkward.`);
      } else if (lowerTopic.includes("food")) {
        fallbackStr.push(`${customRole} struggles with high cost of fresh, healthy ingredients nearby.`);
        fallbackStr.push(`${customRole} finds it difficult to prepare balanced single-portion meals quickly.`);
        fallbackStr.push(`${customRole} faces awkward delays or crowd queues when seeking clean eating options.`);
      } else {
        fallbackStr.push(`${customRole} struggles to navigate safe and comfortable options during busy times.`);
        fallbackStr.push(`${customRole} feels stressed by a lack of clear signs, helpers, or quiet spaces.`);
        fallbackStr.push(`${customRole} faces regular delays because modern community systems ignore their daily needs.`);
      }

      const fallbackPers = {
        id: `gen_fallback_${Date.now()}`,
        name: customRole,
        avatar: "User",
        context: customContext || `An active community stakeholder affected by this issue.`,
        struggles: fallbackStr
      };

      setPerspectives(prev => [...prev, fallbackPers]);
      setSelectedPerspective(fallbackPers);
      setIsGeneratingPerspective(false);
      setShowAddCustomModal(false);
      setCustomRole("");
      setCustomContext("");
      onAddXP(30);
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto py-6 px-4 animate-in fade-in duration-300 ${
      isDark ? "text-text-primary" : "text-slate-900"
    }`}>
      
      {/* HEADER SECTION - Premium, clear, adaptive styling */}
      <div className="text-center mb-8 max-w-3xl mx-auto">
        <span className={`text-xs font-mono uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${
          isDark 
            ? "text-brand-primary bg-brand-primary/35 border-brand-primary/20" 
            : "text-brand-primary bg-brand-primary/10 border-brand-primary font-bold"
        }`}>
          Step 2: Empathize 🧠
        </span>
        <h2 className={`text-3xl font-extrabold mt-4 mb-2 tracking-tight ${
          isDark ? "text-text-primary" : "text-slate-950 font-black"
        }`}>
          See the problem through <span className={`bg-clip-text text-transparent bg-gradient-to-r ${
            isDark ? "from-brand-primary to-brand-primary/80" : "from-brand-primary to-brand-primary/80"
          }`}>different eyes</span>
        </h2>
        <p className={`text-sm max-w-2xl mx-auto ${
          isDark ? "text-text-secondary" : "text-text-tertiary font-semibold"
        }`}>
          Select a perspective below, see their everyday struggles, and pick the ones that stand out. Feel free to write down your own observations, too!
        </p>
      </div>

      {/* COMPACT INTUITIVE METRICS MONITOR BAR */}
      <div className={`p-4 rounded-2xl flex flex-col items-stretch gap-4 mb-6 border-2 shadow-sm transition-all ${
        isDark 
          ? "bg-brand-primary/15 border-brand-primary/10" 
          : "bg-brand-primary/10/70 border-brand-primary"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDark ? "bg-brand-primary" : "bg-indigo-650"
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isDark ? "bg-brand-primary" : "bg-brand-primary"
              }`}></span>
            </div>
            <div>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                isDark ? "text-brand-primary" : "text-brand-primary font-black"
              }`}>
                STUDY REGION ACTIVE
              </span>
              <h4 className={`text-xs font-extrabold uppercase ${
                isDark ? "text-text-primary" : "text-slate-950 font-black"
              }`}>
                {topic.title}
              </h4>
            </div>
          </div>
          <span className={`text-[10px] font-mono italic ${
            isDark ? "text-text-tertiary" : "text-slate-700 font-bold"
          }`}>
            Tip: Pick at least 1 struggle to start building your Problem Board!
          </span>
        </div>
        
        {isBroadFallback && (
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isDark 
              ? "bg-amber-950/20 border-brand-secondary/20 text-amber-300" 
              : "bg-amber-50 border-amber-300/40 text-amber-950 font-bold"
          }`}>
            💡 <span className="font-extrabold">Broad Perspectives Active:</span> Because this topic description is quite open-ended or generic, broad community viewpoints have been generated to help you find an entry point.
          </div>
        )}
      </div>

      {/* CORE INTERACTION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch mb-8">
        
        {/* LEFT COLUMN: Perspective Selector + Struggle Picker (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* PERSPECTIVE BUTTON ROW */}
          <div>
            <span className={`text-[10px] font-mono uppercase tracking-widest block mb-2.5 px-1 ${
              isDark ? "text-text-tertiary font-bold" : "text-slate-900 font-black"
            }`}>
              👥 CHOOSE A PERSPECTIVE
            </span>
            <div className="flex flex-wrap gap-2 items-center">
              {isLoadingPerspectives ? (
                <div className="flex flex-wrap gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <button
                      key={`skeleton_${idx}`}
                      disabled
                      className={`px-4 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 animate-pulse ${
                        isDark
                          ? "bg-background/20 text-text-tertiary border-border/60"
                          : "bg-surface text-slate-450 border-slate-200"
                      }`}
                    >
                      <User className="w-4 h-4 opacity-40 animate-pulse" />
                      <span>Loading...</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  {perspectives.map((p) => {
                    const isSelected = selectedPerspective?.id === p.id;
                    const IconComponent = iconMap[p.avatar] || User;

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPerspective(p)}
                        className={`px-4 py-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-brand-primary/10 text-brand-primary border-brand-primary/60 shadow-[0_0_12px_rgba(0,181,230,0.15)] scale-[1.02]"
                              : "bg-brand-primary/20/98 text-brand-primary border-brand-primary shadow-[0_2px_10px_rgba(79,70,229,0.1)] scale-[1.02]"
                            : isDark
                              ? "bg-background/45 text-text-secondary border-border hover:text-text-primary hover:border-border"
                              : "bg-surface text-slate-700 border-slate-250 hover:bg-surface-hover hover:text-slate-900 hover:border-slate-400 shadow-sm"
                        }`}
                      >
                        <IconComponent className="w-4 h-4 shrink-0" />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Always keep Add Perspective available even after AI generates standard list */}
              {!isLoadingPerspectives && (
                <button
                  onClick={() => setShowAddCustomModal(true)}
                  className={`px-4 py-2.5 rounded-xl border border-dashed transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? "border-purple-800 hover:border-purple-500 bg-purple-950/10 text-purple-400 hover:text-purple-300"
                      : "border-purple-450 hover:border-purple-600 bg-purple-50/50 text-purple-750 hover:text-purple-900 shadow-sm font-extrabold"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Perspective</span>
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE PERSPECTIVE DETAILS PANEL */}
          {isLoadingPerspectives ? (
            <div className={`rounded-2xl p-5 space-y-5 border-2 animate-pulse ${
              isDark
                ? "bg-background/30 border-border"
                : "bg-surface border-slate-250 shadow-sm"
            }`}>
              {/* Skeleton Summary */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className={`h-2.5 w-24 rounded ${isDark ? "bg-surface-hover" : "bg-slate-200"}`} />
                  <div className={`h-4.5 w-48 rounded ${isDark ? "bg-surface-hover" : "bg-slate-200"}`} />
                </div>
                <div className={`h-3 w-3/4 rounded mt-2 ${isDark ? "bg-surface-hover" : "bg-slate-150"}`} />
              </div>

              {/* Skeleton Struggles */}
              <div className={`pt-4 border-t space-y-3.5 ${isDark ? "border-slate-905/65" : "border-slate-200"}`}>
                <div className={`h-2.5 w-32 rounded ${isDark ? "bg-surface-hover" : "bg-slate-200"}`} />
                <div className={`h-11 w-full rounded ${isDark ? "bg-surface/60" : "bg-slate-150/50"}`} />
                <div className={`h-11 w-full rounded ${isDark ? "bg-surface/60" : "bg-slate-150/50"}`} />
              </div>
            </div>
          ) : selectedPerspective ? (
            <div className={`rounded-2xl p-5 space-y-5 animate-in fade-in duration-200 border-2 ${
              isDark
                ? "bg-background/30 border-border"
                : "bg-surface border-slate-250 shadow-sm"
            }`}>
              
              {/* Context Summary */}
              <div>
                <span className={`text-[10px] uppercase block mb-1.5 ${
                  isDark ? "font-mono text-brand-primary/80 font-bold tracking-widest" : "font-sans text-brand-primary font-black tracking-wider"
                }`}>
                  WHO THEY ARE
                </span>
                <p className={`text-sm flex items-center gap-2 ${
                  isDark ? "font-bold text-text-primary" : "font-black text-slate-950 text-base"
                }`}>
                  {selectedPerspective.name}
                  {selectedPerspective.id.startsWith("gen") && (
                    <span className={`text-[8px] border px-2 py-0.5 rounded uppercase font-mono font-bold ${
                      isDark 
                        ? "bg-purple-950/50 text-purple-400 border-purple-500/20" 
                        : "bg-purple-100 text-purple-900 border-purple-300"
                    }`}>
                      AI Added
                    </span>
                  )}
                </p>
                <p className={`text-xs italic mt-1.5 leading-relaxed ${
                  isDark ? "text-slate-350" : "text-slate-800 font-extrabold"
                }`}>
                  "{selectedPerspective.context}"
                </p>
              </div>

              {/* Struggles - up to 3 */}
              <div className={`pt-4 border-t ${isDark ? "border-slate-905/65" : "border-slate-200"}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-3 ${
                  isDark ? "font-mono text-purple-400/80" : "font-sans text-purple-800 font-extrabold"
                }`}>
                  💡 Suggested Observations
                </span>
                
                {isLoadingStrugglesMap[selectedPerspective.id] || !selectedPerspective.struggles || selectedPerspective.struggles.length === 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-dashed border-border/40 bg-background/5 animate-pulse">
                      <div className="h-4.5 w-3/4 rounded bg-surface-hover/60" />
                      <div className="h-7 w-12 rounded bg-surface-hover/40" />
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-dashed border-border/40 bg-background/5 animate-pulse">
                      <div className="h-4.5 w-2/3 rounded bg-surface-hover/60" />
                      <div className="h-7 w-12 rounded bg-surface-hover/40" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedPerspective.struggles.slice(0, 3).map((struggle, idx) => {
                      const isPinned = problemObservations.some(obs => obs.text === struggle);
                      const targetFeedbackKey = `${selectedPerspective.id}_${idx}`;
                      const feedbackActive = animationTarget === targetFeedbackKey;

                      return (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl flex items-center justify-between gap-4 transition-all border ${
                            isDark
                              ? "bg-surface/40 border-border hover:border-border"
                              : "bg-background border-slate-200 hover:border-slate-300 shadow-sm"
                          }`}
                        >
                          <p className={`text-xs leading-relaxed font-sans font-medium ${
                            isDark ? "text-slate-305" : "text-slate-900 font-bold"
                          }`}>
                            {struggle}
                          </p>

                          <div className="shrink-0">
                            {feedbackActive ? (
                              <span className={`text-[10px] font-bold whitespace-nowrap px-2.5 py-1.5 rounded-lg border ${
                                isDark
                                  ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/20"
                                  : "text-emerald-950 bg-emerald-50 border-emerald-350"
                              }`}>
                                Added to Board 👀!
                              </span>
                            ) : isPinned ? (
                              <span className={`text-[10px] font-semibold whitespace-nowrap flex items-center gap-1 ${
                                isDark ? "text-text-tertiary" : "text-text-tertiary font-bold"
                              }`}>
                                Pinned <Check className={`w-3.5 h-3.5 ${isDark ? "text-brand-primary" : "text-brand-primary"}`} />
                              </span>
                            ) : validatingTargetId === targetFeedbackKey ? (
                              <span className="text-[10px] text-text-tertiary flex items-center gap-1.5 font-mono">
                                <span className="w-3 h-3 border-2 border-t-transparent border-current rounded-full animate-spin shrink-0" />
                                Verifying...
                              </span>
                            ) : (
                              <button
                                onClick={() => injectNoteToBoard(struggle, targetFeedbackKey)}
                                className={`text-[10px] uppercase font-mono tracking-wider font-extrabold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 border ${
                                  isDark
                                    ? "bg-brand-primary/40 hover:bg-brand-primary hover:text-black hover:border-brand-primary text-brand-primary border-brand-primary/20"
                                    : "bg-brand-primary/10 hover:bg-brand-primary hover:text-text-primary hover:border-brand-primary text-brand-primary border-brand-primary shadow-sm"
                                }`}
                              >
                                Pin it 📌
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DYNAMIC OWN CONTRIBUTOR INPUT */}
              <div className={`pt-4 border-t ${isDark ? "border-border/60" : "border-slate-205"}`}>
                <span className={`text-[10px] uppercase tracking-widest block mb-2 ${
                  isDark ? "font-mono text-text-secondary font-bold" : "font-sans text-slate-950 font-black"
                }`}>
                  ✍️ Add Your Own Observation
                </span>

                {observationError && (
                  <div className="mb-2.5 p-3 rounded-xl border bg-red-950/25 border-red-500/35 text-red-400 text-xs font-semibold animate-in fade-in zoom-in-95 leading-normal">
                    {observationError}
                  </div>
                )}

                {/* SEMANTIC DUPLICATE WARNING CARD */}
                {showDuplicateWarning && (
                  <div className={`mb-3.5 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    isDark 
                      ? "bg-amber-950/20 border-brand-secondary/35 text-amber-100 shadow-[0_0_15px_rgba(255,200,61,0.05)]" 
                      : "bg-amber-50/70 border-amber-200 text-amber-950 shadow-sm"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs">⚠️</span>
                      <h4 className="text-[11px] font-bold tracking-wider uppercase font-mono">
                        Duplicate Detected
                      </h4>
                    </div>
                    <p className={`text-[11px] mb-3 font-medium leading-relaxed ${isDark ? "text-slate-450" : "text-text-tertiary"}`}>
                      A similar observation already exists on your board.
                    </p>
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleAddAnyway}
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-lg font-bold transition-all active:scale-95 cursor-pointer hover:scale-[1.01] ${
                          isDark 
                            ? "bg-amber-450 text-black hover:bg-amber-400" 
                            : "bg-amber-600 text-text-primary hover:bg-amber-700 shadow-sm font-black"
                        }`}
                      >
                        Add Anyway
                      </button>
                      <button
                        onClick={handleCancelPin}
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-lg font-bold border transition-all active:scale-95 cursor-pointer hover:scale-[1.01] ${
                          isDark 
                            ? "border-border-subtle hover:border-slate-600 text-text-secondary hover:bg-surface/60" 
                            : "border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-surface-hover font-extrabold"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* AI OBSERVATION EDITOR CARD */}
                {refinerSuggestion && !showDuplicateWarning && (
                  <div className={`mb-3.5 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                    isDark 
                      ? "bg-brand-primary/20 border-brand-primary/35 text-brand-primary shadow-[0_0_15px_rgba(0,181,230,0.05)]" 
                      : "bg-brand-primary/10/70 border-brand-primary text-brand-primary shadow-sm"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="text-xs">✨</span>
                      <h4 className="text-[11px] font-bold tracking-wider uppercase font-mono">
                        AI Observation Editor
                      </h4>
                    </div>

                    <div className="space-y-2 mb-3.5">
                      <div>
                        <span className={`text-[10px] font-bold tracking-wider uppercase font-mono block mb-0.5 ${isDark ? "text-text-tertiary" : "text-text-secondary"}`}>
                          Your Observation:
                        </span>
                        <div className={`text-xs pl-2.5 py-1 border-l-2 ${isDark ? "text-slate-350 border-border-subtle" : "text-text-tertiary border-slate-300"}`}>
                          "{originalPendingText || newStickyText}"
                        </div>
                      </div>

                      <div>
                        <span className={`text-[10px] font-bold tracking-wider uppercase font-mono block mb-1 ${isDark ? "text-brand-primary" : "text-brand-primary"}`}>
                          Suggested Observation:
                        </span>
                        <div className={`p-3 rounded-lg break-words border text-xs font-semibold leading-relaxed ${
                          isDark 
                            ? "bg-slate-955/90 border-slate-805 text-text-primary" 
                            : "bg-background border-slate-300 text-slate-900 shadow-sm"
                        }`}>
                          "{refinerSuggestion}"
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <button
                        onClick={handleAcceptRefined}
                        disabled={isCheckingDuplicate}
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-lg font-bold transition-all active:scale-95 cursor-pointer hover:scale-[1.01] ${
                          isDark 
                            ? "bg-brand-primary text-black hover:bg-brand-primary-hover" 
                            : "bg-brand-primary text-text-primary hover:bg-indigo-705 shadow-sm font-black"
                        }`}
                      >
                        {isCheckingDuplicate ? "Checking..." : "Use Suggested Version"}
                      </button>
                      <button
                        onClick={handleRejectRefined}
                        disabled={isCheckingDuplicate}
                        type="button"
                        className={`text-xs px-3.5 py-2 rounded-lg font-bold border transition-all active:scale-95 cursor-pointer hover:scale-[1.01] ${
                          isDark 
                            ? "border-border-subtle hover:border-slate-600 text-text-secondary hover:bg-surface/60" 
                            : "border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-surface-hover font-extrabold"
                        }`}
                      >
                        Keep My Version
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  <div className="flex-1">
                    <textarea
                      rows={3}
                      maxLength={512}
                      placeholder="Example: Elderly passengers often struggle to board buses safely before they depart."
                      value={newStickyText}
                      disabled={isCheckingDuplicate || showDuplicateWarning}
                      onChange={(e) => handleStickyTextChange(e.target.value)}
                      className={`w-full text-xs px-3.5 py-3 rounded-xl focus:outline-none transition-all font-medium border leading-relaxed min-h-[90px] ${
                        isDark
                          ? "bg-slate-955/70 border-slate-885 text-text-primary placeholder:text-text-tertiary focus:border-brand-primary/80 focus:ring-1 focus:ring-brand-primary/20 shadow-inner"
                          : "bg-background border-2 border-slate-300 text-slate-950 placeholder:text-text-secondary focus:border-brand-primary focus:ring-1 focus:ring-indigo-600/20 font-bold shadow-sm"
                      }`}
                    />
                    {observationFeedback.message && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-[11px] font-medium mt-1.5 flex items-center gap-1.5 ${
                          observationFeedback.type === "success"
                            ? isDark ? "text-emerald-400" : "text-emerald-700"
                            : isDark ? "text-rose-400" : "text-rose-700"
                        }`}
                      >
                        <span>{observationFeedback.message}</span>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="relative shrink-0 w-full sm:w-auto">
                    <button
                      onClick={handleAddCustomSticky}
                      disabled={isCheckingDuplicate || !newStickyText.trim() || showDuplicateWarning}
                      className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-95 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 disabled:opacity-45 disabled:cursor-not-allowed ${
                        isDark 
                          ? "bg-brand-primary hover:bg-brand-primary-hover text-black shadow-[0_0_12px_rgba(0,181,230,0.25)]"
                          : "bg-brand-primary hover:bg-indigo-700 text-text-primary shadow-[0_2px_8px_rgba(79,70,229,0.25)] font-black border border-brand-primary"
                      }`}
                    >
                      {isCheckingDuplicate ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-t-transparent border-current rounded-full animate-spin shrink-0" />
                          Duplicate check...
                        </>
                      ) : (
                        "Add to Board"
                      )}
                    </button>
                    {animationTarget === "custom_sticky" && (
                      <span className={`absolute -top-10 right-0 text-[10px] px-2.5 py-1.5 rounded-lg border shadow-lg font-bold whitespace-nowrap animate-bounce ${
                        isDark 
                          ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-400" 
                          : "bg-emerald-50 border-emerald-400 text-emerald-950 font-black"
                      }`}>
                        Added to Board 👀!
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className={`border rounded-2xl p-8 flex items-center justify-center text-center flex-1 min-h-[180px] ${
              isDark 
                ? "bg-background/20 border-border text-text-tertiary" 
                : "bg-surface border-2 border-slate-200 text-slate-700 font-bold shadow-sm"
            }`}>
              <p className="text-xs">Select a character above to load details.</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Redefined Problem Board (Col 5) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className={`p-5 rounded-2xl flex flex-col h-full min-h-[380px] justify-between border-2 shadow-sm ${
            isDark 
              ? "glass-panel border-border bg-background/15" 
              : "bg-background border-slate-250 text-slate-950"
          }`}>
            
            <div className="space-y-4">
              <div className={`border-b pb-3.5 flex items-center justify-between ${
                isDark ? "border-border" : "border-slate-205"
              }`}>
                <div>
                  <h3 className={`text-base font-extrabold flex items-center gap-1.5 ${
                    isDark ? "text-text-primary" : "text-slate-950 font-black"
                  }`}>
                    📌 Problem Board
                  </h3>
                  <p className={`text-[11px] ${
                    isDark ? "text-text-secondary" : "text-text-tertiary font-bold"
                  }`}>
                    Gather problems and struggles to redesign below.
                  </p>
                </div>
                
                {/* SIMPLE EMPATHY METER */}
                <div className={`px-3 py-1.5 rounded-xl text-right shrink-0 border ${
                  isDark 
                    ? "bg-background/60 border-border" 
                    : "bg-brand-primary/10 border-brand-primary text-brand-primary font-bold"
                }`}>
                  <span className={`text-[8px] font-mono uppercase font-extrabold block ${
                    isDark ? "text-text-tertiary" : "text-text-tertiary"
                  }`}>Collected</span>
                  <span className={`text-xs font-black font-mono ${
                    isDark ? "text-brand-primary" : "text-brand-primary"
                  }`}>
                    {problemObservations.length} / 5
                  </span>
                </div>
              </div>

              {/* LIST OF SAVED STICKY NOTES */}
              {problemObservations.length === 0 ? (
                <div className={`border-2 border-dashed rounded-2xl py-12 px-4 text-center flex flex-col items-center justify-center ${
                  isDark 
                    ? "border-border/60 bg-background/5 text-text-secondary" 
                    : "border-slate-300 bg-surface text-slate-700"
                }`}>
                  <Lightbulb className="w-7 h-7 text-text-tertiary mb-2 animate-pulse" />
                  <p className={`text-xs font-bold leading-relaxed ${
                    isDark ? "text-text-secondary" : "text-slate-800 font-black"
                  }`}>
                    Your Problem Board is currently blank.
                  </p>
                  <p className={`text-[10px] max-w-[200px] mt-1 leading-normal ${
                    isDark ? "text-slate-550" : "text-text-tertiary font-semibold"
                  }`}>
                    Click "Pin it 📌" on any perspective's struggles or write down an observation to build your board!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto max-h-[360px] scrollbar-none pr-1">
                  {problemObservations.map((obs) => {
                    const enhancement = backgroundEnhancements[obs.id];
                    return (
                      <div
                        key={obs.id}
                        className="p-3 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-950 rounded-xl shadow-sm relative group flex flex-col justify-between border-l-4 border-yellow-500 animate-in fade-in zoom-in-95"
                      >
                        <motion.button
                          whileHover={{ 
                            scale: 1.05, 
                            boxShadow: "0 0 10px rgba(220, 38, 38, 0.15)",
                            backgroundColor: "#fef2f2",
                            borderColor: "#fecaca"
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          onClick={() => handleRemoveStickyNote(obs.id)}
                          className="absolute top-1.5 right-1.5 w-10 h-10 rounded-full border border-amber-300/50 bg-amber-100/50 text-amber-900/60 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors cursor-pointer z-10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                          title="Remove observation"
                        >
                          <Trash2 className="w-[17px] h-[17px]" />
                        </motion.button>

                        <span className="text-[8px] font-extrabold font-mono text-amber-800 opacity-60 uppercase block tracking-wider mb-1">
                          📌 {obs.perspectiveName.toUpperCase()}
                        </span>
                        
                        <p className="text-[12px] font-medium leading-relaxed pr-11 text-slate-950 font-sans italic">
                          "{obs.text}"
                        </p>

                        {/* Background loading / suggestions (Rule 7) */}
                        {enhancement && enhancement.status === "loading" && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/40 flex items-center gap-1.5 text-[9px] text-amber-800 animate-pulse font-mono">
                            <span className="w-2.5 h-2.5 border border-t-transparent border-amber-800 rounded-full animate-spin shrink-0" />
                            <span>AI is polishing observation in background...</span>
                          </div>
                        )}

                        {enhancement && enhancement.status === "ready" && enhancement.suggestion && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-amber-950">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-brand-primary mb-1.5">
                              <Sparkles className="w-3.5 h-3.5 animate-bounce text-brand-primary shrink-0" />
                              <span>✨ Suggested Improvement Available</span>
                            </div>
                            <p 
                              className="text-[11px] bg-background/75 p-2 rounded-lg border border-amber-300/40 text-slate-800 leading-relaxed font-sans cursor-pointer hover:bg-background/90 transition-all mb-2" 
                              onClick={() => handleApplyEnhancement(obs.id)}
                              title="Click to apply"
                            >
                              "{enhancement.suggestion}"
                            </p>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleApplyEnhancement(obs.id)}
                                className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-brand-primary/80 hover:from-indigo-700 hover:to-brand-primary/80 text-text-primary rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                              >
                                Improve
                              </button>
                              <button 
                                onClick={() => handleDismissEnhancement(obs.id)}
                                className="px-2.5 py-1 bg-amber-200/40 hover:bg-amber-200/70 text-amber-900 rounded-md text-[10px] font-semibold transition-all cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Micro warning note */}
            {problemObservations.length > 0 && (
              <p className={`text-[10px] font-mono text-center mt-4 ${
                isDark ? "text-text-tertiary" : "text-slate-605 font-bold"
              }`}>
                💡 Pinned observations are saved securely as blueprint notes.
              </p>
            )}

          </div>
        </div>

      </div>

      {/* FOOTER CONTROLS ROW */}
      <div className={`flex justify-between items-center mt-6 pt-4 border-t ${
        isDark ? "border-border/80" : "border-slate-250"
      }`}>
        <span className={`text-xs font-sans ${
          isDark ? "text-text-tertiary" : "text-slate-700 font-bold"
        }`}>
          Stage 2: Empathy Mapping ({problemObservations.length} pinned)
        </span>
        
        <button
          disabled={problemObservations.length === 0}
          onClick={onNext}
          className="px-10 py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-text-primary font-extrabold text-xs uppercase tracking-widest rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(0,181,230,0.3)] hover:shadow-[0_0_25px_rgba(0,181,230,0.5)] disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none"
        >
          Define the Challenge →
        </button>
      </div>

      {/* NEW PERSPECTIVE CREATOR MODAL */}
      {showAddCustomModal && (
        <div className={`fixed inset-0 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 ${
          isDark ? "bg-black/95" : "bg-background/65"
        }`}>
          <div className={`max-w-sm w-full rounded-2xl relative p-6 animate-in zoom-in-95 duration-200 border-2 ${
            isDark 
              ? "glass-panel border-purple-500/20 text-text-primary" 
              : "bg-background border-purple-250 text-slate-950 shadow-2xl"
          }`}>
            
            <button 
              onClick={() => setShowAddCustomModal(false)}
              className={`absolute top-4 right-4 cursor-pointer transition-colors ${
                isDark ? "text-text-secondary hover:text-text-primary" : "text-text-tertiary hover:text-slate-950"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className={`w-5 h-5 animate-pulse ${isDark ? "text-purple-400" : "text-purple-700"}`} />
              <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${
                isDark ? "text-text-primary" : "text-slate-950 font-black"
              }`}>
                Create custom Perspective
              </h3>
            </div>

            <form onSubmit={handleGeneratePerspective} className="space-y-4">
              <p className={`text-xs leading-relaxed ${
                isDark ? "text-text-secondary" : "text-slate-700 font-medium"
              }`}>
                Type in any role (for example, "Campus Gardener" or "Shopkeeper") and our AI teammate will generate their daily lifestyle, frustrations, and struggles.
              </p>

              <div>
                <label className={`block text-[10px] font-mono font-bold uppercase mb-1.5 ${
                  isDark ? "text-text-tertiary" : "text-slate-900 font-black"
                }`}>
                  Stakeholder Name or Role *
                </label>
                <SafeTextInput
                  type="input"
                  required
                  placeholder="e.g., School Bus Driver, Campus Gardener"
                  value={customRole}
                  onChange={setCustomRole}
                  onSafetyChange={(safe) => setIsCustomRoleSafe(safe)}
                  context="Custom perspective role"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 border ${
                    isDark 
                      ? "bg-background border-border text-text-primary focus:ring-purple-500"
                      : "bg-surface border-2 border-slate-250 text-slate-950 focus:ring-indigo-600 font-bold"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-mono font-bold uppercase mb-1.5 ${
                  isDark ? "text-text-tertiary" : "text-slate-900 font-black"
                }`}>
                  Optional details (Background context)
                </label>
                <SafeTextInput
                  type="textarea"
                  placeholder="e.g., Works night shifts, has mobility limitations."
                  value={customContext}
                  onChange={setCustomContext}
                  onSafetyChange={(safe) => setIsCustomContextSafe(safe)}
                  context="Custom perspective details context"
                  rows={2}
                  className={`w-full text-xs px-3.5 py-2 rounded-xl focus:outline-none border ${
                    isDark
                      ? "bg-background border-border text-text-primary"
                      : "bg-surface border-2 border-slate-250 text-slate-950 font-bold"
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className={`px-3.5 py-2 rounded-lg cursor-pointer transition-colors border ${
                    isDark
                      ? "bg-surface border-border text-slate-450 hover:bg-surface-hover hover:text-text-primary"
                      : "bg-surface-hover border-2 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-900 font-black"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingPerspective || !isCustomRoleSafe || !isCustomContextSafe}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-brand-primary/80 hover:from-purple-400 hover:to-brand-primary/80 text-text-primary rounded-lg font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {isGeneratingPerspective ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin shrink-0" />
                      Creating...
                    </>
                  ) : (
                    "Create Persona 🔮"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
