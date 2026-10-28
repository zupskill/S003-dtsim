/**
 * Plain-Text Storage & Reconstruction Engine for S003 Design Thinking Simulation
 *
 * Strict Storage Rules:
 * - Ordinary, human-readable plain text only
 * - NO length markers (e.g., no [27]:)
 * - NO machine-oriented field encodings
 * - NO JSON strings, objects, or arrays
 * - NO binary or base64 data
 * - Normal line breaks between fields
 * - Lists stored as ordinary numbered text lines (e.g., "1. ...", "2. ...")
 * - Scores and counts stored as readable labels followed by values
 * - Backward-compatible reading of existing LPFB records and legacy 5-row records
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
 * Legacy LPFB field formatter - retained exclusively for backward-compatible test assertions
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
 * Legacy LPFB scalar formatter - retained exclusively for backward-compatible test assertions
 */
export function formatLPFBScalar(key: string, value: unknown): string {
  if (value === null || value === undefined) return "";
  const scalarStr = String(value).replace(/[\r\n]/g, " ").trim();
  return `${key}:${scalarStr}\n`;
}

/**
 * Decodes a legacy LPFB formatted text block into key-value pairs.
 */
export function decodeLPFB(raw: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!raw || typeof raw !== "string") return result;

  let i = 0;
  const len = raw.length;

  while (i < len) {
    while (i < len && (raw[i] === "\r" || raw[i] === "\n" || raw[i] === " " || raw[i] === "\t")) {
      i++;
    }
    if (i >= len) break;

    const keyStart = i;
    while (i < len && raw[i] !== "[" && raw[i] !== ":" && raw[i] !== "\n") {
      i++;
    }
    if (i >= len || raw[i] === "\n") break;

    const key = raw.slice(keyStart, i).trim();
    if (!key) break;

    if (raw[i] === "[") {
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

      const payload = raw.slice(i, i + payloadLen);
      if (!(key in result)) {
        result[key] = payload;
      }
      i += payloadLen;

      if (i < len && raw[i] === "\r") i++;
      if (i < len && raw[i] === "\n") i++;
    } else if (raw[i] === ":") {
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
 * Parsed representation of any stored block (new plain text or legacy LPFB)
 */
export interface ParsedBlock {
  fields: Record<string, string>;
  list: string[];
}

/**
 * Universal storage block parser.
 * Reads both new human-readable plain text and legacy LPFB blocks seamlessly.
 */
export function parseStorageBlock(raw: unknown): ParsedBlock {
  const fields: Record<string, string> = {};
  const list: string[] = [];
  if (!raw || typeof raw !== "string") return { fields, list };

  const str = raw.trim();

  // 1. Detect legacy LPFB format: contains Key[length]:
  if (/[A-Za-z0-9_]+\[\d+\]:/.test(str)) {
    const lpfb = decodeLPFB(str);
    for (const [k, v] of Object.entries(lpfb)) {
      const normKey = k.toLowerCase().replace(/[\s_]+/g, "");
      fields[normKey] = v;
      fields[k] = v;
    }
    for (let i = 1; i <= 20; i++) {
      if (lpfb[`Idea${i}_Text`]) list.push(lpfb[`Idea${i}_Text`]);
      else if (lpfb[`Obs${i}_Text`]) list.push(lpfb[`Obs${i}_Text`]);
    }
    return { fields, list };
  }

  // 2. Ordinary human-readable plain text format
  const knownHeaders = new Set([
    "topicid", "topictitle", "trendingtag",
    "observationcount", "obscount",
    "howmightwe", "hmw",
    "ideacount",
    "selectedidea", "selectedideatext", "category", "selectedideacategory",
    "totalideas", "sortedideas",
    "prototypetitle", "prototitle", "prototypeformat", "protoformat", "prototypedescription", "protodesc",
    "whatifscore", "ilikescore", "iwishscore",
    "stagecompletion", "rubricstagecompletion",
    "meaningfulinput", "rubricmeaningfulinput",
    "reflectioniteration", "rubricreflectioniteration",
    "aithoughtfulness", "rubricaithoughtfulness",
    "leveltitle", "leveldesc", "leveldescription", "feedback"
  ]);

  const lines = str.replace(/\r\n/g, "\n").split("\n");
  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentKey && fields[currentKey] !== undefined) {
        fields[currentKey] += "\n";
      }
      continue;
    }

    // Check if line is a labeled field: e.g. "Topic Title: Campus Smart Transportation"
    const isMultiLineKey = currentKey === "prototypedescription" || currentKey === "feedback" || currentKey === "howmightwe";
    const fieldMatch = trimmed.match(/^([A-Za-z0-9 _]+):\s*(.*)$/);
    if (fieldMatch) {
      const originalKey = fieldMatch[1].trim();
      const normKey = originalKey.toLowerCase().replace(/[\s_]+/g, "");
      if (!isMultiLineKey || knownHeaders.has(normKey)) {
        const val = fieldMatch[2].trim();
        fields[normKey] = val;
        fields[originalKey] = val;
        currentKey = normKey;
        continue;
      }
    }

    // Check if line is a numbered list item: e.g. "1. HOW: ..." or "1. Student (Cluster): ..."
    const listMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (listMatch && !isMultiLineKey) {
      list.push(listMatch[1].trim());
      currentKey = null;
      continue;
    }

    // Continuation line for multi-line field (e.g. Prototype Description or Feedback)
    if (currentKey && fields[currentKey] !== undefined) {
      fields[currentKey] = fields[currentKey].endsWith("\n")
        ? fields[currentKey] + trimmed
        : fields[currentKey] + "\n" + trimmed;
    }
  }

  return { fields, list };
}

