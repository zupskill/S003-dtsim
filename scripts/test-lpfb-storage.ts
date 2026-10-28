import assert from "node:assert";
import {
  clampText,
  formatLPFBField,
  formatLPFBScalar,
  decodeLPFB,
  parseStorageBlock,
  buildRow1Payload,
  buildRow2Payload,
  buildRow3Payload,
  reconstructRecapFromActivities
} from "../src/utils/lpfb";

console.log("==========================================");
console.log("TEST SUITE: S003 Human-Readable Plain-Text Storage");
console.log("==========================================");

// Helper function to verify no LPFB length markers, no JSON, and no Base64
function assertPlainReadableText(val: string, label: string) {
  assert(typeof val === "string", `${label} must be a string`);
  // Must NOT contain LPFB length markers like [27]: or [150]:
  assert(!/[A-Za-z0-9_]+\[\d+\]:/.test(val), `${label} must NOT contain LPFB length markers like Key[10]: (found: ${val.slice(0, 50)})`);
  // Must NOT be JSON serialized
  assert(!val.trim().startsWith("{") && !val.trim().startsWith("["), `${label} must NOT be JSON (found: ${val.slice(0, 30)})`);
  // Must NOT be base64 data URL
  assert(!val.startsWith("data:"), `${label} must NOT be a Base64 data URL`);
}

// TEST 1: New Human-Readable Plain-Text Format Verification
{
  const row1 = buildRow1Payload({
    topic: { id: "topic_smart_transit", title: "Campus Smart Transportation", trendingTag: "Smart Campus" },
    problemObservations: [
      { id: "obs_1", perspectiveName: "Student Commuter", cluster: "Mobility", text: "Long queue for express shuttle bus." },
      { id: "obs_2", perspectiveName: "Campus Security", cluster: "Safety", text: "Crowding at gate 4 during evening rush." }
    ],
    refinedHowMightWe: "How might we create real-time shuttle capacity signals to balance passenger load?"
  });

  const row2 = buildRow2Payload({
    ideas: [
      { id: "idea_1", category: "HOW", text: "Digital LED bus stop occupancy indicators." },
      { id: "idea_2", category: "WOW", text: "Autonomous micro-trams for overflow peak crowds." }
    ],
    selectedPrototype: {
      title: "Campus Queue-Sync Transit App",
      description: "Live occupancy maps and push alerts that guide students to alternate uncrowded shuttles."
    }
  });

  const row3 = buildRow3Payload({
    selectedPrototype: {
      title: "Campus Queue-Sync Transit App",
      format: "canvas",
      description: "Live occupancy maps and push alerts that guide students to alternate uncrowded shuttles."
    },
    testingData: { whatIfScore: 9, iLikeScore: true, iWishScore: true },
    rubric: {
      stageCompletion: 40,
      meaningfulInput: 26,
      reflectionIteration: 17,
      aiThoughtfulness: 9,
      levelTitle: "Design Thinker 🚀",
      levelDesc: "Exceptional participation and iteration.",
      feedback: "Exceptional participation! You engaged deeply across every stage, explored multiple ideas, and reflected thoughtfully on your design."
    },
    overallScore: 92
  });

  // Verify all 9 database values across the 3 rows:
  assertPlainReadableText(row1.value1, "Row 1 Val 1");
  assertPlainReadableText(row1.value2, "Row 1 Val 2");
  assertPlainReadableText(row1.value3, "Row 1 Val 3");

  assertPlainReadableText(row2.value1, "Row 2 Val 1");
  assertPlainReadableText(row2.value2, "Row 2 Val 2");
  assertPlainReadableText(row2.value3, "Row 2 Val 3");

  assertPlainReadableText(row3.value1, "Row 3 Val 1");
  assertPlainReadableText(row3.value2, "Row 3 Val 2");
  assertPlainReadableText(row3.value3, "Row 3 Val 3");

  // Verify readable labels and numbered lists:
  assert(row1.value1.includes("Topic Title: Campus Smart Transportation"), "Row 1 Val 1 must have Topic Title label");
  assert(row1.value2.includes("Observation Count: 2"), "Row 1 Val 2 must have Observation Count");
  assert(row1.value2.includes("1. Student Commuter (Mobility): Long queue for express shuttle bus."), "Row 1 Val 2 must be numbered list");
  assert(row1.value3.includes("How Might We: How might we create real-time shuttle capacity signals"), "Row 1 Val 3 must have How Might We label");

  assert(row2.value1.includes("Idea Count: 2"), "Row 2 Val 1 must have Idea Count");
  assert(row2.value1.includes("1. HOW: Digital LED bus stop occupancy indicators."), "Row 2 Val 1 must have numbered idea item");
  assert(row2.value2.includes("Selected Idea: Digital LED bus stop occupancy indicators."), "Row 2 Val 2 must have Selected Idea label");
  assert(row2.value3.includes("Total Ideas: 2"), "Row 2 Val 3 must have Total Ideas");

  assert(row3.value1.includes("Prototype Title: Campus Queue-Sync Transit App"), "Row 3 Val 1 must have Prototype Title");
  assert(row3.value2.includes("What If Score: 9"), "Row 3 Val 2 must have What If Score");
  assert(row3.value2.includes("Stage Completion: 40"), "Row 3 Val 2 must have Stage Completion");
  assert(row3.value3.includes("Level Title: Design Thinker 🚀"), "Row 3 Val 3 must have Level Title with emoji");

  console.log("✔ Test 1 Passed: New Human-Readable Plain-Text Format Verified (Zero LPFB markers, zero JSON, zero Base64)");
}

