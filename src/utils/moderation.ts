/**
 * Client-side Content Moderation & Spam Detection Service
 * Design Thinking Simulation - DT Innovation Lab
 */
import { apiFetch } from "./api";

// Simple dictionary of common inappropriate words (Level 1 / Level 2 indicators)
const BAD_WORDS_DICTIONARY = [
  "sh*t", "f*ck", "b*tch", "asshole", "bastard", "dick", "crap", "piss", "slut", "whore",
  "fuck", "shit", "bitch", "cunt", "nigger", "faggot", "motherfuck", "dumbass", "retard",
  "pussy", "twat", "wanker", "prick"
];

export interface ModerationResult {
  safe: boolean;
  level: 0 | 1 | 2 | 3; // 0 = Safe, 1 = Mild (Warn), 2 = Moderate (Block/Rephrase), 3 = Severe (Instant reject)
  warning?: string;
}

export function assessTextQuality(text: string): { safe: boolean; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: true };
  }

  const lowercase = trimmed.toLowerCase();

  // 1) PROFANITY HANDLING:
  // Show exactly: "Please describe a real challenge, frustration, or observation related to the selected topic."
  const PROFANITY_WORDS = [
    "fuck", "fucking", "fucker", "motherfucker", "f*ck", "f*cking", "f*cker", "motherf*cker",
    "shit", "shiting", "shitter", "sh*t", "bitch", "bitchy", "b*tch",
    "asshole", "ass", "bastard", "dick", "crap", "piss", "slut", "whore",
    "cunt", "nigger", "faggot", "dumbass", "retard", "pussy", "twat", "wanker", "prick",
    "stupid", "idiot", "mother fucker", "mother-fucker", "abuse", "hate", "vulgar", "sex", "porn",
    "dickhead", "cock"
  ];
  const containsProfanity = PROFANITY_WORDS.some(p => {
    if (lowercase.includes(p)) return true;
    const wordsList = lowercase.split(/[^a-z0-9']/i).filter(w => w.length > 0);
    return wordsList.some(w => w === p);
  });
  if (containsProfanity) {
    return {
      safe: false,
      warning: "Please enter a meaningful idea, observation, or challenge."
    };
  }

  // 2) ALL NUMBERS OR ALL SPECIAL CHARACTERS
  const compact = lowercase.replace(/\s+/g, "");
  if (!/[a-z]/i.test(compact)) {
    return {
      safe: false,
      warning: "Please enter a meaningful idea, observation, or challenge."
    };
  }

  // 3) SINGLE CHARACTER REPETITIONS
  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      safe: false,
      warning: "Please enter a meaningful idea, observation, or challenge."
    };
  }

  // 4) SYLLABLE REPETITIONS
  const repeatingPatternGlobal = /([a-z0-9]{2,5})\1{2,}/i;
  const repeatingPatternDouble = /([a-z0-9]{3,5})\1{1,}/i;
  if (repeatingPatternGlobal.test(lowercase) || repeatingPatternDouble.test(lowercase)) {
    return {
      safe: false,
      warning: "Please enter a meaningful idea, observation, or challenge."
    };
  }

  // 5) KEYBOARD RUNS / MASH PATTERNS
  const keyboardRuns = [
    "asdfg", "sdfgh", "dfghj", "fghjk", "ghjkl",
    "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuiop",
    "zxcvb", "xcvbn", "cvbnm", "asdfghjkl", "qwertyuiop", "zxcvbnm", "qwert", "fdsafsd"
  ];
  for (const run of keyboardRuns) {
    if (lowercase.includes(run)) {
      return {
        safe: false,
        warning: "Please enter a meaningful idea, observation, or challenge."
      };
    }
  }

  // 6) INDIVIDUAL WORDS CHECK
  const words = lowercase.split(/[^a-z0-9']/i).filter(w => w.length > 0);

  const MEANINGLESS_WORDS = [
    "bro", "hello", "hi", "hey", "nice", "testing", "test", "demo", "asdfghj", "asdf",
    "ok", "yes", "no", "cool", "fine", "n/a", "na", "null", "undefined", "nothing", 
    "none", "skip", "idk", "stuff", "thing", "things", "bad", "good", "dummy", "sample",
    "asdfg", "asdfgh", "qwerty", "zxcvbnm", "qwert", "fdsafsd", "abc", "xyz", "qwe", "asd", "zxc"
  ];

  const ALLOWED_SHORT_WORDS = [
    "ai", "car", "bus", "pet", "tax", "art", "law", "war", "gap", "sea", "air", "run", "web", "app", "job", "pay", "bio", "eco",
    "kid", "dad", "mom", "doc", "cop", "vet", "boy", "man"
  ];

  if (words.length <= 1) {
    const singleWord = words[0] || "";
    if (MEANINGLESS_WORDS.includes(singleWord) || (singleWord.length < 3 && !ALLOWED_SHORT_WORDS.includes(singleWord))) {
      return {
        safe: false,
        warning: "Please enter a meaningful idea, observation, or challenge."
      };
    }
  }

  const hasSubstance = words.some(w => !MEANINGLESS_WORDS.includes(w) && w.length >= 2);
  if (!hasSubstance && words.length > 0) {
    return {
      safe: false,
      warning: "Please enter a meaningful idea, observation, or challenge."
    };
  }

  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, "");
    if (cleanWord.length >= 6 && !/[aeiouy]/.test(cleanWord)) {
      return {
        safe: false,
        warning: "Please enter a meaningful idea, observation, or challenge."
      };
    }
    if (cleanWord.length >= 8) {
      const vowelsCount = (cleanWord.match(/[aeiouy]/g) || []).length;
      if (vowelsCount <= 1 || (vowelsCount / cleanWord.length) < 0.15) {
        return {
          safe: false,
          warning: "Please enter a meaningful idea, observation, or challenge."
        };
      }
    }
  }

  return { safe: true };
}