/**
 * Builds Row 1 (task_id: 1.0, task_name: "Discovery & Definition")
 * value1: Topic information (human-readable plain text with line breaks)
 * value2: Empathy / Observations (ordinary numbered text lines)
 * value3: Refined HMW statement (human-readable plain text)
 */
export function buildRow1Payload(data: {
  topic?: { id?: string; title?: string; trendingTag?: string } | null;
  problemObservations?: Array<{ id?: string; perspectiveName?: string; cluster?: string; text?: string }> | null;
  refinedHowMightWe?: string | null;
}): { value1: string; value2: string; value3: string } {
  // Value 1: Topic Information
  const topicId = clampText(data.topic?.id || "custom", 60);
  const topicTitle = clampText(data.topic?.title || "Design Challenge", 180);
  const trendingTag = clampText(data.topic?.trendingTag || "Innovation", 60);

  const val1 = [
    `Topic ID: ${topicId}`,
    `Topic Title: ${topicTitle}`,
    `Trending Tag: ${trendingTag}`
  ].join("\n");

  // Value 2: Observations / Empathy (ordinary numbered text lines)
  const obsList = Array.isArray(data.problemObservations) ? data.problemObservations.slice(0, 5) : [];
  const val2Lines = [`Observation Count: ${obsList.length}`];
  obsList.forEach((obs, idx) => {
    const num = idx + 1;
    const perspective = clampText(obs.perspectiveName || "User", 50);
    const text = clampText(obs.text || "", 300);
    const cluster = clampText(obs.cluster || "General", 40);
    val2Lines.push(`${num}. ${perspective} (${cluster}): ${text}`);
  });
  const val2 = val2Lines.join("\n");

  // Value 3: Defined Problem (How Might We)
  const hmw = clampText(data.refinedHowMightWe || "", 1500);
  const val3 = `How Might We: ${hmw}`;

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Builds Row 2 (task_id: 2.0, task_name: "Ideation")
 * value1: Ideas list (ordinary numbered text lines)
 * value2: Selected idea (human-readable plain text)
 * value3: Ideation metrics and counts (readable labels)
 */
export function buildRow2Payload(data: {
  ideas?: Array<{ id?: string; category?: string; text?: string }> | null;
  selectedPrototype?: { title?: string; description?: string } | null;
}): { value1: string; value2: string; value3: string } {
  // Value 1: Ideas list (ordinary numbered list)
  const ideaList = Array.isArray(data.ideas) ? data.ideas.slice(0, 8) : [];
  const val1Lines = [`Idea Count: ${ideaList.length}`];
  ideaList.forEach((item, idx) => {
    const num = idx + 1;
    const cat = clampText(item.category || "HOW", 20);
    const text = clampText(item.text || "", 350);
    val1Lines.push(`${num}. ${cat}: ${text}`);
  });
  const val1 = val1Lines.join("\n");

  // Value 2: Selected Idea / Top Idea
  const primaryIdea = ideaList[0] || null;
  const selIdeaText = clampText(primaryIdea?.text || data.selectedPrototype?.title || "", 500);
  const selIdeaCat = clampText(primaryIdea?.category || "HOW", 30);
  const val2 = [
    `Selected Idea: ${selIdeaText}`,
    `Category: ${selIdeaCat}`
  ].join("\n");

  // Value 3: Stats / Metrics
  const totalIdeas = Array.isArray(data.ideas) ? data.ideas.length : 0;
  const sortedCount = Array.isArray(data.ideas) ? data.ideas.filter(i => i.category && i.category !== "UNSORTED").length : 0;
  const val3 = [
    `Total Ideas: ${totalIdeas}`,
    `Sorted Ideas: ${sortedCount}`
  ].join("\n");

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Builds Row 3 (task_id: 3.0, task_name: "Prototype & Testing")
 * value1: Prototype definition (human-readable plain text with line breaks)
 * value2: Testing metrics and rubric breakdown (readable labels followed by values)
 * value3: Reflection, level info, and feedback (human-readable plain text)
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
  const protoTitle = clampText(data.selectedPrototype?.title || "Prototype", 180);
  const protoFormat = clampText(data.selectedPrototype?.format || "canvas", 40);
  const protoDesc = clampText(data.selectedPrototype?.description || "", 2400);
  const val1 = [
    `Prototype Title: ${protoTitle}`,
    `Prototype Format: ${protoFormat}`,
    `Prototype Description: ${protoDesc}`
  ].join("\n");

  // Value 2: Testing metrics & rubric breakdown
  const whatIf = typeof data.testingData?.whatIfScore === "number" ? data.testingData.whatIfScore : 0;
  const iLike = data.testingData?.iLikeScore ? 1 : 0;
  const iWish = data.testingData?.iWishScore ? 1 : 0;
  const stageComp = typeof data.rubric?.stageCompletion === "number" ? data.rubric.stageCompletion : 0;
  const meanInput = typeof data.rubric?.meaningfulInput === "number" ? data.rubric.meaningfulInput : 0;
  const reflIter = typeof data.rubric?.reflectionIteration === "number" ? data.rubric.reflectionIteration : 0;
  const aiThought = typeof data.rubric?.aiThoughtfulness === "number" ? data.rubric.aiThoughtfulness : 0;

  const val2 = [
    `What If Score: ${whatIf}`,
    `I Like Score: ${iLike}`,
    `I Wish Score: ${iWish}`,
    `Stage Completion: ${stageComp}`,
    `Meaningful Input: ${meanInput}`,
    `Reflection Iteration: ${reflIter}`,
    `AI Thoughtfulness: ${aiThought}`
  ].join("\n");

  // Value 3: Reflection, Level Title & Description, Feedback
  const lvlTitle = clampText(data.rubric?.levelTitle || "Design Thinker", 80);
  const lvlDesc = clampText(data.rubric?.levelDesc || "Completed Design Thinking journey", 250);
  const feedback = clampText(data.rubric?.feedback || "Great problem solving and prototype testing.", 900);

  const val3 = [
    `Level Title: ${lvlTitle}`,
    `Level Description: ${lvlDesc}`,
    `Feedback: ${feedback}`
  ].join("\n");

  return { value1: val1, value2: val2, value3: val3 };
}

/**
 * Reconstructs a CompletedSimulationRecap from Supabase rows.
 * Seamlessly parses:
 * 1. New human-readable plain-text records
 * 2. Existing LPFB records
 * 3. Legacy 5-row records
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

  // CHECK A: Is the latest completion using the 3-Row architecture?
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

    const row1_val1 = parseStorageBlock(row1?.value1);
    const row1_val2 = parseStorageBlock(row1?.value2);
    const row1_val3 = parseStorageBlock(row1?.value3);

    const row2_val1 = parseStorageBlock(row2?.value1);
    const row2_val2 = parseStorageBlock(row2?.value2);

    const row3_val1 = parseStorageBlock(row3.value1);
    const row3_val2 = parseStorageBlock(row3.value2);
    const row3_val3 = parseStorageBlock(row3.value3);

    // Extract challenge (from Row 1 or Row 3 fallback)
    const challenge =
      row1_val1.fields["topictitle"] ||
      row1_val1.fields["TopicTitle"] ||
      (row3_val1.fields["prototypetitle"] ? `${row3_val1.fields["prototypetitle"]} Challenge` :
       row3_val1.fields["ProtoTitle"] ? `${row3_val1.fields["ProtoTitle"]} Challenge` :
       "Design Challenge");

    // Extract empathy summary (from Row 1 first observation or honest fallback)
    let empathizeSummary =
      row1_val2.fields["obs1text"] ||
      row1_val2.fields["Obs1_Text"] ||
      "";

    if (!empathizeSummary && row1_val2.list.length > 0) {
      const firstItem = row1_val2.list[0];
      const colonIdx = firstItem.indexOf(": ");
      empathizeSummary = colonIdx !== -1 ? firstItem.slice(colonIdx + 2).trim() : firstItem;
    }

    if (!empathizeSummary) {
      empathizeSummary = "User empathy research and observations recorded.";
    }

    // Extract problem statement (HMW)
    const problemStatement =
      row1_val3.fields["howmightwe"] ||
      row1_val3.fields["HMW"] ||
      (row1?.value3 ? row1.value3.replace(/^How Might We:\s*/i, "").trim() : "Problem definition and challenge recorded.");

    // Extract top ideas
    const topIdeas: string[] = [];
    if (row2_val1.list.length > 0) {
      for (const item of row2_val1.list) {
        const catMatch = item.match(/^[A-Z]+:\s*(.*)$/);
        if (catMatch) {
          topIdeas.push(catMatch[1].trim());
        } else {
          topIdeas.push(item);
        }
        if (topIdeas.length >= 3) break;
      }
    } else {
      if (row2_val1.fields["idea1text"]) topIdeas.push(row2_val1.fields["idea1text"]);
      if (row2_val1.fields["idea2text"]) topIdeas.push(row2_val1.fields["idea2text"]);
      if (row2_val1.fields["idea3text"]) topIdeas.push(row2_val1.fields["idea3text"]);
    }

    if (topIdeas.length === 0 && (row2_val2.fields["selectedidea"] || row2_val2.fields["SelectedIdeaText"])) {
      topIdeas.push(row2_val2.fields["selectedidea"] || row2_val2.fields["SelectedIdeaText"]);
    }
    if (topIdeas.length === 0 && (row3_val1.fields["prototypetitle"] || row3_val1.fields["ProtoTitle"])) {
      topIdeas.push(row3_val1.fields["prototypetitle"] || row3_val1.fields["ProtoTitle"]);
    }
    if (topIdeas.length === 0) {
      topIdeas.push("Generated creative solutions.");
    }

    // Extract prototype summary
    const prototypeSummary =
      row3_val1.fields["prototypedescription"] ||
      row3_val1.fields["protodesc"] ||
      row3_val1.fields["ProtoDesc"] ||
      row3_val1.fields["prototypetitle"] ||
      row3_val1.fields["ProtoTitle"] ||
      "Built and summarized the final prototype.";

    // Authoritative overall score
    const overallScore = typeof row3.score === "number" ? Math.max(0, Math.min(100, Math.round(row3.score))) : (Number(row3.score) || 0);

    // Achievements
    const levelTitle =
      row3_val3.fields["leveltitle"] ||
      row3_val3.fields["LevelTitle"] ||
      (
        overallScore >= 91 ? "DT Innovation Master" :
        overallScore >= 76 ? "Innovation Builder" :
        overallScore >= 61 ? "Creative Thinker" : "Problem Solver"
      );

    const breakdown = {
      stageCompletion: Number(row3_val2.fields["stagecompletion"] || row3_val2.fields["rubricstagecompletion"] || row3_val2.fields["Rubric_StageCompletion"]) || 0,
      meaningfulInput: Number(row3_val2.fields["meaningfulinput"] || row3_val2.fields["rubricmeaningfulinput"] || row3_val2.fields["Rubric_MeaningfulInput"]) || 0,
      reflectionIteration: Number(row3_val2.fields["reflectioniteration"] || row3_val2.fields["rubricreflectioniteration"] || row3_val2.fields["Rubric_ReflectionIteration"]) || 0,
      aiThoughtfulness: Number(row3_val2.fields["aithoughtfulness"] || row3_val2.fields["rubricaithoughtfulness"] || row3_val2.fields["Rubric_AiThoughtfulness"]) || 0,
      overallScore,
      feedback: row3_val3.fields["feedback"] || row3_val3.fields["Feedback"] || "",
      levelTitle,
      levelDesc: row3_val3.fields["leveldescription"] || row3_val3.fields["leveldesc"] || row3_val3.fields["LevelDesc"] || ""
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
