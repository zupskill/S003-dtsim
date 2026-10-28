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
 * Reconstructs a CompletedSimulationRecap from Supabase rows.
 * Supports both:
 * 1. New 3-Row LPFB plain-text records
 * 2. Legacy 5-Row records (defensive JSON parse with fallback)
 */
export function reconstructRecapFromActivities(activities: any[]): {
  recap: CompletedSimulationRecap | null;
  completedCount: number;
} {
  if (!Array.isArray(activities) || activities.length === 0) {
    return { recap: null, completedCount: 0 };
  }

  // Count total completed simulations
  // New 3-row architecture completions have task_name "Prototype & Testing" (or task_id 3.0)
  // Legacy completions have task_name "Test" and task_id 5.0
  const completionRows = activities.filter(a => 
    a && (
      a.task_name === "Prototype & Testing" || 
      (a.task_id === 3 && a.task_name === "Prototype & Testing") ||
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

  // CHECK A: Is the latest completion using the new 3-Row architecture?
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
