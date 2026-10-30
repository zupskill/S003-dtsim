import { sanitizeString, clampNumber } from "./validation";

export interface EvaluatorInput {
  maxReachedStage?: number;
  problemObservations?: Array<{ text?: string }>;
  refinedHowMightWe?: string;
  ideas?: Array<{ text?: string }>;
  selectedPrototype?: { title?: string; description?: string; imageUrl?: string } | null;
  testingData?: { whatIfScore?: number; iLikeScore?: number; iWishScore?: number } | null;
}

export interface AuthoritativeEvaluation {
  stageCompletion: number;
  meaningfulInput: number;
  reflectionIteration: number;
  deterministicTotal: number;
  aiThoughtfulness: number;
  overallScore: number;
  levelTitle: string;
  levelDesc: string;
  feedback: string;
}

export function computeServerAuthoritativeScore(
  input: EvaluatorInput,
  aiThoughtfulnessScore: number = 0
): AuthoritativeEvaluation {
  const observations = Array.isArray(input.problemObservations)
    ? input.problemObservations.map((o) => ({ text: sanitizeString(o?.text || "", 1000) })).filter((o) => o.text.length > 0)
    : [];

  const refinedHmw = sanitizeString(input.refinedHowMightWe || "", 1000);

  const ideas = Array.isArray(input.ideas)
    ? input.ideas.map((i) => ({ text: sanitizeString(i?.text || "", 1000) })).filter((i) => i.text.length > 0)
    : [];

  const proto = input.selectedPrototype
    ? {
        title: sanitizeString(input.selectedPrototype.title || "", 200),
        description: sanitizeString(input.selectedPrototype.description || "", 2000),
        imageUrl: sanitizeString(input.selectedPrototype.imageUrl || "", 1000),
      }
    : null;

  const testData = input.testingData || {};

  // 1. Stage Completion (Max 40, verified from actual artifacts)
  let stageCompletion = 0;
  if (observations.length > 0) stageCompletion += 8;
  if (refinedHmw.length > 0) stageCompletion += 8;
  if (ideas.length > 0) stageCompletion += 8;
  if (proto && proto.title.length > 0) stageCompletion += 8;
  if (testData.whatIfScore || testData.iLikeScore || testData.iWishScore) stageCompletion += 8;
  stageCompletion = Math.min(40, stageCompletion);

  // 2. Meaningful Input (Max 30, 6 per stage)
  let meaningfulInput = 0;

  // Empathize (max 6)
  let empInput = 0;
  if (observations.length >= 1) empInput += 2;
  if (observations.length >= 3) empInput += 2;
  if (observations.some((obs) => obs.text.length > 20)) empInput += 2;
  meaningfulInput += Math.min(empInput, 6);

  // Define (max 6)
  let defInput = 0;
  if (refinedHmw.length > 10) defInput += 2;
  if (refinedHmw.length > 30) defInput += 2;
  if (refinedHmw.toLowerCase().includes("how might we") || refinedHmw.toUpperCase().includes("HMW")) defInput += 2;
  meaningfulInput += Math.min(defInput, 6);

  // Ideate (max 6)
  let idInput = 0;
  if (ideas.length >= 1) idInput += 2;
  if (ideas.length >= 3) idInput += 2;
  if (ideas.some((i) => i.text.length > 20)) idInput += 2;
  meaningfulInput += Math.min(idInput, 6);

  // Prototype (max 6)
  let protoInput = 0;
  if (proto && proto.title.length > 5) protoInput += 2;
  if (proto && proto.description.length > 20) protoInput += 2;
  if (proto && proto.description.length > 50) protoInput += 2;
  meaningfulInput += Math.min(protoInput, 6);

  // Test (max 6)
  let testInput = 0;
  if (testData.whatIfScore) testInput += 2;
  if (testData.iLikeScore) testInput += 2;
  if (testData.iWishScore) testInput += 2;
  meaningfulInput += Math.min(testInput, 6);

  // 3. Reflection & Iteration (Max 20, 5x4 areas)
  let reflectionIteration = 0;

  // Idea Exploration (5 pts)
  let ideaRef = 0;
  if (ideas.length > 3) ideaRef += 3;
  else if (ideas.length > 1) ideaRef += 2;
  const distinctSet = new Set(ideas.map((i) => i.text.toLowerCase()));
  if (distinctSet.size === ideas.length && ideas.length > 1) ideaRef += 2;
  reflectionIteration += Math.min(ideaRef, 5);

  // Problem Refinement (5 pts)
  let probRef = 0;
  if (refinedHmw.length > 0 && observations.length > 0) probRef += 3;
  if (refinedHmw.length > 40) probRef += 2;
  reflectionIteration += Math.min(probRef, 5);

  // Prototype Iteration (5 pts)
  let protoRef = 0;
  if (proto && proto.title.length > 0 && proto.description.length > 0) protoRef += 3;
  if (proto && (proto.imageUrl.length > 0 || proto.description.length > 100)) protoRef += 2;
  reflectionIteration += Math.min(protoRef, 5);

  // Test -> Improvement (5 pts)
  let testRef = 0;
  if (testData.whatIfScore && testData.whatIfScore > 0) testRef += 2;
  if (testData.iWishScore && testData.iWishScore > 0) testRef += 3;
  reflectionIteration += Math.min(testRef, 5);

  const boundedAiScore = clampNumber(aiThoughtfulnessScore, 0, 10, 5);
  const deterministicTotal = stageCompletion + meaningfulInput + reflectionIteration;
  const overallScore = Math.min(100, Math.max(0, deterministicTotal + boundedAiScore));

  let levelTitle = "Getting Started 💡";
  let levelDesc = "Your simulation participation is currently limited. Try engaging more deeply with each stage.";
  if (overallScore >= 90) {
    levelTitle = "Design Thinker 🚀";
    levelDesc = "Exceptional participation and iteration.";
  } else if (overallScore >= 75) {
    levelTitle = "Strong Explorer 🌟";
    levelDesc = "Strong participation with meaningful inputs.";
  } else if (overallScore >= 60) {
    levelTitle = "Active Participant 👍";
    levelDesc = "You completed the process but could engage more deeply.";
  } else if (overallScore >= 40) {
    levelTitle = "Developing Thinker 🌱";
    levelDesc = "Some participation, but several areas could be explored more deeply.";
  }

  let feedback = "Exceptional participation! You engaged deeply across every stage, explored multiple ideas, and reflected thoughtfully on your design.";
  if (stageCompletion < 40) {
    feedback = "You completed some stages, but finishing the entire simulation will deepen your learning.";
  } else if (meaningfulInput < 20) {
    feedback = "You completed every stage, but your responses were brief. Try elaborating on your observations and ideas next time.";
  } else if (reflectionIteration < 15) {
    feedback = "Strong stage completion and meaningful input. Consider iterating more deeply or exploring more alternative ideas next time.";
  }

  return {
    stageCompletion,
    meaningfulInput,
    reflectionIteration,
    deterministicTotal,
    aiThoughtfulness: boundedAiScore,
    overallScore,
    levelTitle,
    levelDesc,
    feedback,
  };
}
