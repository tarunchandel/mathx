/**
 * MathX - Question Generator Engine
 * Generates level-appropriate math questions with complexity scaling
 * Includes Practice Mode (per-skill drills) and Quiz Mode (mixed sub-levels)
 */

const LEVEL_CONFIG = {
  1: { minOp: 1, maxOp: 12, ops: ['+', '-', '×', '÷'], allowDecimals: false, allowNegatives: false, label: 'The Penny I', tier: 'The Penny' },
  2: { minOp: 1, maxOp: 12, ops: ['+', '-', '×', '÷'], allowDecimals: false, allowNegatives: false, label: 'The Penny II', tier: 'The Penny' },
  3: { minOp: 10, maxOp: 50, ops: ['+', '-', '×', '÷'], allowDecimals: false, allowNegatives: false, label: 'Intern I', tier: 'Intern' },
  4: { minOp: 10, maxOp: 75, ops: ['+', '-', '×', '÷'], allowDecimals: false, allowNegatives: false, label: 'Intern II', tier: 'Intern' },
  5: { minOp: 10, maxOp: 100, ops: ['+', '-', '×', '÷'], allowDecimals: false, allowNegatives: false, label: 'Intern III', tier: 'Intern' },
  6: { minOp: 10, maxOp: 99, ops: ['+', '-', '×', '÷'], twoDigitMult: true, threeDigitAddSub: true, allowDecimals: false, allowNegatives: false, label: 'Eras Tour I', tier: 'The Eras Tour' },
  7: { minOp: 10, maxOp: 99, ops: ['+', '-', '×', '÷'], twoDigitMult: true, threeDigitAddSub: true, allowDecimals: false, allowNegatives: false, label: 'Eras Tour II', tier: 'The Eras Tour' },
  8: { minOp: 10, maxOp: 999, ops: ['+', '-', '×', '÷'], threeDigitMult: true, allowDecimals: true, allowNegatives: false, label: 'Legend I', tier: 'Legend' },
  9: { minOp: 10, maxOp: 999, ops: ['+', '-', '×', '÷'], threeDigitMult: true, allowDecimals: true, allowNegatives: false, label: 'Legend II', tier: 'Legend' },
  10: { minOp: 10, maxOp: 9999, ops: ['+', '-', '×', '÷'], fourDigitAddSub: true, threeDigitMult: true, allowDecimals: true, allowNegatives: true, label: 'Mastermind', tier: 'Mastermind' },
};

/**
 * Sub-level (difficulty) names — Gen Z / Gen Alpha naming
 * "Chill" = easy/no-timer, "Vibe" = medium/timed, "GOAT" = pro/speed
 */
const DIFFICULTY_CONFIG = {
  chill: { timer: null, multiplier: 1, label: 'Chill', emoji: '😎', desc: 'No timer. Learn at your pace.', key: 'chill' },
  vibe:  { timer: 10, multiplier: 2, label: 'Vibe Check', emoji: '⚡', desc: '10s per question. 2× coins.', key: 'vibe' },
  goat:  { timer: 3, multiplier: 5, label: 'GOAT Mode', emoji: '🐐', desc: '3s per question. 5× coins + Golden Plectrums.', key: 'goat' },
};

/** 
 * Skill labels / emojis for the 4 practice operations
 */
const SKILL_CONFIG = {
  '+': { label: 'Addition', emoji: '➕', color: '#22c55e' },
  '-': { label: 'Subtraction', emoji: '➖', color: '#3b82f6' },
  '×': { label: 'Multiplication', emoji: '✖️', color: '#e040fb' },
  '÷': { label: 'Division', emoji: '➗', color: '#f59e0b' },
};

const PRACTICE_POINTS_REQUIRED = 100;
const PRACTICE_QUESTIONS_PER_SESSION = 10;
const PRACTICE_POINTS_PER_CORRECT = 1;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Generate a single question for a specific operation at a given level
 */