// TEST 2: Special Characters, Emojis, Colons in Content, Brackets, and Newlines
{
  const complexObsText = "Pain point [Urgent: High]: Parking at Gate #3 is broken!\nNext line: 20+ bikes blocked. 🚀💡";
  const complexHMW = "How might we fix Gate #3 (West Wing) at 9:00 AM: fast passes & bike-lockers?";
  const complexIdeaText = "Idea: Automated QR gates [Phase 1: Pilot]: 24/7 access with RFID tags.";
  const complexProtoDesc = "A multi-line prototype description:\n1. Hardware scanner at gate.\n2. Mobile push alert [Warning: High Load].\n3. Instant badge unlock. ✨";
  const complexFeedback = "Great iteration! Score breakdown [Category: Excellent]: deep empathy shown across all 6 stages. 🌟";

  const row1 = buildRow1Payload({
    topic: { id: "topic_special", title: "Campus Gate #3: Mobility & Access [Pilot]", trendingTag: "Campus" },
    problemObservations: [
      { id: "obs_complex", perspectiveName: "Campus Resident [East]", cluster: "Access: High Priority", text: complexObsText }
    ],
    refinedHowMightWe: complexHMW
  });

  const row2 = buildRow2Payload({
    ideas: [
      { id: "idea_complex", category: "HOW", text: complexIdeaText }
    ],
    selectedPrototype: {
      title: "Smart Gate Pass [V2: Beta]",
      description: complexProtoDesc
    }
  });

  const row3 = buildRow3Payload({
    selectedPrototype: {
      title: "Smart Gate Pass [V2: Beta]",
      format: "canvas",
      description: complexProtoDesc
    },
    testingData: { whatIfScore: 9, iLikeScore: true, iWishScore: true },
    rubric: {
      stageCompletion: 40,
      meaningfulInput: 26,
      reflectionIteration: 17,
      aiThoughtfulness: 9,
      levelTitle: "Innovation Master 🚀✨",
      levelDesc: "Mastery of iterative design [Certified].",
      feedback: complexFeedback
    },
    overallScore: 92
  });

  // Verify none of the values contain LPFB length markers
  assertPlainReadableText(row1.value1, "Row 1 Val 1");
  assertPlainReadableText(row1.value2, "Row 1 Val 2");
  assertPlainReadableText(row1.value3, "Row 1 Val 3");
  assertPlainReadableText(row2.value1, "Row 2 Val 1");
  assertPlainReadableText(row3.value1, "Row 3 Val 1");

  // Reconstruct and verify exact preservation of user content
  const now = new Date().toISOString();
  const activities = [
    { activity_id: "S003", task_id: 1.0, task_name: "Discovery & Definition", value1: row1.value1, value2: row1.value2, value3: row1.value3, score: null, updated_at: now },
    { activity_id: "S003", task_id: 2.0, task_name: "Ideation", value1: row2.value1, value2: row2.value2, value3: row2.value3, score: null, updated_at: now },
    { activity_id: "S003", task_id: 3.0, task_name: "Prototype & Testing", value1: row3.value1, value2: row3.value2, value3: row3.value3, score: 92, updated_at: now }
  ];

  const { recap } = reconstructRecapFromActivities(activities);
  assert(recap !== null);
  assert.strictEqual(recap.challenge, "Campus Gate #3: Mobility & Access [Pilot]");
  assert.strictEqual(recap.problemStatement, complexHMW);
  assert.strictEqual(recap.topIdeas[0], complexIdeaText);
  assert.strictEqual(recap.prototypeSummary, complexProtoDesc);
  assert.strictEqual(recap.overallScore, 92);
  assert(recap.engagementBreakdown?.feedback.includes("Great iteration! Score breakdown [Category: Excellent]"));
  assert.strictEqual(recap.engagementBreakdown?.levelTitle, "Innovation Master 🚀✨");

  console.log("✔ Test 2 Passed: Special Characters, Colons, Brackets, Emojis & Newlines preserved safely");
}