/**
 * Perform instant local heuristic checks (Spam, Keyboard mash, basic profanity, low quality check)
 */
export function testTopicValidity(text: string): { valid: boolean; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { valid: false };
  }

  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return { valid: false, warning: quality.warning };
  }

  const lowercase = trimmed.toLowerCase();

  // 1. All numbers or all special characters (e.g. "123456", "......", "@@@@@")
  if (/^\d+$/.test(trimmed) || /^[^\s\w]+$/.test(trimmed)) {
    return {
      valid: false,
      warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
    };
  }

  // 2. Character repetition (e.g. "aaaaa", "!!!!!")
  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      valid: false,
      warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
    };
  }

  // 3. Repeating syllable patterns: "zxczxc", "abcabcabcabc", "ababab"
  const repeatingPatternGlobal = /([a-z0-9]{2,5})\1{2,}/i; // matches e.g. "ababab", "zxczxczxc", "abcabcabc"
  const repeatingPatternDouble = /([a-z0-9]{3,5})\1{1,}/i; // matches "asdfasdf", "qwerqwer"
  if (repeatingPatternGlobal.test(lowercase) || repeatingPatternDouble.test(lowercase)) {
    return {
      valid: false,
      warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
    };
  }

  // 4. Keyboard adjacent runs of length >= 5
  const keyboardRuns = [
    "asdfg", "sdfgh", "dfghj", "fghjk", "ghjkl",
    "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuiop",
    "zxcvb", "xcvbn", "cvbnm"
  ];
  for (const run of keyboardRuns) {
    if (lowercase.includes(run)) {
      return {
        valid: false,
        warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
      };
    }
  }

  // 5. Individual word analysis (checking for gibberish keyboard smashing)
  const words = lowercase.split(/[^a-z0-9']/);
  
  for (const word of words) {
    if (!word) continue;

    // Check exact matches of known keyboard runs/mashes
    const exactMashes = [
      "asdf", "lkjh", "qwer", "zxcv", "asdfg", "asdfgh", "asdfghj", "asdfghjkl", "qwertyuiop",
      "asd", "qwe", "zxc", "jkl", "xyz", "abc", "test", "demo", "foo", "bar"
    ];
    if (exactMashes.includes(word)) {
      return {
        valid: false,
        warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
      };
    }

    // Heuristics: medium to long word with no vowels (excluding extremely short things)
    if (word.length >= 5 && !/[aeiouy]/.test(word)) {
      return {
        valid: false,
        warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
      };
    }

    // Heuristics: very low vowel count in a medium-long word
    if (word.length >= 7) {
      const vowelsCount = (word.match(/[aeiouy]/g) || []).length;
      if (vowelsCount <= 1) {
        return {
          valid: false,
          warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
        };
      }
    }

    // Heuristics: for long single words (length > 12) with high consonant clusters
    if (word.length > 12) {
      const vowelsCount = (word.match(/[aeiouy]/g) || []).length;
      const consonantRuns = word.match(/[^aeiouy\s]{3,}/g) || [];
      const longConsonantRuns = word.match(/[^aeiouy\s]{4,}/g) || [];

      // If there is any 4+ consecutive consonant run, or more than one 3+ consonant run, or vowel ratio is extremely low
      if (longConsonantRuns.length > 0 || consonantRuns.length > 1 || (vowelsCount / word.length) < 0.22) {
        return {
          valid: false,
          warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
        };
      }
    }
  }

  // 6. Very short input checks
  const replacedNoSpaces = lowercase.replace(/\s+/g, "");
  const allowedShortWords = [
    "ai", "car", "bus", "pet", "tax", "art", "law", "war", "gap", "sea", "air", "run", "web", "app", "job", "pay", "bio", "eco",
    "food", "sleep", "space", "stress"
  ];
  if (replacedNoSpaces.length <= 2 && !allowedShortWords.includes(replacedNoSpaces)) {
    return {
      valid: false,
      warning: "⚠️ Please enter a meaningful topic or challenge area. Examples: Road Safety, Mental Health, Climate Change, Space Exploration."
    };
  }

  return { valid: true };
}

export function validateWhoField(text: string): { safe: boolean; level: 0 | 1 | 2; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: true, level: 0 };
  }

  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return { safe: false, level: 2, warning: quality.warning };
  }

  const lowercase = trimmed.toLowerCase();

  // 1. All numbers or all special characters (spam)
  if (/^\d+$/.test(trimmed) || /^[^\s\w]+$/.test(trimmed)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful persona or role (e.g., student, doctor, parent)."
    };
  }

  // 2. Character repetition
  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful persona or role (e.g., student, doctor, parent)."
    };
  }

  // 3. Repeating syllable patterns
  const repeatingPatternGlobal = /([a-z0-9]{2,5})\1{2,}/i;
  const repeatingPatternDouble = /([a-z0-9]{3,5})\1{1,}/i;
  if (repeatingPatternGlobal.test(lowercase) || repeatingPatternDouble.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful persona or role (e.g., student, doctor, parent)."
    };
  }

  // 4. Keyboard adjacent runs of length >= 5
  const keyboardRuns = [
    "asdfg", "sdfgh", "dfghj", "fghjk", "ghjkl",
    "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuiop",
    "zxcvb", "xcvbn", "cvbnm"
  ];
  for (const run of keyboardRuns) {
    if (lowercase.includes(run)) {
      return {
         safe: false,
         level: 1,
         warning: "⚠️ This keyboard mash doesn't seem to be a real role or persona."
      };
    }
  }

  const words = lowercase.split(/[^a-z0-9']/);
  const commonValidPersonaWords = [
    "student", "parent", "elderly", "teacher", "resident", "doctor", "driver", "police", "commuter", "rider", "kid", 
    "individual", "user", "commuters", "riders", "individuals", "users", "kids", "children", "pedestrian", "pedestrians",
    "worker", "workers", "senior", "seniors", "patient", "patients", "nurse", "nurses", "staff", "customer", "customers",
    "passenger", "passengers", "cyclist", "cyclists", "teen", "teens", "teenager", "teenagers", "adult", "adults",
    "person", "people", "citizen", "citizens", "local", "locals", "buyer", "seller", "merchant", "merchants", "friend",
    "elder", "elders", "grandparent", "grandparents", "child", "infant", "toddler", "employee", "employees", "employer", 
    "employers", "officer", "officers", "clerk", "clerks", "policeman", "policewomen", "cop", "cops"
  ];

  for (const word of words) {
    if (!word) continue;

    const exactMashes = [
      "asdf", "lkjh", "qwer", "zxcv", "asdfg", "asdfgh", "asdfghj", "asdfghjkl", "qwertyuiop",
      "asd", "qwe", "zxc", "jkl", "xyz", "abc"
    ];
    if (exactMashes.includes(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a meaningful persona or role (e.g., student, doctor, parent)."
      };
    }

    if (word.length >= 5 && !/[aeiouy]/.test(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a real word. Gibberish was detected."
      };
    }
  }

  // For any legitimate persona/role word, bypass any short length limits!
  const hasLegitimateWord = words.some(w => commonValidPersonaWords.includes(w));
  if (hasLegitimateWord) {
    return { safe: true, level: 0 };
  }

  // If length is extremely short (less than 3 characters) and not a known word
  const allowedShortWords = [
    "ai", "kid", "dad", "mom", "doc", "cop", "vet", "pet", "boy", "man"
  ];
  const replacedNoSpaces = lowercase.replace(/\s+/g, "");
  if (replacedNoSpaces.length <= 2 && !allowedShortWords.includes(replacedNoSpaces)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Help us understand your persona with matching letters."
    };
  }

  return { safe: true, level: 0 };
}

