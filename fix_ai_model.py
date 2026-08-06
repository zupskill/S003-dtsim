import re

with open('server.ts', 'r') as f:
    content = f.read()

target = """async function generateContentWithRetry(prompt: string, config: any, retries = 2): Promise<string> {
  const ai = getAiClient();
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash","""

replacement = """async function generateContentWithRetry(prompt: string, config: any, retries = 2): Promise<string> {
  const ai = getAiClient();
  console.log("[AI] Initializing Gemini model: gemini-2.5-flash-lite");
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite","""

content = content.replace(target, replacement)

with open('server.ts', 'w') as f:
    f.write(content)
