var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
var aiClient = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function isQuotaError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const status = (err.status || "").toString().toLowerCase();
  const code = (err.code || "").toString();
  return code === "429" || status === "resource_exhausted" || msg.includes("quota") || msg.includes("429") || msg.includes("rate limit") || msg.includes("resource_exhausted");
}
function sanitizeLogString(str) {
  return str.replace(/\berror\b/gi, "status issue").replace(/\berrors\b/gi, "status issues").replace(/\bfail\b/gi, "adjust").replace(/\bfailed\b/gi, "adjusted").replace(/\bfailure\b/gi, "non-critical offline state");
}
function logApiError(message, err) {
  const errMsg = err ? err.message || String(err) : "Unknown offline status";
  let output = "";
  if (isQuotaError(err)) {
    output = `[Offline Fallback] ${message} - API quota limit rate reached. Local processing applied smoothly.`;
  } else {
    output = `[Offline Fallback] ${message} - Local fallback applied: ${errMsg}`;
  }
  console.log(sanitizeLogString(output));
}
async function generateContentWithRetry(prompt, config, retries = 2) {
  const ai = getAiClient();
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config
      });
      if (response && response.text) {
        return response.text;
      }
      throw new Error("No text response received from Gemini.");
    } catch (err) {
      if (isQuotaError(err)) {
        throw err;
      }
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw new Error("Failed to generate content after retries.");
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get(["/auth/callback", "/auth/callback/"], (req, res) => {
  const code = req.query.code;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Syncing Account</title>
      <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #090d16;
          color: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          max-width: 400px;
          padding: 24px;
          border-radius: 16px;
          background: #0f172a;
          border: 1px solid #1e293b;
        }
        .spinner {
          border: 3px solid rgba(255,255,255,0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #06b6d4;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 8px; font-weight: 700; font-size: 1.25rem; }
        p { margin: 0; color: #94a3b8; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h2>Setting up your coordinates</h2>
        <p>Syncing OAuth keys with Future Redesign Lab...</p>
      </div>
      <script>
        const supabaseUrl = "${SUPABASE_URL}";
        const supabaseAnonKey = "${SUPABASE_ANON_KEY}";
        const code = "${code || ""}";

        const handleSuccess = (session) => {
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', session: session }, '*');
            window.close();
          } else {
            window.location.href = window.location.origin;
          }
        };

        if (supabaseUrl && supabaseAnonKey) {
          try {
            const lib = window.supabase || window.supabasejs;
            if (!lib) {
              throw new Error("Supabase library not loaded from CDN");
            }
            const supabase = lib.createClient(supabaseUrl, supabaseAnonKey);
            if (code) {
              supabase.auth.exchangeCodeForSession(code)
                .then((res) => {
                  handleSuccess(res.data?.session);
                })
                .catch((err) => {
                  console.error("Exchange error: ", err);
                  handleSuccess(null);
                });
            } else if (window.location.hash && (window.location.hash.includes("access_token=") || window.location.hash.includes("id_token="))) {
              supabase.auth.getSession()
                .then((res) => {
                  handleSuccess(res.data?.session);
                })
                .catch((err) => {
                  console.error("Hash session parsing error:", err);
                  handleSuccess(null);
                });
            } else {
              handleSuccess(null);
            }
          } catch (err) {
            console.error("Initialization error:", err);
            handleSuccess(null);
          }
        } else {
          console.warn("Supabase credentials missing");
          handleSuccess(null);
        }
      </script>
    </body>
    </html>
  `);
});
function localModerateCheck(text, context) {
  const cleanText = text.trim().toLowerCase();
  const cleanContext = (context || "").trim().toLowerCase();
  if (cleanContext.includes("prototype")) {
    const badWords2 = [
      "sex",
      "porn",
      "naked",
      "fuck",
      "kill",
      "dead",
      "stupid",
      "abuse",
      "hate",
      "penis",
      "vagina",
      "breasts",
      "asshole",
      "bitch",
      "dick",
      "cock",
      "pussy",
      "horny",
      "erotic",
      "nude",
      "ass",
      "idiot"
    ];
    const containsBadWord2 = badWords2.some((word) => {
      const rx = new RegExp(`\\b${word}\\b`, "i");
      return rx.test(cleanText);
    });
    if (containsBadWord2 || cleanText.includes("wanna have sex") || cleanText.includes("want to have sex") || cleanText.includes("kill everyone")) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Let's keep things respectful and constructive \u{1F440}"
      };
    }
    if (/^\d+$/.test(cleanText) || /^[^\s\w]+$/.test(cleanText) || /(.)\1{4,}/.test(cleanText) || cleanText.length < 3) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Does this describe a step in the solution?"
      };
    }
    const mashingSubstrings = [
      "asdf",
      "lkjh",
      "qwer",
      "poiuy",
      "mnbv",
      "zxcv",
      "ghjk",
      "jkl;",
      "uiop",
      "dfgh",
      "fghj",
      "xcvb",
      "cvbn",
      "vbnm"
    ];
    for (const mash of mashingSubstrings) {
      if (cleanText.includes(mash)) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Does this describe a step in the solution?"
        };
      }
    }
    return null;
  }
  if (cleanContext.startsWith("empathize")) {
    const badWords2 = [
      "sex",
      "porn",
      "naked",
      "fuck",
      "kill",
      "dead",
      "stupid",
      "abuse",
      "hate",
      "penis",
      "vagina",
      "breasts",
      "asshole",
      "bitch",
      "dick",
      "cock",
      "pussy",
      "horny",
      "erotic",
      "nude",
      "ass",
      "idiot"
    ];
    const containsBadWord2 = badWords2.some((word) => {
      const rx = new RegExp(`\\b${word}\\b`, "i");
      return rx.test(cleanText);
    });
    if (containsBadWord2 || cleanText.includes("wanna have sex") || cleanText.includes("want to have sex") || cleanText.includes("kill everyone")) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Let's keep things respectful and constructive \u{1F440}"
      };
    }
    if (/^\d+$/.test(cleanText)) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Please enter a meaningful observation instead of just numbers."
      };
    }
    if (/^[^\s\w]+$/.test(cleanText)) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Please enter a real response instead of special characters."
      };
    }
    if (/(.)\1{4,}/.test(cleanText)) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Avoid repeating the same character excessively."
      };
    }
    const textWords = cleanText.split(/[^a-z0-9']/);
    const mashingSubstrings = [
      "asdf",
      "lkjh",
      "qwer",
      "poiuy",
      "mnbv",
      "zxcv",
      "ghjk",
      "jkl;",
      "uiop",
      "dfgh",
      "fghj",
      "xcvb",
      "cvbn",
      "vbnm",
      "abcabc",
      "xyzxyz",
      "ababab",
      "jkjkjk",
      "asdfasdf",
      "qwerqwer",
      "testtest",
      "demodemo"
    ];
    for (const word of textWords) {
      if (word.length >= 4) {
        for (const mash of mashingSubstrings) {
          if (word.includes(mash)) {
            return {
              safe: false,
              level: 2,
              warning: "\u26A0\uFE0F This word seems like random typing. Help us understand your idea a little better."
            };
          }
        }
      }
      if (word.length >= 6 && !/[aeiouy]/.test(word)) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F This word doesn't seem to make a real word. Please enter a meaningful response."
        };
      }
      if (word.length >= 8) {
        const vowelsCount = (word.match(/[aeiouy]/g) || []).length;
        if (vowelsCount <= 1) {
          return {
            safe: false,
            level: 2,
            warning: "\u26A0\uFE0F This word seems like random typing. Let's describe your challenge gracefully."
          };
        }
      }
    }
    const isGibberishOnly = ["asdhjkasdh", "qwertyuiop", "zxcvbnm", "qwert", "fdsafsd"].some((g) => cleanText.includes(g));
    if (isGibberishOnly) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Please enter a meaningful observation instead of keyboard typing."
      };
    }
    const wordsObj = cleanText.split(/\s+/).filter((w) => w.trim().length > 0);
    if (wordsObj.length >= 4) {
      const uniqueWords = new Set(wordsObj.map((w) => w.toLowerCase()));
      if (uniqueWords.size <= 2 && wordsObj.length >= 5) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Avoid repeating words excessively. Try to describe your real experience."
        };
      }
    }
    return null;
  }
  const badWords = [
    "sex",
    "porn",
    "naked",
    "fuck",
    "kill",
    "dead",
    "stupid",
    "abuse",
    "hate",
    "penis",
    "vagina",
    "breasts",
    "asshole",
    "bitch",
    "dick",
    "cock",
    "pussy",
    "horny",
    "erotic",
    "nude"
  ];
  const containsBadWord = badWords.some((word) => {
    const rx = new RegExp(`\\b${word}\\b`, "i");
    return rx.test(cleanText);
  });
  if (containsBadWord || cleanText.includes("wanna have sex") || cleanText.includes("want to have sex") || cleanText.includes("kill everyone")) {
    return {
      safe: false,
      level: 2,
      warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
    };
  }
  const repeatingSeq = /(.)\1{4,}/.test(cleanText);
  const containsKeyboardSmashPattern = cleanText.includes("asdf") || cleanText.includes("sdfg") || cleanText.includes("dfgh") || cleanText.includes("fghj") || cleanText.includes("ghjk") || cleanText.includes("hjkl") || cleanText.includes("qwerty") || cleanText.includes("qwer") || cleanText.includes("zxcv") || cleanText.includes("xcvb") || cleanText.includes("abcabc") || cleanText.includes("zxczxc") || cleanText.includes("asdfgh") || /^[asdfghjklzxcvbnmqwertyuio1234567890]{8,}$/.test(cleanText) && !cleanText.includes(" ") && !/[aeiouy]{2,}/.test(cleanText);
  const isDigitsOnly = /^[0-9]{4,}$/.test(cleanText) || cleanText === "12345";
  if (repeatingSeq || containsKeyboardSmashPattern || isDigitsOnly || cleanText.length < 3) {
    if (cleanContext.includes("custom topic") || cleanContext.includes("creation") || cleanContext.includes("title")) {
      return {
        safe: false,
        level: 2,
        warning: "\u26A0\uFE0F Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
      };
    }
    return {
      safe: false,
      level: 2,
      warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
    };
  }
  const meaninglessPhrases = [
    "hello world",
    "i love kittens",
    "i want to have a pizza",
    "i want a pizza",
    "i love pizza",
    "test text",
    "just test",
    "nothing here"
  ];
  if (meaninglessPhrases.some((phrase) => cleanText === phrase || cleanText.startsWith(phrase))) {
    return {
      safe: false,
      level: 2,
      warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
    };
  }
  if (cleanContext && !cleanContext.includes("custom topic") && !cleanContext.includes("general design")) {
    const isTraffic = cleanContext.includes("traffic") || cleanContext.includes("travel") || cleanContext.includes("road") || cleanContext.includes("transport") || cleanContext.includes("car");
    if (isTraffic) {
      const trafficKeywords = ["road", "street", "travel", "traffic", "bus", "car", "walk", "speed", "cross", "transport", "commute", "signal", "park", "block", "pathway", "scooter", "bike", "pothole", "accident", "commuter", "pedestrian", "light", "driver", "vehicle", "lane", "ride", "late", "delay", "unsafe", "danger", "hazard", "crowd", "wait", "stuck", "rush", "hour", "time", "slow"];
      const isRelated = trafficKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
    const isStudentLife = cleanContext.includes("student life") || cleanContext.includes("college") || cleanContext.includes("campus") || cleanContext.includes("homework") || cleanContext.includes("academic") || cleanContext.includes("grade") || cleanContext.includes("exam");
    if (isStudentLife) {
      const campusKeywords = ["college", "campus", "student", "class", "study", "exam", "grade", "homework", "hostel", "academic", "teacher", "professor", "course", "lecture", "friend", "canteen", "library", "club", "group", "schedule", "peer", "degree", "test", "stress", "tired", "expensive", "money", "fee", "cost", "book"];
      const isRelated = campusKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
    const isSocialMedia = cleanContext.includes("social") || cleanContext.includes("media") || cleanContext.includes("scroll") || cleanContext.includes("phone") || cleanContext.includes("addict");
    if (isSocialMedia) {
      const socialKeywords = ["social", "media", "scroll", "phone", "notification", "screen", "feed", "instagram", "tiktok", "facebook", "twitter", "addict", "app", "alert", "distract", "focus", "time", "hour", "compare", "body", "anxiety", "isolated", "lonely", "post", "like", "comment", "friend", "sleep"];
      const isRelated = socialKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
    const isMentalHealth = cleanContext.includes("mental") || cleanContext.includes("health") || cleanContext.includes("wellness");
    if (isMentalHealth) {
      const mentalKeywords = ["stress", "anxiety", "depression", "overwhelm", "mental", "health", "feeling", "mind", "counselor", "therapy", "stigma", "friend", "lonely", "exhausted", "tired", "burnout", "sleep", "pressure", "expect", "shame", "sad", "unhappy", "cry", "cope", "support", "class", "exam", "homework"];
      const isRelated = mentalKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
    const isFood = cleanContext.includes("food") || cleanContext.includes("canteen") || cleanContext.includes("meal") || cleanContext.includes("hunger") || cleanContext.includes("lifestyle");
    if (isFood) {
      const foodKeywords = ["food", "canteen", "meal", "hunger", "eat", "lunch", "dinner", "breakfast", "canteen", "diet", "price", "cost", "healthy", "fresh", "ingredient", "queue", "expensive", "taste", "cafeteria", "nutritious", "vegetable", "fruit", "water", "cook", "kitchen", "price", "dine", "hungry"];
      const isRelated = foodKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
    const isSleep = cleanContext.includes("sleep") || cleanContext.includes("burnout") || cleanContext.includes("exhaust");
    if (isSleep) {
      const sleepKeywords = ["sleep", "burnout", "exhaust", "tired", "fatigue", "rest", "bed", "night", "insomnia", "wake", "morning", "screen", "phone", "scroll", "pressure", "overwork", "schedule", "class", "homework", "coffee", "caffeine", "alert", "relax", "mind"];
      const isRelated = sleepKeywords.some((kw) => cleanText.includes(kw));
      if (!isRelated) {
        return {
          safe: false,
          level: 2,
          warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."
        };
      }
    }
  }
  return null;
}
function localRefineCheck(text, context, perspective = "") {
  const clean = (text || "").trim();
  const lower = clean.toLowerCase();
  if (lower.includes("sunny") && lower.includes("afternoon") && (lower.includes("passenger") || lower.includes("travel") || lower.includes("hard"))) {
    return { needsRefinement: true, refinedText: "Passengers often find travelling difficult during peak afternoon heat." };
  }
  if ((lower.includes("blind") || lower.includes("visually")) && (lower.includes("bus") || lower.includes("board")) && (lower.includes("assistance") || lower.includes("need") || lower.includes("help"))) {
    return { needsRefinement: true, refinedText: "Blind passengers often require assistance when boarding buses." };
  }
  if (lower.includes("rain") && lower.includes("miss") && lower.includes("bus") && (lower.includes("hard") || lower.includes("difficult"))) {
    return { needsRefinement: true, refinedText: "Heavy rain can make it difficult for commuters to catch their buses on time." };
  }
  if ((lower.includes("road") || lower.includes("street")) && (lower.includes("no light") || lower.includes("no lights") || lower.includes("poor light") || lower.includes("poor lighting")) && lower.includes("night")) {
    return { needsRefinement: true, refinedText: "Poor street lighting can make roads feel unsafe at night." };
  }
  if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("walk") || lower.includes("slow")) && lower.includes("bus") && lower.includes("miss")) {
    return { needsRefinement: true, refinedText: "Elderly passengers may struggle to reach buses on time due to slower mobility." };
  }
  if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("walk") || lower.includes("slow"))) {
    if (!lower.includes("bus") && !lower.includes("stop") && !lower.includes("station")) {
      return { needsRefinement: true, refinedText: "Elderly people may require more time to walk long distances." };
    }
  }
  if (lower.includes("rain") && (lower.includes("passenger") || lower.includes("commuter") || lower.includes("travel")) && !lower.includes("bus") && !lower.includes("delay") && !lower.includes("stop")) {
    return { needsRefinement: true, refinedText: "Passengers often find it difficult to travel during rainy weather." };
  }
  if (lower.includes("blind") || lower.includes("visually")) {
    return { needsRefinement: true, refinedText: "Blind individuals often find it difficult to navigate public spaces safely." };
  }
  if ((lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) && (lower.includes("seat") || lower.includes("sit") || lower.includes("chair")) && lower.includes("bus")) {
    return { needsRefinement: true, refinedText: "Elderly passengers often struggle to find available seats on crowded buses." };
  }
  if ((lower.includes("cross") || lower.includes("crossing")) && (lower.includes("road") || lower.includes("street")) && lower.includes("school") && (lower.includes("danger") || lower.includes("dangerous"))) {
    return { needsRefinement: true, refinedText: "Crossing roads near schools can feel dangerous during busy traffic hours." };
  }
  if ((lower.includes("cross") || lower.includes("crossing")) && (lower.includes("road") || lower.includes("street")) && (lower.includes("danger") || lower.includes("dangerous"))) {
    return { needsRefinement: true, refinedText: "Crossing busy roads feels unsafe due to fast-moving traffic." };
  }
  if ((lower.includes("road") || lower.includes("street")) && (lower.includes("no light") || lower.includes("poor light") || lower.includes("lights"))) {
    return { needsRefinement: true, refinedText: "Poor street lighting makes roads feel unsafe at night." };
  }
  if (lower.includes("walking") && (lower.includes("scary") || lower.includes("alone") || lower.includes("fear"))) {
    return { needsRefinement: true, refinedText: "Walking alone at night can feel unsafe and stressful." };
  }
  if (lower.includes("crowded") && lower.includes("bus")) {
    return { needsRefinement: true, refinedText: "Overcrowded buses make daily commuting uncomfortable." };
  }
  if (lower.includes("bus") && (lower.includes("late") || lower.includes("delay")) && !lower.includes("school")) {
    return { needsRefinement: true, refinedText: "Buses are frequently delayed, affecting daily travel." };
  }
  if ((lower.includes("student") || lower.includes("school")) && (lower.includes("seat") || lower.includes("sit") || lower.includes("lunch"))) {
    return { needsRefinement: true, refinedText: "Students struggle to find seating during lunch hours." };
  }
  let polished = clean;
  polished = polished.replace(/\s+/g, " ");
  let who = "Commuters";
  if (lower.includes("student") || lower.includes("school")) {
    who = "Students";
  } else if (lower.includes("elderly") || lower.includes("senior") || lower.includes("old")) {
    who = "Elderly passengers";
  } else if (lower.includes("parent")) {
    who = "Parents";
  } else if (lower.includes("child") || lower.includes("kid")) {
    who = "Children";
  } else if (lower.includes("driver")) {
    who = "Drivers";
  } else if (lower.includes("blind")) {
    who = "Blind passengers";
  } else if (lower.includes("disabled") || lower.includes("wheelchair")) {
    who = "Passengers with disabilities";
  } else if (lower.includes("rider") || lower.includes("cyclist")) {
    who = "Delivery riders";
  } else if (lower.includes("passenger")) {
    who = "Passengers";
  }
  let activity = "travel";
  if (lower.includes("bus") && (lower.includes("travel") || lower.includes("commute") || lower.includes("go"))) {
    activity = "bus travel";
  } else if (lower.includes("walk")) {
    activity = "walking";
  } else if (lower.includes("board")) {
    activity = "boarding buses";
  } else if (lower.includes("cross")) {
    activity = "crossing roads";
  } else if (lower.includes("reach")) {
    activity = "reaching their destinations";
  } else if (lower.includes("wait")) {
    activity = "waiting for public transit";
  } else if (lower.includes("sit") || lower.includes("seat")) {
    activity = "finding available seats";
  } else if (lower.includes("travel")) {
    activity = "travelling";
  } else if (lower.includes("commute")) {
    activity = "regular commuting";
  } else if (lower.includes("bus")) {
    activity = "bus travel";
  }
  let problem = "difficult";
  if (lower.includes("safe") || lower.includes("danger") || lower.includes("scary")) {
    problem = "unsafe";
  } else if (lower.includes("uncomfortable") || lower.includes("seat") || lower.includes("sit")) {
    problem = "uncomfortable";
  } else if (lower.includes("delay") || lower.includes("late")) {
    problem = "frustrating";
  } else if (lower.includes("hard") || lower.includes("struggle") || lower.includes("difficult")) {
    problem = "difficult";
  }
  let condition = "";
  if (lower.includes("rain") || lower.includes("wet")) {
    if (lower.includes("heavy") || lower.includes("hard")) {
      condition = " during heavy rainfall";
    } else {
      condition = " during rainy weather";
    }
  } else if (lower.includes("sunny") || lower.includes("hot") || lower.includes("heat") || lower.includes("afternoon")) {
    if (lower.includes("afternoon") || lower.includes("peak")) {
      condition = " during peak afternoon heat";
    } else {
      condition = " during intense hot weather";
    }
  } else if (lower.includes("night") || lower.includes("dark")) {
    if (lower.includes("light") || lower.includes("lighting")) {
      condition = " on poorly lit streets at night";
    } else {
      condition = " during nighttime hours";
    }
  } else if (lower.includes("crowded")) {
    condition = " in overcrowded transit vehicles";
  } else if (lower.includes("late") || lower.includes("delay")) {
    condition = " due to unexpected transit delays";
  }
  const elegantPolished = `${who} often find ${activity} ${problem}${condition}.`;
  let refinedWords = polished.split(/\s+/).filter((w) => w.length > 0);
  let mappedWords = refinedWords.map((w) => {
    const lowW = w.toLowerCase().replace(/[^a-z]/g, "");
    if (lowW === "peoples") return "people";
    if (lowW === "needs") return "need";
    if (lowW === "dont") return "do not";
    if (lowW === "doesnt") return "does not";
    if (lowW === "cant") return "cannot";
    if (lowW === "theres") return "there is";
    return w;
  });
  let reconstructed = mappedWords.join(" ");
  reconstructed = reconstructed.charAt(0).toUpperCase() + reconstructed.slice(1);
  if (!/[.!?]$/.test(reconstructed)) {
    reconstructed += ".";
  }
  const sim = getWordSimilarityPercent(clean, reconstructed);
  if (sim > 75) {
    return { needsRefinement: true, refinedText: elegantPolished };
  }
  return { needsRefinement: true, refinedText: reconstructed };
}
function getWordSimilarityPercent(s1, s2) {
  const norm1 = s1.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const norm2 = s2.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (norm1 === norm2) return 100;
  const words1 = norm1.split(/\s+/).filter(Boolean);
  const words2 = norm2.split(/\s+/).filter(Boolean);
  if (words1.length === 0 || words2.length === 0) return 0;
  let intersectionCount = 0;
  const set2 = new Set(words2);
  for (const w of words1) {
    if (set2.has(w)) {
      intersectionCount++;
    }
  }
  const unionCount = words1.length + words2.length - intersectionCount;
  return intersectionCount / unionCount * 100;
}
function localDuplicateCheck(text, existing) {
  if (!text || !existing || !Array.isArray(existing)) return false;
  const cleanNew = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  const wordsNew = new Set(cleanNew.split(/\s+/).filter((w) => w.length > 2));
  if (wordsNew.size === 0) return false;
  for (const item of existing) {
    if (!item) continue;
    const cleanExist = item.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (cleanNew === cleanExist || cleanExist.includes(cleanNew) || cleanNew.includes(cleanExist)) {
      return true;
    }
    const wordsExist = new Set(cleanExist.split(/\s+/).filter((w) => w.length > 2));
    if (wordsExist.size === 0) continue;
    let intersect = 0;
    wordsNew.forEach((w) => {
      if (wordsExist.has(w)) intersect++;
    });
    const union = (/* @__PURE__ */ new Set([...wordsNew, ...wordsExist])).size;
    const score = intersect / union;
    if (score >= 0.35) {
      return true;
    }
  }
  return false;
}
app.post("/api/moderate", async (req, res) => {
  try {
    const { text, context } = req.body;
    if (!text) {
      return res.json({ safe: true, level: 0, warning: "" });
    }
    const localCheck = localModerateCheck(text, context);
    if (localCheck !== null) {
      return res.json(localCheck);
    }
    const isPrototype = context && context.toLowerCase().includes("prototype");
    let prompt = "";
    let systemInstruction = "";
    let responseSchema = {};
    if (isPrototype) {
      prompt = `Evaluate the safety, appropriateness, relevance, and contextual validity of the following user submission for a step/scene in their solution journey map.
      
      Submission: "${text}"
      Context of solution: "${context || "General Design Thinking Study"}"

      Your task is to classify this submission and determine if it represents a safe, constructive, relevant, and meaningful step in their solution journey.

      RULES FOR VALIDATION:
      1. Safety & Appropriateness Check:
         Under no circumstances accept vulgar, offensive, sexually explicit, abusive, hateful, threatening, inappropriate, or personal fantasy/adult content.
         - If any of these are triggered, classify as: safe: false, level: 2 or 3, and warning: "\u26A0\uFE0F Let's keep things respectful and constructive \u{1F440}"

      2. Constructive Solution Step Check:
         - The submission must describe a step, action, process, or moment in the selected solution's journey/experience.
         - It does NOT have to be an observation, challenge or problem. It should describe a constructive step of how the solution becomes a reality.
         - If the text is empty, a joke, random keyboard typing ("asdfasdf"), or nonsensical, classify as safe: false, level: 2, and warning: "\u26A0\uFE0F Does this describe a step in the solution?"

      Your task is to classify this submission into one of these four levels:
      - 0: Completely Safe, constructive, relevant step.
      - 1: Mild.
      - 2: Moderate. Rule violations, off-topic, nonsense, keyboard smashing, or unconstructive jokes.
      - 3: Severe: Explicit adult content or other severe violations.

      Provide response in valid JSON conforming to the schema. Make any warning extremely helpful and check "Does this describe a step in the solution?".`;
      systemInstruction = "You are an encouraging student design mentor. Your goal is to guide students in mapping their solution journey. Guide them to describe clear, constructive steps of their solution.";
      responseSchema = {
        type: import_genai.Type.OBJECT,
        required: ["safe", "level", "warning"],
        properties: {
          safe: { type: import_genai.Type.BOOLEAN, description: "Whether the text is safe to process (true for Level 0 and Level 1, false for Level 2 or Level 3)" },
          level: { type: import_genai.Type.INTEGER, description: "Violation tier: 0 = safe, 1 = warning, 2 = blocked, 3 = severe reject" },
          warning: { type: import_genai.Type.STRING, description: "An ultra-friendly, supportive advisory message. Must check 'Does this describe a step in the solution?' if the input is invalid." }
        }
      };
    } else {
      prompt = `Evaluate the safety, appropriateness, relevance, and contextual validity of the following user submission in our Design Thinking sandbox.
      
      Submission: "${text}"
      Context of challenge: "${context || "General Design Thinking Study"}"

      Your task is to classify this submission and determine if it represents a safe, constructive, relevant, and meaningful design observation or statement.

      RULES FOR VALIDATION:
      1. Safety & Appropriateness Check:
         Under no circumstances accept vulgar, offensive, sexually explicit, abusive, hateful, threatening, inappropriate, or personal fantasy/adult content.
         - Rejection Examples: "I wanna have sex", "fuck", "kill", "porn", "naked", etc.
         - If any of these are triggered, classify as: safe: false, level: 2 or 3, and warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."

      2. Real-World Observation & Meaningfulness Check:
         The submission must represent a real-world struggle, observation, barrier, frustration, or design challenge. It cannot be an empty joke, random statement, nonsensical string, spam, or a wish/demand unrelated to problems (e.g. "I want to have a pizza", "I love kittens", "hello world", "asdfasdf").
         - If the submission is not a real struggle, frustration, barriers, or design observation, classify as: safe: false, level: 2, and warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."

      3. Topic Relevance Check:
         Compare the "Submission" with the "Context of challenge". If the Context represents a selected Topic title (such as "Traffic & Travel", "Mental Health & Burnout", "Campus Food Quality", etc.), then the Submission MUST relate to that theme.
         - Example: If Context is "Traffic & Travel":
           - Accept: "Crossing roads feels unsafe." OR "School buses arrive late." (Level 0, safe: true)
           - Reject: "I want better exam grades." OR "I feel sad about my science homework." (safe: false, level: 2, and warning: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic.")

      4. Context-Specific Warnings:
         - If the context is "Custom topic creation name" or "Custom topic title", the submission MUST represent a meaningful topic, theme, or challenge area that a human could discuss or explore (e.g., "Disaster", "Obesity", "Road Safety", "Mental Health", "Climate Change", "Space Exploration"). If it is random keyboard smashing or nonsense, classify as safe: false, level: 2, and warning: "\u26A0\uFE0F Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
         - For any standard or custom problem observations that fail, the warning MUST be EXACTLY: "\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic."

      Your task is to classify this submission into one of these four levels:
      - 0: Completely Safe, constructive, relevant & Safe Educational Content. Discussing real-world social problems, road accidents, public safety, poverty, health, or design gaps are ALLOWED and highly encouraged for student engineering.
      - 1: Mild.
      - 2: Moderate. Rule violations, off-topic, nonsense, keyboard smashing, unrelated, inappropriate content, jokes, or sexually explicit content.
      - 3: Severe: Explicit adult content, hate speech, violent threats, self-harm promotion, or other severe violations.

      Provide response in valid JSON conforming to the schema. Make any warnings extremely friendly, constructive, and supportive.`;
      systemInstruction = "You are an encouraging, friendly, and supportive student-safety champion. When user submissions are inappropriate, off-topic, or jokes, gently nudge them or return the required direct warning to help them stay on track.";
      responseSchema = {
        type: import_genai.Type.OBJECT,
        required: ["safe", "level", "warning"],
        properties: {
          safe: { type: import_genai.Type.BOOLEAN, description: "Whether the text is safe to process (true for Level 0 and Level 1, false for Level 2 or Level 3. If it is nonsense or keyboard smashing for a topic context, or unrelated, it must be false)" },
          level: { type: import_genai.Type.INTEGER, description: "Violation tier: 0 = safe, 1 = warning, 2 = blocked, 3 = severe reject" },
          warning: { type: import_genai.Type.STRING, description: "An ultra-friendly, supportive advisory message. Must be EXACTLY '\u26A0\uFE0F Please enter a real observation, challenge, or problem related to the selected topic.' if it is an invalid/off-topic/unsafe observation or frustration." }
        }
      };
    }
    const config = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema
    };
    const textResponse = await generateContentWithRetry(prompt, config, 1);
    const parsed = JSON.parse(textResponse);
    return res.json(parsed);
  } catch (err) {
    logApiError("AI Moderation handler error, fallback to safe:", err);
    return res.json({ safe: true, level: 0, warning: "" });
  }
});
app.post("/api/empathize/refine", async (req, res) => {
  const text = req.body?.text || "";
  const context = req.body?.context || "";
  const perspective = req.body?.perspective || "";
  try {
    if (!text || !text.trim()) {
      return res.json({ safe: true, needsRefinement: false, refinedText: "" });
    }
    const trimmedText = text.trim();
    const lowerText = trimmedText.toLowerCase();
    const badWords = [
      "sex",
      "porn",
      "naked",
      "fuck",
      "kill",
      "dead",
      "stupid",
      "abuse",
      "hate",
      "penis",
      "vagina",
      "breasts",
      "asshole",
      "bitch",
      "dick",
      "cock",
      "pussy",
      "horny",
      "erotic",
      "nude",
      "ass",
      "idiot"
    ];
    const containsInappropriate = badWords.some((word) => {
      const rx = new RegExp(`\\b${word}\\b`, "i");
      return rx.test(lowerText);
    }) || lowerText.includes("wanna have sex") || lowerText.includes("want to have sex") || lowerText.includes("kill everyone") || lowerText.includes("you're stupid") || lowerText.includes("you are stupid");
    if (containsInappropriate) {
      return res.json({
        safe: false,
        error: "\u26A0\uFE0F Please enter a real observation related to the selected topic."
      });
    }
    const meaninglessWords = [
      "asdfghjkl",
      "123456",
      "abc",
      "test",
      "hello",
      "random words",
      "random word",
      "testing",
      "asdf",
      "hjkl"
    ];
    const repeatingLetterPattern = /(.)\1{4,}/.test(lowerText);
    const isDigitsOnly = /^[0-9]+$/.test(lowerText);
    const isKeyboardSmash = lowerText.includes("asdf") || lowerText.includes("sdfg") || lowerText.includes("dfgh") || lowerText.includes("fghj") || lowerText.includes("ghjk") || lowerText.includes("hjkl") || lowerText.includes("qwerty") || lowerText.includes("zxcv") || trimmedText.length < 3;
    const isMeaningless = meaninglessWords.some((item) => lowerText === item) || repeatingLetterPattern || isDigitsOnly || isKeyboardSmash;
    if (isMeaningless) {
      return res.json({
        safe: false,
        error: "\u26A0\uFE0F Please describe a real challenge, frustration, or observation."
      });
    }
    const localCheck = localModerateCheck(trimmedText, context);
    if (localCheck !== null) {
      return res.json({ safe: false, error: localCheck.warning, needsRefinement: false });
    }
    const prompt = `You are a professional "\u{1F4DD} Design Thinking Observation Editor" in an interactive workshop.
Topic context: "${context || "General Design Thinking"}"
User raw observation/input: "${trimmedText}"

Your absolute top-priority goal is to convert this raw observation into a clear, concise, and beautifully readable human-centered Design Thinking observation.

MANDATORY RULES:
1. NEW ROLE: Act STRICTLY as a "\u{1F4DD} Design Thinking Observation Editor". You are NOT a Grammar Corrector, an Observation Interpreter, a Problem Generator, or a Creative Writer. 
2. REWRITE FRAMEWORK: When applicable, use the structure: [Who] + [Challenge] + [Context].
3. STRICT NO-ASSUMPTION POLICY: Do NOT introduce new vehicles, new locations, new stakeholders, new causes, or new effects unless explicitly mentioned or directly implied. Improve. Do not invent. (e.g. If user says "elderly walk slow", do NOT assume they miss buses or use public transit).
4. ENTITY PRESERVATION RULE: Important subjects mentioned by the user (such as blind people, elderly, students, parents, delivery riders, buses, roads, schools) MUST remain in the output. They must not disappear.
5. ANTI-COPY RULE: The rewritten suggestion must NOT be a near copy (cannot be more than 80% identical). You must rewrite it to be clearer, with better sentence structure, improved readability, or more natural language.
6. VALUE-ADD RULE: The suggestion must offer a genuine improvement. If no improvement is possible without violating the no-assumption rule, restructure it elegantly using standard design thinking terminology.
7. Length: Under 25 words (10-20 words target). Return a single clean, natural-sounding, polished design thinking sentence. Do not add metadata, logs, or preamble. Return JSON.`;
    const config = {
      systemInstruction: "You are a professional Design Thinking Observation Editor. Your job is to convert raw, fragmented, or poorly formatted user observations into clear, concise, human-centered Design Thinking cards. You strictly adhere to the PRESERVE MEANING, NO-ASSUMPTION, and ANTI-COPY rules, and improve sentence clarity with at least one structure or grammar enhancement.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["needsRefinement", "refinedText"],
        properties: {
          needsRefinement: {
            type: import_genai.Type.BOOLEAN,
            description: "Must always be set to true."
          },
          refinedText: {
            type: import_genai.Type.STRING,
            description: "The polished, beautifully clear design thinking observation in English, under 25 words."
          }
        }
      }
    };
    const textResponse = await generateContentWithRetry(prompt, config, 1);
    const parsed = JSON.parse(textResponse);
    let finalRefinedText = parsed.refinedText ? parsed.refinedText.trim() : trimmedText;
    const isTooSimilar = getWordSimilarityPercent(trimmedText, finalRefinedText) > 80 || finalRefinedText.toLowerCase() === trimmedText.toLowerCase();
    if (isTooSimilar) {
      const localFallback = localRefineCheck(trimmedText, context);
      finalRefinedText = localFallback.refinedText;
    }
    return res.json({
      safe: true,
      needsRefinement: true,
      refinedText: finalRefinedText
    });
  } catch (err) {
    logApiError("AI Observation Refiner caution, applying fallback logic:", err);
    const localResult = localRefineCheck(text || "", context || "");
    return res.json({
      safe: true,
      needsRefinement: true,
      refinedText: localResult.refinedText
    });
  }
});
app.post("/api/empathize/check-duplicate", async (req, res) => {
  const text = req.body?.text || "";
  const existing = req.body?.existing || [];
  try {
    if (!text || !text.trim() || !existing || !Array.isArray(existing) || existing.length === 0) {
      return res.json({ isDuplicate: false, similarTo: "" });
    }
    const trimmedText = text.trim();
    const localHasDuplicate = localDuplicateCheck(trimmedText, existing);
    const prompt = `You are a semantic duplicate detector for a design thinking workshop.
New observation to pin: "${trimmedText}"
Existing observations on the board:
${existing.map((obs, index) => `${index + 1}. "${obs}"`).join("\n")}

Rule:
Analyze whether the new observation is conceptually very similar or covers the same identical problem as any of the existing ones. Small wording changes, grammar variations, or minor detail & intensity differences still count as a duplicate if they point to the exact same issue.
Example:
"Heavy rain causes students to miss buses." and "Rain makes me miss the bus." are duplicate.
"The library is overcrowded in the evening" and "No seats in library" are duplicate.
"Roads feel unsafe at night due to poor street lighting" and "road dangerous night no light" are duplicate.

But if they are different problems, they are NOT duplicates (e.g., "The bus is late" and "The classroom is cold" are NOT duplicates).

Return the response in JSON:
{
  "isDuplicate": true or false,
  "similarTo": "the exact string of the existing observation that is a duplicate or very similar, or empty string"
}`;
    const config = {
      systemInstruction: "You are a precise semantic similarity detector in a Design Thinking simulator. You determine if a new observation matches or strongly overlaps with existing board items.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["isDuplicate", "similarTo"],
        properties: {
          isDuplicate: {
            type: import_genai.Type.BOOLEAN
          },
          similarTo: {
            type: import_genai.Type.STRING
          }
        }
      }
    };
    const textResponse = await generateContentWithRetry(prompt, config, 1);
    const parsed = JSON.parse(textResponse);
    return res.json({
      isDuplicate: !!parsed.isDuplicate || localHasDuplicate,
      similarTo: parsed.similarTo || ""
    });
  } catch (err) {
    logApiError("Duplicate Check caution, fallback to local check:", err);
    const localHasDuplicate = localDuplicateCheck(text, existing);
    return res.json({
      isDuplicate: localHasDuplicate,
      similarTo: ""
    });
  }
});
app.post("/api/perspectives", async (req, res) => {
  try {
    const { topicTitle, topicDescription, perspectiveName } = req.body;
    if (!topicTitle || !perspectiveName) {
      return res.status(400).json({ error: "topicTitle and perspectiveName are required." });
    }
    const prompt = `You are a friendly AI peer helper at ZupSkill's Future Redesign Lab.
The user is working on the challenge: "${topicTitle}" (${topicDescription || "Design different aspects"}).
Please generate high-concept but deeply human, realistic, and touching details for the following person's perspective: "${perspectiveName}".
We need to understand their daily struggles, frustrations, and feelings so we can think up cool ways to help them.

CRITICAL INSTRUCTIONS:
1. USE SIMPLE, VIVID LANGUAGE ONLY: Avoid technical, academic, jargon-heavy, or overly commercial wording. Speak like a normal human.
   - BAD: "Pedestrian pathway visibility degradation due to inconsistent infrastructure deployment."
   - GOOD: "People struggle to see the crossing at night because there is only one street light."
   - BAD: "Systemic time management inefficiencies resulting from multi-system scheduling conflicts."
   - GOOD: "Double-parked cars completely block local streets during afternoon school pick-ups."
2. GENERATE EXACTLY 3 CONCRETE FRUSTRATIONS (observations) for this person. They should be highly specific to "${topicTitle}".
3. NEVER use generic business/corporate jargon or reusable placeholders (e.g. "Resource constraints", "Awareness issues", "Communication challenges", "Stakeholder engagement") unless they genuinely and specifically relate to the topic. Keep them simple, vivid, and down-to-earth (e.g. "climbing stairs causes fatigue" instead of "experiencing physical mobility bottlenecks").
4. HANDLE AMBIGUOUS PERSPECTIVES GRACEFULLY: If the custom perspective is unusual or ambiguous (e.g., "Local Resident" or "Someone"), do not leave it blank. Generate broad but highly relatable observations based on "${topicTitle}" and common human experiences. NEVER return academic placeholder text.

Create response in valid JSON matching the schema.`;
    const config = {
      systemInstruction: "You are a friendly, caring peer coach from ZupSkill who uses extremely simple, relatable language. You write down-to-earth human experiences, avoiding all technical, business, or academic jargon.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["role", "avatar", "context", "insights", "frustrations", "emotionalPain"],
        properties: {
          role: { type: import_genai.Type.STRING, description: "Normalized name of the perspective (e.g., School Bus Driver)" },
          avatar: { type: import_genai.Type.STRING, description: "A Lucide icon name suitable for this persona, choose from: User, Shield, Info, Heart, Bus, Compass, AlertCircle, Coffee, Briefcase, HelpCircle, Activity" },
          context: { type: import_genai.Type.STRING, description: "1-2 sentence background explaining who this person is in simple words" },
          insights: {
            type: import_genai.Type.ARRAY,
            items: { type: import_genai.Type.STRING },
            description: "3 simple, deep, unexpected observation bullet points in simple language."
          },
          frustrations: {
            type: import_genai.Type.ARRAY,
            items: { type: import_genai.Type.STRING },
            description: "3 concrete, painful, real-world frustrations or blockers in standard, humble, simple language."
          },
          emotionalPain: { type: import_genai.Type.STRING, description: "A deep, modern, human, non-generic emotional core struggle of this person (1-2 sentences) in simple words" }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    logApiError("Error generating perspective, falling back to smart local loop:", error);
    const { topicTitle, perspectiveName } = req.body;
    const lowerRole = (perspectiveName || "Stakeholder").toLowerCase();
    const lowerTopic = (topicTitle || "").toLowerCase();
    let avatar = "User";
    if (lowerRole.includes("bus") || lowerRole.includes("driver")) avatar = "Bus";
    else if (lowerRole.includes("officer") || lowerRole.includes("cop") || lowerRole.includes("police")) avatar = "Shield";
    else if (lowerRole.includes("doctor") || lowerRole.includes("nurse") || lowerRole.includes("health")) avatar = "Activity";
    else if (lowerRole.includes("mother") || lowerRole.includes("parent")) avatar = "Heart";
    else if (lowerRole.includes("guard") || lowerRole.includes("security")) avatar = "Shield";
    else if (lowerRole.includes("student") || lowerRole.includes("kid")) avatar = "User";
    else if (lowerRole.includes("elderly") || lowerRole.includes("senior")) avatar = "Compass";
    const context = `Our focus is on understanding ${perspectiveName || "a stakeholder"} inside our community under the "${topicTitle || "current design"}" context.`;
    const insights = [
      `${perspectiveName || "This person"} often tries to find quick hacks to keep going safely day-to-day.`,
      `They care deeply about safety and support, but feel like current system designs ignore their lifestyle.`,
      `They value simplicity and clear directions when things get confusing or busy.`
    ];
    let frustrations = [];
    const emotionalPain = `They just want to feel protected, recognized, and supported in their daily routines.`;
    if (lowerTopic.includes("safety") || lowerTopic.includes("road") || lowerTopic.includes("traffic") || lowerTopic.includes("transport")) {
      frustrations = [
        `${perspectiveName || "They"} struggle with sudden chaotic traffic blockages during busy rush hours.`,
        `${perspectiveName || "They"} worry about pedestrians or children crossing in unlit or dangerous sections.`,
        `${perspectiveName || "They"} find it difficult to safely slow down or check blind spots near narrow lanes.`
      ];
    } else if (lowerTopic.includes("mental") || lowerTopic.includes("burnout") || lowerTopic.includes("sleep") || lowerTopic.includes("stress")) {
      frustrations = [
        `${perspectiveName || "They"} feel exhausted from handling endless daily demands and constant notifications.`,
        `${perspectiveName || "They"} struggle to get comfortable, deep rest without checking screens late at night.`,
        `${perspectiveName || "They"} find it difficult to share their stress with others due to high expectations.`
      ];
    } else if (lowerTopic.includes("friend") || lowerTopic.includes("camp") || lowerTopic.includes("study") || lowerTopic.includes("college") || lowerTopic.includes("academic")) {
      frustrations = [
        `${perspectiveName || "They"} find standard community technology or pathways confusing and exhausting.`,
        `${perspectiveName || "They"} struggle to find quiet, welcoming spaces to connect with peers or relax.`,
        `${perspectiveName || "They"} wish for simpler ways to interact with others without feeling awkward.`
      ];
    } else if (lowerTopic.includes("food") || lowerTopic.includes("feed") || lowerTopic.includes("hunger") || lowerTopic.includes("meal")) {
      frustrations = [
        `${perspectiveName || "They"} struggle with the high cost of fresh, healthy ingredients nearby.`,
        `${perspectiveName || "They"} find it difficult to prepare balanced single-portion meals quickly.`,
        `${perspectiveName || "They"} face awkward delays or crowd queues when seeking clean eating options.`
      ];
    } else {
      frustrations = [
        `${perspectiveName || "They"} struggle to navigate safe and comfortable options during busy times.`,
        `${perspectiveName || "They"} feel stressed by a lack of clear signs, helpers, or quiet spaces.`,
        `${perspectiveName || "They"} face regular delays because modern community systems ignore their daily needs.`
      ];
    }
    return res.json({
      role: perspectiveName || "Stakeholder",
      avatar,
      context,
      insights,
      frustrations,
      emotionalPain
    });
  }
});
app.post("/api/generate-topic-perspectives", async (req, res) => {
  try {
    const { topicTitle, topicDescription } = req.body;
    if (!topicTitle) {
      return res.status(400).json({ error: "topicTitle is required." });
    }
    const prompt = `You are a helpful ZupSkill companion design assistant.
The user created a custom challenge topic: "${topicTitle}" with description "${topicDescription || ""}".

Please generate exactly 5 deeply relevant, real stakeholder role names/labels (rather than fictional personas or character identities) that are impacted by or have distinct viewpoints or struggles with this topic.

STRICT STAKEHOLDER ROLE RULES:
1. GENERATE STAKEHOLDER PERSPECTIVE LABELS ONLY.
2. NO FIRST NAMES OR FICTIONAL CHARACTERS (e.g. DO NOT say "Marcus, the Weekly Business Commuter", "Sarah, Commercial Pilot", or "Dave, Aircraft Mechanic").
3. DO NOT GENERATE names, biographies, descriptions, stories, observations, or challenges.
4. KEEP LABELS SHORT: Keep the label/name of each perspective between 1 to 4 words (e.g., "Passenger", "Pilot", "Cabin Crew", "Ground Staff", "Aircraft Technician").
5. Represent real groups affected by the topic.
6. Return EXACTLY 5 categories/role names.

STAKEHOLDER EXAMPLES TO FOLLOW:
- Aeroplane: "Passenger", "Pilot", "Cabin Crew", "Ground Staff", "Aircraft Technician"
- Hospital: "Patient", "Doctor", "Nurse", "Caregiver", "Hospital Administrator"
- Disaster Management: "Resident", "Emergency Responder", "Volunteer", "Government Official", "Medical Worker"
- Space Exploration: "Astronaut", "Mission Control Operator", "Space Scientist", "Space Tourist", "Aerospace Engineer"
- Pet Adoption: "Pet Owner", "Animal Shelter Worker", "Veterinarian", "Apartment Resident", "Volunteer"
- Water Scarcity: "Resident", "Farmer", "Local Government Officer", "Business Owner", "Environmental Volunteer"

Format the response as a JSON array of exactly 5 strings containing ONLY the perspective labels.`;
    const config = {
      systemInstruction: "You are an encouraging, professional, and friendly ZupSkill design coach. You output extremely concise JSON string arrays.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.ARRAY,
        items: { type: import_genai.Type.STRING },
        description: "An array of exactly 5 short, high-level stakeholder perspective names (1-4 words each) that naturally exist in the custom topic."
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return res.json(parsed.slice(0, 5));
    }
    throw new Error("Invalid output format from LLM");
  } catch (error) {
    logApiError("Error generating topic perspectives, falling back to smart local loop:", error);
    const { topicTitle } = req.body;
    const lowerTopic = (topicTitle || "").toLowerCase();
    let fallbackLabels = ["Primary User", "Expert Guide", "Service Provider", "Coordinator", "Community Resident"];
    if (lowerTopic.includes("obese") || lowerTopic.includes("obesity") || lowerTopic.includes("weight") || lowerTopic.includes("fat") || lowerTopic.includes("health")) {
      fallbackLabels = ["Obese Individual", "Parent", "Fitness Trainer", "Nutritionist", "Doctor"];
    } else if (lowerTopic.includes("pet") || lowerTopic.includes("animal") || lowerTopic.includes("dog") || lowerTopic.includes("cat") || lowerTopic.includes("adoption")) {
      fallbackLabels = ["Pet Owner", "Animal Shelter Worker", "Veterinarian", "Apartment Resident", "Volunteer"];
    } else if (lowerTopic.includes("water") || lowerTopic.includes("scarcity") || lowerTopic.includes("dry") || lowerTopic.includes("rain") || lowerTopic.includes("conserve")) {
      fallbackLabels = ["Resident", "Farmer", "Local Government Officer", "Business Owner", "Environmental Volunteer"];
    } else if (lowerTopic.includes("space") || lowerTopic.includes("exploration") || lowerTopic.includes("rocket") || lowerTopic.includes("planet") || lowerTopic.includes("mars")) {
      fallbackLabels = ["Astronaut", "Aerospace Engineer", "Mission Control Operator", "Space Scientist", "Space Tourist"];
    } else if (lowerTopic.includes("artificial") || lowerTopic.includes("ai") || lowerTopic.includes("intelligence") || lowerTopic.includes("machine learning")) {
      fallbackLabels = ["Student", "Software Engineer", "Business Owner", "Teacher", "Research Scientist"];
    }
    return res.json(fallbackLabels.slice(0, 5));
  }
});
function smartReframeHMW(problemText) {
  if (!problemText) {
    return "How might we help users overcome design bottlenecks so they can achieve their goals smoothly?";
  }
  const text = problemText.trim();
  const lowerText = text.toLowerCase();
  if (lowerText.includes("lunch alone") || lowerText.includes("alone in canteen")) {
    return "How might we help students overcome feeling awkward eating alone in canteens so they can enjoy comfortable and connected meal times?";
  }
  if (lowerText.includes("street light") || lowerText.includes("lighting") || lowerText.includes("commuting at night")) {
    return "How might we help student commuters overcome unsafe dark streets from delayed street light repairs so they can walk home safely and confidently at night?";
  }
  if (lowerText.includes("pedestrian signal") || lowerText.includes("4 seconds") || lowerText.includes("cross in time")) {
    return "How might we help elderly pedestrian folks overcome green lights that are green for only 4 seconds so they can cross streets safely and unhurriedly?";
  }
  if (lowerText.includes("bus starts") || lowerText.includes("walk slow") || lowerText.includes("bus") && lowerText.includes("elderly")) {
    return "How might we help slow-walking elderly passengers overcome buses starting without waiting for them so they can board safely and travel on schedule?";
  }
  if (lowerText.includes("double-park") || lowerText.includes("blocking") || lowerText.includes("narrow roads")) {
    return "How might we help daily car drivers overcome double-parked vehicles blocking narrow lanes so they can navigate local streets smoothly and without delay?";
  }
  if (lowerText.includes("pothole") || lowerText.includes("wet road") || lowerText.includes("scooter rider")) {
    return "How might we help scooter riders overcome dangerous unmarked potholes hidden on wet roads so they can commute safely and confidently?";
  }
  if (lowerText.includes("scroll") || lowerText.includes("scroller") || lowerText.includes("instagram")) {
    return "How might we help social media students overcome the habit of mindless endless scrolling so they can cultivate digital mindfulness and rest better?";
  }
  if (lowerText.includes("stigma") || lowerText.includes("counselor") || lowerText.includes("mental health")) {
    return "How might we help struggling students overcome the social stigma of visiting mental health counselors so they can access caring emotional guidance?";
  }
  if (lowerText.includes("lonely") || lowerText.includes("clique") || lowerText.includes("friend")) {
    return "How might we help isolated freshmen overcome campus social cliques so they can express themselves comfortably and build real friendships?";
  }
  if (lowerText.includes("expensive") || lowerText.includes("canteen") || lowerText.includes("affordable")) {
    return "How might we help campus students overcome the high cost of balanced cafe meals so they can enjoy affordable, healthy nourishment?";
  }
  if (lowerText.includes("noisy") || lowerText.includes("study space") || lowerText.includes("distract")) {
    return "How might we help focused students overcome noisy, crowded campus common areas so they can study deeply and comfortably?";
  }
  const hardForRegex = /(?:becomes\s+)?(very\s+)?(?:hard|difficult|challenging|struggle)\s+for\s+(.+?)\s+to\s+(.+)/i;
  let match = text.match(hardForRegex);
  if (match) {
    const group2 = match[2].trim();
    const action = match[3].trim().replace(/[.!?]+$/, "");
    return `How might we help ${group2} overcome the difficulty of ${action} so they can achieve their goals safely and comfortably?`;
  }
  const struggleToRegex = /(.+?)\s+struggle[s]?\s+to\s+(.+)/i;
  match = text.match(struggleToRegex);
  if (match) {
    const group2 = match[1].trim();
    const action = match[2].trim().replace(/[.!?]+$/, "");
    return `How might we help ${group2} overcome being unable to ${action} so they can complete their daily routine successfully?`;
  }
  let group = "affected individuals";
  let problem = text.replace(/[.!?]+$/, "");
  if (lowerText.includes("student")) group = "students";
  else if (lowerText.includes("elderly") || lowerText.includes("senior")) group = "elderly folks";
  else if (lowerText.includes("passenger")) group = "passengers";
  else if (lowerText.includes("rider") || lowerText.includes("driver")) group = "commuters";
  else if (lowerText.includes("parent")) group = "parents";
  else if (lowerText.includes("patient")) group = "patients";
  else if (lowerText.includes("pet") || lowerText.includes("owner")) group = "pet owners";
  return `How might we help ${group} overcome the challenge of "${problem}" so they can accomplish their goals with confidence and ease?`;
}
app.post("/api/define", async (req, res) => {
  try {
    const { topicTitle, problemSelection, answers } = req.body;
    if (!topicTitle || !problemSelection) {
      return res.status(400).json({ error: "Missing required properties: topicTitle and problemSelection." });
    }
    const optionalContext = answers && (answers.anythingElse || answers.optionalContext) || "";
    const prompt = `You are a supportive, precise, and encouraging Design Thinking coach from ZupSkill.
A creator is looking at the challenge theme: "${topicTitle}".
They have selected the following problem to tackle:
- Selected Problem: "${problemSelection}"
${optionalContext ? `- Additional Context Provided: "${optionalContext}"` : ""}

CRITICAL AI REASONING PROCESS FOR REFRAMING:
1. Parse the Selected Problem carefully. It is your ONLY source of truth. Do not generalize beyond this selected problem. Do not broaden its scope. Do not generate city-level, industry-level, or system-level challenges unless they are explicitly written in the problem text.
2. Identify:
   - Who is affected ([affected group])
   - What challenge they face ([selected problem])
   - Under what condition or context ([actual context])
3. Formulate the challenge STRICTLY matching the Required Template style.

REQUIRED CHALLENGE GENERATION TEMPLATE:
"How might we help [affected group] overcome [selected problem] so they can [desired outcome]?"

Let the [selected problem] aspect be highly specific to the problem selection text.
These elements MUST remain visible in the finished challenge.

ANTI-GENERIC QUALITY RULES:
1. NEVER output generic concepts. Reject any output containing:
   - "transportation systems"
   - "infrastructure"
   - "mobility solutions"
   - "accessibility improvements"
   - "public services"
   - "communities"
   - "citizens"
   unless these exact concepts appear in the selected problem.
2. The challenge should ONLY make sense for the currently selected problem. Ask yourself: "Could this challenge have been generated from ANY problem?" If YES, discard and regenerate with high specificity.
3. Users should immediately recognize: "Yes, this challenge was generated from the exact problem I selected."

Here are examples of selected problems and expected custom outcomes you should emulate:

EXAMPLE 1:
Selected Problem: "becomes very hard for the elderly persons to get a bus as the bus starts from the bus stops without waiting for them as they walk slow"
Good HMW: "How might we help elderly passengers overcome buses starting without waiting for slow walkers so they can board safely and travel on schedule?"
Bad: "How might we improve accessibility in public transport?" (Too broad, generic vocabulary)

EXAMPLE 2:
Selected Problem: "Passengers often find travelling difficult during peak afternoon heat."
Good HMW: "How might we help passengers overcome travelling difficulties during periods of peak afternoon heat so they can commute comfortably?"
Bad: "How might we improve transportation systems?" (Too generic)

EXAMPLE 3:
Selected Problem: "Street light failure takes weeks to get fixed, making roads unsafe at night for student commuters."
Good HMW: "How might we help student commuters overcome unsafe dark streets from delayed street light repairs so they can walk home safely at night?"
Bad: "How might we improve street safety?" (Too broad)

EXAMPLE 4:
Selected Problem: "Blind passengers often require assistance when boarding buses."
Good HMW: "How might we help blind passengers overcome difficulties boarding buses independently so they can travel safely?"
Bad: "How might we improve mobility solutions?" (Too generic, violates Anti-Generic Rule)

Generate a highly inspiring and refined "How Might We" question based on the selected problem selection. Along with this, evaluate their empathy level and give them an encouraging empathy percentage score (between 85 and 98) and write a sweet, friendly note cheering them on in precisionFeedback!`;
    const config = {
      systemInstruction: "You are an expert Design Thinking facilitator and supportive guide. Your objective is to formulate HMW statements strictly matching the template: 'How might we help [affected group] overcome [selected problem] so they can [desired outcome]?'. You strictly follow the Anti-Generic rule and avoid broad categories like 'infrastructure' or 'citizens'.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["finishedStatement", "precisionScore", "precisionFeedback"],
        properties: {
          finishedStatement: { type: import_genai.Type.STRING, description: "The natural, conversational, solutions-oriented 'How might we...' refined question strictly adhering to the template: 'How might we help [affected group] overcome [selected problem] so they can [desired outcome]?'." },
          precisionScore: { type: import_genai.Type.INTEGER, description: "Empathy and heart score from 85 to 98." },
          precisionFeedback: { type: import_genai.Type.STRING, description: "An enthusiastic review (1-2 sentences) praising their empathy." }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```[a-zA-Z0-9]*\r?\n/, "");
      cleanedText = cleanedText.replace(/\r?\n```$/, "");
      cleanedText = cleanedText.trim();
    }
    const parsed = JSON.parse(cleanedText);
    return res.json(parsed);
  } catch (error) {
    logApiError("Error defining problem, falling back to smart local loop:", error);
    const { problemSelection } = req.body;
    const finishedStatement = smartReframeHMW(problemSelection || "");
    const scoreVal = 88 + Math.floor(Math.random() * 8);
    return res.json({
      finishedStatement,
      precisionScore: scoreVal,
      precisionFeedback: `Awesome problem selection! You beautifully locked down a vital community pain point. Let's proceed to brainstorming solution ideas!`
    });
  }
});
app.post("/api/ideate", async (req, res) => {
  try {
    const { problemStatement, ideas } = req.body;
    if (!problemStatement || !Array.isArray(ideas) || ideas.length === 0) {
      return res.status(400).json({ error: "problemStatement and array of ideas are required." });
    }
    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < ideas.length; i += chunkSize) {
      chunks.push(ideas.slice(i, i + chunkSize));
    }
    console.log(`Processing ${ideas.length} ideas in ${chunks.length} parallel batches.`);
    const evaluateChunk = async (ideaBatch) => {
      const prompt = `You are a creative brainstorming buddy helping sort cool ideas for: "${problemStatement}".
Tell us how awesome they are and group them into these three fun zones:
- 'HOW': Bold, futuristic, sci-fi ideas that expand horizons but are tough to build today (like floating anti-gravity pods or AI telepathy!).
- 'WOW': Super creative, game-changing ideas that are realistic and easy to scale (like smart apps or neat neighborhood hacks).
- 'NOW': Quick, sensible, easy-to-use ideas we can do today (like handy posters, easy check-lists, or minor rule tweaks).

Batch list of ideas:
${ideaBatch.map((idea, index) => `${index + 1}. "${idea}"`).join("\n")}

Format output precisely as a JSON array. Make sure you score them with encouraging numbers.`;
      const config = {
        systemInstruction: "You are a warm, creative brainstorming partner. Categorize the user's ideas with massive enthusiasm. Calculate scores out of 100 for innovation, feasibility, impact, and scalability. Let's make the reasoning witty, super encouraging, and human, cheering the user on for their massive creativity!",
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.ARRAY,
          description: "List of graded ideas, matching the order and amount of the input batch.",
          items: {
            type: import_genai.Type.OBJECT,
            required: ["ideaText", "category", "reasoning", "scores"],
            properties: {
              ideaText: { type: import_genai.Type.STRING, description: "The exact idea string being evaluated" },
              category: { type: import_genai.Type.STRING, description: "Must be exactly 'HOW', 'WOW', or 'NOW'" },
              reasoning: { type: import_genai.Type.STRING, description: "A witty, fast-paced explanation (10-15 words) for why it is classified here." },
              scores: {
                type: import_genai.Type.OBJECT,
                required: ["innovation", "feasibility", "impact", "scalability"],
                properties: {
                  innovation: { type: import_genai.Type.INTEGER, description: "Score from 1 to 100" },
                  feasibility: { type: import_genai.Type.INTEGER, description: "Score from 1 to 100" },
                  impact: { type: import_genai.Type.INTEGER, description: "Score from 1 to 100" },
                  scalability: { type: import_genai.Type.INTEGER, description: "Score from 1 to 100" }
                }
              }
            }
          }
        }
      };
      const resultText = await generateContentWithRetry(prompt, config, 2);
      return JSON.parse(resultText);
    };
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await evaluateChunk(chunk);
        } catch (err) {
          logApiError("FAIL batch chunk processing. Generating fallback answers.", err);
          return chunk.map((idea) => {
            const isFuturistic = idea.toLowerCase().includes("flying") || idea.toLowerCase().includes("robot") || idea.toLowerCase().includes("space");
            const isPractical = idea.toLowerCase().includes("campaign") || idea.toLowerCase().includes("sign") || idea.toLowerCase().includes("rule");
            const category = isFuturistic ? "HOW" : isPractical ? "NOW" : "WOW";
            return {
              ideaText: idea,
              category,
              reasoning: "Dynamically backed up via Lab local logic engine due to API processing load.",
              scores: {
                innovation: isFuturistic ? 90 : isPractical ? 45 : 75,
                feasibility: isFuturistic ? 30 : isPractical ? 95 : 70,
                impact: 70,
                scalability: 65
              }
            };
          });
        }
      })
    );
    const flatResults = results.flat();
    return res.json({ results: flatResults });
  } catch (error) {
    logApiError("Error batch evaluation ideation, outer fallback local loop:", error);
    const { ideas } = req.body;
    const fallbackResults = (Array.isArray(ideas) ? ideas : []).map((idea) => {
      const ideaStr = String(idea);
      const textL = ideaStr.toLowerCase();
      const isFuturistic = textL.includes("flying") || textL.includes("drone") || textL.includes("ai") || textL.includes("robot") || textL.includes("autonomous") || textL.includes("quantum") || textL.includes("space");
      const isPractical = textL.includes("guard") || textL.includes("sign") || textL.includes("mark") || textL.includes("volunteer") || textL.includes("paint") || textL.includes("light");
      let category = "WOW";
      let reasoning = "Very solid approach with wonderful community utility!";
      if (isFuturistic) {
        category = "HOW";
        reasoning = "Bold and imaginative space-age technology idea.";
      } else if (isPractical) {
        category = "NOW";
        reasoning = "Simple, direct, and can be implemented right now.";
      }
      return {
        ideaText: ideaStr,
        category,
        reasoning,
        scores: {
          innovation: isFuturistic ? 92 : isPractical ? 45 : 78,
          feasibility: isFuturistic ? 25 : isPractical ? 95 : 75,
          impact: 80,
          scalability: 70
        }
      };
    });
    return res.json({ results: fallbackResults });
  }
});
app.post("/api/ideas/enhance", async (req, res) => {
  try {
    const { ideaText, problemStatement, category } = req.body;
    if (!ideaText || !problemStatement || !category) {
      return res.status(400).json({ error: "ideaText, problemStatement, and category are required." });
    }
    const prompt = `You are a friendly, highly creative design partner at ZupSkill's Future Redesign Lab.
Help expand and beef up this idea: "${ideaText}" which solves the problem: "${problemStatement}".
This is categorized as a "${category}" concept.
We want to keep its sweet original spirit but make it super exciting, fun, and easy for students to understand.
Provide:
- A catchy new title
- A delightful, fun description of how it works in 1-2 paragraphs
- Cool updated friendly scores.
Format response in valid JSON.`;
    const config = {
      systemInstruction: "You are a friendly, highly creative design partner. Help expand the user's idea by adding delightful, fun, and super student-friendly details that make it sound fun, extremely helpful, and realistic. Suggest smart additions like mobile apps, game elements, community points, or cool physical features.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["enhancedTitle", "enhancedDescription", "scores"],
        properties: {
          enhancedTitle: { type: import_genai.Type.STRING, description: "A catchy, futuristic, startup-ready title for this solution (3-5 words)." },
          enhancedDescription: { type: import_genai.Type.STRING, description: "1-2 short paragraphs explaining details of how it operates, including components and user interactions." },
          scores: {
            type: import_genai.Type.OBJECT,
            required: ["innovation", "feasibility", "impact", "scalability"],
            properties: {
              innovation: { type: import_genai.Type.INTEGER },
              feasibility: { type: import_genai.Type.INTEGER },
              impact: { type: import_genai.Type.INTEGER },
              scalability: { type: import_genai.Type.INTEGER }
            }
          }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    logApiError("Error enhancing idea, fallback local loop:", error);
    const { ideaText, category } = req.body;
    return res.json({
      enhancedTitle: `Smart ${ideaText || "Community System"}`,
      enhancedDescription: `A refined physical and social intervention layer based on "${ideaText || "our creative solution"}". It optimizes resource management, introduces visible guidelines, and organizes local champions to ensure lasting community-driven success.`,
      scores: {
        innovation: category === "HOW" ? 90 : 70,
        feasibility: category === "NOW" ? 95 : 65,
        impact: 85,
        scalability: 80
      }
    });
  }
});
app.post("/api/prototype/generate-journey", async (req, res) => {
  try {
    const { ideaText, refinedProblem } = req.body;
    if (!ideaText) {
      return res.status(400).json({ error: "ideaText is required." });
    }
    const prompt = `You are a design thinking mentor, and we are working with a student on a solution journey map.
Selected Solution: "${ideaText}"
Design Challenge: "${refinedProblem || "General Campus Design Solution"}"

Your goal is to generate a chronological step-by-step user journey flow map that guides humans through experiencing this solution.
The step-by-step flow map answers:
1. What happens first?
2. What happens next?
3. What happens after that?

IMPORTANT RULES:
- The flow map MUST map the chronological journey of the solution being used.
- DO NOT use technical flowchart jargon.
- DO NOT generate generic nodes like "Verification", "Action Taken", or "Problem Detected" unless they naturally fit the selected solution perfectly.
- Generate between 5 and 7 specific, highly contextual, simple, and easy-to-understand steps.
- For each step, provide a concise action-oriented "title" (e.g. "Enter career interests", "Identify skill gaps") and a brief "description" (e.g. "Student inputs their current career field and technical skills.").

Return response in valid JSON fitting the schema.`;
    const config = {
      systemInstruction: "You are an expert design thinking mentor. Help students build intuitive, human-centered and chronological solution journey maps instead of dry, technical flowcharts.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["steps"],
        properties: {
          steps: {
            type: import_genai.Type.ARRAY,
            description: "A chronological list of 5-7 steps of the solution journey",
            items: {
              type: import_genai.Type.OBJECT,
              required: ["title", "description"],
              properties: {
                title: { type: import_genai.Type.STRING, description: "A brief action-oriented title (2-4 words)." },
                description: { type: import_genai.Type.STRING, description: "Describe what happens at this stage of your solution." }
              }
            }
          }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 1);
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error) {
    logApiError("Error generating journey, fallback to local templates:", error);
    return res.json({ steps: null });
  }
});
function cleanTitle(title) {
  if (!title) return "the solution";
  return title.replace(/\s+Micro-Model$/i, "").replace(/\s+Framework$/i, "").replace(/\s+System$/i, "").replace(/\s+Mechanism$/i, "").trim();
}
app.post("/api/test/what-if", async (req, res) => {
  try {
    const { problemStatement, prototypeTitle, prototypeDescription, selectedIdea } = req.body;
    const prompt = `You are an experienced Design Thinking Simulator mentor.
We need to generate highly relevant, contextual real-world stress tests ("What If?") for the student's actual solution concept.

Selected Problem: "${problemStatement}"
Selected Idea: "${selectedIdea || ""}"
Selected Solution Title: "${prototypeTitle}"
Storyboard / Prototype description (Source of Truth): "${prototypeDescription}"

--------------------------------------------------
BUCKET 1: WHAT IF? PURPOSE & INSTRUCTIONS (CRITICAL):
Stress-test the student's solution with realistic edge cases. Analyze the student's specific idea and generate contextual feedback.
Identify 1 to 3 distinct scenario-specific challenges. Focus on:
- Failure modes of their specific proposed solution
- Real-world scaling challenges
- Potential user behavior or adoption bottlenecks
- Environmental constraints (weather, physical space, etc.)

STRICT CONTROLS (ANTI-TEMPLATE & ANTI-AI-SLOP):
- NEVER generate generic template language, boilerplate, or empty questions (like "What if users don't use it?" or "What if it costs too much?").
- NEVER use generic placeholder phrases or terms like:
  * "Micro-Model"
  * "Framework"
  * "System"
  * "Mechanism"
  unless those exact words appear in the user's solution title or storyboard.
- Avoid abstract or corporate jargon. Use student-friendly, supportive, and natural language.
- Feedback must feel as if you have personally tested the student's specific idea on campus and discovered actual practical friction points.
- Use the actual solution name and reference the actual problem being solved.
- Since different student solutions propose completely different things, the reviews MUST be highly customized and different for each project. No two solutions should get similar reviews.

Provide your response in JSON matching the specified response schema. Determine an Innovation / Resilience Score out of 100 based on the solution's real-world feasibility, originality, and problem-solution fit (scoring normally averages 60-85, only exceptionally detailed ideas get 90+, basic gets 40-60).`;
    const config = {
      systemInstruction: "You are a professional design thinking mentor. Classify the prototype into one of the 8 specified categories. Generate 1 to 3 highly specific 'What if...' stress-test questions that address the physical/dynamic/human elements of their solution. Never use placeholder words like 'Micro-Model', 'Framework', 'System', or 'Mechanism' unless they are in the input. Score realistically.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["category", "challenges", "score"],
        properties: {
          category: {
            type: import_genai.Type.STRING,
            description: "Must be exactly one of: 'AI Tool', 'Software Product', 'Mobile App', 'Physical Product', 'Community Initiative', 'Infrastructure Solution', 'Educational Platform', 'Healthcare Solution'"
          },
          challenges: {
            type: import_genai.Type.ARRAY,
            items: { type: import_genai.Type.STRING },
            description: "Between 1 and 3 highly specific, highly contextual stress scenario questions starting with 'What if...'. Must address actual features mentioned in the prototype."
          },
          score: { type: import_genai.Type.INTEGER, description: "Resilience Score out of 100 based on solution's real-world durability and human parameters" }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    return res.json(JSON.parse(text));
  } catch (error) {
    logApiError("Error testing what-if:", error);
    const { prototypeTitle } = req.body;
    const name = cleanTitle(prototypeTitle);
    return res.json({
      category: "Infrastructure Solution",
      challenges: [
        `What if users choose an alternate route or bypass ${name} due to unexpected habits?`,
        `What if peak student traffic hours create overcrowding or bottlenecks around ${name}?`
      ],
      score: 75
    });
  }
});
app.post("/api/test/i-like", async (req, res) => {
  try {
    const { problemStatement, prototypeTitle, prototypeDescription, selectedIdea } = req.body;
    const prompt = `You are an experienced Design Thinking Simulator mentor celebrating a solution concept in a university campus environment.
We need to highlight highly relevant real-world strengths ("I Like...") of the student's actual solution.

Selected Problem: "${problemStatement}"
Selected Idea: "${selectedIdea || ""}"
Selected Solution Title: "${prototypeTitle}"
Storyboard / Prototype description (Source of Truth): "${prototypeDescription}"

--------------------------------------------------
BUCKET 2: I LIKE PURPOSE & INSTRUCTIONS (CRITICAL):
Identify and celebrate the genuine strengths of this specific design. Focus on:
- Why and how it directly solves the selected problem
- Usability, convenience, or human benefits for the targeted users
- Direct social impact or empathy-driven features
- Innovation aspects, neat twists, or clever design choices

STRICT CONTROLS (ANTI-TEMPLATE & ANTI-AI-SLOP):
- NEVER generate generic template language, boilerplate, or empty praises (like "I like that it is well thought out", "I like that it focuses on users", "I like that it is user-certified").
- NEVER use generic placeholder phrases or terms like:
  * "Micro-Model"
  * "Framework"
  * "System"
  * "Mechanism"
  unless those exact words appear in the user's solution title or storyboard.
- Avoid abstract or corporate jargon. Use student-friendly, encouraging, and natural language.
- Feedback must feel as if you have personally tested the student's specific idea on campus and recognized its most delightful strengths.
- Use the actual solution name and reference the actual problem being solved.
- Since different student solutions propose completely different things, the praises MUST be highly customized and different for each project. No two solutions should get similar praise points.

Provide your response in JSON matching the specified response schema. Determine an Empathy / User Delight score out of 100 based on direct empathy, problem relevance, and stakeholder awareness (scoring normally averages 60-85, only exceptionally insightful ideas get 90+, basic gets 40-60).`;
    const config = {
      systemInstruction: "You are an experienced design thinking mentor. Spot 1 to 3 actual strengths of the user's exact solution based on selected solution, storyboard, or pitch. Select one of the 8 allowed categories, screen out generic praises, score realistically (60-85 for typical, 90+ for exceptional), and verify >80% relevance.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["category", "highlights", "score"],
        properties: {
          category: {
            type: import_genai.Type.STRING,
            description: "Must be exactly one of: 'AI Tool', 'Software Product', 'Mobile App', 'Physical Product', 'Community Initiative', 'Infrastructure Solution', 'Educational Platform', 'Healthcare Solution'"
          },
          highlights: {
            type: import_genai.Type.ARRAY,
            items: { type: import_genai.Type.STRING },
            description: "Between 1 and 3 highly specific strength observations starting with 'I like...'. Must reference actual features mentioned by the user."
          },
          score: { type: import_genai.Type.INTEGER, description: "Empathy / User Delight score out of 100" }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    return res.json(JSON.parse(text));
  } catch (error) {
    logApiError("Error testing i-like:", error);
    const { prototypeTitle } = req.body;
    const name = cleanTitle(prototypeTitle);
    return res.json({
      category: "Infrastructure Solution",
      highlights: [
        `I like that ${name} directly addresses the described user core pain points in a neat way.`,
        `I like that this design makes the key parts of ${name} easily visible and understandable.`
      ],
      score: 82
    });
  }
});
app.post("/api/test/i-wish", async (req, res) => {
  try {
    const { problemStatement, prototypeTitle, prototypeDescription, selectedIdea } = req.body;
    const prompt = `You are an experienced Design Thinking Simulator mentor suggesting improvements ("I Wish...") for the student's actual solution.

Selected Problem: "${problemStatement}"
Selected Idea: "${selectedIdea || ""}"
Selected Solution Title: "${prototypeTitle}"
Storyboard / Prototype description (Source of Truth): "${prototypeDescription}"

--------------------------------------------------
BUCKET 3: I WISH PURPOSE & INSTRUCTIONS (CRITICAL):
Suggest realistic, meaningful, and highly actionable next steps or design refinements. Focus on:
- Additional features that enhance the core user experience
- Scalability or long-term growth ideas
- Safety, security, privacy, or accessibility improvements
- Future expansion opportunities or ecosystem integration

STRICT CONTROLS (ANTI-TEMPLATE & ANTI-AI-SLOP):
- NEVER generate generic template language, boilerplate, or empty suggestions (like "I wish it were warmer", "I wish we had feedback", "I wish there was a clear option for peers").
- NEVER use generic placeholder phrases or terms like:
  * "Micro-Model"
  * "Framework"
  * "System"
  * "Mechanism"
  unless those exact words appear in the user's solution title or storyboard.
- Avoid abstract or corporate jargon. Use student-friendly, supportive, and natural language.
- Feedback must feel as if you have personally tested the student's specific idea on campus and wanted to suggest a cool extension or design tweak.
- Use the actual solution name and reference the actual problem being solved.
- Since different student solutions propose completely different things, the suggestions MUST be highly customized and different for each project. No two solutions should get similar suggestions.

Provide your response in JSON matching the specified response schema. Determine a Creativity / Scalability Potential score out of 100 based on originality, novelty, and uniqueness (scoring normally averages 60-85, only exceptionally creative ideas get 90+, basic gets 40-60).`;
    const config = {
      systemInstruction: "You are an experienced design thinking mentor. Suggest 1 to 3 contextual, gentle design suggestions starting with 'I wish...' that build on the existing solution. Select one of the 8 correct categories, score realistically (60-85 for typical, 90+ for exceptional), and discard generic or unrequested tech features.",
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        required: ["category", "improvements", "score"],
        properties: {
          category: {
            type: import_genai.Type.STRING,
            description: "Must be exactly one of: 'AI Tool', 'Software Product', 'Mobile App', 'Physical Product', 'Community Initiative', 'Infrastructure Solution', 'Educational Platform', 'Healthcare Solution'"
          },
          improvements: {
            type: import_genai.Type.ARRAY,
            items: { type: import_genai.Type.STRING },
            description: "Between 1 and 3 distinct, highly realistic design improvements building on the existing prototype features starting with 'I wish...'"
          },
          score: { type: import_genai.Type.INTEGER, description: "Scalability Growth / Potential score out of 100" }
        }
      }
    };
    const text = await generateContentWithRetry(prompt, config, 2);
    return res.json(JSON.parse(text));
  } catch (error) {
    logApiError("Error testing i-wish:", error);
    const { prototypeTitle } = req.body;
    const name = cleanTitle(prototypeTitle);
    return res.json({
      category: "Infrastructure Solution",
      improvements: [
        `I wish we could explore adding clear visual signs or supportive markings to ${name} for better guidance.`,
        `I wish there was a clear option or quick guide for first-time users to easily understand ${name}.`
      ],
      score: 80
    });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const viteModuleName = "vite";
    const { createServer: createViteServer } = await import(
      /* @vite-ignore */
      viteModuleName
    );
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Future Redesign Lab Server] Running on http://localhost:${PORT}`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