function generateQuestionForOp(level, op) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[10];
  let a, b, answer;
  let retries = 0;

  do {
    retries++;
    if (retries > 50) break;

    switch (op) {
      case '+':
        if (config.fourDigitAddSub && Math.random() > 0.5) {
          a = randInt(100, 9999);
          b = randInt(100, 9999);
        } else if (config.threeDigitAddSub && Math.random() > 0.5) {
          a = randInt(100, 999);
          b = randInt(10, 999);
        } else {
          a = randInt(config.minOp, config.maxOp);
          b = randInt(config.minOp, config.maxOp);
        }
        if (config.allowDecimals && Math.random() > 0.7) {
          a = round2(a + pickRandom([0.25, 0.5, 0.75]));
          b = round2(b + pickRandom([0.25, 0.5, 0.75]));
        }
        if (config.allowNegatives && Math.random() > 0.6) {
          a = Math.random() > 0.5 ? -a : a;
        }
        answer = round2(a + b);
        break;

      case '-':
        if (config.fourDigitAddSub && Math.random() > 0.5) {
          a = randInt(100, 9999);
          b = randInt(100, a);
        } else if (config.threeDigitAddSub && Math.random() > 0.5) {
          a = randInt(100, 999);
          b = randInt(10, config.allowNegatives ? 999 : a);
        } else {
          a = randInt(config.minOp, config.maxOp);
          b = randInt(config.minOp, config.allowNegatives ? config.maxOp : a);
        }
        if (config.allowDecimals && Math.random() > 0.7) {
          const da = pickRandom([0.25, 0.5, 0.75]);
          const db = pickRandom([0.25, 0.5]);
          a = round2(a + da);
          b = round2(b + db);
        }
        answer = round2(a - b);
        break;

      case '×':
        if (config.threeDigitMult && Math.random() > 0.5) {
          a = randInt(100, 999);
          b = randInt(2, 12);
        } else if (config.twoDigitMult && Math.random() > 0.4) {
          a = randInt(10, 99);
          b = randInt(10, 99);
        } else {
          a = randInt(config.minOp, Math.min(config.maxOp, 30));
          b = randInt(2, 12);
        }
        answer = a * b;
        break;

      case '÷':
        b = randInt(2, 12);
        if (config.threeDigitMult && Math.random() > 0.5) {
          answer = randInt(10, 99);
        } else {
          answer = randInt(config.minOp, Math.min(config.maxOp, 50));
        }
        a = answer * b;
        break;
    }
  } while (answer === undefined || (typeof answer === 'number' && isNaN(answer)));

  const questionStr = formatQuestion(a, op, b);

  return {
    a,
    b,
    operator: op,
    answer: typeof answer === 'number' ? round2(answer) : answer,
    display: questionStr,
    operations: [op],
  };
}

/**
 * Generate a single question based on level config (mixed ops)
 */
function generateQuestion(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[10];
  const op = pickRandom(config.ops);
  return generateQuestionForOp(level, op);
}

function formatQuestion(a, op, b) {
  const formatNum = (n) => {
    if (n < 0) return `(${n})`;
    return String(n);
  };
  return `${formatNum(a)} ${op} ${formatNum(b)}`;
}

/**
 * Generate a set of 10 questions ensuring mixed operations
 */
function generateQuestionSet(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[10];
  const questions = [];
  const opsUsed = new Set();
  
  const requiredOps = [...config.ops];
  
  for (let i = 0; i < 10; i++) {
    let q;
    if (i < requiredOps.length) {
      let retries = 0;
      do {
        q = generateQuestion(level);
        retries++;
      } while (q.operator !== requiredOps[i] && retries < 20);
      if (q.operator !== requiredOps[i]) {
        q = generateQuestion(level);
      }
    } else {
      q = generateQuestion(level);
    }
    questions.push(q);
    opsUsed.add(q.operator);
  }
  
  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  
  return questions;
}

