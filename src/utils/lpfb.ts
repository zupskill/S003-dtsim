/**
 * Length-Prefixed Field Block (LPFB) Plain-Text Serialization Engine
 * 
 * Strict Storage Rules:
 * - Human-readable plain text only
 * - NO JSON strings, objects, or arrays
 * - NO binary or base64 data
 * - Immune to delimiter collision (newlines, colons, brackets, emojis)
 * - Header-injection safe via length-bounded code unit extraction
 */

import { CompletedSimulationRecap } from "../types";

/**
 * Normalizes input text to clean string with LF newlines.
 * Clamps to a strict maximum length prior to serialization.
 */
export function clampText(val: unknown, maxLen: number): string {
  if (val === null || val === undefined) return "";
  let str = String(val).normalize("NFC").replace(/\r\n/g, "\n");
  if (str.length > maxLen) {
    str = str.slice(0, maxLen);
  }
  return str;
}

/**
 * Formats a single LPFB field.
 * Format: Key[length]:Payload\n
 */
export function formatLPFBField(key: string, value: unknown, maxLen?: number): string {
  if (value === null || value === undefined) return "";
  let payload = String(value).normalize("NFC").replace(/\r\n/g, "\n");
  if (typeof maxLen === "number" && payload.length > maxLen) {
    payload = payload.slice(0, maxLen);
  }
  return `${key}[${payload.length}]:${payload}\n`;
}

/**
 * Formats a single scalar line.
 * Format: Key:Scalar\n
 */
export function formatLPFBScalar(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  const scalarStr = String(value).replace(/[\r\n]/g, " ").trim();
  return `${key}:${scalarStr}\n`;
}

/**
 * Decodes an LPFB formatted text block into key-value pairs.
 */
export function decodeLPFB(raw: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || typeof raw !== "string") return result;

  let i = 0;
  const len = raw.length;

  while (i < len) {
    // Skip empty lines or whitespace between records
    while (i < len && (raw[i] === "\r" || raw[i] === "\n" || raw[i] === " " || raw[i] === "\t")) {
      i++;
    }
    if (i >= len) break;

    // Scan for key name until '[' or ':' or '\n'
    const keyStart = i;
    while (i < len && raw[i] !== "[" && raw[i] !== ":" && raw[i] !== "\n") {
      i++;
    }
    if (i >= len || raw[i] === "\n") break;

    const key = raw.slice(keyStart, i).trim();
    if (!key) break;

    if (raw[i] === "[") {
      // Length-prefixed format: Key[length]:Payload\n
      i++; // skip '['
      const numStart = i;
      while (i < len && raw[i] !== "]") {
        i++;
      }
      if (i >= len) break;
      const lengthStr = raw.slice(numStart, i);
      const payloadLen = parseInt(lengthStr, 10);
      i++; // skip ']'

      if (i >= len || raw[i] !== ":") break;
      i++; // skip ':'

      if (isNaN(payloadLen) || payloadLen < 0 || payloadLen > 50000) break;

      // Extract payload exactly according to payloadLen UTF-16 code units
      const payload = raw.slice(i, i + payloadLen);
      if (!(key in result)) {
        result[key] = payload;
      }
      i += payloadLen;

      // Consume trailing newline
      if (i < len && raw[i] === "\r") i++;
      if (i < len && raw[i] === "\n") i++;
    } else if (raw[i] === ":") {
      // Scalar format: Key:value\n
      i++; // skip ':'
      const valStart = i;
      while (i < len && raw[i] !== "\n") {
        i++;
      }
      let val = raw.slice(valStart, i);
      if (val.endsWith("\r")) val = val.slice(0, -1);
      if (!(key in result)) {
        result[key] = val.trim();
      }
      if (i < len && raw[i] === "\n") i++;
    } else {
      i++;
    }
  }

  return result;
}

/**
 * Builds Row 1 (task_id: 1.0, task_name: "Discovery & Definition")
 * value1: Topic information (bounded to < 500 chars, limit 4000)
 * value2: Empathy / Observations (bounded to < 1800 chars, limit 2000)
 * value3: Refined HMW (bounded to < 1500 chars, limit 2000)
 */
