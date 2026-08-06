import re

with open('src/supabase.ts', 'r') as f:
    content = f.read()

target = """    const testStage = activities.find(a => a.task_id === 5);
    const completedCount = testStage ? 1 : 0;
    
    let lastCompletedSimulation = null;
    if (testStage) {
      const stage1 = activities.find(a => a.task_id === 1);
      const stage2 = activities.find(a => a.task_id === 2);

      let parsedScores = { overallScore: testStage.score || 0, creativity: 0, understanding: 0, innovation: 0 };
      try {
        if (testStage.value3) {
          parsedScores = JSON.parse(testStage.value3);
        }
      } catch (e) {}

      lastCompletedSimulation = {
        date: testStage.updated_at,
        topicId: stage1?.value1 || "custom",
        topicTitle: stage1?.value2 || "Custom Challenge",
        refinedProblem: stage2?.value1 || "Problem definition not found",
        prototypeTitle: testStage.value1 || "Untitled Prototype",
        prototypeDescription: testStage.value2 || "Prototype description not found",
        scores: parsedScores
      };
    }"""

replacement = """    const testStage = activities.find(a => a.task_id === 5 && a.task_name === "Test") || activities.find(a => a.task_id === 5);
    const completedCount = testStage ? 1 : 0;
    
    let lastCompletedSimulation = null;
    if (testStage && testStage.task_name === "Test") {
      const stage1 = activities.find(a => a.task_id === 1);
      const stage2 = activities.find(a => a.task_id === 2);
      const stage3 = activities.find(a => a.task_id === 3);
      const stage4 = activities.find(a => a.task_id === 4);

      let parsedScores = { overallScore: testStage.score || 0, creativity: 0, understanding: 0, innovation: 0 };
      try {
        if (testStage.value3) {
          parsedScores = JSON.parse(testStage.value3);
        }
      } catch (e) {}

      let empathizeSummary = "";
      try {
         if (stage2?.value1) {
            const obs = JSON.parse(stage2.value1);
            if (obs.length > 0) empathizeSummary = obs[0].text;
         }
      } catch(e) {}
      
      let topIdeas: string[] = [];
      try {
         if (stage4?.value1) {
            const ideas = JSON.parse(stage4.value1);
            topIdeas = ideas.slice(0, 3).map((i: any) => i.text);
         }
      } catch(e) {}

      let overallScore = parsedScores.overallScore;
      let title = "Explorer";
      if (overallScore >= 91) title = "DT Innovation Master";
      else if (overallScore >= 76) title = "Innovation Builder";
      else if (overallScore >= 61) title = "Creative Thinker";
      else if (overallScore >= 41) title = "Problem Solver";

      lastCompletedSimulation = {
        simulationName: "DT Innovation Lab",
        completionDate: new Date(testStage.updated_at).toLocaleDateString(),
        challenge: stage1?.value2 || "Custom Challenge",
        empathizeSummary: empathizeSummary,
        problemStatement: stage3?.value1 || "Problem definition not found",
        topIdeas: topIdeas,
        prototypeSummary: testStage.value2 || "Prototype description not found",
        achievements: [title],
        overallScore: overallScore,
        completionTime: new Date(testStage.updated_at).getTime()
      };
    }"""

content = content.replace(target, replacement)

with open('src/supabase.ts', 'w') as f:
    f.write(content)
