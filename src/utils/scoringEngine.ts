import { ProblemObservation, IdeaItem, PrototypeData, CompletedSimulationRecap } from "../types";

export function calculateDeterministicEngagement(
  maxReachedStage: number,
  problemObservations: ProblemObservation[],
  refinedHowMightWe: string,
  ideas: IdeaItem[],
  selectedPrototype: PrototypeData | null,
  testingData: any
) {
  let stageCompletion = 0;
  let meaningfulInput = 0;
  let reflectionIteration = 0;

  // 1. Stage Completion (Max 40, 8 per stage)
  // Reached stages: Empathize=2, Define=3, Ideate=4, Prototype=5, Test=6
  if (maxReachedStage >= 2) stageCompletion += 8;
  if (maxReachedStage >= 3) stageCompletion += 8;
  if (maxReachedStage >= 4) stageCompletion += 8;
  if (maxReachedStage >= 5) stageCompletion += 8;
  if (maxReachedStage >= 6) stageCompletion += 8;
  if (stageCompletion > 40) stageCompletion = 40;

  // 2. Meaningful Input (Max 30, 6 per stage)
  
  // Empathize (max 6)
  let empInput = 0;
  if (problemObservations.length >= 1) empInput += 2;
  if (problemObservations.length >= 3) empInput += 2;
  if (problemObservations.some(obs => obs.text.length > 20)) empInput += 2;
  meaningfulInput += Math.min(empInput, 6);

  // Define (max 6)
  let defInput = 0;
  if (refinedHowMightWe.trim().length > 10) defInput += 2;
  if (refinedHowMightWe.trim().length > 30) defInput += 2;
  if (refinedHowMightWe.includes("How might we") || refinedHowMightWe.includes("HMW")) defInput += 2;
  meaningfulInput += Math.min(defInput, 6);

  // Ideate (max 6)
  let idInput = 0;
  if (ideas.length >= 1) idInput += 2;
  if (ideas.length >= 3) idInput += 2;
  if (ideas.some(i => i.text.length > 20)) idInput += 2;
  meaningfulInput += Math.min(idInput, 6);

  // Prototype (max 6)
  let protoInput = 0;
  if (selectedPrototype?.title && selectedPrototype.title.length > 5) protoInput += 2;
  if (selectedPrototype?.description && selectedPrototype.description.length > 20) protoInput += 2;
  if (selectedPrototype?.description && selectedPrototype.description.length > 50) protoInput += 2;
  meaningfulInput += Math.min(protoInput, 6);

  // Test (max 6)
  let testInput = 0;
  if (testingData?.whatIfScore) testInput += 2;
  if (testingData?.iLikeScore) testInput += 2;
  if (testingData?.iWishScore) testInput += 2;
  meaningfulInput += Math.min(testInput, 6);

  // 3. Reflection & Iteration (Max 20, 5x4 areas)
  
  // Idea Exploration (5 points)
  let ideaRef = 0;
  if (ideas.length > 3) ideaRef += 3;
  else if (ideas.length > 1) ideaRef += 2;
  const hasDistinctIdeas = new Set(ideas.map(i => i.text.trim().toLowerCase())).size === ideas.length;
  if (hasDistinctIdeas && ideas.length > 1) ideaRef += 2;
  reflectionIteration += Math.min(ideaRef, 5);

  // Problem Refinement (5 points)
  let probRef = 0;
  if (refinedHowMightWe && problemObservations.length > 0) probRef += 3;
  if (refinedHowMightWe.length > 40) probRef += 2;
  reflectionIteration += Math.min(probRef, 5);

  // Prototype Iteration (5 points)
  let protoRef = 0;
  if (selectedPrototype?.title && selectedPrototype?.description) protoRef += 3;
  if (selectedPrototype?.imageUrl || selectedPrototype?.description.length > 100) protoRef += 2;
  reflectionIteration += Math.min(protoRef, 5);

  // Test -> Improvement (5 points)
  let testRef = 0;
  if (testingData?.whatIfScore && testingData.whatIfScore > 0) testRef += 2;
  if (testingData?.iWishScore && testingData.iWishScore > 0) testRef += 3;
  reflectionIteration += Math.min(testRef, 5);

  return {
    stageCompletion,
    meaningfulInput,
    reflectionIteration
  };
}

export function generateEngagementFeedback(breakdown: { stageCompletion: number; meaningfulInput: number; reflectionIteration: number; aiThoughtfulness: number; total: number; }) {
  const { stageCompletion, meaningfulInput, reflectionIteration } = breakdown;
  
  if (stageCompletion < 40) {
    return "You completed some stages, but finishing the entire simulation will deepen your learning.";
  }
  
  if (meaningfulInput < 20) {
    return "You completed every stage, but your responses were brief. Try elaborating on your observations and ideas next time.";
  }

  if (reflectionIteration < 15) {
    return "Strong stage completion and meaningful input. Consider iterating more deeply or exploring more alternative ideas next time.";
  }

  return "Exceptional participation! You engaged deeply across every stage, explored multiple ideas, and reflected thoughtfully on your design.";
}

export function getEngagementLevel(total: number) {
  if (total >= 90) return { title: "Design Thinker 🚀", desc: "Exceptional participation and iteration." };
  if (total >= 75) return { title: "Strong Explorer 🌟", desc: "Strong participation with meaningful inputs." };
  if (total >= 60) return { title: "Active Participant 👍", desc: "You completed the process but could engage more deeply." };
  if (total >= 40) return { title: "Developing Thinker 🌱", desc: "Some participation, but several areas could be explored more deeply." };
  return { title: "Getting Started 💡", desc: "Your simulation participation is currently limited. Try engaging more deeply with each stage." };
}