export function buildRow1Payload(data: {
  topic?: { id?: string; title?: string; trendingTag?: string } | null;
  problemObservations?: Array<{ id?: string; perspectiveName?: string; cluster?: string; text?: string }> | null;
  refinedHowMightWe?: string | null;
}): { value1: string; value2: string; value3: string } {
  // Value 1: Topic
  let val1 = "";
  val1 += formatLPFBField("TopicId", clampText(data.topic?.id || "custom", 60));
  val1 += formatLPFBField("TopicTitle", clampText(data.topic?.title || "Design Challenge", 180));
  val1 += formatLPFBField("TrendingTag", clampText(data.topic?.trendingTag || "Innovation", 60));

  // Value 2: Observations (top 5 max, strictly budgeted to guarantee < 1800 chars)
  let val2 = "";
  const obsList = Array.isArray(data.problemObservations) ? data.problemObservations.slice(0, 5) : [];
  val2 += formatLPFBScalar("ObsCount", obsList.length);
  obsList.forEach((obs, idx) => {
    const num = idx + 1;
    val2 += formatLPFBField(`Obs${num}_Id`, clampText(obs.id || `obs_${num}`, 30));
    val2 += formatLPFBField(`Obs${num}_Perspective`, clampText(obs.perspectiveName || "User", 40));
    val2 += formatLPFBField(`Obs${num}_Cluster`, clampText(obs.cluster || "General", 30));
    val2 += formatLPFBField(`Obs${num}_Text`, clampText(obs.text || "", 160));
  });

  // Value 3: Defined Problem (HMW)
  let val3 = "";
  val3 += formatLPFBField("HMW", clampText(data.refinedHowMightWe || "", 1500));

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Builds Row 2 (task_id: 2.0, task_name: "Ideation")
 * value1: Ideas list (bounded to < 3000 chars, limit 4000)
 * value2: Selected idea (bounded to < 800 chars, limit 2000)
 * value3: Ideation metrics (bounded to < 100 chars, limit 2000)
 */
export function buildRow2Payload(data: {
  ideas?: Array<{ id?: string; category?: string; text?: string }> | null;
  selectedPrototype?: { title?: string; description?: string } | null;
}): { value1: string; value2: string; value3: string } {
  // Value 1: Ideas (top 8 max)
  let val1 = "";
  const ideaList = Array.isArray(data.ideas) ? data.ideas.slice(0, 8) : [];
  val1 += formatLPFBScalar("IdeaCount", ideaList.length);
  ideaList.forEach((item, idx) => {
    const num = idx + 1;
    val1 += formatLPFBField(`Idea${num}_Id`, clampText(item.id || `idea_${num}`, 40));
    val1 += formatLPFBField(`Idea${num}_Category`, clampText(item.category || "HOW", 20));
    val1 += formatLPFBField(`Idea${num}_Text`, clampText(item.text || "", 220));
  });

  // Value 2: Selected Idea / Top Idea
  let val2 = "";
  const primaryIdea = ideaList[0] || null;
  val2 += formatLPFBField("SelectedIdeaId", clampText(primaryIdea?.id || "none", 40));
  val2 += formatLPFBField("SelectedIdeaCategory", clampText(primaryIdea?.category || "HOW", 20));
  val2 += formatLPFBField("SelectedIdeaText", clampText(primaryIdea?.text || data.selectedPrototype?.title || "", 450));

  // Value 3: Stats
  let val3 = "";
  val3 += formatLPFBScalar("TotalIdeas", Array.isArray(data.ideas) ? data.ideas.length : 0);
  const sortedCount = Array.isArray(data.ideas) ? data.ideas.filter(i => i.category && i.category !== "UNSORTED").length : 0;
  val3 += formatLPFBScalar("SortedIdeas", sortedCount);

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Builds Row 3 (task_id: 3.0, task_name: "Prototype & Testing")
 * value1: Prototype definition (bounded to < 2800 chars, limit 4000)
 * value2: Testing & Rubric breakdown (bounded to < 300 chars, limit 2000)
 * value3: Reflection & Level (bounded to < 1500 chars, limit 2000)
 */
export function buildRow3Payload(data: {
  selectedPrototype?: { title?: string; format?: string; description?: string } | null;
  testingData?: any;
  rubric?: {
    stageCompletion?: number;
    meaningfulInput?: number;
    reflectionIteration?: number;
    aiThoughtfulness?: number;
    feedback?: string;
    levelTitle?: string;
    levelDesc?: string;
  } | null;
  overallScore?: number;
}): { value1: string; value2: string; value3: string } {
  // Value 1: Prototype details
  let val1 = "";
  val1 += formatLPFBField("ProtoTitle", clampText(data.selectedPrototype?.title || "Prototype", 180));
  val1 += formatLPFBField("ProtoFormat", clampText(data.selectedPrototype?.format || "canvas", 40));
  val1 += formatLPFBField("ProtoDesc", clampText(data.selectedPrototype?.description || "", 2400));

  // Value 2: Testing metrics & rubric
  let val2 = "";
  val2 += formatLPFBScalar("WhatIfScore", typeof data.testingData?.whatIfScore === "number" ? data.testingData.whatIfScore : 0);
  val2 += formatLPFBScalar("ILikeScore", data.testingData?.iLikeScore ? 1 : 0);
  val2 += formatLPFBScalar("IWishScore", data.testingData?.iWishScore ? 1 : 0);
  val2 += formatLPFBScalar("Rubric_StageCompletion", typeof data.rubric?.stageCompletion === "number" ? data.rubric.stageCompletion : 0);
  val2 += formatLPFBScalar("Rubric_MeaningfulInput", typeof data.rubric?.meaningfulInput === "number" ? data.rubric.meaningfulInput : 0);
  val2 += formatLPFBScalar("Rubric_ReflectionIteration", typeof data.rubric?.reflectionIteration === "number" ? data.rubric.reflectionIteration : 0);
  val2 += formatLPFBScalar("Rubric_AiThoughtfulness", typeof data.rubric?.aiThoughtfulness === "number" ? data.rubric.aiThoughtfulness : 0);

  // Value 3: Reflection, Level Title & Description, Feedback
  let val3 = "";
  val3 += formatLPFBField("LevelTitle", clampText(data.rubric?.levelTitle || "Design Thinker", 80));
  val3 += formatLPFBField("LevelDesc", clampText(data.rubric?.levelDesc || "Completed Design Thinking journey", 250));
  val3 += formatLPFBField("Feedback", clampText(data.rubric?.feedback || "Great problem solving and prototype testing.", 900));

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Builds New 1-Row Architecture Payload (task_id: 10.0, task_name: "Design Thinking Journey")
 * Formats data as clean, human-readable plain text without LPFB, JSON, or base64 encoding.
 * 
 * value1: Stage 1: Topic and Challenge
 * value2: Stage 2: Empathy Observations
 * value3: Stage 3: How Might We Statement
 * value4: Stage 4: Brainstormed Ideas and Selected Idea
 * value5: Stage 5: Prototype Details
 * value6: Stage 6: Testing Scores and Rubric Breakdown
 * value7: Stage 6: Feedback, Level Title and Level Description
 */
export function buildOneRowPayload(data: {
  topic?: { id?: string; title?: string; trendingTag?: string } | null;
  problemObservations?: Array<{ id?: string; perspectiveName?: string; cluster?: string; text?: string; votes?: number }> | null;
  refinedHowMightWe?: string | null;
  ideas?: Array<{ id?: string; category?: string; text?: string; reasoning?: string }> | null;
  selectedPrototype?: { title?: string; format?: string; description?: string } | null;
  testingData?: any;
  rubric?: {
    stageCompletion?: number;
    meaningfulInput?: number;
    reflectionIteration?: number;
    aiThoughtfulness?: number;
    feedback?: string;
    levelTitle?: string;
    levelDesc?: string;
  } | null;
  overallScore?: number;
}): {
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  value5: string;
  value6: string;
  value7: string;
} {
  // value1 – Stage 1: Topic and Challenge
  const topicId = clampText(data.topic?.id || "custom", 100);
  const topicTitle = clampText(data.topic?.title || "Design Challenge", 250);
  const trendingTag = clampText(data.topic?.trendingTag || "Innovation", 100);
  const value1 = [
    `Topic ID: ${topicId}`,
    `Topic Title: ${topicTitle}`,
    `Trending Tag: ${trendingTag}`
  ].join("\n");

  // value2 – Stage 2: Empathy Observations (Preserve all collected observations with context)
  const obsList = Array.isArray(data.problemObservations) ? data.problemObservations : [];
  const obsLines = obsList.map((obs, idx) => {
    const metaParts: string[] = [];
    if (obs.perspectiveName) metaParts.push(`Perspective: ${obs.perspectiveName}`);
    if (obs.cluster) metaParts.push(`Cluster: ${obs.cluster}`);
    const meta = metaParts.length > 0 ? ` [${metaParts.join(", ")}]` : "";
    const cleanTextVal = clampText(obs.text || "", 500).replace(/[\r\n]+/g, " ").trim();
    return `Observation ${idx + 1}${meta}: ${cleanTextVal}`;
  });
  const value2 = obsLines.length > 0
    ? obsLines.join("\n")
    : "Observation 1: User empathy research and observations recorded.";

  // value3 – Stage 3: How Might We Statement
  const cleanHmw = clampText(data.refinedHowMightWe || "", 2000).replace(/[\r\n]+/g, " ").trim();
  const value3 = `How Might We: ${cleanHmw || "Problem definition and challenge recorded."}`;

  // value4 – Stage 4: Brainstormed Ideas and Selected Idea (Preserve all ideas collected)
  const ideaList = Array.isArray(data.ideas) ? data.ideas : [];
  const ideaLines = ideaList.map((idea, idx) => {
    const cat = idea.category ? ` [${idea.category}]` : "";
    const text = clampText(idea.text || "", 500).replace(/[\r\n]+/g, " ").trim();
    return `Idea ${idx + 1}${cat}: ${text}`;
  });
  const primaryIdea = ideaList[0] || null;
  const selectedIdeaText = clampText(primaryIdea?.text || data.selectedPrototype?.title || "Generated creative solutions.", 500).replace(/[\r\n]+/g, " ").trim();
  const selectedCategory = clampText(primaryIdea?.category || "HOW", 50);
  const sortedCount = ideaList.filter(i => i.category && i.category !== "UNSORTED").length;

  const value4Parts = [...ideaLines];
  if (value4Parts.length > 0) value4Parts.push("");
  value4Parts.push(`Selected Idea: ${selectedIdeaText}`);
  value4Parts.push(`Selected Category: ${selectedCategory}`);
  value4Parts.push(`Total Ideas: ${ideaList.length}`);
  value4Parts.push(`Sorted Ideas: ${sortedCount}`);
  const value4 = value4Parts.join("\n");

  // value5 – Stage 5: Prototype Details
  const protoTitle = clampText(data.selectedPrototype?.title || "Prototype Solution", 250);
  const protoFormat = clampText(data.selectedPrototype?.format || "canvas", 100);
  const protoDesc = clampText(data.selectedPrototype?.description || "Built and summarized the final prototype.", 4000);
  const value5 = [
    `Prototype Title: ${protoTitle}`,
    `Format: ${protoFormat}`,
    `Description: ${protoDesc}`
  ].join("\n");

  // value6 – Stage 6: Testing Scores and Rubric Breakdown
  const whatIfScore = typeof data.testingData?.whatIfScore === "number" ? data.testingData.whatIfScore : 0;
  const iLikeScore = data.testingData?.iLikeScore ? 1 : 0;
  const iWishScore = data.testingData?.iWishScore ? 1 : 0;
  const stageCompletion = typeof data.rubric?.stageCompletion === "number" ? data.rubric.stageCompletion : 0;
  const meaningfulInput = typeof data.rubric?.meaningfulInput === "number" ? data.rubric.meaningfulInput : 0;
  const reflectionIteration = typeof data.rubric?.reflectionIteration === "number" ? data.rubric.reflectionIteration : 0;
  const aiThoughtfulness = typeof data.rubric?.aiThoughtfulness === "number" ? data.rubric.aiThoughtfulness : 0;

  const value6 = [
    `WhatIfScore: ${whatIfScore}`,
    `ILikeScore: ${iLikeScore}`,
    `IWishScore: ${iWishScore}`,
    `StageCompletion: ${stageCompletion}`,
    `MeaningfulInput: ${meaningfulInput}`,
    `ReflectionIteration: ${reflectionIteration}`,
    `AiThoughtfulness: ${aiThoughtfulness}`
  ].join("\n");

  // value7 – Stage 6: Feedback, Level Title and Level Description
  const overall = typeof data.overallScore === "number" ? data.overallScore : 0;
  const levelTitle = clampText(data.rubric?.levelTitle || (
    overall >= 91 ? "DT Innovation Master" :
    overall >= 76 ? "Innovation Builder" :
    overall >= 61 ? "Creative Thinker" : "Problem Solver"
  ), 100);
  const levelDesc = clampText(data.rubric?.levelDesc || "Completed Design Thinking journey", 500);
  const feedback = clampText(data.rubric?.feedback || "Great problem solving and prototype testing.", 2000);

  const value7 = [
    `LevelTitle: ${levelTitle}`,
    `LevelDescription: ${levelDesc}`,
    `Feedback: ${feedback}`
  ].join("\n");

  return { value1, value2, value3, value4, value5, value6, value7 };
}

/**
 * Reconstructs a CompletedSimulationRecap from Supabase rows.
 * Supports all three architectures:
 * 1. New 1-Row human-readable plain-text records (task_id: 10.0, task_name: "Design Thinking Journey")
 * 2. Existing 3-Row LPFB plain-text records (task_id: 1.0, 2.0, 3.0)
 * 3. Legacy 5-Row records (defensive JSON parse with fallback)
 */
export function reconstructRecapFromActivities(activities: any[]): {
  recap: CompletedSimulationRecap | null;
  completedCount: number;
} {
  if (!Array.isArray(activities) || activities.length === 0) {
    return { recap: null, completedCount: 0 };
  }

  // Count total completed simulations
  // New 1-row architecture completions: task_name "Design Thinking Journey" or task_id 10.0
  // Existing 3-row architecture completions: task_name "Prototype & Testing" or task_id 3.0
  // Legacy 5-row architecture completions: task_name "Test" and task_id 5.0
  const completionRows = activities.filter(a => 
    a && (
      (a.task_name === "Design Thinking Journey" || a.task_id === 10) ||
      (a.task_name === "Prototype & Testing" || (a.task_id === 3 && a.task_name === "Prototype & Testing")) ||
      (a.task_id === 5 && a.task_name === "Test")
    )
  );

  const completedCount = completionRows.length;
  if (completedCount === 0) {
    return { recap: null, completedCount: 0 };
  }

  // Find the most recent completion row by updated_at
  const latestCompletion = [...completionRows].sort((a, b) => {
    const tA = new Date(a.updated_at || 0).getTime();
    const tB = new Date(b.updated_at || 0).getTime();
    return tB - tA;
  })[0];

  const completionTimestamp = new Date(latestCompletion.updated_at || Date.now()).getTime();
  const completionDate = new Date(latestCompletion.updated_at || Date.now()).toLocaleDateString();

  // CHECK A: Is the latest completion using the New 1-Row Architecture?
  if (
    latestCompletion.task_name === "Design Thinking Journey" ||
    latestCompletion.task_id === 10
  ) {
    const row = latestCompletion;

    // 1. Extract Challenge from value1 (Stage 1)
    const val1 = row.value1 || "";
    let challenge = "";
    const titleMatch = val1.match(/^Topic Title:\s*(.*)$/im);
    if (titleMatch && titleMatch[1].trim()) {
      challenge = titleMatch[1].trim();
    } else {
      const firstLine = val1.split("\n").filter(Boolean)[0] || "";
      challenge = firstLine.replace(/^Topic Title:\s*/i, "").replace(/^Topic ID:\s*/i, "").trim() || "Design Challenge";
    }

    // 2. Extract Empathize Summary from value2 (Stage 2)
    const val2 = row.value2 || "";
    let empathizeSummary = "";
    const obsMatch = val2.match(/^Observation \d+(?:\s*\[.*?\])*:\s*(.*)$/im);
    if (obsMatch && obsMatch[1].trim()) {
      empathizeSummary = obsMatch[1].trim();
    } else {
      const firstObsLine = val2.split("\n").filter(Boolean)[0] || "";
      empathizeSummary = firstObsLine.replace(/^Observation \d+:\s*/i, "").trim() || "User empathy research and observations recorded.";
    }

    // 3. Extract Problem Statement (HMW) from value3 (Stage 3)
    const val3 = row.value3 || "";
    const problemStatement = val3.replace(/^How Might We:\s*/i, "").trim() || "Problem definition and challenge recorded.";

    // 4. Extract Top Ideas from value4 (Stage 4)
    const val4 = row.value4 || "";
    const topIdeas: string[] = [];
    const val4Lines = val4.split("\n").map((l: string) => l.trim()).filter(Boolean);
    for (const line of val4Lines) {
      const ideaMatch = line.match(/^Idea \d+(?:\s*\[.*?\])?:\s*(.*)$/i);
      if (ideaMatch && ideaMatch[1].trim()) {
        topIdeas.push(ideaMatch[1].trim());
        if (topIdeas.length >= 3) break;
      }
    }
    if (topIdeas.length === 0) {
      const selMatch = val4.match(/^Selected Idea:\s*(.*)$/im);
      if (selMatch && selMatch[1].trim()) {
        topIdeas.push(selMatch[1].trim());
      }
    }
    if (topIdeas.length === 0) {
      topIdeas.push("Generated creative solutions.");
    }

    // 5. Extract Prototype Summary from value5 (Stage 5)
    const val5 = row.value5 || "";
    let prototypeSummary = "";
    const descMatch = val5.match(/^Description:\s*([\s\S]*)$/im);
    if (descMatch && descMatch[1].trim()) {
      prototypeSummary = descMatch[1].trim();
    } else {
      const protoTitleMatch = val5.match(/^Prototype Title:\s*(.*)$/im);
      if (protoTitleMatch && protoTitleMatch[1].trim()) {
        prototypeSummary = protoTitleMatch[1].trim();
      } else {
        prototypeSummary = val5.trim() || "Built and summarized the final prototype.";
      }
    }

    // 6. Authoritative overall score from score column
    const overallScore = typeof row.score === "number" ? Math.max(0, Math.min(100, Math.round(row.score))) : (Number(row.score) || 0);

    // 7. Extract Rubric & Testing scores from value6 (Stage 6)
    const val6 = row.value6 || "";
    const extractScalar = (key: string): number => {
      const m = val6.match(new RegExp(`^${key}:\\s*(\\d+)`, "im"));
      return m ? Number(m[1]) : 0;
    };

    // 8. Extract Achievements & Feedback from value7 (Stage 6)
    const val7 = row.value7 || "";
    const lvlMatch = val7.match(/^LevelTitle:\s*(.*)$/im);
    const levelTitle = (lvlMatch && lvlMatch[1].trim()) || (
      overallScore >= 91 ? "DT Innovation Master" :
      overallScore >= 76 ? "Innovation Builder" :
      overallScore >= 61 ? "Creative Thinker" : "Problem Solver"
    );

    const descMatchLvl = val7.match(/^LevelDescription:\s*(.*)$/im);
    const levelDesc = (descMatchLvl && descMatchLvl[1].trim()) || "Completed Design Thinking journey";

    const fbMatch = val7.match(/^Feedback:\s*([\s\S]*)$/im);
    const feedback = (fbMatch && fbMatch[1].trim()) || "";

    const breakdown = {
      stageCompletion: extractScalar("StageCompletion"),
      meaningfulInput: extractScalar("MeaningfulInput"),
      reflectionIteration: extractScalar("ReflectionIteration"),
      aiThoughtfulness: extractScalar("AiThoughtfulness"),
      overallScore,
      feedback,
      levelTitle,
      levelDesc
    };

    const recap: CompletedSimulationRecap = {
      simulationName: "DT Innovation Lab",
      completionDate,
      challenge,
      empathizeSummary,
      problemStatement,
      topIdeas,
      prototypeSummary,
      achievements: [levelTitle],
      overallScore,
      engagementBreakdown: breakdown,
      completionTime: completionTimestamp
    };

    return { recap, completedCount };
  }

  // CHECK B: Is the latest completion using the existing 3-Row architecture?
  if (latestCompletion.task_name === "Prototype & Testing" || (latestCompletion.task_id === 3 && latestCompletion.task_name === "Prototype & Testing")) {
    const otherCompletions = completionRows.filter(c => c !== latestCompletion);

    // 1. Strict Attempt Matching:
    // All 3 rows are inserted in the exact same atomic batch and share identical updated_at.
    let row1 = activities.find(a => 
      a && 
      (a.task_name === "Discovery & Definition" || (a.task_id === 1 && a.task_name === "Discovery & Definition")) && 
      a.updated_at === latestCompletion.updated_at
    );
    let row2 = activities.find(a => 
      a && 
      (a.task_name === "Ideation" || (a.task_id === 2 && a.task_name === "Ideation")) && 
      a.updated_at === latestCompletion.updated_at
    );

    // 2. Proximity fallback only if timestamps have sub-second database clock jitter (<= 5s)
    // AND the candidate row is strictly closer to latestCompletion than to ANY other completion row.
    if (!row1) {
      const candidates = activities.filter(a => 
        a && (a.task_name === "Discovery & Definition" || (a.task_id === 1 && a.task_name === "Discovery & Definition"))
      );
      for (const c of candidates) {
        const t = new Date(c.updated_at || 0).getTime();
        const distToLatest = Math.abs(t - completionTimestamp);
        if (distToLatest <= 5000) {
          const ambiguous = otherCompletions.some(oc => {
            const tOc = new Date(oc.updated_at || 0).getTime();
            return Math.abs(t - tOc) <= distToLatest;
          });
          if (!ambiguous) {
            row1 = c;
            break;
          }
        }
      }
    }

    if (!row2) {
      const candidates = activities.filter(a => 
        a && (a.task_name === "Ideation" || (a.task_id === 2 && a.task_name === "Ideation"))
      );
      for (const c of candidates) {
        const t = new Date(c.updated_at || 0).getTime();
        const distToLatest = Math.abs(t - completionTimestamp);
        if (distToLatest <= 5000) {
          const ambiguous = otherCompletions.some(oc => {
            const tOc = new Date(oc.updated_at || 0).getTime();
            return Math.abs(t - tOc) <= distToLatest;
          });
          if (!ambiguous) {
            row2 = c;
            break;
          }
        }
      }
    }

    // Strictly NO fallback to global activities from other attempts!
    const row3 = latestCompletion;

    const row1_val1 = row1 ? decodeLPFB(row1.value1) : {};
    const row1_val2 = row1 ? decodeLPFB(row1.value2) : {};
    const row1_val3 = row1 ? decodeLPFB(row1.value3) : {};

    const row2_val1 = row2 ? decodeLPFB(row2.value1) : {};
    const row2_val2 = row2 ? decodeLPFB(row2.value2) : {};
    const row2_val3 = row2 ? decodeLPFB(row2.value3) : {};

    const row3_val1 = decodeLPFB(row3.value1);
    const row3_val2 = decodeLPFB(row3.value2);
    const row3_val3 = decodeLPFB(row3.value3);

    // Extract challenge (from Row 1 or Row 3 fallback)
    const challenge = row1_val1.TopicTitle || (row3_val1.ProtoTitle ? `${row3_val1.ProtoTitle} Challenge` : "Design Challenge");

    // Extract empathy summary (from Row 1 first observation or honest fallback)
    const empathizeSummary = row1_val2.Obs1_Text || "User empathy research and observations recorded.";

    // Extract problem statement (HMW)
    const problemStatement = row1_val3.HMW || "Problem definition and challenge recorded.";

    // Extract top ideas (Idea1_Text, Idea2_Text, Idea3_Text)
    const topIdeas: string[] = [];
    if (row2_val1.Idea1_Text) topIdeas.push(row2_val1.Idea1_Text);
    if (row2_val1.Idea2_Text) topIdeas.push(row2_val1.Idea2_Text);
    if (row2_val1.Idea3_Text) topIdeas.push(row2_val1.Idea3_Text);
    if (topIdeas.length === 0 && row2_val2.SelectedIdeaText) {
      topIdeas.push(row2_val2.SelectedIdeaText);
    }
    if (topIdeas.length === 0 && row3_val1.ProtoTitle) {
      topIdeas.push(row3_val1.ProtoTitle);
    }
    if (topIdeas.length === 0) {
      topIdeas.push("Generated creative solutions.");
    }

    // Extract prototype summary
    const prototypeSummary = row3_val1.ProtoDesc || row3_val1.ProtoTitle || "Built and summarized the final prototype.";

    // Authoritative overall score
    const overallScore = typeof row3.score === "number" ? Math.max(0, Math.min(100, Math.round(row3.score))) : (Number(row3.score) || 0);

    // Achievements
    const levelTitle = row3_val3.LevelTitle || (
      overallScore >= 91 ? "DT Innovation Master" :
      overallScore >= 76 ? "Innovation Builder" :
      overallScore >= 61 ? "Creative Thinker" : "Problem Solver"
    );

    const breakdown = {
      stageCompletion: Number(row3_val2.Rubric_StageCompletion) || 0,
      meaningfulInput: Number(row3_val2.Rubric_MeaningfulInput) || 0,
      reflectionIteration: Number(row3_val2.Rubric_ReflectionIteration) || 0,
      aiThoughtfulness: Number(row3_val2.Rubric_AiThoughtfulness) || 0,
      overallScore,
      feedback: row3_val3.Feedback || "",
      levelTitle: levelTitle,
      levelDesc: row3_val3.LevelDesc || ""
    };

    const recap: CompletedSimulationRecap = {
      simulationName: "DT Innovation Lab",
      completionDate,
      challenge,
      empathizeSummary,
      problemStatement,
      topIdeas,
      prototypeSummary,
      achievements: [levelTitle],
      overallScore,
      engagementBreakdown: breakdown,
      completionTime: completionTimestamp
    };

    return { recap, completedCount };
  }

  // CHECK B: Legacy 5-Row record parsing (defensive JSON parsing with text fallbacks)
  const legacyTestStage = latestCompletion;
  const otherLegacyCompletions = completionRows.filter(c => c !== latestCompletion);

  // Strictly bound preceding stages to this attempt's timeframe without cross-attempt stealing
  const findLegacyStage = (taskId: number) => {
    return activities.find(a => {
      if (!a || a.task_id !== taskId) return false;
      const t = new Date(a.updated_at || 0).getTime();
      const distToLatest = Math.abs(t - completionTimestamp);
      if (distToLatest > 300000) return false; // Within 5 minutes
      const ambiguous = otherLegacyCompletions.some(oc => {
        const tOc = new Date(oc.updated_at || 0).getTime();
        return Math.abs(t - tOc) <= distToLatest;
      });
      return !ambiguous;
    });
  };

  const stage1 = findLegacyStage(1);
  const stage2 = findLegacyStage(2);
  const stage3 = findLegacyStage(3);
  const stage4 = findLegacyStage(4);

  let parsedScores = { overallScore: legacyTestStage.score || 0 };
  if (legacyTestStage.value3) {
    try {
      parsedScores = JSON.parse(legacyTestStage.value3);
    } catch {
      const decoded = decodeLPFB(legacyTestStage.value3);
      if (decoded.overallScore) {
        parsedScores = { overallScore: Number(decoded.overallScore) || 0 };
      }
    }
  }

  let empathizeSummary = "";
  if (stage2?.value1) {
    try {
      const obs = JSON.parse(stage2.value1);
      if (Array.isArray(obs) && obs.length > 0) {
        empathizeSummary = obs[0].text || String(obs[0]);
      } else {
        empathizeSummary = String(obs);
      }
    } catch {
      const lines = stage2.value1.split("\n").filter(Boolean);
      empathizeSummary = lines[0] || stage2.value1;
    }
  }

  let topIdeas: string[] = [];
  if (stage4?.value1) {
    try {
      const ideas = JSON.parse(stage4.value1);
      if (Array.isArray(ideas)) {
        topIdeas = ideas.slice(0, 3).map((i: any) => i.text || String(i));
      } else {
        topIdeas = [String(ideas)];
      }
    } catch {
      topIdeas = stage4.value1.split("\n").filter(Boolean).slice(0, 3);
    }
  }

  const overallScore = typeof legacyTestStage.score === "number" ? legacyTestStage.score : (parsedScores.overallScore || 0);
  let title = "Explorer";
  if (overallScore >= 91) title = "DT Innovation Master";
  else if (overallScore >= 76) title = "Innovation Builder";
  else if (overallScore >= 61) title = "Creative Thinker";
  else if (overallScore >= 41) title = "Problem Solver";

  const legacyRecap: CompletedSimulationRecap = {
    simulationName: "DT Innovation Lab",
    completionDate,
    challenge: stage1?.value2 || "Custom Challenge",
    empathizeSummary: empathizeSummary || "Explored user feelings and pain points.",
    problemStatement: stage3?.value1 || "Problem definition not found",
    topIdeas: topIdeas.length > 0 ? topIdeas : ["Generated creative solutions."],
    prototypeSummary: legacyTestStage.value2 || "Prototype description not found",
    achievements: [title],
    overallScore,
    completionTime: completionTimestamp
  };

  return { recap: legacyRecap, completedCount };
}