export function validateWhatField(text: string): { safe: boolean; level: 0 | 1 | 2; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: true, level: 0 };
  }

  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return { safe: false, level: 2, warning: quality.warning };
  }

  const lowercase = trimmed.toLowerCase();

  if (/^\d+$/.test(trimmed) || /^[^\s\w]+$/.test(trimmed)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful struggle (e.g., crossing roads, managing stress)."
    };
  }

  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful struggle (e.g., crossing roads, managing stress)."
    };
  }

  const repeatingPatternGlobal = /([a-z0-9]{2,5})\1{2,}/i;
  const repeatingPatternDouble = /([a-z0-9]{3,5})\1{1,}/i;
  if (repeatingPatternGlobal.test(lowercase) || repeatingPatternDouble.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful struggle (e.g., finding parking, exam stress)."
    };
  }

  const keyboardRuns = [
    "asdfg", "sdfgh", "dfghj", "fghjk", "ghjkl",
    "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuiop",
    "zxcvb", "xcvbn", "cvbnm"
  ];
  for (const run of keyboardRuns) {
    if (lowercase.includes(run)) {
      return {
         safe: false,
         level: 1,
         warning: "⚠️ Please enter a real struggle description."
      };
    }
  }

  const words = lowercase.split(/[^a-z0-9']/);
  for (const word of words) {
    if (!word) continue;

    const exactMashes = [
      "asdf", "lkjh", "qwer", "zxcv", "asdfg", "asdfgh", "asdfghj", "asdfghjkl", "qwertyuiop",
      "asd", "qwe", "zxc", "jkl", "xyz", "abc"
    ];
    if (exactMashes.includes(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a meaningful struggle (e.g., crossing roads, climbing stairs)."
      };
    }

    if (word.length >= 5 && !/[aeiouy]/.test(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a real struggle description."
      };
    }
  }

  const lowQuality = ["nothing", "none", "skip", "test", "demo", "asdf", "idk", "ok", "yes", "no"];
  if (lowQuality.includes(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Let's enter a real struggle to build a design challenge!"
    };
  }

  return { safe: true, level: 0 };
}

export function validateWhyField(text: string): { safe: boolean; level: 0 | 1 | 2; warning?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: true, level: 0 };
  }

  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    return { safe: false, level: 2, warning: quality.warning };
  }

  const lowercase = trimmed.toLowerCase();

  if (/^\d+$/.test(trimmed) || /^[^\s\w]+$/.test(trimmed)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful reason (e.g., heavy traffic makes it dangerous)."
    };
  }

  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful reason."
    };
  }

  const repeatingPatternGlobal = /([a-z0-9]{2,5})\1{2,}/i;
  const repeatingPatternDouble = /([a-z0-9]{3,5})\1{1,}/i;
  if (repeatingPatternGlobal.test(lowercase) || repeatingPatternDouble.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful reason."
    };
  }

  const keyboardRuns = [
    "asdfg", "sdfgh", "dfghj", "fghjk", "ghjkl",
    "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuiop",
    "zxcvb", "xcvbn", "cvbnm"
  ];
  for (const run of keyboardRuns) {
    if (lowercase.includes(run)) {
      return {
         safe: false,
         level: 1,
         warning: "⚠️ This keyboard mash doesn't seem to be a real explanation."
      };
    }
  }

  const words = lowercase.split(/[^a-z0-9']/);
  for (const word of words) {
    if (!word) continue;

    const exactMashes = [
      "asdf", "lkjh", "qwer", "zxcv", "asdfg", "asdfgh", "asdfghj", "asdfghjkl", "qwertyuiop",
      "asd", "qwe", "zxc", "jkl", "xyz", "abc"
    ];
    if (exactMashes.includes(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a meaningful explanation."
      };
    }

    if (word.length >= 5 && !/[aeiouy]/.test(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a real explanation."
      };
    }
  }

  // Encourages more detail: if response is short, provide a constructive warning prompt
  // But return safe: true with level 1 so the user gets notified but is not blocked!
  const wordsCount = words.filter(w => w.trim().length > 0).length;
  if (trimmed.length < 15 || wordsCount <= 2) {
    return {
      safe: true, // DOES NOT BLOCK PROGRESS!
      level: 1,
      warning: "This field benefits from additional context. E.g. Good: 'Signals change too quickly.' Better: 'Signals change too quickly for elderly pedestrians to cross safely.'"
    };
  }

  return { safe: true, level: 0 };
}

export function scanTextLocally(text: string, context = ""): ModerationResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { safe: true, level: 0 };
  }

  // Unified absolute validation of text quality parameters
  const quality = assessTextQuality(trimmed);
  if (!quality.safe) {
    let warn = quality.warning || "Please enter a meaningful idea, observation, or challenge.";
    if (
      (context && context.toLowerCase().includes("empathize")) ||
      context.toLowerCase().includes("observation") ||
      context.toLowerCase().includes("define")
    ) {
      warn = "Please describe a real challenge, frustration, or observation related to the selected topic.";
    }
    return {
      safe: false,
      level: 2,
      warning: warn
    };
  }

  const lowercase = trimmed.toLowerCase();

  const isPrototype = context && context.toLowerCase().includes("prototype");
  if (isPrototype) {
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }

    if (/^\d+$/.test(lowercase) || /^[^\s\w]+$/.test(lowercase) || /(.)\1{4,}/.test(lowercase)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Does this describe a step in the solution?"
      };
    }

    const mashingSubstrings = [
      "asdf", "lkjh", "qwer", "poiuy", "mnbv", "zxcv", "ghjk", "jkl;", "uiop", "dfgh", "fghj", "xcvb", "cvbn", "vbnm"
    ];
    for (const mash of mashingSubstrings) {
      if (lowercase.includes(mash)) {
        return {
          safe: false,
          level: 1,
          warning: "⚠️ Does this describe a step in the solution?"
        };
      }
    }

    if (trimmed.length < 3) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Does this describe a step in the solution?"
      };
    }

    return { safe: true, level: 0 };
  }

  if (context.startsWith("Empathize")) {
    const PROFANITY_WORDS = [
      "fuck", "fucking", "fucker", "motherfucker", "f*ck", "f*cking", "f*cker", "motherf*cker",
      "shit", "shiting", "shitter", "sh*t", "bitch", "bitchy", "b*tch",
      "asshole", "ass", "bastard", "dick", "crap", "piss", "slut", "whore",
      "cunt", "nigger", "faggot", "dumbass", "retard", "pussy", "twat", "wanker", "prick",
      "stupid", "idiot", "mother fucker", "mother-fucker", "abuse", "hate", "vulgar", "sex", "porn"
    ];
    const containsProfanity = PROFANITY_WORDS.some(p => {
      if (lowercase.includes(p)) return true;
      const wordsList = lowercase.split(/[^a-z0-9']/i).filter(w => w.length > 0);
      return wordsList.some(w => w === p);
    });
    if (containsProfanity) {
      return {
        safe: false,
        level: 2,
        warning: "Please describe a real challenge, frustration, or observation related to the selected topic."
      };
    }

    // 2. Meaningfulness Check (rejection of "bro", "hello", "nice", "testing" etc.)
    const MEANINGLESS_WORDS = [
      "bro", "hello", "hi", "hey", "nice", "testing", "test", "demo", "asdfghj", "asdf",
      "ok", "yes", "no", "cool", "fine", "n/a", "na", "null", "undefined", "nothing", 
      "none", "skip", "idk", "stuff", "thing", "things", "bad", "good", "dummy", "sample",
      "asdfg", "asdfgh", "qwerty", "zxcvbnm", "qwert", "fdsafsd"
    ];

    if (/^\d+$/.test(trimmed) || /^[^\s\w]+$/.test(trimmed)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a meaningful challenge, frustration, or observation."
      };
    }

    if (/(.)\1{4,}/.test(lowercase)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a meaningful observation instead of repeating characters."
      };
    }

    const wordsObj = trimmed.split(/\s+/).filter(w => w.trim().length > 0);
    const lowercaseWords = wordsObj.map(w => w.toLowerCase().replace(/[^a-z0-9']/g, ""));

    if (wordsObj.length <= 1) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please describe your observation with a few more words (e.g. 'Finding internships is hard.')."
      };
    }

    const hasSubstance = lowercaseWords.some(w => !MEANINGLESS_WORDS.includes(w) && w.length > 2);
    if (!hasSubstance) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please describe a real challenge, frustration, or observation."
      };
    }

    // Gibberish checking for mashed letters
    for (const word of wordsObj) {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, "");
      if (cleanWord.length >= 6 && !/[aeiouy]/.test(cleanWord)) {
        return {
          safe: false,
          level: 1,
          warning: "⚠️ This keyboard mash doesn't seem to be a real word. Please describe a real challenge."
        };
      }
    }

    // Topic/Context check: Attempt to match any transport, college or general acceptor
    const keywordMatches = [
      "traffic", "travel", "road", "street", "transport", "bus", "car", "metro", "commute", 
      "walk", "crossing", "speed", "hazard", "pothole", "ride", "lane", "delay", "late", 
      "parking", "driver", "commuter", "pedestrian", "transit", "vehicle", "scooter",
      "student", "college", "campus", "hostel", "dorm", "canteen", "academic", "class", 
      "exam", "friend", "professor", "course", "textbook", "tuition", "degree", "fee", 
      "admission", "lecture", "placement", "internship", "study", "schedule",
      "social", "media", "app", "phone", "scroll", "screen", "tiktok", "instagram", 
      "feed", "addict", "notification", "post", "online", "chat", "influence", "like", 
      "comment", "profile", "distract", "watch", "alert",
      "mental", "health", "anxiety", "stress", "depression", "burnout", "therapy", 
      "counselor", "stigma", "feeling", "mind", "shame", "sad", "emotional", "pressure", 
      "exhaust", "tire", "cope", "food", "meal", "eat"
    ];

    const hasTopicKeywords = lowercaseWords.some(w => keywordMatches.includes(w) || w.length > 4); 
    if (lowercaseWords.length > 0 && !hasTopicKeywords) {
      // Gentle warning for unrelated entries
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a real challenge, frustration, or observation related to the selected topic."
      };
    }

    const warningMsg = trimmed.length < 45 
      ? "Looks good! You can add more detail if you'd like, but this observation is valid."
      : "";
    return {
      safe: true,
      level: 0,
      warning: warningMsg
    };
  }

  // Define Stage Custom overrides
  if (context === "Define Stage - WHO") {
    const res = validateWhoField(trimmed);
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }
    return res;
  }

  if (context === "Define Stage - WHAT") {
    const res = validateWhatField(trimmed);
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }
    return res;
  }

  if (context === "Define Stage - WHY") {
    const res = validateWhyField(trimmed);
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }
    return res;
  }

  if (context === "Define Stage - OPTIONAL") {
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }
    return { safe: true, level: 0 };
  }

  // Custom Topic override
  if (context === "Custom topic creation name" || context === "Custom topic title") {
    const check = testTopicValidity(trimmed);
    if (!check.valid) {
      return {
        safe: false,
        level: 2, // Moderate safety hit to completely block / disable button
        warning: check.warning
      };
    }
    // Also run dictionary check
    for (const word of lowercase.split(/[^a-z0-9']/)) {
      if (BAD_WORDS_DICTIONARY.includes(word)) {
        return {
          safe: false,
          level: 2,
          warning: "⚠️ Let's keep things respectful and constructive 👀"
        };
      }
    }
    return { safe: true, level: 0 };
  }

  // 1. SPAM DETECTION: Entirely numbers (e.g. "123456", "9999999")
  if (/^\d+$/.test(trimmed)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a meaningful response instead of just numbers."
    };
  }

  // 2. SPAM DETECTION: Entirely special characters / punctuation (e.g., "......", "!!!!!!!!!!", "#####")
  if (/^[^\s\w]+$/.test(trimmed)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Please enter a real response instead of special characters."
    };
  }

  // 3. SPAM DETECTION: Single character repetition (e.g., "aaaaaaaaaaaa", "!!!!!!")
  if (/(.)\1{4,}/.test(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ Avoid repeating the same character excessively. Help us understand your thought better."
    };
  }

  // 4. Keyboard adjacent QWERTY layouts and repeating syllable patterns
  const words = lowercase.split(/[^a-z0-9']/);
  const mashingSubstrings = [
    "asdf", "lkjh", "qwer", "poiuy", "mnbv", "zxcv", "ghjk", "jkl;", "uiop", "dfgh", "fghj", "xcvb", "cvbn", "vbnm",
    "abcabc", "xyzxyz", "ababab", "jkjkjk", "asdfasdf", "qwerqwer", "testtest", "demodemo"
  ];

  for (const word of words) {
    if (word.length >= 4) {
      for (const mash of mashingSubstrings) {
        if (word.includes(mash)) {
          return {
            safe: false,
            level: 1,
            warning: "⚠️ This doesn't seem to describe a real thought. Give it another try with meaningful words."
          };
        }
      }
    }

    // Heuristics for gibberish vowel counts in long words
    if (word.length >= 5 && !/[aeiouy]/.test(word)) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ This doesn't seem to make a real word. Please enter a meaningful response."
      };
    }
    if (word.length >= 7) {
      const vowelsCount = (word.match(/[aeiouy]/g) || []).length;
      if (vowelsCount <= 1) {
        return {
          safe: false,
          level: 1,
          warning: "⚠️ This word seems like random typing. Help us understand your idea a little better."
        };
      }
    }
  }

  // 5. LOW-QUALITY & VAGUE INPUT CHECKLIST
  const lowQualityResponses = [
    "problem", "idea", "good", "fix road", "nothing", "none", "test", "demo", "asdf", 
    "empty", "dummy", "sample", "hello", "hi", "ok", "yes", "no", "cool", "fine", 
    "nice", "n/a", "na", "null", "undefined", "fix", "observ", "observation", "solution", 
    "innovate", "change", "help", "work", "bad", "worst", "great", "awesome", "don't know", 
    "dont know", "skip", "idk", "stuff", "thing", "things"
  ];

  if (lowQualityResponses.includes(lowercase)) {
    return {
      safe: false,
      level: 1,
      warning: "⚠️ This doesn't seem to describe a real observation or solution. Please elaborate a bit more."
    };
  }

  // 6. Descriptive context constraints (Descriptives like WHO, WHAT, WHY, and summaries require elaboration)
  const isShortValueAllowed = [
    "Custom perspective role",
    "Profile name",
    "College name",
    "Custom topic title",
    "Custom topic creation name",
    "Custom topic description",
    "Custom perspective details context",
    "Pilot Username input change form",
    "Design institute college name"
  ].includes(context);

  if (context === "Custom topic creation name" || context === "Custom topic title") {
    // Check for "abc" or similar short keyboard runs/gibberish
    const lowercaseNoSpaces = lowercase.replace(/\s+/g, "");
    const shortGibberish = ["abc", "xyz", "qwe", "asd", "zxc", "jkl", "123", "aaa", "bbb", "ccc", "test", "demo", "foo", "bar"];
    if (
      shortGibberish.includes(lowercaseNoSpaces) || 
      (lowercaseNoSpaces.length <= 2 && !["ai", "car", "bus", "pet", "tax", "art", "law", "war", "gap", "sea", "air", "run", "web", "app", "job", "pay", "bio", "eco"].includes(lowercaseNoSpaces))
    ) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Describe what happens in this step of your solution journey."
      };
    }
  }

  if (!isShortValueAllowed) {
    // If the string is extremely short or contains very few characters
    if (trimmed.length < 8) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Please enter a more detailed, meaningful response. Elaborating helps our AI teammate understand!"
      };
    }
    // If 1-word answer which doesn't convey enough complexity
    if (words.filter(w => w.trim().length > 0).length <= 1) {
      return {
        safe: false,
        level: 1,
        warning: "⚠️ Describe what happens in this step of your solution journey with a few more words."
      };
    }
  }

  // 7. LOCAL PROFANITY DICTIONARY CHECK
  for (const word of words) {
    if (BAD_WORDS_DICTIONARY.includes(word)) {
      return {
        safe: false,
        level: 2,
        warning: "⚠️ Let's keep things respectful and constructive 👀"
      };
    }
  }

  return { safe: true, level: 0 };
}

/**
 * Context-aware AI Moderation (calls server endpoint for meaning and intent validation)
 */
export async function scanTextOnServer(text: string, context?: string): Promise<ModerationResult> {
  // First run local check with context
  const localCheck = scanTextLocally(text, context);
  
  // If this is a Define Stage or Empathize Stage field, return the local checked value directly to avoid network calls and AI false-positives
  if (
    (context && context.startsWith("Empathize")) ||
    context === "Define Stage - WHO" ||
    context === "Define Stage - WHAT" ||
    context === "Define Stage - WHY" ||
    context === "Define Stage - OPTIONAL"
  ) {
    return localCheck;
  }

  if (!localCheck.safe && localCheck.level >= 2) {
    // If severe enough locally, return it immediately to avoid unnecessary backend load
    return localCheck;
  }

  try {
    const response = await apiFetch("./api/moderate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, context })
    });

    if (!response.ok) {
      // In case of any network error, fall back gracefully to local check
      return localCheck;
    }

    const data = await response.json();
    return {
      safe: data.safe,
      level: data.level,
      warning: data.warning
    };
  } catch (error) {
    console.warn("Moderation API unreachable. Falling back online.", error);
    return localCheck;
  }
}
