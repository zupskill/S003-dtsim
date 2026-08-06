import re

with open('src/contexts/RuntimeContext.tsx', 'r') as f:
    content = f.read()

target = """    for (const key in localStorage) {
      if (key.startsWith("zupskill_sim_")) {
        localStorage.removeItem(key);
      }
    }"""

replacement = """    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("zupskill_sim_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));"""

content = content.replace(target, replacement)

with open('src/contexts/RuntimeContext.tsx', 'w') as f:
    f.write(content)
