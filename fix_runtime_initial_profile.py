import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target = """  const [profile, setProfile] = useState<UserProfile | null>(null);"""
replacement = """  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return {
      username: "Beta_Innovator_9", college: "Stanford Design Lab", level: "Explorer",
      xp: 60, unlockedBadgeIds: ["problem-hunter"], problemsSolved: 0, ideasGenerated: 0, prototypesBuilt: 0, isOnboarded: false
    };
  });"""

content = content.replace(target, replacement)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