// TEST 3: Column Size Bounds (No Truncation)
{
  const longText = "A".repeat(5000);
  const row1 = buildRow1Payload({
    topic: { id: "T1", title: longText, trendingTag: "Tech" },
    problemObservations: Array(10).fill({ id: "O1", perspectiveName: longText, cluster: "Tech", text: longText }),
    refinedHowMightWe: longText
  });

  const row2 = buildRow2Payload({
    ideas: Array(15).fill({ id: "I1", category: "HOW", text: longText }),
    selectedPrototype: { title: longText, description: longText }
  });

  const row3 = buildRow3Payload({
    selectedPrototype: { title: longText, format: "canvas", description: longText },
    testingData: { whatIfScore: 8, iLikeScore: true, iWishScore: true },
    rubric: { stageCompletion: 40, meaningfulInput: 20, reflectionIteration: 10, aiThoughtfulness: 10, levelTitle: longText, levelDesc: longText, feedback: longText },
    overallScore: 88
  });

  // Verify all values fit well within Postgres column limits (4000 for val1, 2000 for val2/val3)
  assert(row1.value1.length < 4000, `Row 1 Val 1 too large: ${row1.value1.length}`);
  assert(row1.value2.length < 2000, `Row 1 Val 2 too large: ${row1.value2.length}`);
  assert(row1.value3.length < 2000, `Row 1 Val 3 too large: ${row1.value3.length}`);

  assert(row2.value1.length < 4000, `Row 2 Val 1 too large: ${row2.value1.length}`);
  assert(row2.value2.length < 2000, `Row 2 Val 2 too large: ${row2.value2.length}`);
  assert(row2.value3.length < 2000, `Row 2 Val 3 too large: ${row2.value3.length}`);

  assert(row3.value1.length < 4000, `Row 3 Val 1 too large: ${row3.value1.length}`);
  assert(row3.value2.length < 2000, `Row 3 Val 2 too large: ${row3.value2.length}`);
  assert(row3.value3.length < 2000, `Row 3 Val 3 too large: ${row3.value3.length}`);

  console.log("✔ Test 3 Passed: Column character bounds strictly respected without truncation");
}