/**
 * Generate a practice set — all questions use the SAME operation
 */
function generatePracticeSet(level, operation) {
  const questions = [];
  for (let i = 0; i < PRACTICE_QUESTIONS_PER_SESSION; i++) {
    questions.push(generateQuestionForOp(level, operation));
  }
  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }
  return questions;
}

/**
 * Check what operations are available for practice at a given level
 */
function getAvailableOps(level) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[10];
  return config.ops;
}

/**
 * Check if the user's answer is correct
 */
function checkAnswer(question, userAnswer) {
  const tolerance = 0.01;
  const parsed = parseFloat(userAnswer);
  if (isNaN(parsed)) return false;
  return Math.abs(parsed - question.answer) < tolerance;
}

/**
 * Get level config
 */
function getLevelConfig(level) {
  return LEVEL_CONFIG[level] || LEVEL_CONFIG[10];
}

/**
 * Get difficulty config with progressive time scaling for timed modes
 */
function getDifficultyConfig(difficulty, level = 1) {
  const base = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.chill;
  if (!base.timer) return { ...base };

  const lvl = Math.max(1, Math.min(10, Number(level) || 1));
  let scaledTimer = base.timer;

  if (difficulty === 'vibe') {
    // Progressive Vibe Check timer: 10s at lvl 1-2, 12s at lvl 3-5, 14s at lvl 6-7, 16s at lvl 8-10
    if (lvl <= 2) scaledTimer = 10;
    else if (lvl <= 5) scaledTimer = 12;
    else if (lvl <= 7) scaledTimer = 14;
    else scaledTimer = 16;
  } else if (difficulty === 'goat') {
    // Progressive GOAT mode timer: 4s at lvl 1-2, 5s at lvl 3-5, 6s at lvl 6-7, 7s at lvl 8-10
    if (lvl <= 2) scaledTimer = 4;
    else if (lvl <= 5) scaledTimer = 5;
    else if (lvl <= 7) scaledTimer = 6;
    else scaledTimer = 7;
  }

  return {
    ...base,
    timer: scaledTimer,
    desc: difficulty === 'vibe' 
      ? `${scaledTimer}s per question. 2× coins.`
      : `${scaledTimer}s per question. 5× coins + Golden Plectrums.`
  };
}

/**
 * Get bite-sized concept lesson for pre-practice overview
 */