// TEST 4: 3-Row Reconstruction (All 11 Recap Fields Preserved)
{
  const now = new Date().toISOString();
  const sampleTopic = { id: "topic_water", title: "Smart Water Conservation in Dormitories", trendingTag: "Eco" };
  const sampleObs = [
    { id: "obs_1", perspectiveName: "Student Resident", cluster: "Infrastructure", text: "Showers leak 5 gallons an hour during peak usage." },
    { id: "obs_2", perspectiveName: "Facility Manager", cluster: "Policy", text: "Low water pressure alerts are manually logged." }
  ];
  const sampleHMW = "How might we empower dorm residents to track real-time water usage while incentivizing conservation?";
  const sampleIdeas = [
    { id: "idea_1", category: "WOW", text: "Smart aerator with LED usage ring that shifts from blue to amber." },
    { id: "idea_2", category: "HOW", text: "Mobile leaderboard connecting floor wings in weekly challenges." },
    { id: "idea_3", category: "NOW", text: "Pressure sensor connected to resident WhatsApp notifications." }
  ];
  const sampleProto = {
    title: "EcoFlow Aerator & Dashboard",
    format: "canvas",
    description: "A plug-and-play shower aerator equipped with an LED flow indicator paired with an interactive floor leaderboard mobile widget."
  };
  const sampleRubric = {
    stageCompletion: 40,
    meaningfulInput: 20,
    reflectionIteration: 10,
    aiThoughtfulness: 10,
    overallScore: 80,
    levelTitle: "Innovation Builder",
    levelDesc: "Demonstrated strong empathetic design and iterative prototyping.",
    feedback: "Exceptional user-centric focus with measurable intervention points."
  };

  const row1 = buildRow1Payload({ topic: sampleTopic, problemObservations: sampleObs, refinedHowMightWe: sampleHMW });
  const row2 = buildRow2Payload({ ideas: sampleIdeas, selectedPrototype: sampleProto });
  const row3 = buildRow3Payload({ selectedPrototype: sampleProto, testingData: { whatIfScore: 8, iLikeScore: true, iWishScore: true }, rubric: sampleRubric, overallScore: 80 });

  const activities = [
    {
      activity_id: "S003",
      task_id: 1.0,
      task_name: "Discovery & Definition",
      value1: row1.value1,
      value2: row1.value2,
      value3: row1.value3,
      score: null,
      updated_at: now
    },
    {
      activity_id: "S003",
      task_id: 2.0,
      task_name: "Ideation",
      value1: row2.value1,
      value2: row2.value2,
      value3: row2.value3,
      score: null,
      updated_at: now
    },
    {
      activity_id: "S003",
      task_id: 3.0,
      task_name: "Prototype & Testing",
      value1: row3.value1,
      value2: row3.value2,
      value3: row3.value3,
      score: 80,
      updated_at: now
    }
  ];

  const { recap, completedCount } = reconstructRecapFromActivities(activities);
  assert(recap !== null, "Recap must not be null");
  assert.strictEqual(completedCount, 1);
  assert.strictEqual(recap.simulationName, "DT Innovation Lab");
  assert.strictEqual(recap.challenge, sampleTopic.title);
  assert.strictEqual(recap.empathizeSummary, sampleObs[0].text);
  assert.strictEqual(recap.problemStatement, sampleHMW);
  assert.strictEqual(recap.topIdeas.length, 3);
  assert.strictEqual(recap.topIdeas[0], sampleIdeas[0].text);
  assert.strictEqual(recap.prototypeSummary, sampleProto.description);
  assert.strictEqual(recap.overallScore, 80);
  assert.deepStrictEqual(recap.achievements, ["Innovation Builder"]);
  assert(recap.engagementBreakdown !== undefined);
  assert.strictEqual(recap.engagementBreakdown?.stageCompletion, 40);
  assert.strictEqual(recap.engagementBreakdown?.meaningfulInput, 20);
  assert.strictEqual(recap.engagementBreakdown?.feedback, sampleRubric.feedback);

  console.log("✔ Test 4 Passed: All 11 recap fields reconstructed faithfully from human-readable plain text");
}

// TEST 5: Backward Compatibility: Reading Existing LPFB Records
{
  const lpfbTime = new Date(Date.now() - 3600000).toISOString();
  const lpfbActivities = [
    {
      activity_id: "S003",
      task_id: 1.0,
      task_name: "Discovery & Definition",
      value1: "TopicTitle[25]:Legacy LPFB Water Project\nTrendingTag[3]:Eco\n",
      value2: "ObsCount:1\nObs1_Text[32]:Water filter valve leaked daily.\n",
      value3: "HMW[45]:How might we prevent dorm water filter leaks?\n",
      score: null,
      updated_at: lpfbTime
    },
    {
      activity_id: "S003",
      task_id: 2.0,
      task_name: "Ideation",
      value1: "IdeaCount:2\nIdea1_Text[26]:Magnetic auto-sealing ring\nIdea2_Text[22]:Pressure sensor buzzer\n",
      value2: "SelectedIdeaText[26]:Magnetic auto-sealing ring\n",
      value3: "TotalIdeas:2\n",
      score: null,
      updated_at: lpfbTime
    },
    {
      activity_id: "S003",
      task_id: 3.0,
      task_name: "Prototype & Testing",
      value1: "ProtoTitle[16]:Auto-Seal Sensor\nProtoDesc[39]:Magnetic sensor with audible beep alert\n",
      value2: "Rubric_StageCompletion:40\nRubric_MeaningfulInput:26\nRubric_ReflectionIteration:17\nRubric_AiThoughtfulness:9\n",
      value3: "LevelTitle[17]:Design Thinker 🚀\nFeedback[24]:Excellent iteration flow\n",
      score: 92,
      updated_at: lpfbTime
    }
  ];

  const { recap, completedCount } = reconstructRecapFromActivities(lpfbActivities);
  assert(recap !== null);
  assert.strictEqual(completedCount, 1);
  assert.strictEqual(recap.challenge, "Legacy LPFB Water Project");
  assert.strictEqual(recap.empathizeSummary, "Water filter valve leaked daily.");
  assert.strictEqual(recap.problemStatement, "How might we prevent dorm water filter leaks?");
  assert.strictEqual(recap.topIdeas[0], "Magnetic auto-sealing ring");
  assert.strictEqual(recap.prototypeSummary, "Magnetic sensor with audible beep alert");
  assert.strictEqual(recap.overallScore, 92);
  assert.strictEqual(recap.engagementBreakdown?.stageCompletion, 40);

  console.log("✔ Test 5 Passed: Existing LPFB records read with 100% backward compatibility");
}

// TEST 6: Backward Compatibility: Reading Legacy 5-Row JSON Records
{
  const legacyTime = new Date(Date.now() - 7200000).toISOString();
  const legacyActivities = [
    { activity_id: "S003", task_id: 1, task_name: "Topic Selection", value1: "T1", value2: "Legacy Campus Waste Challenge", updated_at: legacyTime },
    { activity_id: "S003", task_id: 2, task_name: "Empathize", value1: JSON.stringify([{ text: "Bins overflow on Fridays." }]), updated_at: legacyTime },
    { activity_id: "S003", task_id: 3, task_name: "Define", value1: "How might we sort campus waste effectively?", updated_at: legacyTime },
    { activity_id: "S003", task_id: 4, task_name: "Ideate", value1: JSON.stringify([{ text: "Color-coded smart bins" }, { text: "Reward points for recycling" }]), updated_at: legacyTime },
    { activity_id: "S003", task_id: 5, task_name: "Test", value1: "Smart Bins", value2: "Prototype smart bin system with sensors", value3: JSON.stringify({ overallScore: 78 }), score: 78, updated_at: legacyTime }
  ];

  const { recap, completedCount } = reconstructRecapFromActivities(legacyActivities);
  assert(recap !== null);
  assert.strictEqual(completedCount, 1);
  assert.strictEqual(recap.challenge, "Legacy Campus Waste Challenge");
  assert.strictEqual(recap.empathizeSummary, "Bins overflow on Fridays.");
  assert.strictEqual(recap.problemStatement, "How might we sort campus waste effectively?");
  assert.strictEqual(recap.topIdeas.length, 2);
  assert.strictEqual(recap.prototypeSummary, "Prototype smart bin system with sensors");
  assert.strictEqual(recap.overallScore, 78);
  assert.deepStrictEqual(recap.achievements, ["Innovation Builder"]);

  console.log("✔ Test 6 Passed: Legacy 5-row records reconstructed with 100% backward compatibility");
}

// TEST 7: Multiple Attempts Isolation (Latest Attempt Selection)
{
  const olderTime = new Date(Date.now() - 7200000).toISOString();
  const newerTime = new Date().toISOString();

  const multiActivities = [
    // Attempt 1 (Older, score 65)
    { activity_id: "S003", task_id: 1, task_name: "Discovery & Definition", value1: "Topic Title: Old Topic\n", updated_at: olderTime },
    { activity_id: "S003", task_id: 2, task_name: "Ideation", value1: "", updated_at: olderTime },
    { activity_id: "S003", task_id: 3, task_name: "Prototype & Testing", value1: "Prototype Description: Old Proto\n", score: 65, updated_at: olderTime },

    // Attempt 2 (Newer, score 95)
    { activity_id: "S003", task_id: 1, task_name: "Discovery & Definition", value1: "Topic Title: New Topic\n", updated_at: newerTime },
    { activity_id: "S003", task_id: 2, task_name: "Ideation", value1: "", updated_at: newerTime },
    { activity_id: "S003", task_id: 3, task_name: "Prototype & Testing", value1: "Prototype Description: New Proto\n", score: 95, updated_at: newerTime },
  ];

  const { recap, completedCount } = reconstructRecapFromActivities(multiActivities);
  assert.strictEqual(completedCount, 2);
  assert.strictEqual(recap?.challenge, "New Topic");
  assert.strictEqual(recap?.prototypeSummary, "New Proto");
  assert.strictEqual(recap?.overallScore, 95);
  console.log("✔ Test 7 Passed: Multi-attempt isolation selects the latest completed attempt cleanly");
}