function getPrePracticeLesson(level, op) {
  const lessons = {
    '+': [
      {
        title: 'Left-to-Right Mental Addition',
        rule: 'Add the largest place values first, then add the units.',
        example: '47 + 38 → (40 + 30) + (7 + 8) = 70 + 15 = 85',
        tip: 'Eliminates carrying in your head by adding from left to right.'
      },
      {
        title: 'Compensation & Friendly Tens',
        rule: 'Round numbers ending in 7, 8, or 9 up to a friendly ten, then subtract the extra.',
        example: '68 + 25 → (68 + 2) + 23 = 70 + 23 = 93',
        tip: 'Borrow a little first to make clean round milestones.'
      }
    ],
    '-': [
      {
        title: 'Count Up Distance',
        rule: 'Subtracting is measuring distance! Jump from the smaller number to friendly milestones.',
        example: '92 - 67 → 67 (+3) → 70 (+20) → 90 (+2) → 92 = 3 + 20 + 2 = 25',
        tip: 'Counting forward is much faster than borrowing backwards.'
      },
      {
        title: 'Same Difference Adjustment',
        rule: 'Add or subtract the same amount to BOTH numbers to make the subtrahend end in 0.',
        example: '74 - 29 → Add 1 to both: 75 - 30 = 45',
        tip: 'Difference never changes when both shift by equal steps.'
      }
    ],
    '×': [
      {
        title: 'Chunking & Distributive Law',
        rule: 'Split multi-digit numbers into tens and ones before multiplying.',
        example: '14 × 7 → (10 × 7) + (4 × 7) = 70 + 28 = 98',
        tip: 'Multiply the tens first, hold the sum, then add the product of the ones.'
      },
      {
        title: 'Double and Halve Shortcut',
        rule: 'Double one factor and halve the other to simplify tough products.',
        example: '15 × 18 → Double 15 to 30, halve 18 to 9 → 30 × 9 = 270',
        tip: 'Turns complex multiplication into a simple single-digit times a round ten.'
      },
      {
        title: 'Multiply by 5 or 9 Superpower',
        rule: '× 5 is (× 10 ÷ 2). × 9 is (× 10 - the number).',
        example: '36 × 5 = 360 ÷ 2 = 180  |  24 × 9 = 240 - 24 = 216',
        tip: 'Multiply by 10 first—it is as easy as appending a zero!'
      }
    ],
    '÷': [
      {
        title: 'Division as Missing Multiplier',
        rule: 'Turn every quotient into a question: "What times divisor equals dividend?"',
        example: '84 ÷ 6 → Think "6 × 10 = 60", leaving 24. "6 × 4 = 24", so 10 + 4 = 14',
        tip: 'Decompose the dividend into familiar multiples of the divisor.'
      },
      {
        title: 'Divide by Halving Stages',
        rule: 'Dividing by 4 is halving twice. Dividing by 8 is halving thrice.',
        example: '112 ÷ 4 → Half is 56 → Half again is 28',
        tip: 'Smaller steps reduce working memory load.'
      }
    ]
  };

  const pool = lessons[op] || lessons['+'];
  const idx = (level - 1) % pool.length;
  return pool[idx];
}

/**
 * Calculate bonus coins earned at set completion (speed bonus and perfect bonus)
 */
function calculateSetBonuses(level, difficulty, correctCount, totalTime, options = {}) {
  const diffConfig = getDifficultyConfig(difficulty);
  const lvl = Number(level) || 1;
  let perfectBonus = 0;
  let speedBonus = 0;

  if (correctCount === 10) {
    const perfectMultiplier = (options.comboCarnival ? 3 : 1) * (options.hasHabitPower ? 1.5 : 1);
    perfectBonus = Math.round(lvl * 50 * perfectMultiplier);
  }

  if (diffConfig && diffConfig.timer && totalTime > 0) {
    const maxTime = diffConfig.timer * 10 * 1000;
    const timeRatio = Math.max(0, 1 - (totalTime / maxTime));
    if (timeRatio > 0) {
      speedBonus = Math.floor(timeRatio * lvl * 15);
    }
  }

  return { perfectBonus, speedBonus, totalBonuses: perfectBonus + speedBonus };
}

/**
 * Calculate coins earned for a completed set
 */
function calculateCoins(level, difficulty, correctCount, totalTime, questionTimes, options = {}) {
  const diffConfig = getDifficultyConfig(difficulty);
  const lvl = Number(level) || 1;
  const baseCoins = lvl * 10;
  const correctBonus = correctCount * baseCoins;
  const multiplier = (diffConfig && diffConfig.multiplier) || 1;
  
  let total = Math.floor(correctBonus * multiplier);
  const bonuses = calculateSetBonuses(lvl, difficulty, correctCount, totalTime, options);
  total += bonuses.totalBonuses;
  
  return Math.max(total, 0);
}

export { 
  generateQuestion,
  generateQuestionForOp,
  generateQuestionSet, 
  generatePracticeSet,
  getAvailableOps,
  checkAnswer, 
  getLevelConfig, 
  getDifficultyConfig, 
  getPrePracticeLesson,
  calculateCoins,
  calculateSetBonuses,
  LEVEL_CONFIG, 
  DIFFICULTY_CONFIG,
  SKILL_CONFIG,
  PRACTICE_POINTS_REQUIRED,
  PRACTICE_QUESTIONS_PER_SESSION,
  PRACTICE_POINTS_PER_CORRECT,
};