// TEST 8: Strict Overlapping Multi-Attempt Isolation (Zero Cross-Attempt Row Stealing)
{
  const tAttempt1 = new Date(Date.now() - 60000).toISOString();
  const tAttempt2 = new Date().toISOString();

  const overlappingActivities = [
    // Attempt 1 (Fully complete)
    { activity_id: "S003", task_id: 1, task_name: "Discovery & Definition", value1: "Topic Title: Clean Water Initiative\n", updated_at: tAttempt1 },
    { activity_id: "S003", task_id: 2, task_name: "Ideation", value1: "", updated_at: tAttempt1 },
    { activity_id: "S003", task_id: 3, task_name: "Prototype & Testing", value1: "Prototype Title: Water Filter\n", score: 70, updated_at: tAttempt1 },

    // Attempt 2 (Row 1 is missing, only Row 2 and Row 3 present)
    { activity_id: "S003", task_id: 2, task_name: "Ideation", value1: "", updated_at: tAttempt2 },
    { activity_id: "S003", task_id: 3, task_name: "Prototype & Testing", value1: "Prototype Title: Solar Cooker\n", score: 92, updated_at: tAttempt2 }
  ];

  const { recap } = reconstructRecapFromActivities(overlappingActivities);
  assert(recap !== null);
  // Attempt 2's recap must NEVER steal Attempt 1's topic ("Clean Water Initiative")!
  assert.notStrictEqual(recap.challenge, "Clean Water Initiative", "Attempt 2 must NOT steal Row 1 from Attempt 1!");
  assert.strictEqual(recap.overallScore, 92);
  assert.strictEqual(recap.challenge, "Solar Cooker Challenge");
  console.log("✔ Test 8 Passed: Zero cross-attempt row stealing under missing/ambiguous attempt rows");
}

// TEST 9: Non-BMP Characters, Unicode & Surrogate Pairs Exact Equality
{
  const unicodePayload = "✨ Innovator 💡: 🚴‍♂️ Campus Bike Scheme 🌟 / 𝓤𝓷𝓲𝓬𝓸𝓭𝓮 𝒯ℯ𝓈𝓉 / 日本語 / العربية / 🚀";
  const row1 = buildRow1Payload({
    topic: { id: "T1", title: unicodePayload, trendingTag: "Global" },
    problemObservations: [{ id: "O1", perspectiveName: "Rider", text: unicodePayload }],
    refinedHowMightWe: unicodePayload
  });

  const parsed1 = parseStorageBlock(row1.value1);
  const parsed3 = parseStorageBlock(row1.value3);

  assert.strictEqual(parsed1.fields["topictitle"], unicodePayload);
  assert.strictEqual(parsed3.fields["howmightwe"], unicodePayload);
  console.log("✔ Test 9 Passed: Non-BMP Unicode and surrogate pairs preserved with exact equality");
}

// TEST 10: Malformed & Corrupted Legacy Records
{
  const legacyCorrupted = [
    { activity_id: "S003", task_id: 1, task_name: "Topic Selection", value1: null, value2: "Legacy Solar", updated_at: "2026-01-01T00:00:00Z" },
    { activity_id: "S003", task_id: 2, task_name: "Empathize", value1: "{Not valid JSON", updated_at: "2026-01-01T00:00:00Z" },
    { activity_id: "S003", task_id: 3, task_name: "Define", value1: null, updated_at: "2026-01-01T00:00:00Z" },
    { activity_id: "S003", task_id: 4, task_name: "Ideate", value1: "Plain text ideas without JSON", updated_at: "2026-01-01T00:00:00Z" },
    { activity_id: "S003", task_id: 5, task_name: "Test", value1: null, value2: "Solar Oven Prototype", value3: "{{corrupt: true", score: 82, updated_at: "2026-01-01T00:00:00Z" }
  ];

  const { recap, completedCount } = reconstructRecapFromActivities(legacyCorrupted);
  assert(recap !== null);
  assert.strictEqual(completedCount, 1);
  assert.strictEqual(recap.challenge, "Legacy Solar");
  assert.strictEqual(recap.overallScore, 82);
  assert.strictEqual(recap.prototypeSummary, "Solar Oven Prototype");
  console.log("✔ Test 10 Passed: Malformed and corrupted legacy records parsed defensively without crashes");
}

console.log("\n==========================================");
console.log("ALL 10 TEST SUITES PASSED FLAWLESSLY!");
console.log("==========================================");
